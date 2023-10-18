local t = require("telescope")

return {
  {
    "nvim-telescope/telescope.nvim",
    keys = {
      {
        "<leader>fp",
        function()
          t.extensions.project.project()
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
          t.extensions.live_grep_args.live_grep_args()
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
        "<leader>sP",
        function()
          require("telescope").extensions.luasnip.luasnip({})
        end,
        desc = "Snippets",
      },
      {
        "<leader>sT",
        function()
          require("telescope-tabs").list_tabs()
        end,
        desc = "Tabs",
      },
      {
        "<leader>fF",
        function()
          t.extensions["pathogen"].find_files()
        end,
        desc = "Find Files (Pathogen)",
      },
      {
        "<leader>sq",
        "<cmd>Telescope quickfix<cr>",
        desc = "Quickfix",
      },
      {
        "<leader>su",
        function()
          t.extensions.undo.undo()
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
      "LukasPietzschmann/telescope-tabs",
      "ThePrimeagen/harpoon",
      "benfowler/telescope-luasnip.nvim",
      "brookhong/telescope-pathogen.nvim",
      "debugloop/telescope-undo.nvim",
      "gbprod/yanky.nvim",
      "natecraddock/telescope-zf-native.nvim",
      "nvim-telescope/telescope-fzf-native.nvim",
      "nvim-telescope/telescope-live-grep-args.nvim",
      "nvim-telescope/telescope-project.nvim",
      "nvim-telescope/telescope-smart-history.nvim",
      "otavioschwanck/telescope-alternate",
      config = function()
        t.load_extension("harpoon")
        t.load_extension("live_grep_args")
        t.load_extension("luasnip")
        t.load_extension("pathogen")
        t.load_extension("project")
        t.load_extension("smart_history")
        t.load_extension("telescope-alternate")
        t.load_extension("telescope-tabs")
        t.load_extension("undo")
        t.load_extension("yank_history")
        t.load_extension("zf-native")
        t.load_extension("zoxide")
      end,
    },
    config = function()
      t.setup({
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
            n = {
              ["<Esc>"] = function(...)
                return require("telescope.actions").close(...)
              end,
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
            presets = { "rails", "rspec" },
          },
        },
      })
    end,
  },
  {
    "xiyaowong/telescope-emoji.nvim",
    dependencies = {
      "nvim-telescope/telescope.nvim",
    },
    config = function()
      require("telescope").load_extension("emoji")
    end,
    keys = {
      {
        "<leader>se",
        function()
          t.extensions.emoji.emoji()
        end,
        desc = "Emoji",
      },
    },
  },
  {
    "nvim-telescope/telescope-file-browser.nvim",
    dependencies = {
      "nvim-telescope/telescope.nvim",
    },
    config = function()
      require("telescope").load_extension("file_browser")
    end,
    keys = {
      {
        "<leader>fB",
        "<cmd>Telescope file_browser<cr>",
        desc = "File Browser",
      },
    },
  },
}
