return {
  {
    "declancm/maximize.nvim",
    config = function()
      require("maximize").setup({
        default_keymaps = false,
      })
    end,
    keys = {
      {
        "<leader>wm",
        function()
          require("maximize").toggle()
        end,
        desc = "Maximize windows",
      },
    },
  },
}
