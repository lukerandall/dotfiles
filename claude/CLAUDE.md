# Claude Configuration

## Personal Preferences

- Always use jj (Jujutsu) instead of git for version control operations unless it is not a jj repo

## Custom Commands

- `jj pop` - Rebase the current commit onto main
- `jj up` - Rebase current commit on top of main
- jj tug - Move bookmark forward
- `jj bookmark create` - Create bookmarks (not branches) for PRs

## GitHub Integration

- Use `gh` CLI for all GitHub interactions (PRs, issues, etc.) if the GitHub MCP is not available

## PR Creation

- Describe behaviour, not implementation details in the commit message

1. Check if commits are directly off main. If not, ask if should rebase on main and use `jj up` if yes
2. `jj commit -m "message"` - Commit changes with descriptive message
3. `jj file untrack CLAUDE.local.md` - Untrack local config if changed
4. `jj bookmark create branch-name` - Create bookmark for PR
5. `jj bookmark set branch-name -r change-id --allow-backwards` - Move bookmark to correct commit if needed
6. `jj git push --bookmark branch-name --allow-new` - Push bookmark to remote
7. `gh pr create --head branch-name --title "Title" --body "Description"` - Create PR

## Code Style

- When generating code, run the appropriate formatter if it is available (rubocop, erb_lint, eslint, etc.)
- Write tests/specs for new code. Favour a TDD approach where possible
