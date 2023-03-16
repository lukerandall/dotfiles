local wk = require("which-key")

wk.register({
  t = {
    name = "Test", -- optional group name
  },
}, { prefix = "<leader>" })

return {
  "vim-test/vim-test",
  keys = {
    {
      "<leader>tt",
      "<cmd>:TestNearest<cr>",
      desc = "Nearest",
    },
    {
      "<leader>tf",
      "<cmd>:TestFile<cr>",
      desc = "File",
    },
    {
      "<leader>ta",
      "<cmd>:TestSuite<cr>",
      desc = "All",
    },
    {
      "<leader>tl",
      "<cmd>:TestLast<cr>",
      desc = "Last",
    },
    {
      "<leader>tg",
      "<cmd>:TestVisit<cr>",
      desc = "Go to Last",
    },
  },
}
