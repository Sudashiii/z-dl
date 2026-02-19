local json = require("json")
local ltn12 = require("ltn12")
local socket = require("socket.url")

local Client = require("api/client")

local BookApi = {}

local API_PREFIX = "/api/library"
local ROUTE_NEW = "/new?deviceId="
local ROUTE_DOWNLOAD = "/"
local ROUTE_CONFIRM = "/confirmDownload"

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

local function parseJson(body)
    local ok, result = pcall(function() return json.decode(body) end)
    if not ok or result == nil then
        return false, "Invalid JSON response"
    end
    return true, result
end

function BookApi.fetchBookList(base_url, user, pass, device_id)
    local auth_header = Client.authHeader(user, pass)
    local target_url = libraryBaseUrl(base_url) .. ROUTE_NEW .. socket.escape(device_id or "")

    local ok, statusCode, _, requestErr, response_chunks = Client.request{
        url = target_url,
        method = "GET",
        headers = { ["Authorization"] = auth_header },
    }

    if not ok then
        return false, "Request failed: " .. tostring(requestErr)
    end
    if statusCode ~= 200 then
        local api_error = Client.errorFromBody(response_chunks)
        if api_error then
            return false, api_error
        end
        return false, "HTTP Error " .. tostring(statusCode)
    end

    local body = table.concat(response_chunks)
    return parseJson(body)
end

function BookApi.fetchBookContent(base_url, user, pass, book)
    local s3Key = book and book.s3_storage_key
    if not s3Key or s3Key == "" then
        return false, nil, "Missing book storage key"
    end

    local encodedKey = socket.escape(s3Key)
    local download_url = libraryBaseUrl(base_url) .. ROUTE_DOWNLOAD .. encodedKey
    local auth_header = Client.authHeader(user, pass)
    local response_chunks = {}

    local ok, statusCode, _, requestErr = Client.request{
        url = download_url,
        method = "GET",
        redirect = true,
        headers = { ["Authorization"] = auth_header },
        sink = ltn12.sink.table(response_chunks),
    }

    if not ok then
        return false, nil, "Request failed: " .. tostring(requestErr)
    end
    if statusCode ~= 200 then
        local api_error = Client.errorFromBody(response_chunks)
        if api_error then
            return false, nil, api_error
        end
        return false, nil, "HTTP Error " .. tostring(statusCode)
    end

    return true, {
        storage_key = s3Key,
        content = table.concat(response_chunks),
    }
end

function BookApi.confirmDownload(base_url, user, pass, device_id, book_id)
    local body = json.encode({ deviceId = device_id, bookId = book_id })
    local target_url = libraryBaseUrl(base_url) .. ROUTE_CONFIRM
    local auth_header = Client.authHeader(user, pass)

    local ok, statusCode, _, requestErr, response_chunks = Client.request{
        url = target_url,
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["Content-Length"] = tostring(#body),
            ["Authorization"] = auth_header,
        },
        source = ltn12.source.string(body),
    }

    if not ok then
        return false, "Request failed: " .. tostring(requestErr)
    end
    if statusCode ~= 200 and statusCode ~= 201 and statusCode ~= 204 then
        local api_error = Client.errorFromBody(response_chunks)
        if api_error then
            return false, api_error
        end
        return false, "HTTP Error " .. tostring(statusCode)
    end

    return true
end

return BookApi
