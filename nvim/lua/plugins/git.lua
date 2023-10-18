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
  {
    "f-person/git-blame.nvim",
  },
  {
    "FabijanZulj/blame.nvim",
    keys = {
      {
        "<leader>gB",
        function()
          vim.cmd("ToggleBlame")
        end,
        desc = "Blame",
      },
    },
  },
  {
    "ruifm/gitlinker.nvim",
    dependencies = "nvim-lua/plenary.nvim",
    keys = {
      {
        "<leader>ghy",
        function()
          require("gitlinker").get_buf_range_url("v")
        end,
        desc = "Copy GitHub URL to system clipboard",
        mode = "x",
      },
      {
        "<leader>ghy",
        function()
          require("gitlinker").get_buf_range_url("n")
        end,
        desc = "Copy GitHub URL to system clipboard",
      },
      {
        "<leader>gho",
        function()
          require("gitlinker").get_repo_url({ action_callback = require("gitlinker.actions").open_in_browser })
        end,
        desc = "Open GitHub repository in browser",
      },
    },
  },
}
