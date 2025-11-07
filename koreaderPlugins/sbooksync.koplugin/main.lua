--[[--
This is a debug plugin to test Plugin functionality.

@module koplugin.SBookSync
--]]--


-- if true then
--     return { disabled = true, }
-- end

local Dispatcher = require("dispatcher")  -- luacheck:ignore
local InfoMessage = require("ui/widget/infomessage")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local _ = require("gettext")
local http = require("socket.http")
local json = require("json")
local ltn12 = require("ltn12")
local socket = require("socket.url")
local mime = require("mime")

local SBookSync = WidgetContainer:extend{
    name = "hello",
    is_doc_only = false,
}
SBookSync.scheduled_callback = nil
SBookSync.request_url = "https://undaubed-decapodous-prudence.ngrok-free.dev/api/library"
-- SBookSync.request_url = "https://z-dl.codingsascha.dev/api/library"
SBookSync.device_id = "kindle_001"

SBookSync.get_new_books_route = "/new?deviceId="
SBookSync.post_confirm_book_download_route = "/confirmDownload"
SBookSync.get_download_book = "/"
SBookSync.confirm_download_book = "/confirmDownload"
SBookSync.debug_mode = false

SBookSync.basic_user = "###"
SBookSync.basic_pass = "###"

function SBookSync:init()
    self:onDispatcherRegisterActions()
    self.ui.menu:registerToMainMenu(self)
    self:showInfoDebug("Registerd SbookSync Plugin")

    self.scheduled_callback = function()
        local success, message = self:getNewBooks()
        self:showInfoDebug(message)
    end
    self.onResume = self._onResume
    self.onSuspend = self._onSuspend
    UIManager:scheduleIn(1, self.scheduled_callback)
end

function SBookSync:getNewBooks()
    self:showInfoDebug("Searching for new Books...")
    local auth_header_value = self:createBasicAuthHeader()
    self.showInfoDebug("Auth Header: " .. auth_header_value)    

    local target_url = self.request_url .. self.get_new_books_route .. self.device_id
    
    local response_body = {}
    local success, statusCode, headers, statusText = http.request{
        url = target_url,
        method = "GET",
        headers = {
            ["Authorization"] = auth_header_value,
        },
        sink = ltn12.sink.table(response_body)
    }

    if statusCode ~= 200 then
        return false, "Getting new Book failed - " .. tostring(code)
    end

    local body = table.concat(response_body)
    local ok, result = pcall(function()
        return json.decode(body)
    end)

    if not ok and not result then
        return false, "Could not Decode JSON - " .. tostring(ok)
    end

    self:showInfoDebug("Downloading " .. #result .. " Books")

    for _, book in ipairs(result) do
        self:showInfoDebug("Found Book: " .. book.title .. " - downloading...")

        local success, message = self:downloadBook(book.s3_storage_key, book.id)
        self:showInfoDebug(message)
    end

    return true, "Downloaded " .. #result .. " Books"
end

function SBookSync:downloadBook(s3Key, bookId)
   local ok, result, message = pcall(function()
        local sanitizedFilename = self:sanitizeFilename(s3Key)
        local output_path = G_reader_settings:readSetting("home_dir") .. "/".. sanitizedFilename
        local encodedKey = socket.escape(s3Key)
        local download_url = self.request_url .. self.get_download_book .. encodedKey
        self:showInfoDebug(sanitizedFilename)

        local file, err = io.open(output_path, "wb")
        if not file then
            error("Failed to open file: " .. tostring(err))
        end

        local auth_header_value = self:createBasicAuthHeader()

        local success, statusCode, headers, statusText = http.request{
            url = download_url,
            sink = ltn12.sink.file(file),
            redirect = true,
            headers = {
                ["Authorization"] = auth_header_value,
            },
        }

        if not success then
            error("Download new Book failed - " .. tostring(statusCode))
        end

        if tonumber(statusCode) ~= 200 then
            error("Download new Book failed - " .. tostring(statusCode))
        end

        local registerSuccess, registerMessage = self:registerBookAsDownloaded(bookId)
        self:showInfoDebug(registerMessage)
        
        if not registerSuccess then
            error(registerMessage)
        end

        return true, "Downloaded to " .. output_path
    end)

    if not ok then
        return false, "Download new book failed failed: " .. tostring(result)
    end

    return result, message
end

function SBookSync:registerBookAsDownloaded(bookId)
    local body
    
    pcall(function()
        body = json.encode({
            deviceId = self.device_id,
            bookId = bookId
        })
    end)

    if not body then
        return false, "Failed to encode JSON body"
    end

    local target_url = self.request_url .. self.confirm_download_book
    local response_body = {}
    local auth_header_value = self:createBasicAuthHeader()

    local success, statusCode, headers, statusText = http.request{
        url = target_url,
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["Content-Length"] = tostring(#body),
            headers = {
                ["Authorization"] = auth_header_value,
            },
        },
        source = ltn12.source.string(body),
        sink = ltn12.sink.table(response_body)
    }

    if not success then
        return false, "Confirming book download failed - " .. tostring(statusCode)
    end

    if statusCode < 200 or statusCode >= 300 then
        return false, "Confirming book download failed - " .. tostring(statusCode)
    end

    return true, "Confirmed book download"
end

function SBookSync:createBasicAuthHeader()
    local credentials = self.basic_user .. ":" .. self.basic_pass
    
    local encoded_credentials = (mime.b64(credentials))
    
    return "Basic " .. encoded_credentials
end


function SBookSync:sanitizeFilename(name)
    name = string.gsub(name, "%s+", "_")

    name = string.gsub(name, "[^%w%._%-]", "")
    return name
end

function SBookSync:showInfoDebug(msg)
    if not self.debug_mode then
        return
    end
    UIManager:show(InfoMessage:new{
        text = msg,
    })
end

function SBookSync:showDebug(msg)
    UIManager:show(InfoMessage:new{
        text = msg,
    })
end

function SBookSync:_onResume()
end

function SBookSync:_onSuspend()
    UIManager:scheduleIn(3, self.scheduled_callback)
end

function SBookSync:onDispatcherRegisterActions()
    Dispatcher:registerAction("helloworld_action", {category="none", event="HelloWorld", title=_("Hello World"), general=true,})
end

function SBookSync:addToMainMenu(menu_items)
    menu_items.hello_world = {
        text = _("Hello World"),
        -- in which menu this should be appended
        sorting_hint = "more_tools",
        -- a callback when tapping
        callback = function()
            UIManager:show(InfoMessage:new{
                text = _("Hello, plugin world"),
            })
        end,
    }
end

function SBookSync:onHelloWorld()
    local popup = InfoMessage:new{
        text = _("Hello World"),
    }
    UIManager:show(popup)
end

return SBookSync
