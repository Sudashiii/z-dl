local Dispatcher = require("dispatcher")
local InfoMessage = require("ui/widget/infomessage")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local logger = require("logger")
local _ = require("gettext")

local Settings = require("settings")
local has_sake_device, SakeDevice = pcall(require, "sake_device")
local Menu = require("ui/menu")
local Dialogs = require("ui/dialogs")
local BookSync = require("services/book_sync")
local ProgressSync = require("services/progress_sync")

local Sake = WidgetContainer:extend{
    name = "sake",
    is_doc_only = false,
}

function Sake:startDeferredProgressWatcher()
    if self.progress_watcher_active then
        return
    end

    self.progress_watcher_active = true
    logger.info("[Sake] Started deferred progress watcher.")

    local function checkAndApply()
        if self.ui and self.ui.document then
            UIManager:scheduleIn(1.0, checkAndApply)
            return
        end

        self.progress_watcher_active = false
        logger.info("[Sake] Document closed. Running deferred progress sync now.")
        self:runProgressSync()
    end

    UIManager:scheduleIn(1.0, checkAndApply)
end

function Sake:runProgressSync(opts)
    local ok, result_or_err = self.progressSync:syncNewProgressForDevice(opts)
    if not ok then
        return false
    end

    local result = result_or_err
    if result.deferred then
        self:startDeferredProgressWatcher()
        return true
    end

    if result.total > 0 and not (opts and opts.silent_summary) then
        local summary = string.format(
            "Remote progress sync:\nApplied %d of %d (%d failed).",
            result.applied,
            result.total,
            result.failed
        )
        UIManager:show(InfoMessage:new{
            text = _(summary),
            timeout = 5
        })
    end

    return true
end

function Sake:onDispatcherRegisterActions()
    Dispatcher:registerAction("sake_action", {category="none", event="Sake", title="Sake", general=true,})
end

function Sake:init()
    self:onDispatcherRegisterActions()
    self.settings = Settings.load()
    self.init_error_message = nil
    if has_sake_device and SakeDevice and SakeDevice.ensure then
        local ensured, device_or_err = pcall(SakeDevice.ensure, self.settings)
        if not ensured then
            logger.error("[Sake] Device setup failed: " .. tostring(device_or_err))
            self.init_error_message = _("Device setup failed: ") .. tostring(device_or_err)
        end
    else
        local err_msg = has_sake_device and "Unknown device module error" or tostring(SakeDevice)
        logger.error("[Sake] Failed to load local device module: " .. err_msg)
        self.init_error_message = _("Failed to load local device module: ") .. tostring(err_msg)
    end

    self.books_downloaded_bg = 0
    self.bg_error_messages = {}
    self.progress_watcher_active = false
    local device_name = tostring(self.settings.device_name or "Not Set")
    local api_url = (self.settings.api_url ~= "" and self.settings.api_url or "Not Set")
    logger.info("[Sake] Initialized. Device: " .. device_name .. " | URL: " .. api_url)

    self.ctx = {
        ui = self.ui,
        settings = self.settings,
        input_dialog = nil,
        actions = {},
    }

    self.bookSync = BookSync:new(self.ctx)
    self.progressSync = ProgressSync:new(self.ctx)

    self.ctx.actions.onSync = function() self.bookSync:syncNow() end
    self.ctx.actions.onProgressSync = function() self:runProgressSync() end
    self.ctx.actions.showInput = function(field, title)
        Dialogs.showStringInput(self.ctx, field, title)
    end

    self.ui.menu:registerToMainMenu(self)

    self.onSuspend = function() self:handleSuspend() end
    self.onResume = function() self:handleResume() end
end

function Sake:addToMainMenu(menu_items)
    Menu.addToMainMenu(menu_items, self.ctx)
end

function Sake:handleSuspend()
    local valid, missing = Settings.validateRequired(self.settings)
    if not valid then
        logger.info("[Sake] Suspend sync skipped. Missing settings: " .. tostring(missing))
        self.bg_error_messages = { _("Background sync skipped: Missing ") .. tostring(missing) }
        return
    end

    logger.info("[Sake] Suspend detected. Starting background tasks...")
    self.bg_error_messages = {}

    UIManager:scheduleIn(1.0, function()
        local success, err = self.progressSync:syncCurrentBookProgress({ silent = true })
        if not success and err then
            table.insert(self.bg_error_messages, _("Progress sync failed: ") .. tostring(err))
        end
    end)

    UIManager:scheduleIn(1, function()
        logger.info("[Sake] Starting silent book sync...")
        local count, err = self.bookSync:performSilentSync()
        self.books_downloaded_bg = count
        if err then
            table.insert(self.bg_error_messages, _("Book sync failed: ") .. tostring(err))
        end
        if count > 0 then
            logger.info("[Sake] Silent sync downloaded " .. count .. " books.")
        else
            logger.info("[Sake] Silent sync finished. No new books.")
        end
    end)
end

function Sake:handleResume()
    logger.info("[Sake] Resume detected.")
    if self.books_downloaded_bg and self.books_downloaded_bg > 0 then
        logger.info("[Sake] Alerting user of " .. self.books_downloaded_bg .. " background downloads.")
        UIManager:show(InfoMessage:new{ 
            text = _("Welcome back!\nDownloaded " .. self.books_downloaded_bg .. " books while away."),
            timeout = 5
        })
        self.books_downloaded_bg = 0
    end
    if self.bg_error_messages and #self.bg_error_messages > 0 then
        UIManager:show(InfoMessage:new{
            text = _("Background sync errors:\n") .. table.concat(self.bg_error_messages, "\n"),
            timeout = 8
        })
        self.bg_error_messages = {}
    end

    UIManager:scheduleIn(0.3, function()
        self:runProgressSync()
    end)
end

function Sake:onReaderReady()
    if self.init_error_message then
        UIManager:show(InfoMessage:new{
            text = self.init_error_message,
            timeout = 8
        })
        self.init_error_message = nil
    end
    self:runProgressSync({ silent = true, silent_summary = true })
end

return Sake
