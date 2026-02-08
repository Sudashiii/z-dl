local logger = require("logger")
local UIManager = require("ui/uimanager")
local InfoMessage = require("ui/widget/infomessage")
local Event = require("ui/event")
local ProgressApi = require("api/progress")
local _ = require("gettext")

local ProgressSync = {}
ProgressSync.__index = ProgressSync

function ProgressSync:new(ctx)
    return setmetatable({ ctx = ctx }, self)
end

function ProgressSync:syncCurrentBookProgress()
    logger.info("[Sake] Checking for open document to sync progress...")

    local ui = self.ctx.ui
    local settings = self.ctx.settings

    if not ui.document then
        logger.info("[Sake] No document open. Skipping progress sync.")
        return
    end

    local doc_path = ui.document.file
    if not doc_path then
        logger.info("[Sake] Could not determine document path.")
        return
    end

    local sdr_path = string.gsub(doc_path, "%.([^%.]+)$", ".sdr/metadata.%1.lua")
    local filename = doc_path:match("^.+/(.+)$")

    local f = io.open(sdr_path, "r")
    if not f then
        logger.info("[Sake] Metadata file not found at: " .. sdr_path)
        return
    end

    local content = f:read("*all")
    f:close()

    logger.info("[Sake] Uploading progress for: " .. filename)

    local success, msg = ProgressApi.uploadProgress(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        filename,
        content
    )

    if not success then
        logger.info("[Sake] Progress Upload Failed: " .. tostring(msg))
    else
        logger.info("[Sake] Progress Upload Success.")
    end
end

function ProgressSync:downloadProgress()
    local ui = self.ctx.ui
    local settings = self.ctx.settings

    logger.info("[Sake] Checking for remote progress...")

    if not ui.document then
        logger.info("[Sake] No document open. Cannot download progress.")
        return
    end

    local doc_path = ui.document.file
    local filename = doc_path:match("^.+/(.+)$")
    local sdr_path = string.gsub(doc_path, "%.([^%.]+)$", ".sdr/metadata.%1.lua")

    local success, content = ProgressApi.downloadProgress(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        filename
    )

    if not success then
        if content ~= "No progress found on server" then
            logger.warn("[Sake] Sync Download Failed: " .. tostring(content))
        end
        return
    end

    logger.info("[Sake] Received content length: " .. tostring(#content))
    logger.info("[Sake] Content preview: " .. string.sub(content, 1, 100))

    if not content or content == "" or not content:find("return {") then
        logger.warn("[Sake] Received invalid Lua metadata content.")
        return
    end

    
    UIManager:show(InfoMessage:new{
        text = _("New progress found!\nApplying update..."),
        timeout = 2
    })

    -- ui:handleEvent(Event:new("Close")) 

    UIManager:scheduleIn(1.0, function()
        logger.info("[Sake] Overwriting metadata with remote content...")
        
        local f_write = io.open(sdr_path, "w")
        if f_write then
            f_write:write(content)
            f_write:close()
            logger.info("[Sake] Success. User must re-open book.")
            
            UIManager:show(InfoMessage:new{
                text = _("Sync Complete.\nPlease re-open the book."),
                timeout = 3
            })
        else
            logger.error("[Sake] Failed to write metadata file.")
        end
    end)
end

return ProgressSync
