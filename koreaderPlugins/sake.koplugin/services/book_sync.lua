local InfoMessage = require("ui/widget/infomessage")
local UIManager = require("ui/uimanager")
local logger = require("logger")
local _ = require("gettext")

local BookApi = require("api/book")
local Settings = require("settings")
local Utils = require("utils")

local BookSync = {}
BookSync.__index = BookSync

function BookSync:new(ctx)
    return setmetatable({
        ctx = ctx,
        popup = nil,
    }, self)
end

local function closePopup(self)
    if self.popup then
        UIManager:close(self.popup)
        self.popup = nil
    end
end

function BookSync:showError(message)
    local text = _("Error: ") .. tostring(message)
    logger.warn("[Sake] " .. text)
    UIManager:show(InfoMessage:new{ text = text, timeout = 6 })
end

function BookSync:validateSettings()
    local ok, missing = Settings.validateRequired(self.ctx.settings)
    if not ok then
        return false, "Please configure: " .. tostring(missing)
    end
    return true
end

function BookSync:saveBook(home_dir, storage_key, content)
    local sanitized = Utils.sanitizeFilename(storage_key)
    local output_path = home_dir .. "/" .. sanitized
    local temp_path = output_path .. ".part"

    local file, open_err = io.open(temp_path, "wb")
    if not file then
        return false, "Cannot open file for writing: " .. tostring(open_err)
    end

    local ok, write_err = file:write(content or "")
    file:close()
    if not ok then
        os.remove(temp_path)
        return false, "Cannot write file: " .. tostring(write_err)
    end

    local renamed = os.rename(temp_path, output_path)
    if not renamed then
        os.remove(temp_path)
        return false, "Cannot move temporary file into place"
    end

    return true, output_path
end

function BookSync:downloadAndStoreBook(book)
    local settings = self.ctx.settings
    local ok_content, payload_or_err, err = BookApi.fetchBookContent(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        book
    )
    if not ok_content then
        return false, err or payload_or_err
    end

    local payload = payload_or_err
    local ok_save, output_or_err = self:saveBook(settings.home_dir, payload.storage_key, payload.content)
    if not ok_save then
        return false, output_or_err
    end

    local ok_confirm, confirm_err = BookApi.confirmDownload(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        settings.device_name,
        book.id
    )
    if not ok_confirm then
        return false, "Saved locally but failed to confirm download: " .. tostring(confirm_err)
    end

    return true, output_or_err
end

function BookSync:syncNow()
    logger.info("[Sake] Manual sync started.")

    local valid, err = self:validateSettings()
    if not valid then
        self:showError(err)
        return
    end

    self.popup = InfoMessage:new{ text = _("Checking for new books..."), timeout = nil }
    UIManager:show(self.popup)

    UIManager:scheduleIn(0.05, function()
        local settings = self.ctx.settings
        local success, result = BookApi.fetchBookList(
            settings.api_url,
            settings.api_user,
            settings.api_pass,
            settings.device_name
        )

        closePopup(self)

        if not success then
            self:showError(result)
            return
        end

        local books = result
        if #books == 0 then
            UIManager:show(InfoMessage:new{ text = _("No new books found.") })
            return
        end

        logger.info("[Sake] Found " .. #books .. " new books. Starting download queue.")
        self:startDownloadQueue(books, 1)
    end)
end

function BookSync:startDownloadQueue(books, index)
    local total = #books

    closePopup(self)

    if index > total then
        UIManager:show(InfoMessage:new{ text = _("Success! Downloaded " .. total .. " books.") })
        return
    end

    local book = books[index]
    local size_mb = Utils.formatSize(book.filesize)
    local title = tostring(book.title or "Unknown")

    logger.info("[Sake] Downloading " .. index .. "/" .. total .. ": " .. title .. " (" .. size_mb .. ")")

    local msg = string.format("Downloading %d of %d\n\n%s\nSize: %s", index, total, title, size_mb)
    self.popup = InfoMessage:new{
        text = msg,
        timeout = nil,
    }
    UIManager:show(self.popup)

    UIManager:scheduleIn(0.1, function()
        local success, output_or_err = self:downloadAndStoreBook(book)
        if not success then
            closePopup(self)
            self:showError("Failed on book " .. tostring(index) .. ": " .. tostring(output_or_err))
            return
        end

        logger.info("[Sake] Download success: " .. title .. " -> " .. tostring(output_or_err))
        self:startDownloadQueue(books, index + 1)
    end)
end

function BookSync:performSilentSync()
    local valid, err = self:validateSettings()
    if not valid then
        return 0, err
    end

    local settings = self.ctx.settings
    local success, result = BookApi.fetchBookList(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        settings.device_name
    )
    if not success then
        return 0, result
    end

    local books = result
    if #books == 0 then
        return 0
    end

    local count = 0
    for _, book in ipairs(books) do
        local ok_book, err_book = self:downloadAndStoreBook(book)
        if ok_book then
            count = count + 1
        else
            return count, err_book
        end
    end

    return count
end

return BookSync
