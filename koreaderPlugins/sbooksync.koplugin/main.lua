--[[--
This is a debug plugin to test Plugin functionality.

@module koplugin.SBookSync
--]]--


if true then
    return { disabled = true, }
end

local Dispatcher = require("dispatcher")  -- luacheck:ignore
local InfoMessage = require("ui/widget/infomessage")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local _ = require("gettext")
local http = require("socket.http")
local json = require("json")
local ltn12 = require("ltn12")

local SBookSync = WidgetContainer:extend{
    name = "hello",
    is_doc_only = false,
}
SBookSync.scheduled_callback = nil
-- SBookSync.request_url = "https://undaubed-decapodous-prudence.ngrok-free.dev/library/Python_Crash_Course_-_The_Ultimate_Beginners_Course_to_Learning_Python_Programming_in_Under_12_Hours.epub"
SBookSync.request_url = "https://z-dl.codingsascha.dev/api/library"
SBookSync.device_id = "kindle_001"

SBookSync.get_new_books_route = "/new?deviceId="
SBookSync.post_confirm_book_download_route = "/confirmDownload"
SBookSync.get_download_book = "/"

function SBookSync:init()
    self:onDispatcherRegisterActions()
    self.ui.menu:registerToMainMenu(self)

    self.scheduled_callback = function()
        self:show()
        self:showMsg("Downloading...")
        -- local success, message = self:saveBinary()
        self:showMsg(message)
    end
    self.onResume = self._onResume
    UIManager:scheduleIn(3, self.scheduled_callback)
end

function SBookSync:getNewBooks()
    local body, code, headers, status = http.request(self.request_url .. self.get_new_books_route .. self.device_id)

    if code ~= 200 then
        self:showInfo("Getting new Book failed - " .. tostring(code))
        return nil
    end

    local ok, result = pcall(function()
        return json.decode(body)
    end)

    if not ok and not result then
        self:showInfo("Could not Decode JSON - " .. tostring(ok))
        return nil
    end

    self:showInfo("Download" .. #result .. "Books")

    for _, book in ipairs(result) do
        self:downloadBook(book.s3Key)
    end
end

function SBookSync:downloadBook(s3Key)
   local ok, result, message = pcall(function()
        local output_path = G_reader_settings:readSetting("home_dir") .. s3Key

        local file, err = io.open(output_path, "wb")
        if not file then
            error("Failed to open file: " .. tostring(err))
        end

        local success, statusCode, headers, statusText = http.request{
            url = self.request_url .. self.get_download_book .. s3Key,
            sink = ltn12.sink.file(file),
            redirect = true,
        }

        if not success then
            error("Download new Book failed - " .. tostring(statusCode))
        end

        if tonumber(statusCode) ~= 200 then
            error("Download new Book failed - " .. tostring(statusCode))
        end

        return true, "Downloaded to " .. output_path
    end)

    if not ok then
        return false, "Download new book failed failed: " .. tostring(result)
    end

    return result, message
end

function SBookSync:show()
    -- local path = G_reader_settings:readSetting("home_dir")
    -- local texttoshow = path
    
    -- local body, code, headers, status = http.request(self.request_url .. self.get_new_books_route .. self.device_id)
    -- texttoshow = "HTTP code: " .. tostring(code)
    -- if code == 200 and body then
    -- local ok, result = pcall(function()
    --     return json.decode(body)
    -- end)

        -- if ok and result then
        --     texttoshow = result.name
        -- else
        --     texttoshow = "Failed to parse JSON:" .. tostring(result)
        -- end
    -- else
    --     texttoshow = "HTTP request failed with code: " .. tostring(code)
    -- end


    -- UIManager:show(InfoMessage:new{
    --     text = texttoshow,
    -- })
    -- UIManager:scheduleIn(15, self.scheduled_callback)
end

function SBookSync:showInfo(msg)
    UIManager:show(InfoMessage:new{
        text = msg,
    })
end

function SBookSync:showMsg(msg)
    local ok, msg = self:saveBinary()
    UIManager:show(InfoMessage:new{
        text = msg,
    })
end

function SBookSync:saveBinary()
    local ok, result, message = pcall(function()
        local output_path = G_reader_settings:readSetting("home_dir") .. "/todo_get_book_title.epub"

        local file, err = io.open(output_path, "wb")
        if not file then
            error("Failed to open file: " .. tostring(err))
        end

        local success, statusCode, headers, statusText = http.request{
            url = self.request_url,
            sink = ltn12.sink.file(file),
            redirect = true,
        }

        if not success then
            error("HTTP request failed: " .. tostring(statusCode))
        end

        if tonumber(statusCode) ~= 200 then
            error("Unexpected status: " .. tostring(statusCode))
        end

        return true, "Downloaded to " .. output_path
    end)

    if not ok then
        return false, "saveBinary failed: " .. tostring(result)
    end

    return result, message
end

function SBookSync:_onResume()
    self:show()
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
