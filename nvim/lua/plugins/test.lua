local wk = require("which-key")
-- As an example, we will create the following mappings:
--  * <leader>ff find files
--  * <leader>fr show recent files
--  * <leader>fb Foobar
-- we'll document:
--  * <leader>fn new file
--  * <leader>fe edit file
-- and hide <leader>1

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
