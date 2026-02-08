local _ = require("gettext")

local Menu = {}

function Menu.addToMainMenu(menu_items, ctx)
    menu_items.sake = {
        text = _("Sake"),
        sorting_hint = "more_tools",
        sub_item_table = {
            {
                text = _("Sync Books Now"),
                callback = function()
                    ctx.actions.onSync()
                end,
            },
            {
                text = _("Set API URL"),
                keep_menu_open = true,
                callback = function() ctx.actions.showInput("sake_api_url", "api_url", "Enter API URL") end,
            },
            {
                text = _("Set API Username"),
                keep_menu_open = true,
                callback = function() ctx.actions.showInput("sake_api_user", "api_user", "Enter Username") end,
            },
            {
                text = _("Set API Password"),
                keep_menu_open = true,
                callback = function() ctx.actions.showInput("sake_api_pass", "api_pass", "Enter Password") end,
            },
            {
                text = _("Set Device Name"),
                keep_menu_open = true,
                callback = function() ctx.actions.showInput("sake_device_name", "device_name", "Enter Device Name") end,
            }
        }
    }
end

return Menu
