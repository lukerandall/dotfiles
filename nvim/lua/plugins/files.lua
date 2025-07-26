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
          -- missing spec mappings
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
              { target = "%1/app/%2/%3.rb", context = "class" },
              { target = "%1/lib/%2/%3.rb" },
            },
          },
          {
            pattern = "(.+)/spec/(.*)/(.*)_(.*)_spec.rb",
            target = {
              { target = "%1/app/%4s/%3_%4.rb", context = "class" },
            },
          },
          -- project: call-flow
          {
            pattern = "(.+)/spec/requests/(.*)_spec.rb",
            target = {
              { target = "%1/app/models/flow/%2.yml", context = "flow" },
            },
          },
          {
            pattern = "(.+)/app/models/flow/(.*).yml",
            target = {
              { target = "%1/spec/requests/%2_spec.rb", context = "spec" },
            },
          },
          -- component controller
          {
            pattern = "(.+)/app/components/(.*)/(.*).rb",
            target = {
              { target = "%1/app/components/%2/%3.html.erb", context = "view" },
              { target = "%1/spec/components/%2/%3_spec.rb", context = "spec" },
            },
          },
          {
            pattern = "(.+)/app/components/(.+).rb",
            target = {
              { target = "%1/app/components/%2.html.erb", context = "view" },
              { target = "%1/spec/components/%2_spec.rb", context = "spec" },
            },
          },
          -- component view
          {
            pattern = "(.+)/app/components/(.*)/(.*).html.erb",
            target = {
              { target = "%1/app/components/%2/%3.rb", context = "controller" },
              { target = "%1/spec/components/%2/%3_spec.rb", context = "spec" },
            },
          },
          {
            pattern = "(.+)/app/components/(.*).html.erb",
            target = {
              { target = "%1/app/components/%2.rb", context = "controller" },
              { target = "%1/spec/components/%2_spec.rb", context = "spec" },
            },
          },
          -- component spec
          {
            pattern = "(.+)/spec/components/(.*)/(.*)_spec.rb",
            target = {
              { target = "%1/app/components/%2/%3.rb", context = "controller" },
              { target = "%1/app/components/%2/%3.html.erb", context = "view" },
            },
          },
          {
            pattern = "(.+)/spec/components/(.*)_spec.rb",
            target = {
              { target = "%1/app/components/%2.rb", context = "controller" },
              { target = "%1/app/components/%2.html.erb", context = "view" },
            },
          },
          {
            pattern = "lib/(.*)_web/live/(.*)_live/(.*).ex",
            target = {
              { target = "lib/%1_web/live/%2_live/%3.html.heex", context = "view" },
            },
          },
          -- elixir & phoenix
          {
            pattern = "lib/(.*)_web/live/(.*)_live/(.*).html.heex",
            target = { { target = "lib/%1_web/live/%2_live/%3.ex" } },
          },
          {
            pattern = "lib/(.*)/(.*).ex",
            target = { { target = "test/%1/%2_test.exs", context = "test" } },
          },
          {
            pattern = "test/(.*)_test.exs",
            target = { { target = "lib/%1.ex" } },
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
        "<leader>fm",
        function()
          vim.cmd("Oil")
        end,
        desc = "Manager (Oil)",
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
