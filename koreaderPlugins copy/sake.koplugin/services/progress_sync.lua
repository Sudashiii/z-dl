local logger = require("logger")

local ProgressApi = require("api/progress")

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
        logger.warn("[Sake] Could not determine document path.")
        return
    end

    local sdr_path = string.gsub(doc_path, "%.([^%.]+)$", ".sdr/metadata.%1.lua")
    local filename = doc_path:match("^.+/(.+)$")

    local f = io.open(sdr_path, "r")
    if not f then
        logger.warn("[Sake] Metadata file not found at: " .. sdr_path)
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

return ProgressSync
