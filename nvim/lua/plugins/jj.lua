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
    "julienvincent/hunk.nvim",
    cmd = { "DiffEditor" },
    config = function()
      require("hunk").setup({
        hooks = {
          on_tree_mount = function(context)
            vim.keymap.set("n", "j", function()
              -- unfortunately we have to recompute every time because folding ruins these computed values
              set_jumpable_lines(context)
              local row = vim.api.nvim_win_get_cursor(0)[1]
              if row < jumpable_lines[1] then
                vim.api.nvim_win_set_cursor(0, { jumpable_lines[1], 0 })
                return
              end
              for idx = #jumpable_lines, 1, -1 do
                if jumpable_lines[idx] <= row then
                  if jumpable_lines[idx + 1] then
                    vim.api.nvim_win_set_cursor(0, { jumpable_lines[idx + 1], 0 })
                  end
                  return
                end
              end
            end, { buffer = context.buf })

            vim.keymap.set("n", "k", function()
              set_jumpable_lines(context)
              local row = vim.api.nvim_win_get_cursor(0)[1]
              if row > jumpable_lines[#jumpable_lines] then
                vim.api.nvim_win_set_cursor(0, { jumpable_lines[#jumpable_lines], 0 })
                return
              end
              for idx, node_row in ipairs(jumpable_lines) do
                if node_row >= row then
                  if jumpable_lines[idx - 1] then
                    vim.api.nvim_win_set_cursor(0, { jumpable_lines[idx - 1], 0 })
                  end
                  return
                end
              end
            end, { buffer = context.buf })
          end,
        },
      })
    end,
  },
}
