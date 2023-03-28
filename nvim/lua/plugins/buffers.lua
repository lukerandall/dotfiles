return {
  {
    "akinsho/bufferline.nvim",
    config = function()
      require("bufferline").setup({
        options = {
          diagnostics = "nvim_lsp",
          diagnostics_indicator = function(_, level, _, _)
            local icon = level:match("error") and " " or " "
            return " " .. icon
          end,
          color_icons = false,
          show_buffer_close_icons = false,
          separator_style = "thin",
        },
      })
    end,
  },
  {
    "tiagovla/scope.nvim",
    config = function()
      require("scope").setup()
    end,
  },
}
