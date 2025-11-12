local jumpable_lines
local function set_jumpable_lines(context)
  jumpable_lines = {}
  local i = 1
  local n, _, _ = context.tree:get_node(i)
  while n do
    if not n:has_children() then
      table.insert(jumpable_lines, i)
    end
    i = i + 1
    n, _, _ = context.tree:get_node(i)
  end
end

return {
  {
    "avm99963/vim-jjdescription",
  },
  {
    "will133/vim-dirdiff",
  },
  {
    "rafikdraoui/jj-diffconflicts",
  },
  {
    "julienvincent/hunk.nvim",
    cmd = { "DiffEditor" },
    config = function()
      require("hunk").setup({
        keys = {
          global = {
            quit = { "q" },
            accept = { "<leader><Cr>" },
            focus_tree = { "<leader>e" },
          },

          tree = {
            expand_node = { "l", "<Right>" },
            collapse_node = { "h", "<Left>" },

            open_file = { "<Cr>" },

            toggle_file = { "a" },
          },

          diff = {
            toggle_hunk = { "A" },
            toggle_line = { "a" },
            -- This is like toggle_line but it will also toggle the line on the other
            -- 'side' of the diff.
            toggle_line_pair = { "s" },

            prev_hunk = { "[h" },
            next_hunk = { "]h" },

            -- Jump between the left and right diff view
            toggle_focus = { "<Tab>" },
          },
        },

        ui = {
          tree = {
            -- Mode can either be `nested` or `flat`
            mode = "nested",
            width = 35,
          },
          --- Can be either `vertical` or `horizontal`
          layout = "vertical",
        },

        icons = {
          selected = "󰡖",
          deselected = "",
          partially_selected = "󰛲",

          folder_open = "",
          folder_closed = "",
        },

        -- Called right after each window and buffer are created.
        hooks = {
          ---@param _context { buf: number, tree: NuiTree, opts: table }
          on_tree_mount = function(_context) end,
          ---@param _context { buf: number, win: number }
          on_diff_mount = function(_context) end,
        },
      })
    end,
  },
}
