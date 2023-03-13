return {
  -- change some telescope options and a keymap to browse plugin files
  {
    "nvim-telescope/telescope.nvim",
    keys = {
      -- add a keymap to browse plugin files
      -- stylua: ignore
      {
        "<leader>fp",
        function() require("telescope.builtin").find_files({ cwd = require("lazy.core.config").options.root }) end,
        desc = "Find Plugin File",
      },
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
    "zolrath/telescope-projectionist.nvim", -- forked from adalessa/telescope-projectionist.nvim
    dependencies = { "tpope/vim-projectionist" },
    config = function()
      require("telescope").load_extension("projectionist")
    end,
  },
}
