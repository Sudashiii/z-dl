local http = require("socket.http")
local json = require("json")
local ltn12 = require("ltn12")
local socket = require("socket.url")
local mime = require("mime")
local logger = require("logger")

local ProgressApi = {}

local ROUTE_UPLOAD = "/progress/"
local ROUTE_DOWNLOAD = "/progress/"

local function createBasicAuthHeader(user, pass)
    local credentials = user .. ":" .. pass
    return "Basic " .. mime.b64(credentials)
end

function ProgressApi.uploadProgress(base_url, user, pass, filename, content)
    local target_url = base_url .. "/progress" 
    
    local auth_header = createBasicAuthHeader(user, pass)
    local response_chunks = {} 

    logger.info("[Sake] Uploading progress (Multipart) to " .. target_url)

    -- 2. Construct Multipart Body
    local boundary = "SakeBoundary" .. os.time()
    local body_parts = {}

    -- FIX: Changed 'name="filename"' to 'name="fileName"' (Capital N)
    -- to match the server error requirement.
    table.insert(body_parts, "--" .. boundary)
    table.insert(body_parts, 'Content-Disposition: form-data; name="fileName"')
    table.insert(body_parts, "")
    table.insert(body_parts, filename)

    -- Field 2: file
    table.insert(body_parts, "--" .. boundary)
    table.insert(body_parts, 'Content-Disposition: form-data; name="file"; filename="' .. filename .. '"')
    table.insert(body_parts, "Content-Type: application/octet-stream")
    table.insert(body_parts, "")
    table.insert(body_parts, content)

    -- End Boundary
    table.insert(body_parts, "--" .. boundary .. "--")
    table.insert(body_parts, "") 

    local request_body = table.concat(body_parts, "\r\n")

    -- 3. Send Request (POST)
    local success, statusCode, headers, statusText = http.request{
        url = target_url,
        method = "PUT", 
        headers = {
            ["Authorization"] = auth_header,
            ["Content-Type"] = "multipart/form-data; boundary=" .. boundary,
            ["Content-Length"] = tostring(#request_body),
        },
        source = ltn12.source.string(request_body),
        sink = ltn12.sink.table(response_chunks)
    }

    -- Helper to parse JSON response
    local function parseError()
        local body = table.concat(response_chunks)
        if body == "" then return "Empty response" end
        
        local ok, data = pcall(json.decode, body)
        if ok and data and data.error then
            return data.error
        elseif not ok then
            return "Invalid JSON response: " .. body
        end
        return body 
    end

    if statusCode == 200 or statusCode == 201 or statusCode == 204 then
        return true, "Success"
    elseif statusCode == 409 then
        local err_msg = parseError()
        return false, "Conflict: " .. err_msg
    else
        local err_msg = parseError()
        return false, "HTTP " .. tostring(statusCode) .. ": " .. err_msg
    end
end

function ProgressApi.downloadProgress(base_url, user, pass, filename)
    local safe_filename = socket.escape(filename)
    local target_url = base_url .. ROUTE_DOWNLOAD .. safe_filename
    
    local auth_header = createBasicAuthHeader(user, pass)
    local response_chunks = {}

    logger.info("Sake: Checking remote progress for " .. filename)

    local success, statusCode, headers, statusText = http.request{
        url = target_url,
        method = "GET",
        headers = {
            ["Authorization"] = auth_header,
        },
        sink = ltn12.sink.table(response_chunks)
    }

    if statusCode == 200 then
        local content = table.concat(response_chunks)
        return true, content
    elseif statusCode == 404 then
        return false, "No progress on server"
    else
        return false, "HTTP Error " .. tostring(statusCode)
    end
end

return ProgressApi