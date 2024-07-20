local wk = require("which-key")

wk.add({
  { "<leader>y", group = "Yank" },
})

return {
  "gbprod/yanky.nvim",
  dependencies = {
    "nvim-telescope/telescope.nvim",
  },
  config = function()
    require("yanky").setup({
      ring = {
        history_length = 100,
      },
    })
    require("telescope").load_extension("yank_history")
  end,
  keys = {
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
