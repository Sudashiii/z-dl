local http = require("socket.http")
local json = require("json")
local ltn12 = require("ltn12")
local socket = require("socket.url")
local mime = require("mime")
local logger = require("logger")

local API = {}

local ROUTE_NEW = "/new?deviceId="
local ROUTE_DOWNLOAD = "/"
local ROUTE_CONFIRM = "/confirmDownload"

local function createBasicAuthHeader(user, pass)
    local credentials = user .. ":" .. pass
    return "Basic " .. mime.b64(credentials)
end

local function sanitizeFilename(name)
    name = string.gsub(name, "%s+", "_")
    name = string.gsub(name, "[^%w%._%-]", "")
    return name
end

function API.fetchBookList(base_url, user, pass, device_id)
    local auth_header = createBasicAuthHeader(user, pass)
    local target_url = base_url .. ROUTE_NEW .. device_id
    
    local response_body = {}
    local success, statusCode = http.request{
        url = target_url,
        method = "GET",
        headers = { ["Authorization"] = auth_header },
        sink = ltn12.sink.table(response_body)
    }

    if statusCode ~= 200 then
        return false, "HTTP Error " .. tostring(statusCode)
    end

    local body = table.concat(response_body)
    local ok, result = pcall(function() return json.decode(body) end)

    if not ok or not result then
        return false, "JSON Error"
    end

    return true, result
end

function API.downloadBook(base_url, user, pass, device_id, book, home_dir)
    local s3Key = book.s3_storage_key
    local bookId = book.id
    
    local sanitizedFilename = sanitizeFilename(s3Key)
    local output_path = home_dir .. "/" .. sanitizedFilename
    local encodedKey = socket.escape(s3Key)
    local download_url = base_url .. ROUTE_DOWNLOAD .. encodedKey

    logger.info("Downloading: " .. output_path)

    local file, err = io.open(output_path, "wb")
    if not file then return false, "File Error" end

    local auth_header = createBasicAuthHeader(user, pass)

    local success, statusCode = http.request{
        url = download_url,
        sink = ltn12.sink.file(file),
        redirect = true,
        headers = { ["Authorization"] = auth_header },
    }
    
    if not success or statusCode ~= 200 then
        return false, "Download Failed: " .. tostring(statusCode)
    end

    API.confirmDownload(base_url, user, pass, device_id, bookId)

    return true, "Saved to " .. sanitizedFilename
end

function API.confirmDownload(base_url, user, pass, device_id, book_id)
    local body = json.encode({ deviceId = device_id, bookId = book_id })
    local target_url = base_url .. ROUTE_CONFIRM
    local auth_header = createBasicAuthHeader(user, pass)

    http.request{
        url = target_url,
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["Content-Length"] = tostring(#body),
            ["Authorization"] = auth_header,
        },
        source = ltn12.source.string(body)
    }
end

function API.performSilentSync(base_url, user, pass, device_id, home_dir)
    local success, result = API.fetchBookList(base_url, user, pass, device_id)
    
    if not success or #result == 0 then
        return 0
    end

    local count = 0
    for _, book in ipairs(result) do
        local ok, _ = API.downloadBook(base_url, user, pass, device_id, book, home_dir)
        if ok then
            count = count + 1
        end
    end

    return count
end

return API