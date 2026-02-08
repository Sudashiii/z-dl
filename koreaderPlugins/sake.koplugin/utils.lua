local Utils = {}

function Utils.formatSize(bytes)
    if not bytes then return "Unknown" end
    local mb = bytes / 1024 / 1024
    return string.format("%.2f MB", mb)
end

function Utils.sanitizeFilename(name)
    name = string.gsub(name, "%s+", "_")
    name = string.gsub(name, "[^%w%._%-]", "")
    return name
end

return Utils
