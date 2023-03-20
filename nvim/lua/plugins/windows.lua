return {
  "nyngwang/NeoZoom.lua",
  config = function()
    require("neo-zoom").setup()
  end,
  keys = {
    {
      "<leader>wz",
      function()
        vim.cmd("NeoZoomToggle")
      end,
      desc = "Zoom",
    },
  },
}
