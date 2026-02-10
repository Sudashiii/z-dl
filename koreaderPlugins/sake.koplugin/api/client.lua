local http = require("socket.http")
local ltn12 = require("ltn12")
local mime = require("mime")
local json = require("json")

local Client = {}
Client.DEFAULT_TIMEOUT_SECONDS = 20

function Client.authHeader(user, pass)
    local credentials = (user or "") .. ":" .. (pass or "")
    return "Basic " .. mime.b64(credentials)
end

function Client.request(opts)
    local response_chunks = opts.sink_table or {}
    local ok, statusCode, headers, statusText = http.request{
        url = opts.url,
        method = opts.method or "GET",
        headers = opts.headers or {},
        source = opts.source,
        sink = opts.sink or ltn12.sink.table(response_chunks),
        redirect = opts.redirect,
        timeout = opts.timeout or Client.DEFAULT_TIMEOUT_SECONDS,
    }

    if not ok then
        return false, nil, headers, tostring(statusCode or "Request failed"), response_chunks
    end

    return true, statusCode, headers, statusText, response_chunks
end

function Client.errorFromBody(response_chunks)
    local body = table.concat(response_chunks or {})
    if body == "" then
        return nil
    end

    local ok, decoded = pcall(function() return json.decode(body) end)
    if ok and decoded and type(decoded) == "table" and decoded.error then
        return tostring(decoded.error)
    end

    return nil
end

return Client
