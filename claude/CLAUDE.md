## Tools

- Use git for version control. When more than one agent may write the same
  repository concurrently, **always work inside a fresh git worktree created off
  the latest `main`, never the primary checkout** — a shared working copy
  corrupts under concurrent writers. Start a task by creating/entering the
  worktree (in Stemma, run the `start-work` skill). If a task appears to require
  the primary checkout, or to work outside a worktree, and that was not made
  explicit in the instructions, **STOP and ask what to do** — do not assume.
- **Search with the Grep tool, not Bash.** Grep *is* ripgrep and needs no
  permission approval; it covers `-n -A -B -C -i -l -c --type -g` and multiline.
  Shell out to `rg` only for what Grep cannot do (`-o`, `-v`, `-r` replacements,
  or piping into another command) — and never to `grep`.
- Use `gh` CLI for all GitHub interactions (PRs, issues, CI status)

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

1. If your branch has fallen behind `main`, rebase it on `main` first.
2. `git commit -m "message"` — commit with a behaviour-describing message.
3. `git push -u origin <suitable-branch-name>`, then `gh pr create` (land via the project's merge queue where it has one).

## Code Style

- When generating code, run linters and formatters
- Favour a TDD approach wherever possible

- Always write tests/specs for new code.
