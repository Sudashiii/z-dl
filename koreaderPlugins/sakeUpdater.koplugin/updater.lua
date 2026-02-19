local json = require("json")
local ltn12 = require("ltn12")
local logger = require("logger")
local mime = require("mime")
local socket = require("socket.http")

local Updater = {}
Updater.__index = Updater

local LOG_PREFIX = "[Sake] "
local ROUTE_LATEST = "/api/plugin/koreader/latest"

local function normalizedBaseUrl(base_url)
    local url = tostring(base_url or "")
    url = url:gsub("^%s+", ""):gsub("%s+$", "")
    url = url:gsub("/+$", "")
    url = url:gsub("/api/library/?$", "")
    return url
end

local function shellQuote(value)
    return "'" .. tostring(value or ""):gsub("'", "'\\''") .. "'"
end

local function authHeader(user, pass)
    local credentials = (user or "") .. ":" .. (pass or "")
    return "Basic " .. mime.b64(credentials)
end

local function request(opts)
    local response_chunks = {}
    local ok, statusCode, headers, statusText = socket.request{
        url = opts.url,
        method = opts.method or "GET",
        headers = opts.headers or {},
        source = opts.source,
        sink = opts.sink or ltn12.sink.table(response_chunks),
        redirect = opts.redirect,
        timeout = opts.timeout or 20,
    }
    if not ok then
        return false, nil, headers, tostring(statusCode or "Request failed"), response_chunks
    end
    return true, statusCode, headers, statusText, response_chunks
end

local function parseVersion(version)
    local parts = {}
    for n in tostring(version or ""):gmatch("(%d+)") do
        table.insert(parts, tonumber(n))
    end
    if #parts == 0 then
        return nil
    end
    return parts
end

local function isVersionGreater(new_version, current_version)
    local a = parseVersion(new_version)
    local b = parseVersion(current_version)
    if not a or not b then
        return false
    end

    local max_len = math.max(#a, #b)
    for i = 1, max_len do
        local av = a[i] or 0
        local bv = b[i] or 0
        if av > bv then return true end
        if av < bv then return false end
    end
    return false
end

local function readSakeVersion(sake_plugin_dir)
    local meta_path = tostring(sake_plugin_dir or "") .. "/_meta.lua"
    local ok, meta = pcall(dofile, meta_path)
    if not ok or type(meta) ~= "table" then
        return nil, "Failed to read Sake _meta.lua"
    end
    if not meta.version then
        return nil, "Sake _meta.lua has no version"
    end
    return tostring(meta.version)
end

function Updater:new(ctx, opts)
    return setmetatable({
        ctx = ctx,
        plugins_root = opts.plugins_root,
        sake_plugin_dir = opts.sake_plugin_dir,
        current_version = nil,
        latest_version = nil,
        latest_file_name = nil,
        latest_sha256 = nil,
        latest_download_url = nil,
        update_available = false,
    }, self)
end

function Updater:isUpdateAvailable()
    return self.update_available == true
end

function Updater:getLatestVersion()
    return self.latest_version
end

function Updater:getCurrentVersion()
    return self.current_version
end

function Updater:checkForUpdate()
    local settings = self.ctx.settings
    local current_version, version_err = readSakeVersion(self.sake_plugin_dir)
    if not current_version then
        logger.warn(LOG_PREFIX .. "Updater failed to read current version: " .. tostring(version_err))
        self.update_available = false
        return false, version_err
    end
    self.current_version = current_version

    local url = normalizedBaseUrl(settings.api_url) .. ROUTE_LATEST
    local ok, statusCode, _, requestErr, response_chunks = request{
        url = url,
        method = "GET",
        headers = {
            ["Authorization"] = authHeader(settings.api_user, settings.api_pass),
        },
    }
    if not ok then
        self.update_available = false
        return false, "Request failed: " .. tostring(requestErr)
    end
    if statusCode ~= 200 then
        self.update_available = false
        return false, "HTTP Error " .. tostring(statusCode)
    end

    local body = table.concat(response_chunks)
    local ok_json, payload = pcall(function() return json.decode(body) end)
    if not ok_json or type(payload) ~= "table" or not payload.version then
        self.update_available = false
        return false, "Invalid version response"
    end

    self.latest_version = tostring(payload.version)
    self.latest_file_name = payload.fileName and tostring(payload.fileName) or nil
    self.latest_sha256 = payload.sha256 and tostring(payload.sha256) or nil
    self.latest_download_url = payload.downloadUrl and tostring(payload.downloadUrl) or nil
    self.update_available = isVersionGreater(self.latest_version, self.current_version)

    logger.info(LOG_PREFIX .. "Updater check: current=" .. tostring(self.current_version) .. " latest=" .. tostring(self.latest_version) .. " available=" .. tostring(self.update_available) .. " file=" .. tostring(self.latest_file_name))
    return true, {
        current_version = self.current_version,
        latest_version = self.latest_version,
        file_name = self.latest_file_name,
        sha256 = self.latest_sha256,
        download_url = self.latest_download_url,
        update_available = self.update_available,
    }
end

function Updater:performUpdate()
    local settings = self.ctx.settings
    local plugins_root = self.plugins_root
    local zip_name = self.latest_file_name or "sake-koplugin.zip"
    local zip_path = plugins_root .. "/" .. zip_name
    local updated_path = plugins_root .. "/sake.koplugin.updated"
    local current_path = plugins_root .. "/sake.koplugin"
    local old_path = plugins_root .. "/sake.koplugin.old"

    local url = self.latest_download_url
    if not url or url == "" then
        return false, "Missing downloadUrl from latest metadata response"
    end
    logger.info(LOG_PREFIX .. "Updater downloading package from " .. url)
    local file, open_err = io.open(zip_path, "wb")
    if not file then
        return false, "Failed to create zip file: " .. tostring(open_err)
    end

    local ok, statusCode, _, requestErr = request{
        url = url,
        method = "GET",
        redirect = true,
        headers = {
            ["Authorization"] = authHeader(settings.api_user, settings.api_pass),
        },
        sink = ltn12.sink.file(file),
    }
    if not ok then
        os.remove(zip_path)
        return false, "Download failed: " .. tostring(requestErr)
    end
    if statusCode ~= 200 then
        os.remove(zip_path)
        return false, "Download HTTP Error " .. tostring(statusCode)
    end

    local cleanup_ok = os.execute("rm -rf " .. shellQuote(updated_path) .. " " .. shellQuote(old_path))
    if cleanup_ok ~= true and cleanup_ok ~= 0 then
        return false, "Failed to clean old updater directories"
    end

    local mkdir_ok = os.execute("mkdir -p " .. shellQuote(updated_path))
    if mkdir_ok ~= true and mkdir_ok ~= 0 then
        return false, "Failed to create update directory"
    end

    local unzip_ok = os.execute("unzip -o " .. shellQuote(zip_path) .. " -d " .. shellQuote(updated_path))
    if unzip_ok ~= true and unzip_ok ~= 0 then
        os.remove(zip_path)
        return false, "Failed to unpack zip"
    end

    -- Normalize archive layout. Some archives contain a top-level "sake.koplugin/" folder.
    local nested_path = updated_path .. "/sake.koplugin"
    local normalized_path = updated_path .. ".normalized"
    local normalize_cmd = string.format(
        "if [ -d %s ]; then rm -rf %s && mv %s %s && rm -rf %s && mv %s %s; fi",
        shellQuote(nested_path),
        shellQuote(normalized_path),
        shellQuote(nested_path),
        shellQuote(normalized_path),
        shellQuote(updated_path),
        shellQuote(normalized_path),
        shellQuote(updated_path)
    )
    local normalize_ok = os.execute(normalize_cmd)
    if normalize_ok ~= true and normalize_ok ~= 0 then
        os.remove(zip_path)
        return false, "Failed to normalize zip layout"
    end

    os.remove(zip_path)

    local renamed_current = os.rename(current_path, old_path)
    if not renamed_current then
        return false, "Failed to move current plugin to .old"
    end

    local renamed_updated = os.rename(updated_path, current_path)
    if not renamed_updated then
        os.rename(old_path, current_path)
        return false, "Failed to move updated plugin into place"
    end

    local rm_old_ok = os.execute("rm -rf " .. shellQuote(old_path))
    if rm_old_ok ~= true and rm_old_ok ~= 0 then
        logger.warn(LOG_PREFIX .. "Updater could not remove old plugin directory: " .. old_path)
    end

    self.update_available = false
    logger.info(LOG_PREFIX .. "Updater finished successfully.")
    return true
end

return Updater
