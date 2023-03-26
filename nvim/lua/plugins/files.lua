return {
  {
    "tpope/vim-eunuch",
    keys = {
      {
        "<leader>fd",
        "<cmd>Remove<cr>",
        desc = "Delete File",
      },
    },
  },
  {
    "jghauser/mkdir.nvim",
  },
  {
    "rgroli/other.nvim",
    config = function()
      require("other-nvim").setup({
        mappings = {
          "rails",
          {
            pattern = "(.+)/spec/(.*)/(.*)/(.*)_spec.rb",
            target = {
              { target = "%1/db/%3/%4.rb" },
              { target = "%1/app/%3/%4.rb" },
              { target = "%1/%3/%4.rb" },
            },
          },
          {
            pattern = "(.+)/spec/(.*)/(.*)_spec.rb",
            target = {
              { target = "%1/db/%2/%3.rb" },
              { target = "%1/app/%2/%3.rb" },
              { target = "%1/lib/%2/%3.rb" },
            },
          },
          {
            pattern = "(.+)/spec/(.*)/(.*)_(.*)_spec.rb",
            target = {
              { target = "%1/app/%4s/%3_%4.rb" },
            },
          },
        },
      })
    end,
    keys = {
      {
        "<leader>fa",
        function()
          vim.cmd("Other")
        end,
        desc = "Alternate",
      },
      {
        "<leader>fA",
        function()
          vim.cmd("OtherVSplit")
        end,
        desc = "Alternate (VSplit)",
      },
    },
  },
}
