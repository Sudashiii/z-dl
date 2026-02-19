local json = require("json")
local ltn12 = require("ltn12")
local socket = require("socket.url")
local Client = require("api/client")
local logger = require("logger")

local ProgressApi = {}
local LOG_PREFIX = "[Sake] "
local API_PREFIX = "/api/library"

local function normalizedBaseUrl(base_url)
    local url = tostring(base_url or "")
    url = url:gsub("^%s+", ""):gsub("%s+$", "")
    url = url:gsub("/+$", "")
    url = url:gsub("/api/library/?$", "")
    return url
end

local function libraryBaseUrl(base_url)
    return normalizedBaseUrl(base_url) .. API_PREFIX
end

function ProgressApi.uploadProgress(base_url, user, pass, filename, content, device_id, percent_finished)
    local target_url = libraryBaseUrl(base_url) .. "/progress"

    local auth_header = Client.authHeader(user, pass)
    local response_chunks = {}

    local boundary = "SakeBoundary" .. os.time()
    local body_parts = {}

    table.insert(body_parts, "--" .. boundary)
    table.insert(body_parts, 'Content-Disposition: form-data; name="fileName"')
    table.insert(body_parts, "")
    table.insert(body_parts, filename)

    if device_id and device_id ~= "" then
        table.insert(body_parts, "--" .. boundary)
        table.insert(body_parts, 'Content-Disposition: form-data; name="deviceId"')
        table.insert(body_parts, "")
        table.insert(body_parts, tostring(device_id))
    end

    if percent_finished ~= nil then
        table.insert(body_parts, "--" .. boundary)
        table.insert(body_parts, 'Content-Disposition: form-data; name="percentFinished"')
        table.insert(body_parts, "")
        table.insert(body_parts, tostring(percent_finished))
    end

    table.insert(body_parts, "--" .. boundary)
    table.insert(body_parts, 'Content-Disposition: form-data; name="file"; filename="' .. filename .. '"')
    table.insert(body_parts, "Content-Type: application/octet-stream")
    table.insert(body_parts, "")
    table.insert(body_parts, content)

    table.insert(body_parts, "--" .. boundary .. "--")
    table.insert(body_parts, "")

    local request_body = table.concat(body_parts, "\r\n")

    logger.info(LOG_PREFIX .. "PUT progress for file: " .. tostring(filename))

    local ok, statusCode, _, requestErr = Client.request{
        url = target_url,
        method = "PUT",
        headers = {
            ["Authorization"] = auth_header,
            ["Content-Type"] = "multipart/form-data; boundary=" .. boundary,
            ["Content-Length"] = tostring(#request_body),
        },
        source = ltn12.source.string(request_body),
        sink = ltn12.sink.table(response_chunks),
    }

    local function parseError()
        local api_error = Client.errorFromBody(response_chunks)
        if api_error then
            return api_error
        end

        local body = table.concat(response_chunks)
        if body == "" then
            return "Empty response"
        end

        local ok, data = pcall(json.decode, body)
        if ok and data and data.error then
            return data.error
        elseif not ok then
            return "Invalid JSON response: " .. body
        end
        return body
    end

    if not ok then
        logger.warn(LOG_PREFIX .. "PUT progress request failed: " .. tostring(requestErr))
        return false, "Request failed: " .. tostring(requestErr)
    elseif statusCode == 200 or statusCode == 201 or statusCode == 204 then
        logger.info(LOG_PREFIX .. "PUT progress success. HTTP " .. tostring(statusCode))
        return true, "Success"
    elseif statusCode == 409 then
        local err_msg = parseError()
        logger.warn(LOG_PREFIX .. "PUT progress conflict: " .. tostring(err_msg))
        return false, "Conflict: " .. err_msg
    else
        local err_msg = parseError()
        logger.warn(LOG_PREFIX .. "PUT progress failed. HTTP " .. tostring(statusCode) .. " - " .. tostring(err_msg))
        return false, "HTTP " .. tostring(statusCode) .. ": " .. err_msg
    end
end

function ProgressApi.downloadProgress(base_url, user, pass, filename)
    local safe_filename = socket.escape(filename)
    local target_url = libraryBaseUrl(base_url) .. "/progress?fileName=" .. safe_filename

    local auth_header = Client.authHeader(user, pass)
    local response_chunks = {}

    logger.info(LOG_PREFIX .. "GET progress for file: " .. tostring(filename))

    local ok, statusCode, _, requestErr = Client.request{
        url = target_url,
        method = "GET",
        headers = {
            ["Authorization"] = auth_header,
        },
        sink = ltn12.sink.table(response_chunks),
    }

    if not ok then
        logger.warn(LOG_PREFIX .. "GET progress request failed: " .. tostring(requestErr))
        return false, "Request failed: " .. tostring(requestErr)
    elseif statusCode == 200 then
        local content = table.concat(response_chunks)
        logger.info(LOG_PREFIX .. "GET progress success. Bytes: " .. tostring(#content))
        return true, content
    elseif statusCode == 404 then
        local api_error = Client.errorFromBody(response_chunks)
        logger.info(LOG_PREFIX .. "GET progress not found for file: " .. tostring(filename))
        return false, api_error or "No progress found on server"
    else
        local api_error = Client.errorFromBody(response_chunks)
        if api_error then
            logger.warn(LOG_PREFIX .. "GET progress failed with API error: " .. tostring(api_error))
            return false, api_error
        end
        logger.warn(LOG_PREFIX .. "GET progress failed. HTTP " .. tostring(statusCode))
        return false, "HTTP Error " .. tostring(statusCode)
    end
end

function ProgressApi.getNewProgressForDevice(base_url, user, pass, device_id)
    local safe_device_id = socket.escape(device_id or "")
    local target_url = libraryBaseUrl(base_url) .. "/progress/new?deviceId=" .. safe_device_id
    local auth_header = Client.authHeader(user, pass)
    local response_chunks = {}

    logger.info(LOG_PREFIX .. "GET new progress queue for device: " .. tostring(device_id))

    local ok, statusCode, _, requestErr = Client.request{
        url = target_url,
        method = "GET",
        headers = {
            ["Authorization"] = auth_header,
        },
        sink = ltn12.sink.table(response_chunks),
    }

    if not ok then
        logger.warn(LOG_PREFIX .. "GET new progress queue request failed: " .. tostring(requestErr))
        return false, "Request failed: " .. tostring(requestErr)
    end

    if statusCode ~= 200 then
        local api_error = Client.errorFromBody(response_chunks)
        if api_error then
            logger.warn(LOG_PREFIX .. "GET new progress queue failed with API error: " .. tostring(api_error))
            return false, api_error
        end
        logger.warn(LOG_PREFIX .. "GET new progress queue failed. HTTP " .. tostring(statusCode))
        return false, "HTTP Error " .. tostring(statusCode)
    end

    local body = table.concat(response_chunks)
    local ok_json, decoded = pcall(function() return json.decode(body) end)
    if not ok_json or type(decoded) ~= "table" then
        logger.warn(LOG_PREFIX .. "GET new progress queue returned invalid JSON.")
        return false, "Invalid JSON response"
    end
    logger.info(LOG_PREFIX .. "GET new progress queue success. Items: " .. tostring(#decoded))

    return true, decoded
end

function ProgressApi.confirmProgressDownload(base_url, user, pass, device_id, book_id)
    local target_url = libraryBaseUrl(base_url) .. "/progress/confirm"
    local auth_header = Client.authHeader(user, pass)
    local body = json.encode({
        deviceId = device_id,
        bookId = book_id,
    })
    local response_chunks = {}

    logger.info(LOG_PREFIX .. "POST progress confirm. Device: " .. tostring(device_id) .. " | Book: " .. tostring(book_id))

    local ok, statusCode, _, requestErr = Client.request{
        url = target_url,
        method = "POST",
        headers = {
            ["Authorization"] = auth_header,
            ["Content-Type"] = "application/json",
            ["Content-Length"] = tostring(#body),
        },
        source = ltn12.source.string(body),
        sink = ltn12.sink.table(response_chunks),
    }

    if not ok then
        logger.warn(LOG_PREFIX .. "POST progress confirm request failed: " .. tostring(requestErr))
        return false, "Request failed: " .. tostring(requestErr)
    end

    if statusCode ~= 200 and statusCode ~= 201 and statusCode ~= 204 then
        local api_error = Client.errorFromBody(response_chunks)
        if api_error then
            logger.warn(LOG_PREFIX .. "POST progress confirm failed with API error: " .. tostring(api_error))
            return false, api_error
        end
        logger.warn(LOG_PREFIX .. "POST progress confirm failed. HTTP " .. tostring(statusCode))
        return false, "HTTP Error " .. tostring(statusCode)
    end
    logger.info(LOG_PREFIX .. "POST progress confirm success. HTTP " .. tostring(statusCode))

    return true
end

return ProgressApi
