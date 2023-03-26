vim.keymap.set("n", "<leader>cp", function()
  vim.cmd("Glow")
end, { desc = "Preview Markdown", buffer = true })
