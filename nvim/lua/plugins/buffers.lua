return {
  "tiagovla/scope.nvim",
  config = function()
    require("scope").setup()
  end,
  keys = {
    {
      "<leader>bn",
      "<cmd>bnext<cr>",
      desc = "Next",
    },
    {
      "<leader>bN",
      "<cmd>bprevious<cr>",
      desc = "Previous",
    },
  },
}
