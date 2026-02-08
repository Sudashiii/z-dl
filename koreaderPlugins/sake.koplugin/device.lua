local logger = require("logger")
local Settings = require("settings")

local Device = {}

function Device.ensure(settings)
    local stored_name = settings.device_name
    if not stored_name or stored_name == "" then
        logger.info("[Sake] No device name found. Generating new ID...")
        math.randomseed(os.time())
        local random_id = string.format("%x", math.random(100000, 999999))
        stored_name = "device_" .. random_id
        Settings.saveKey("sake_device_name", stored_name)
    end
    settings.device_name = stored_name
    return stored_name
end

return Device
