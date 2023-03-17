return {
  "ThePrimeagen/harpoon",
  keys = {
    {
      "<leader>ha",
      function()
        require("harpoon.mark").add_file()
      end,
      desc = "Add file",
    },
    {
      "<leader>hp",
      function()
        require("harpoon.ui").nav_prev()
      end,
      desc = "Previous",
    },
    {
      "<leader>hn",
      function()
        require("harpoon.ui").nav_next()
      end,
      desc = "Next",
    },
    {
      "<leader>hs",
      "<cmd>Telescope harpoon marks<cr>",
      desc = "Search marks",
    },
  },
}
