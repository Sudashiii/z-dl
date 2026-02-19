local logger = require("logger")
local UIManager = require("ui/uimanager")
local InfoMessage = require("ui/widget/infomessage")
local Event = require("ui/event")
local ProgressApi = require("api/progress")
local Settings = require("settings")
local Utils = require("utils")
local _ = require("gettext")

local ProgressSync = {}
ProgressSync.__index = ProgressSync
local LOG_PREFIX = "[Sake] "

function ProgressSync:new(ctx)
    return setmetatable({ ctx = ctx }, self)
end

function ProgressSync:showError(message, opts)
    logger.warn(LOG_PREFIX .. tostring(message))
    if opts and opts.silent then
        return
    end
    UIManager:show(InfoMessage:new{
        text = _("Error: ") .. tostring(message),
        timeout = 6
    })
end

function ProgressSync:validateSettings()
    local ok, missing = Settings.validateRequired(self.ctx.settings)
    if not ok then
        return false, "Please configure: " .. tostring(missing)
    end
    return true
end

function ProgressSync:getCurrentDocPaths()
    local ui = self.ctx.ui
    if not ui.document then
        return false, "No document open"
    end

    local doc_path = ui.document.file
    if not doc_path or doc_path == "" then
        return false, "Could not determine document path"
    end

    local filename = Utils.basename(doc_path)
    if not filename then
        return false, "Could not determine file name"
    end

    local sdr_path = string.gsub(doc_path, "%.([^%.]+)$", ".sdr/metadata.%1.lua")
    return true, {
        doc_path = doc_path,
        filename = filename,
        sdr_path = sdr_path,
    }
end

function ProgressSync:hasOpenDocument()
    local ui = self.ctx.ui
    return ui and ui.document and ui.document.file and ui.document.file ~= ""
end

local function safeCall(obj, method, ...)
    if not obj then
        return false, nil
    end
    local fn = obj[method]
    if type(fn) ~= "function" then
        return false, nil
    end
    local ok, value = pcall(fn, obj, ...)
    if not ok then
        return false, nil
    end
    return true, value
end

function ProgressSync:getLivePercentFinished(paths)
    local ui = self.ctx.ui
    local function asPercent(value)
        local n = tonumber(value)
        if not n then
            return nil
        end
        if n >= 0 and n <= 1 then
            return n
        end
        if n > 1 and n <= 100 then
            return n / 100
        end
        return nil
    end

    -- 1) Direct document APIs, if exposed by current reader engine.
    if ui and ui.document then
        local ok_cur, current_page = safeCall(ui.document, "getCurrentPage")
        local ok_total, total_pages = safeCall(ui.document, "getPageCount")
        if ok_cur and ok_total and tonumber(total_pages) and tonumber(total_pages) > 0 then
            return asPercent(tonumber(current_page) / tonumber(total_pages))
        end
    end

    -- 2) Live doc settings object that KOReader keeps around.
    if ui and ui.doc_settings then
        local ok_summary, summary = safeCall(ui.doc_settings, "readSetting", "summary")
        if ok_summary and type(summary) == "table" then
            local percent = asPercent(summary.percent_finished)
            if percent then
                return percent
            end
        end

        local ok_percent, percent_finished = safeCall(ui.doc_settings, "readSetting", "percent_finished")
        if ok_percent then
            local percent = asPercent(percent_finished)
            if percent then
                return percent
            end
        end
    end

    -- 3) Fallback: open DocSettings directly for the current document path.
    local ok_require, DocSettings = pcall(require, "docsettings")
    if ok_require and DocSettings and paths and paths.doc_path then
        local opened = nil
        local ok_open, instance = pcall(function()
            if type(DocSettings.open) == "function" then
                return DocSettings:open(paths.doc_path)
            end
            return nil
        end)
        if ok_open then
            opened = instance
        end
        if opened then
            local ok_summary, summary = safeCall(opened, "readSetting", "summary")
            if ok_summary and type(summary) == "table" then
                local percent = asPercent(summary.percent_finished)
                if percent then
                    safeCall(opened, "close")
                    return percent
                end
            end
            local ok_percent, percent_finished = safeCall(opened, "readSetting", "percent_finished")
            if ok_percent then
                local percent = asPercent(percent_finished)
                if percent then
                    safeCall(opened, "close")
                    return percent
                end
            end
            safeCall(opened, "close")
        end
    end

    return nil
end

function ProgressSync:readMetadataFile(path)
    local f = io.open(path, "r")
    if not f then
        return false, "Metadata file not found: " .. tostring(path)
    end
    local content = f:read("*all")
    f:close()
    return true, content
end

function ProgressSync:writeMetadataFile(path, content)
    local parent = path:match("^(.*)/[^/]+$")
    if parent and parent ~= "" then
        local quoted_parent = "'" .. parent:gsub("'", "'\\''") .. "'"
        local mk_ok = os.execute("mkdir -p " .. quoted_parent)
        if mk_ok ~= true and mk_ok ~= 0 then
            return false, "Failed to create metadata directory: " .. tostring(parent)
        end
    end

    local temp_path = path .. ".part"
    local f_write, open_err = io.open(temp_path, "w")
    if not f_write then
        return false, "Failed to write metadata file: " .. tostring(open_err)
    end

    local ok, write_err = f_write:write(content)
    f_write:close()
    if not ok then
        os.remove(temp_path)
        return false, "Failed while writing metadata: " .. tostring(write_err)
    end

    local renamed = os.rename(temp_path, path)
    if not renamed then
        os.remove(temp_path)
        return false, "Failed to replace metadata file"
    end

    return true
end

function ProgressSync:isLikelyValidLuaMetadata(content)
    return content and content ~= "" and content:find("return%s*{", 1) ~= nil
end

function ProgressSync:getLocalPathsForBook(book)
    local settings = self.ctx.settings
    local storage_key = tostring(book.s3_storage_key or "")
    local local_filename = Utils.sanitizeFilename(storage_key)
    local book_path = settings.home_dir .. "/" .. local_filename
    local sdr_path = string.gsub(book_path, "%.([^%.]+)$", ".sdr/metadata.%1.lua")
    return {
        book_path = book_path,
        sdr_path = sdr_path,
        local_filename = local_filename,
    }
end

function ProgressSync:bookMatchesOpenDocument(book, open_doc_path)
    if not open_doc_path or open_doc_path == "" then
        return false
    end
    local open_file = Utils.basename(open_doc_path)
    if not open_file then
        return false
    end

    local storage_key = tostring(book.s3_storage_key or "")
    local local_filename = Utils.sanitizeFilename(storage_key)
    return open_file == local_filename or open_file == storage_key
end

function ProgressSync:closeCurrentDocumentIfMatches(books)
    local ui = self.ctx.ui
    if not ui.document or not ui.document.file then
        return true
    end

    local open_path = ui.document.file
    local needs_close = false
    for _, book in ipairs(books) do
        if self:bookMatchesOpenDocument(book, open_path) then
            needs_close = true
            break
        end
    end

    if not needs_close then
        return true
    end

    logger.info(LOG_PREFIX .. "Open book has incoming remote progress. Closing before apply.")
    local ok, err = pcall(function()
        ui:handleEvent(Event:new("Close"))
    end)
    if not ok then
        return false, "Failed to close current book: " .. tostring(err)
    end

    if ui.document and ui.document.file == open_path then
        return false, "Could not close current book before applying remote progress"
    end

    return true
end

function ProgressSync:syncCurrentBookProgress(opts)
    logger.info(LOG_PREFIX .. "Sync current book progress started.")
    local valid_settings, settings_err = self:validateSettings()
    if not valid_settings then
        self:showError(settings_err, opts)
        return false, settings_err
    end

    local ok_doc, doc_or_err = self:getCurrentDocPaths()
    if not ok_doc then
        if doc_or_err == "No document open" then
            logger.info(LOG_PREFIX .. "No document open. Running remote progress download sync.")
            return self:syncNewProgressForDevice(opts)
        end
        self:showError(doc_or_err, opts)
        return false, doc_or_err
    end
    local paths = doc_or_err
    local live_percent_finished = self:getLivePercentFinished(paths)
    logger.info(LOG_PREFIX .. "Live percent_finished: " .. tostring(live_percent_finished))

    local ok_file, content_or_err = self:readMetadataFile(paths.sdr_path)
    if not ok_file then
        self:showError(content_or_err, opts)
        return false, content_or_err
    end

    local settings = self.ctx.settings
    local success, msg = ProgressApi.uploadProgress(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        paths.filename,
        content_or_err,
        settings.device_name,
        live_percent_finished
    )

    if not success then
        self:showError("Progress upload failed: " .. tostring(msg), opts)
        return false, msg
    end

    logger.info(LOG_PREFIX .. "Progress upload success.")
    return true
end

function ProgressSync:downloadProgress(opts)
    local valid_settings, settings_err = self:validateSettings()
    if not valid_settings then
        self:showError(settings_err, opts)
        return false, settings_err
    end

    local ok_doc, doc_or_err = self:getCurrentDocPaths()
    if not ok_doc then
        self:showError(doc_or_err, opts)
        return false, doc_or_err
    end
    local paths = doc_or_err
    local settings = self.ctx.settings

    local success, content = ProgressApi.downloadProgress(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        paths.filename
    )

    if not success then
        if content == "No progress found on server" then
            return false, content
        end
        self:showError("Progress download failed: " .. tostring(content), opts)
        return false, content
    end

    if not self:isLikelyValidLuaMetadata(content) then
        local err = "Received invalid Lua metadata content"
        self:showError(err, opts)
        return false, err
    end

    UIManager:show(InfoMessage:new{
        text = _("New progress found!\nApplying update..."),
        timeout = 2
    })

    UIManager:scheduleIn(1.0, function()
        local ok_write, write_err = self:writeMetadataFile(paths.sdr_path, content)
        if not ok_write then
            self:showError(write_err, opts)
            return
        end

        UIManager:show(InfoMessage:new{
            text = _("Sync Complete.\nPlease re-open the book."),
            timeout = 3
        })
    end)

    return true
end

function ProgressSync:applyRemoteProgressForBook(book, opts)
    local settings = self.ctx.settings
    local storage_key = tostring(book.s3_storage_key or "")
    if storage_key == "" then
        return false, "Book is missing storage key"
    end

    local local_paths = self:getLocalPathsForBook(book)
    logger.info(LOG_PREFIX .. "Applying remote progress for: " .. tostring(local_paths.local_filename))
    local exists = io.open(local_paths.book_path, "rb")
    if not exists then
        return false, "Local file not found for progress apply: " .. tostring(local_paths.local_filename)
    end
    exists:close()

    local ok_download, content_or_err = ProgressApi.downloadProgress(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        storage_key
    )
    if not ok_download then
        return false, "Download failed for " .. tostring(storage_key) .. ": " .. tostring(content_or_err)
    end

    if not self:isLikelyValidLuaMetadata(content_or_err) then
        return false, "Downloaded invalid Lua metadata for " .. tostring(storage_key)
    end

    local ok_write, write_err = self:writeMetadataFile(local_paths.sdr_path, content_or_err)
    if not ok_write then
        return false, write_err
    end

    local ok_confirm, confirm_err = ProgressApi.confirmProgressDownload(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        settings.device_name,
        book.id
    )
    if not ok_confirm then
        return false, "Applied locally but confirm failed for book " .. tostring(book.id) .. ": " .. tostring(confirm_err)
    end

    logger.info(LOG_PREFIX .. "Applied and confirmed remote progress for book id " .. tostring(book.id))

    return true
end

function ProgressSync:syncNewProgressForDevice(opts)
    logger.info(LOG_PREFIX .. "Device-level progress sync started.")
    local valid_settings, settings_err = self:validateSettings()
    if not valid_settings then
        self:showError(settings_err, opts)
        return false, settings_err
    end

    local settings = self.ctx.settings
    local ok_list, books_or_err = ProgressApi.getNewProgressForDevice(
        settings.api_url,
        settings.api_user,
        settings.api_pass,
        settings.device_name
    )
    if not ok_list then
        self:showError("Progress queue fetch failed: " .. tostring(books_or_err), opts)
        return false, books_or_err
    end

    local books = books_or_err
    if #books == 0 then
        logger.info(LOG_PREFIX .. "No new remote progress updates.")
        return true, { total = 0, applied = 0, failed = 0, errors = {} }
    end
    logger.info(LOG_PREFIX .. "Remote progress queue size: " .. tostring(#books))

    -- Safety workaround: applying progress while reader is actively open can crash KOReader.
    -- Only auto-apply when no document is open.
    if self:hasOpenDocument() then
        logger.warn(LOG_PREFIX .. "Deferring remote progress apply because a document is open.")
        if not (opts and opts.silent) then
            UIManager:show(InfoMessage:new{
                text = _("Remote progress is available.\nClose the current book to apply safely."),
                timeout = 5
            })
        end
        return true, {
            total = #books,
            applied = 0,
            failed = 0,
            errors = {},
            deferred = true,
        }
    end

    local ok_close, close_err = self:closeCurrentDocumentIfMatches(books)
    if not ok_close then
        self:showError(close_err, opts)
        return false, close_err
    end

    local applied = 0
    local failed = 0
    local errors = {}

    for _, book in ipairs(books) do
        local ok_apply, err_apply = self:applyRemoteProgressForBook(book, opts)
        if ok_apply then
            applied = applied + 1
        else
            failed = failed + 1
            table.insert(errors, tostring(err_apply))
            self:showError(err_apply, opts)
        end
    end

    logger.info(LOG_PREFIX .. "Device-level progress sync done. Applied: " .. tostring(applied) .. " Failed: " .. tostring(failed))

    return true, {
        total = #books,
        applied = applied,
        failed = failed,
        errors = errors,
    }
end

return ProgressSync
