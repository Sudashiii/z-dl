local Dispatcher = require("dispatcher")
local InfoMessage = require("ui/widget/infomessage")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local logger = require("logger")
local _ = require("gettext")

local Settings = require("settings")
local Device = require("device")
local Menu = require("ui/menu")
local Dialogs = require("ui/dialogs")
local BookSync = require("services/book_sync")
local ProgressSync = require("services/progress_sync")

local Sake = WidgetContainer:extend{
    name = "sake",
    is_doc_only = false,
}

function Sake:onDispatcherRegisterActions()
    Dispatcher:registerAction("sake_action", {category="none", event="Sake", title="Sake", general=true,})
end

function Sake:init()
    self:onDispatcherRegisterActions()
    self.settings = Settings.load()

    self.books_downloaded_bg = 0

    logger.info("[Sake] Initialized. Device: " .. self.settings.device_name .. " | URL: " .. (self.settings.api_url ~= "" and self.settings.api_url or "Not Set"))

    self.ctx = {
        ui = self.ui,
        settings = self.settings,
        input_dialog = nil,
        actions = {},
    }

    self.bookSync = BookSync:new(self.ctx)
    self.progressSync = ProgressSync:new(self.ctx)

    self.ctx.actions.onSync = function() self.bookSync:syncNow() end
    self.ctx.actions.showInput = function(setting_key, field, title)
        Dialogs.showStringInput(self.ctx, setting_key, field, title)
    end

    self.ui.menu:registerToMainMenu(self)

    self.onSuspend = function() self:handleSuspend() end
    self.onResume = function() self:handleResume() end
end

function Sake:addToMainMenu(menu_items)
    Menu.addToMainMenu(menu_items, self.ctx)
end

function Sake:handleSuspend()
    if self.settings.api_user == "" or self.settings.api_pass == "" then return end

    logger.info("[Sake] Suspend detected. Starting background tasks...")

    UIManager:scheduleIn(1.0, function()
        self.progressSync:syncCurrentBookProgress()
    end)

    UIManager:scheduleIn(1, function()
        logger.info("[Sake] Starting silent book sync...")
        local count = self.bookSync:performSilentSync()
        self.books_downloaded_bg = count
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
end

function Sake:onReaderReady()
    self.progressSync:downloadProgress()
end

return Sake