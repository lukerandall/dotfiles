return {
  {
    "someone-stole-my-name/yaml-companion.nvim",
    requires = {
      { "neovim/nvim-lspconfig" },
      { "nvim-lua/plenary.nvim" },
      { "nvim-telescope/telescope.nvim" },
    },
    config = function()
      require("telescope").load_extension("yaml_schema")
    end,
  },
  {
    "cuducos/yaml.nvim",
    ft = { "yaml" },
    requires = {
      "nvim-treesitter/nvim-treesitter",
      "nvim-telescope/telescope.nvim",
    },
  },
}
