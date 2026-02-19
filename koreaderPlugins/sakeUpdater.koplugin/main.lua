local WidgetContainer = require("ui/widget/container/widgetcontainer")

local SakeUpdaterPlugin = WidgetContainer:extend{
    name = "sakeUpdater",
    is_doc_only = false,
}

function SakeUpdaterPlugin:init()
    -- This plugin currently provides helper logic loaded by Sake.
end

return SakeUpdaterPlugin
