-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
-- Add any additional autocmds here

-- Use solargraph for ruby
require("lspconfig").solargraph.setup({})

require("lspconfig").elixirls.setup({
  cmd = { "/opt/homebrew/bin/elixir-ls" },
})
