local json = require("json")
local ltn12 = require("ltn12")
local socket = require("socket.url")
local logger = require("logger")

local Client = require("api/client")

local BookApi = {}

local ROUTE_NEW = "/new?deviceId="
local ROUTE_DOWNLOAD = "/"
local ROUTE_CONFIRM = "/confirmDownload"

local function sanitizeFilename(name)
    name = string.gsub(name, "%s+", "_")
    name = string.gsub(name, "[^%w%._%-]", "")
    return name
end

function BookApi.fetchBookList(base_url, user, pass, device_id)
    local auth_header = Client.authHeader(user, pass)
    local target_url = base_url .. ROUTE_NEW .. device_id

    local ok, statusCode, _, _, response_chunks = Client.request{
        url = target_url,
        method = "GET",
        headers = { ["Authorization"] = auth_header },
    }

    if statusCode ~= 200 then
        return false, "HTTP Error " .. tostring(statusCode)
    end

    local body = table.concat(response_chunks)
    local ok_json, result = pcall(function() return json.decode(body) end)

    if not ok_json or not result then
        return false, "JSON Error"
    end

    return true, result
end

function BookApi.downloadBook(base_url, user, pass, device_id, book, home_dir)
    local s3Key = book.s3_storage_key
    local bookId = book.id

    local sanitizedFilename = sanitizeFilename(s3Key)
    local output_path = home_dir .. "/" .. sanitizedFilename
    local encodedKey = socket.escape(s3Key)
    local download_url = base_url .. ROUTE_DOWNLOAD .. encodedKey

    logger.info("Downloading: " .. output_path)

    local file, err = io.open(output_path, "wb")
    if not file then return false, "File Error" end

    local auth_header = Client.authHeader(user, pass)

    local ok, statusCode = Client.request{
        url = download_url,
        method = "GET",
        sink = ltn12.sink.file(file),
        redirect = true,
        headers = { ["Authorization"] = auth_header },
    }

    if not ok or statusCode ~= 200 then
        return false, "Download Failed: " .. tostring(statusCode)
    end

    BookApi.confirmDownload(base_url, user, pass, device_id, bookId)

    return true, "Saved to " .. sanitizedFilename
end

function BookApi.confirmDownload(base_url, user, pass, device_id, book_id)
    local body = json.encode({ deviceId = device_id, bookId = book_id })
    local target_url = base_url .. ROUTE_CONFIRM
    local auth_header = Client.authHeader(user, pass)

    Client.request{
        url = target_url,
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["Content-Length"] = tostring(#body),
            ["Authorization"] = auth_header,
        },
        source = ltn12.source.string(body),
        sink = ltn12.sink.table({}),
    }
end

function BookApi.performSilentSync(base_url, user, pass, device_id, home_dir)
    local success, result = BookApi.fetchBookList(base_url, user, pass, device_id)

    if not success or #result == 0 then
        return 0
    end

    local count = 0
    for _, book in ipairs(result) do
        local ok, _ = BookApi.downloadBook(base_url, user, pass, device_id, book, home_dir)
        if ok then
            count = count + 1
        end
    end

    return count
end

return BookApi
