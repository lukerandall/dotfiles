return {
  -- change some telescope options and a keymap to browse plugin files
  {
    "nvim-telescope/telescope.nvim",
    keys = {
      {
        "<leader>fp",
        function()
          require("telescope.builtin").find_files({ cwd = require("lazy.core.config").options.root })
        end,
        desc = "Find Plugin File",
      },
      {
        "<leader>su",
        "<cmd>Telescope undo<cr>",
        desc = "Undo",
      },
      {
        "<leader>gb",
        "<cmd>Telescope git_branches<cr>",
        desc = "Branches",
      },
    },
    dependencies = {
      "natecraddock/telescope-zf-native.nvim",
      "nvim-telescope/telescope-fzf-native.nvim",
      "gbprod/yanky.nvim",
      config = function()
        require("telescope").load_extension("zf-native")
        require("telescope").load_extension("yank_history")
      end,
    },
    -- change some options
    opts = {
      defaults = {
        layout_strategy = "horizontal",
        sorting_strategy = "ascending",
        winblend = 0,
      },
    },
  },

  {
    "debugloop/telescope-undo.nvim",
    config = function()
      require("telescope").load_extension("undo")
    end,
  },

  {
    "zolrath/telescope-projectionist.nvim", -- forked from adalessa/telescope-projectionist.nvim
    dependencies = { "tpope/vim-projectionist" },
    config = function()
      require("telescope").load_extension("projectionist")
    end,
  },
}
