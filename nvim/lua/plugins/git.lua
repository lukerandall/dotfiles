return {
  {
    "TimUntersberger/neogit",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "sindrets/diffview.nvim",
    },
    config = function()
      require("neogit").setup({
        signs = {
          section = { "↦", "↧" },
          item = { "↪", "⤥" },
        },
        integrations = {
          diffview = true,
        },
      })
    end,
    keys = {
      {
        "<leader>gd",
        "<cmd>DiffviewOpen<cr>",
        desc = "Diffview",
      },
      {
        "<leader>gg",
        function()
          require("neogit").open()
        end,
        desc = "Neogit",
      },
      {
        "<leader>gG",
        function()
          require("neogit").open({ "commit" })
        end,
        desc = "Neogit Commit",
      },
      {
        "<leader>gG",
        function()
          require("neogit").open({ kind = "split" })
        end,
        desc = "Neogit Split",
      },
    },
  },
}
