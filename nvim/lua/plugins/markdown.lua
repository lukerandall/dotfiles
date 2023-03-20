local wk = require("which-key")

wk.register({
  m = {
    name = "Markdown", -- optional group name
  },
}, { prefix = "<leader>" })

return {
  {
    "ellisonleao/glow.nvim",
    config = function()
      require("glow").setup()
    end,
    keys = {
      {
        "<leader>mp",
        function()
          vim.cmd("Glow")
        end,
        desc = "Preview",
      },
    },
  },
}
