local wk = require("which-key")

wk.register({
  y = {
    name = "Yank",
  },
}, { prefix = "<leader>" })

return {
  "gbprod/yanky.nvim",
  dependencies = {
    "nvim-telescope/telescope.nvim",
  },
  config = function()
    require("yanky").setup({})
    require("telescope").load_extension("yank_history")
  end,
  keys = {
    {
      "<leader>sy",
      function()
        require("telescope").extensions.yank_history.yank_history()
      end,
      desc = "Yank history",
    },
    {
      "<leader>yd",
      function()
        vim.fn.setreg("+", vim.fn.expand("%:h") .. "/")
      end,
      desc = "Yank relative directory path",
    },
    {
      "<leader>yD",
      function()
        vim.fn.setreg("+", vim.fn.expand("%:p:h") .. "/")
      end,
      desc = "Yank absolute directory path",
    },
    {
      "<leader>yf",
      function()
        vim.fn.setreg("+", vim.fn.expand("%"))
      end,
      desc = "Yank relative file path",
    },
    {
      "<leader>yF",
      function()
        vim.fn.setreg("+", vim.fn.expand("%:p"))
      end,
      desc = "Yank absolute file path",
    },
  },
}
