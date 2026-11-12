---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published as a board project task with one child task per ticket.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

The tickets go in the board as tasks, as the `tasks` skill describes: one project task for the whole plan, one child task per ticket, and each ticket's blocking edges in its `after` list. Run every `board` command from the repository the work is for, so the tasks go to the notes repo that repository routes to.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, a board path such as a task or a change's plan, an issue number or URL) as an argument, fetch it and read its full body and comments. Read a board record with `board -C <board> get <path>`.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the tickets as board tasks

Publish the approved tickets:

1. Add the project task that holds them. Its text is the plan in a few lines and a reference to its source:

       board -C <board> tasks add --kind project --title '<plan title>' --text '<the plan and its source>'

   When the source is an existing task, add `--parent <that task's path>` so the project sits under it. Note the path the call prints.
2. Add one child task per ticket, in dependency order (blockers first), so each ticket's `after` can name the paths of the tasks that block it. Pass the ticket as JSON on stdin, because `after` goes on stdin and a flag makes `tasks.add` ignore stdin:

       echo '{"title": "<ticket title>", "parent": "<project path>", "text": "<ticket body>", "after": ["<blocking task path>"]}' | board -C <board> tasks add

   `parent` and `after` take paths in the task's own repo, `.md` included, such as `/tasks/<slug>.md`; when `tasks.add` prints a mounted path, drop the mount prefix. Leave out `after` for a ticket with no blockers. Use the ticket template below for `text`.
3. Run `board -C <board> tasks tree --path <project path>` and check that every ticket is under the project and that each one's `blocked_by` matches the breakdown the user approved.

The **frontier** is every open child task whose `blocked_by` is empty. For a purely linear chain that means top to bottom. Leave the source task's status and text unchanged; the project's `parent` link is the only connection.

This step is done when the tree matches the approved breakdown and you have told the user the project's path.

<ticket-template>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Acceptance criteria:**

- [ ] Criterion 1
- [ ] Criterion 2

</ticket-template>

In the ticket text, avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
