## Writing style — READ THIS FIRST, IT OVERRIDES EVERY OTHER STYLE HABIT

**Write plain declarative sentences. Name the subject. Put the actual claim in
the main clause.** This is the highest-priority instruction in this file. I
find the clipped, aphoristic register genuinely hard to parse, and it costs me
real time on every message.

**Never write like this:**

- "Measured it rather than guessed." — the subject is missing.
- "The premise is half stale and half sharper than you put it." — a riddle.
- "Usage is high; typing is wrong." — a fragment standing in for a finding.
- "The residual gap is ceremony cost, not ignorance." — an X-not-Y antithesis
  doing the work a plain sentence should do.
- "Not a taste preference. A comprehension cost." — sentence fragments used
  for cadence.

**Write like this instead:**

- "Claude sessions call Board in almost every session now, so that part of your
  impression is out of date. But they record a Drop where a Work belongs, and
  the tool that compares Claude against Codex is reading the wrong directory."

Specifically, do not: open a paragraph or a reply with a bare verb phrase that
drops the subject; build the load-bearing structure out of X-not-Y antitheses;
use two- or three-word fragments as headings or summaries; write "half X and
half Y"; or hold the real noun back until a later clause so the sentence lands
like a punchline. Headings, tables, bullet lists and long sentences are all
fine — the rule is about sentence construction, not length or formatting. It
applies to headings and one-line summaries exactly as much as to body prose.

Write plainly. Say the thing directly and stop. Also avoid these habits:

- **"Not X, but Y" / "X isn't Y, it's Z"** constructions. Just state Y.
- **Ending a paragraph or section on a flourish** — a summarising aphorism, a
  callback, a line that exists to land well. End on the last useful fact.
- **Clever or allusive phrasing** where a plain word works. No metaphors for
  ordinary technical things.
- **Rule-of-three lists** and rhetorical parallelism used for rhythm.
- **Restating a point in a more elegant form** after you have already made it.

Explain jargon in the terms someone would actually need. If you say a limit or
a threshold has been reached, say what the limit counts, what happens when it
is hit, and what to do about it. Do not name the mechanism and assume it is
self-explanatory.

Terse is fine. Dense and allusive is not. If a sentence needs re-reading to
parse, rewrite it.

This applies to all user-facing text, including summaries, PR bodies, commit
messages, and status updates.

## Questions waiting on me

Don't list or repeat questions waiting on me. File each one as a board
record. Name the count from `board call plans.waiting` once when it changes,
and list the questions only for /ask or when I ask for them. When the Board
mod puts a waiting line in your context, end your reply with that line,
verbatim, as its last line.

## Tools

- Use git for version control. When more than one agent may write the same
  repository concurrently, **work in an isolated checkout off the latest `main`,
  never the primary checkout** — a shared working copy
  corrupts under concurrent writers. Unless given more specific instructions,
  start a task by creating/entering the worktree. When a repository's own
  instructions name a way to start work (in Stemma, the `start-work` skill),
  follow those instead, even if the harness already put the session in a
  worktree. If a task appears to require
  the primary checkout, or to work outside a worktree, and that was not made
  explicit in the instructions, **STOP and ask what to do** — do not assume.
- Search with the Grep tool when the session has it. Grep is ripgrep and needs
  no permission approval.
  When the session has no Grep tool, run `rg` through Bash.
  Also use `rg` through Bash for what Grep cannot do (`-o`, `-v`, `-r`
  replacements, or piping into another command). Never use `grep` unless `rg`
  is not installed.
- Use `gh` CLI for all GitHub interactions (PRs, issues, CI status)
- To wait for CI on a GitHub pull request, run `gh pr checks <n> --watch` in
  the foreground with a Bash timeout of up to 600000 ms. If the timeout ends
  the command before CI finishes, run it again.
  Never run `sleep` in the foreground; the harness blocks it.
  To wait on any other condition, use the Monitor tool with an until-loop, or
  start the command with `run_in_background`. A top-level session is re-invoked when a background
  command exits. A subagent is not re-invoked, so a subagent never starts a
  command in the background and then ends its turn to wait for it.
- Make hand edits with Edit and Write. When a Bash command, a formatter or
  another agent has changed a file since you read it,
  Read the file again before you Edit or Write it.
- Only the top-level session calls the `update_plan` and `wrap_up` tools, where
  the session has them. A subagent never calls them.

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

A change to a repository that a board mounts lands through the land phase of
the changes flow (the `changes` skill). `changes.pr` writes the body to
`/changes/<name>/pr.md`, and `board call github.push` and
`board call github.pr-create` push the branch and open the pull request after
the boundary check. Use the plain git steps below only for a repository that
no board mounts:

1. If your branch has fallen behind `main`, rebase it on `main` first.
2. `git commit -m "message"` — commit with a behaviour-describing message.
3. `git push -u origin <suitable-branch-name>`, then `gh pr create` (land via the project's merge queue where it has one).

## Code Style

- When generating code, run linters and formatters
- Favour a TDD approach wherever possible

- Always write tests/specs for new code.
