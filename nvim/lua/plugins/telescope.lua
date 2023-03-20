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
        "<leader>sg",
        function()
          require("telescope").extensions.live_grep_args.live_grep_args()
        end,
        desc = "Grep With Args",
      },
      {
        "<leader>sG",
        function()
          local input_string = vim.fn.input("Search For > ")
          if input_string == "" then
            return
          end
          require("telescope.builtin").grep_string({
            search = input_string,
          })
        end,
        desc = "Grep String",
      },
      {
        "<leader>sp",
        "<cmd>Telescope pickers<cr>",
        desc = "Pickers",
      },
      {
        "<leader>sq",
        "<cmd>Telescope quickfix<cr>",
        desc = "Quickfix",
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
      "ThePrimeagen/harpoon",
      "debugloop/telescope-undo.nvim",
      "gbprod/yanky.nvim",
      "natecraddock/telescope-zf-native.nvim",
      "nvim-telescope/telescope-fzf-native.nvim",
      "nvim-telescope/telescope-live-grep-args.nvim",
      "nvim-telescope/telescope-project.nvim",
      "nvim-telescope/telescope-smart-history.nvim",
      "otavioschwanck/telescope-alternate",
      config = function()
        require("telescope").load_extension("harpoon")
        require("telescope").load_extension("live_grep_args")
        require("telescope").load_extension("project")
        require("telescope").load_extension("telescope-alternate")
        require("telescope").load_extension("undo")
        require("telescope").load_extension("yank_history")
        require("telescope").load_extension("zf-native")
        require("telescope").load_extension("smart_history")
      end,
    },
    config = function()
      require("telescope").setup({
        defaults = {
          layout_strategy = "horizontal",
          sorting_strategy = "ascending",
          winblend = 0,
          cache_picker = {
            num_pickers = 25,
          },
          mappings = {
            i = {
              ["<C-]>"] = require("telescope.actions").cycle_history_next,
              ["<C-[>"] = require("telescope.actions").cycle_history_prev,
              ["<Esc>"] = require("telescope.actions").close,
            },
          },
          history = {
            path = "~/.local/share/nvim/databases/telescope_history.sqlite3",
            limit = 200,
          },
        },
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
  },
}
