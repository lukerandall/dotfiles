return {
  {
    "neovim/nvim-lspconfig",
    ---@class PluginLspOpts
    opts = {
      ---@type lspconfig.options
      servers = {
        ruby_ls = {},
      },
    },
    keys = {
      {
        "<leader>ct",
        function()
          vim.lsp.buf.hover()
        end,
        desc = "Type at point",
      },
    },
  },
}
