local http = require("socket.http")
local ltn12 = require("ltn12")
local mime = require("mime")

local Client = {}

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
    }

    return ok, statusCode, headers, statusText, response_chunks
end

return Client
