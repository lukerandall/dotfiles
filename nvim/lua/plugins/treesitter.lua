return {
	{ import = "lazyvim.plugins.extras.lang.typescript" },

	{
		"nvim-treesitter/nvim-treesitter",
		opts = {
			ensure_installed = {
				"bash",
				"elixir",
				"fish",
				"help",
				"html",
				"javascript",
				"json",
				"lua",
				"markdown",
				"markdown_inline",
				"python",
				"query",
				"regex",
				"ruby",
				"tsx",
				"typescript",
				"vim",
				"yaml",
			},
		},
	},

	-- add jsonls and schemastore and setup treesitter for json, json5 and jsonc
	{ import = "lazyvim.plugins.extras.lang.json" },
}
