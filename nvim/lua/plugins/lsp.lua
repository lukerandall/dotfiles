return {
  {
    "neovim/nvim-lspconfig",
    ---@class PluginLspOpts
    opts = {
      ---@type lspconfig.options
      servers = {
        cssls = {},
        cssmodules_ls = {},
        dockerls = {},
        elixirls = {},
        gopls = {},
        graphql = {},
        html = {},
        jsonls = {},
        marksman = {}, -- markdown
        pyright = {},
        rnix = {},
        ruby_ls = {},
        rust_analyzer = {},
        solargraph = {},
        tailwindcss = {},
        taplo = {}, -- toml
        terraformls = {},
        tsserver = {},
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
