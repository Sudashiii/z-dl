local API = require("api") 
local Dispatcher = require("dispatcher")
local InfoMessage = require("ui/widget/infomessage")
local InputDialog = require("ui/widget/inputdialog")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local _ = require("gettext")

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
        math.randomseed(os.time())
        local random_id = string.format("%x", math.random(100000, 999999))
        stored_name = "device_" .. random_id
        
        G_reader_settings:saveSetting("sake_device_name", stored_name)
    end
    self.device_name = stored_name
    
    self.home_dir = G_reader_settings:readSetting("home_dir") or "."

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
    if self.api_user == "" then 
        UIManager:show(InfoMessage:new{ text = _("Please configure settings first!") })
        return 
    end

    self.popup = InfoMessage:new{ text = _("Checking for new books..."), timeout = nil }
    UIManager:show(self.popup)

    UIManager:scheduleIn(0.05, function()
        local success, result = API.fetchBookList(self.api_url, self.api_user, self.api_pass, self.device_name)
        
        if self.popup then UIManager:close(self.popup) end

        if not success then
            UIManager:show(InfoMessage:new{ text = _("Error: " .. result) })
            return
        end

        local books = result
        if #books == 0 then
            UIManager:show(InfoMessage:new{ text = _("No new books found.") })
            return
        end

        self:startDownloadQueue(books, 1)
    end)
end

function Sake:startDownloadQueue(books, index)
    local total = #books
    
    if self.popup then
        UIManager:close(self.popup)
    end

    if index > total then
        UIManager:show(InfoMessage:new{ text = _("Success! Downloaded " .. total .. " books.") })
        return
    end

    local book = books[index]
    local size_mb = self:formatSize(book.filesize)

    local msg = string.format("Downloading %d of %d\n\n%s\nSize: %s", index, total, book.title, size_mb)
    
    self.popup = InfoMessage:new{
        text = msg,
        timeout = nil, 
    }
    UIManager:show(self.popup)

    UIManager:scheduleIn(0.1, function()
        local success, err = API.downloadBook(self.api_url, self.api_user, self.api_pass, self.device_name, book, self.home_dir)
        
        if not success then
            if self.popup then UIManager:close(self.popup) end
            UIManager:show(InfoMessage:new{ text = _("Failed on book " .. index .. ": " .. err) })
            return
        end

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

    UIManager:scheduleIn(1, function()
        local count = API.performSilentSync(self.api_url, self.api_user, self.api_pass, self.device_name, self.home_dir)
        self.books_downloaded_bg = count
    end)
end

function Sake:handleResume()
    if self.books_downloaded_bg > 0 then
        UIManager:show(InfoMessage:new{ 
            text = _("Welcome back!\nDownloaded " .. self.books_downloaded_bg .. " books while away."),
            timeout = 5
        })
        self.books_downloaded_bg = 0
    end
end

return Sake