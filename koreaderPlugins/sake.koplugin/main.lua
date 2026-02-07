local BookApi = require("bookApi") 
local Dispatcher = require("dispatcher")
local InfoMessage = require("ui/widget/infomessage")
local InputDialog = require("ui/widget/inputdialog")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local _ = require("gettext")
local ProgressApi = require("progressApi")
local logger = require("logger")

local Sake = WidgetContainer:extend{
    name = "sake",
    is_doc_only = false,
}

function Sake:onDispatcherRegisterActions()
    Dispatcher:registerAction("sake_action", {category="none", event="Sake", title=_("Sake"), general=true,})
end

function Sake:init()
    self:onDispatcherRegisterActions()
    self.ui.menu:registerToMainMenu(self)
    
    self.api_url = G_reader_settings:readSetting("sake_api_url") or ""
    self.api_user = G_reader_settings:readSetting("sake_api_user") or ""
    self.api_pass = G_reader_settings:readSetting("sake_api_pass") or ""

    local stored_name = G_reader_settings:readSetting("sake_device_name")
    if not stored_name then
        logger.info("[Sake] No device name found. Generating new ID...")
        math.randomseed(os.time())
        local random_id = string.format("%x", math.random(100000, 999999))
        stored_name = "device_" .. random_id
        
        G_reader_settings:saveSetting("sake_device_name", stored_name)
    end
    self.device_name = stored_name
    
    self.home_dir = G_reader_settings:readSetting("home_dir") or "."
    self.books_downloaded_bg = 0 -- Initialize this to prevent nil errors

    logger.info("[Sake] Initialized. Device: " .. self.device_name .. " | URL: " .. (self.api_url ~= "" and self.api_url or "Not Set"))

    self.onSuspend = function() self:handleSuspend() end
    self.onResume = function() self:handleResume() end
end

function Sake:addToMainMenu(menu_items)
    menu_items.sake = {
        text = _("Sake"),
        sorting_hint = "more_tools",
        sub_item_table = {
            {
                text = _("Sync Books Now"),
                callback = function()
                    self:onSakeSync()
                end,
            },
            {
                text = _("Set API URL"),
                keep_menu_open = true,
                callback = function() self:showStringInput("sake_api_url", "api_url", "Enter API URL") end,
            },
            {
                text = _("Set API Username"),
                keep_menu_open = true,
                callback = function() self:showStringInput("sake_api_user", "api_user", "Enter Username") end,
            },
            {
                text = _("Set API Password"),
                keep_menu_open = true,
                callback = function() self:showStringInput("sake_api_pass", "api_pass", "Enter Password") end,
            },
            {
                text = _("Set Device Name"),
                keep_menu_open = true,
                callback = function() self:showStringInput("sake_device_name", "device_name", "Enter Device Name") end,
            }
        }
    }
end

function Sake:showStringInput(setting_key, class_var, title)
    self.input_dialog = InputDialog:new{
        title = _(title),
        input = self[class_var],
        input_type = "string",
        buttons = {
            {
                {
                    text = _("Cancel"),
                    id = "close",
                    callback = function() UIManager:close(self.input_dialog) end,
                },
                {
                    text = _("Save"),
                    callback = function()
                        local new_val = self.input_dialog:getInputText()
                        self[class_var] = new_val
                        G_reader_settings:saveSetting(setting_key, new_val)
                        
                        logger.info("[Sake] Updated setting: " .. setting_key .. " = " .. new_val)
                        
                        UIManager:close(self.input_dialog)
                        UIManager:show(InfoMessage:new{ text = _("Saved!") })
                    end,
                },
            },
        },
    }
    UIManager:show(self.input_dialog)
    self.input_dialog:onShowKeyboard()
end

function Sake:onSakeSync()
    logger.info("[Sake] Manual sync started.")

    if self.api_user == "" then 
        logger.warn("[Sake] Sync aborted: Missing credentials.")
        UIManager:show(InfoMessage:new{ text = _("Please configure settings first!") })
        return 
    end

    self.popup = InfoMessage:new{ text = _("Checking for new books..."), timeout = nil }
    UIManager:show(self.popup)

    UIManager:scheduleIn(0.05, function()
        logger.info("[Sake] Fetching book list from API...")
        local success, result = BookApi.fetchBookList(self.api_url, self.api_user, self.api_pass, self.device_name)
        
        if self.popup then UIManager:close(self.popup) end

        if not success then
            logger.error("[Sake] Fetch failed: " .. tostring(result))
            UIManager:show(InfoMessage:new{ text = _("Error: " .. result) })
            return
        end

        local books = result
        if #books == 0 then
            logger.info("[Sake] No new books found.")
            UIManager:show(InfoMessage:new{ text = _("No new books found.") })
            return
        end

        logger.info("[Sake] Found " .. #books .. " new books. Starting download queue.")
        self:startDownloadQueue(books, 1)
    end)
end

function Sake:startDownloadQueue(books, index)
    local total = #books
    
    if self.popup then
        UIManager:close(self.popup)
    end

    if index > total then
        logger.info("[Sake] All downloads completed successfully.")
        UIManager:show(InfoMessage:new{ text = _("Success! Downloaded " .. total .. " books.") })
        return
    end

    local book = books[index]
    local ok, val = pcall(self.formatSize, self, book.filesize)
    local size_mb = ok and val or "Unknown"

    logger.info("[Sake] Downloading " .. index .. "/" .. total .. ": " .. book.title .. " (" .. size_mb .. ")")

    local msg = string.format("Downloading %d of %d\n\n%s\nSize: %s", index, total, book.title, size_mb)
    
    self.popup = InfoMessage:new{
        text = msg,
        timeout = nil, 
    }
    UIManager:show(self.popup)

    UIManager:scheduleIn(0.1, function()
        local success, err = BookApi.downloadBook(self.api_url, self.api_user, self.api_pass, self.device_name, book, self.home_dir)
        
        if not success then
            logger.error("[Sake] Download failed for '" .. book.title .. "': " .. tostring(err))
            if self.popup then UIManager:close(self.popup) end
            UIManager:show(InfoMessage:new{ text = _("Failed on book " .. index .. ": " .. err) })
            return
        end
        
        logger.info("[Sake] Download success: " .. book.title)
        self:startDownloadQueue(books, index + 1)
    end)
end

function Sake:formatSize(bytes)
    if not bytes then return "Unknown" end
    local mb = bytes / 1024 / 1024
    return string.format("%.2f MB", mb)
end

function Sake:handleSuspend()
    if self.api_user == "" or self.api_pass == "" then return end

    logger.info("[Sake] Suspend detected. Starting background tasks...")

    UIManager:scheduleIn(1.0, function()
            self:syncCurrentBookProgress()
        end)

    UIManager:scheduleIn(1, function()
        logger.info("[Sake] Starting silent book sync...")
        local count = BookApi.performSilentSync(self.api_url, self.api_user, self.api_pass, self.device_name, self.home_dir)
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

function Sake:syncCurrentBookProgress()
    logger.info("[Sake] Checking for open document to sync progress...")
    
    if not self.ui.document then 
        logger.info("[Sake] No document open. Skipping progress sync.")
        return 
    end
    
    local doc_path = self.ui.document.file
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
        self.api_url, 
        self.api_user, 
        self.api_pass, 
        filename, 
        content
    )
    
    if not success then
        logger.info("[Sake] Progress Upload Failed: " .. tostring(msg))
    else
        logger.info("[Sake] Progress Upload Success.")
    end
end

return Sake