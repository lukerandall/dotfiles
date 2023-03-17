return {
  -- change some telescope options and a keymap to browse plugin files
  {
    "nvim-telescope/telescope.nvim",
    keys = {
      {
        "<leader>fp",
        function()
          require("telescope").extensions.project.project()
        end,
        desc = "Find Project",
      },
      {
        "<leader>fP",
        function()
          require("telescope.builtin").find_files({ cwd = require("lazy.core.config").options.root })
        end,
        desc = "Find Plugin File",
      },
      {
        "<leader>su",
        function()
          require("telescope").extensions.undo.undo()
        end,
        desc = "Undo",
      },
      {
        "<leader>gb",
        "<cmd>Telescope git_branches<cr>",
        desc = "Branches",
      },
    },
    dependencies = {
      "debugloop/telescope-undo.nvim",
      "gbprod/yanky.nvim",
      "natecraddock/telescope-zf-native.nvim",
      "nvim-telescope/telescope-fzf-native.nvim",
      "nvim-telescope/telescope-project.nvim",
      "otavioschwanck/telescope-alternate",
      config = function()
        require("telescope").load_extension("project")
        require("telescope").load_extension("telescope-alternate")
        require("telescope").load_extension("undo")
        require("telescope").load_extension("yank_history")
        require("telescope").load_extension("zf-native")
      end,
    },
    config = function()
      require("telescope").setup({
        extensions = {
          project = {
            base_dirs = { "~/Code" },
          },
          undo = {
            use_delta = true,
            side_by_side = true,
            layout_strategy = "vertical",
            layout_config = {
              preview_height = 0.7,
            },
          },
          ["telescope-alternate"] = {
            mappings = {},
            presets = { "rails", "nestjs" },
          },
        },
      })
    end,
    -- change some options
    opts = {
      defaults = {
        layout_strategy = "horizontal",
        sorting_strategy = "ascending",
        winblend = 0,
      },
    },
  },
}
