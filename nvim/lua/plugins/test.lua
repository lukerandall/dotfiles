local wk = require("which-key")

wk.register({
  t = {
    name = "Test", -- optional group name
  },
}, { prefix = "<leader>" })

return {
  "nvim-neotest/neotest",
  config = function()
    require("neotest").setup({
      adapters = {
        require("neotest-go"),
        require("neotest-rspec"),
        require("neotest-rust"),
        require("neotest-elixir"),
      },
    })
  end,
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-treesitter/nvim-treesitter",
    "antoinemadec/FixCursorHold.nvim",
    "nvim-neotest/neotest-python",
    "nvim-neotest/neotest-go",
    "olimorris/neotest-rspec",
    "rouge8/neotest-rust",
    "jfpedroza/neotest-elixir",
  },
  keys = {
    {
      "<leader>tt",
      function()
        require("neotest").run.run()
      end,
      desc = "Nearest",
    },
    {
      "<leader>tf",
      function()
        require("neotest").run.run(vim.fn.expand("%"))
      end,
      desc = "File",
    },
    {
      "<leader>ta",
      function()
        require("neotest").run.run(vim.fn.getcwd())
      end,
      desc = "All",
    },
    {
      "<leader>to",
      function()
        require("neotest").output.open({ enter = true })
      end,
      desc = "Open Output",
    },
    {
      "<leader>ts",
      function()
        require("neotest").summary.open()
      end,
      desc = "Summary",
    },
    {
      "<leader>tS",
      function()
        require("neotest").run.stop()
      end,
      desc = "Stop",
    },
  },
}
