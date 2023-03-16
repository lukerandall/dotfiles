return {
  {
    "neovim/nvim-lspconfig",
    ---@class PluginLspOpts
    opts = {
      ---@type lspconfig.options
      servers = {
        elixirls = {},
        ruby_ls = {},
        tailwindcss = {},
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
