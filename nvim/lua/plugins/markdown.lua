return {
  {
    "ellisonleao/glow.nvim",
    config = function()
      require("glow").setup()
    end,
    keys = {
      {
        "<leader>cp",
        function()
          vim.cmd("Glow")
        end,
        desc = "Preview Markdown",
      },
    },
  },
}
