local InfoMessage = require("ui/widget/infomessage")
local InputDialog = require("ui/widget/inputdialog")
local UIManager = require("ui/uimanager")
local logger = require("logger")
local _ = require("gettext")

local Settings = require("settings")

local Dialogs = {}

function Dialogs.showStringInput(ctx, setting_key, field, title)
    ctx.input_dialog = InputDialog:new{
        title = _(title),
        input = ctx.settings[field],
        input_type = "string",
        buttons = {
            {
                {
                    text = _("Cancel"),
                    id = "close",
                    callback = function() UIManager:close(ctx.input_dialog) end,
                },
                {
                    text = _("Save"),
                    callback = function()
                        local new_val = ctx.input_dialog:getInputText()
                        ctx.settings[field] = new_val
                        Settings.saveKey(setting_key, new_val)

                        logger.info("[Sake] Updated setting: " .. setting_key .. " = " .. new_val)

                        UIManager:close(ctx.input_dialog)
                        UIManager:show(InfoMessage:new{ text = _("Saved!") })
                    end,
                },
            },
        },
    }
    UIManager:show(ctx.input_dialog)
    ctx.input_dialog:onShowKeyboard()
end

return Dialogs
