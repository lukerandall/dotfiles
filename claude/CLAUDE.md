## Tools

- Always use jj (Jujutsu) not git for version control operations
- Always use rg not grep
- Use `gh` CLI for all GitHub interactions (PRs, issues, CI status)

## Custom Commands

- `jj last` - Show the last (not current) commit
- `jj pop` - Rebase the current commit onto main
- `jj up` - Rebase current commit on top of main
- jj tug - Move bookmark forward
- `jj bookmark create` - Create bookmarks (not branches) for PRs

## Atlassian / Jira Integration

Use `acli` (Atlassian CLI) for Jira interactions:

```bash
# View a specific issue
acli jira workitem view PROJ-123

# View sprint work items
acli jira sprint list --board-id 123

# Check auth status
acli jira auth status
```

## PR Creation

- Describe behaviour, not implementation details in the commit message

1. Check if commits are directly off main. If not, ask if should rebase on main and use `jj up` if yes
2. `jj commit -m "message"` - Commit changes with descriptive message
3. jjpr -b "suitable-branch-name"

## Code Style

- When generating code, run linters and formatters
- Favour a TDD approach wherever possible

- Always write tests/specs for new code.
