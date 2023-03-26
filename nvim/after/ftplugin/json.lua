vim.keymap.set("n", "<leader>yp", function()
  vim.fn.setreg("+", require("jsonpath").get())
end, { desc = "Json Path", buffer = true })
