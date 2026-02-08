local InfoMessage = require("ui/widget/infomessage")
local UIManager = require("ui/uimanager")
local logger = require("logger")
local _ = require("gettext")

local BookApi = require("api/book")

local BookSync = {}
BookSync.__index = BookSync

function BookSync:new(ctx)
    return setmetatable({
        ctx = ctx,
        popup = nil,
    }, self)
end

function BookSync:syncNow()
    logger.info("[Sake] Manual sync started.")

    local settings = self.ctx.settings
    if settings.api_user == "" then
        logger.warn("[Sake] Sync aborted: Missing credentials.")
        UIManager:show(InfoMessage:new{ text = _("Please configure settings first!") })
        return
    end

    self.popup = InfoMessage:new{ text = _("Checking for new books..."), timeout = nil }
    UIManager:show(self.popup)

    UIManager:scheduleIn(0.05, function()
        logger.info("[Sake] Fetching book list from API...")
        local success, result = BookApi.fetchBookList(
            settings.api_url,
            settings.api_user,
            settings.api_pass,
            settings.device_name
        )

        if self.popup then UIManager:close(self.popup) end

        if not success then
            logger.info("[Sake] Fetch failed: " .. tostring(result))
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

function BookSync:startDownloadQueue(books, index)
    local total = #books

    if self.popup then
        UIManager:close(self.popup)
    end

    if index > total then
        logger.info("[Sake] All downloads completed successfully.")
        UIManager:show(InfoMessage:new{ text = _("Success! Downloaded " .. total .. " books.") })
        return
    end

    local settings = self.ctx.settings
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
        local success, err = BookApi.downloadBook(
            settings.api_url,
            settings.api_user,
            settings.api_pass,
            settings.device_name,
            book,
            settings.home_dir
        )

        if not success then
            logger.info("[Sake] Download failed for '" .. book.title .. "': " .. tostring(err))
            if self.popup then UIManager:close(self.popup) end
            UIManager:show(InfoMessage:new{ text = _("Failed on book " .. index .. ": " .. err) })
            return
        end

        logger.info("[Sake] Download success: " .. book.title)
        self:startDownloadQueue(books, index + 1)
    end)
end

function BookSync:formatSize(bytes)
    if not bytes then return "Unknown" end
    local mb = bytes / 1024 / 1024
    return string.format("%.2f MB", mb)
end

function BookSync:performSilentSync()
    local settings = self.ctx.settings
    local count = BookApi.performSilentSync(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        settings.device_name,
        settings.home_dir
    )
    return count
end

return BookSync
