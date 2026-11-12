---
name: wayfinder
description: Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets in the board, and resolve them one at a time until the way to the destination is clear.
disable-model-invocation: true
---

A loose idea has arrived, too big for one agent session, and wrapped in fog: the way from here to the **destination** isn't visible yet. Wayfinding is about finding that way, not charging at the destination. This skill charts the way as a **shared map** in the board, then works its **decision tickets** (questions whose resolution is a decision, not slices of a build to execute) one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting: it shapes every ticket. It might be a spec to hand off and iterate on, a decision to lock before planning starts, or a change made in place like a data-structure migration. The map is domain-agnostic: engineering work, course content, whatever fits the shape.

## Plan, don't do

Wayfinder is **planning** by default: each ticket resolves a decision, and the map is done when the way is clear, with nothing left to decide before someone goes and does the thing. The pull to just do the work is usually the signal you've reached the edge of the map and it's time to hand off. An effort can override this in its **Notes**, carrying execution into the map itself, but absent that, produce decisions, not deliverables.

## Refer by name

Every map and ticket is a task, so it has a **name**: its title. In everything the human reads (narration, the map's Decisions-so-far), refer to it by that name, never by a bare path or slug. A wall of `/tasks/a.md, /tasks/b.md` is illegible; names read at a glance. The path doesn't vanish: it rides _beside_ the name, as in "Choose the queue (`/tasks/choose-the-queue.md`)", never in place of it.

## The Map

The map is a project task in the board (`kind: project`), the canonical artifact. Its tickets are child tasks of the map, and each answer is a `plans/decision/v1` record. Run every `board` command from the repository the effort is about, so the tasks go to the notes repo it routes to, and use the repository's name as `<project>` for decisions. The `tasks` and `plans` skills describe the commands.

The map is an **index**, not a store. It lists the decisions made and points at the decision records that hold their detail; a decision lives in exactly one place, its record, so the map never restates it, only gists it and gives its path.

To change the map's text, follow the `tasks` skill's Edit steps: `board -C <board> --json get <map path>`, then `board -C <board> put --batch` with the blob as `expect`, then `tasks.reviewed`. Other sessions may edit the map at the same time, so on `board::put::stale` read it again and redo the edit.

### The map body

The map task's body: the whole map at low resolution, loaded once per session. Open tickets are **not** listed: they are open child tasks, found with `tasks.tree`.

```markdown
## Destination

<what reaching the end of this map looks like: the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index: one line per resolved ticket, enough to judge relevance, then read the decision for its detail -->

- <ticket title> (`<decision path>`): <one-line gist of the answer>

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- see "Out of scope": work ruled beyond the destination; dropped, never graduates -->
```

### Tickets

Each ticket is a **child task** of the map (`parent` is the map's path); its path is its identity. Its body is the question, sized to one 100K token agent session:

```markdown
Type: <research | prototype | grilling | task>

## Question

<the decision or investigation this ticket resolves>
```

The `Type` line names one of the [Ticket Types](#ticket-types).

A session **claims** a ticket with `board -C <board> tasks claim --path <ticket> --session <your local_ id>`, **first**, before any work, so concurrent sessions skip it. That `owner` _is_ the claim: an open ticket with no owner is unclaimed. On `tasks::task::held`, another session has it; choose another.

Blocking uses the task's `after` list: the tickets that must resolve first, by their path in the task's own repo, `.md` included. `tasks.add` prints a mounted path, such as `/repos/notes/tasks/<slug>.md`; drop the mount prefix for each `after` entry, so it becomes `/tasks/<slug>.md`. `parent` takes the map's path exactly as `tasks.add` printed it, mount prefix included. An `after` entry that keeps the mount prefix blocks nothing. A ticket is **unblocked** when every ticket in its `after` is done; `tasks.tree --path <map>` shows each ticket's open blockers in `blocked_by`. The **frontier** is the open, unblocked, unclaimed children, the edge of the known.

The answer isn't part of the body; it's recorded on resolution as a decision (see [Work through the map](#work-through-the-map)). Assets created while resolving a ticket are linked from the decision's `urls` or `refs`, not pasted in.

## Ticket Types

Every ticket is either **HITL** (human in the loop, worked _with_ a human who speaks for themselves) or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).

- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a subagent that calls the Skill tool with "research". Use when knowledge outside the current working directory is required.
- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or UI/logic code) by calling the Skill tool with "prototype". Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
- **Grilling** (HITL): Conversation. The default case. Always call the Skill tool twice, for "grilling" and "domain-modeling".
- **Task** (HITL or AFK): Manual work that must happen before a _decision_ can be made: nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that _does_ rather than decides, and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.

## Fog of war

The map is _deliberately_ incomplete: don't chart what you can't yet see. Beyond the live tickets lies the **fog of war**: the dim view of decisions and investigations you can tell are coming but can't yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever's now specifiable into fresh tickets, one at a time, until the way to the destination is clear and no tickets remain.

The map's **Not yet specified** section is where that dim view is written down: the suspected question, the area to revisit later. It's the undiscovered frontier _toward_ the destination: everything here is in scope, just not sharp enough to ticket. Write as loosely or as fully as the view allows; it doubles as a signpost for collaborators reading where the effort is headed.

**Fog or ticket?** The test is whether you can state the question precisely now, _not_ whether you can answer it now.

- **Ticket when** the question is already sharp, even if it's blocked and you can't act on it yet.
- **Not yet specified when** you can't yet phrase it that sharply. Don't pre-slice the fog into ticket-sized pieces: it's coarser than a ticket, and one patch may graduate into several tickets, or none, once the frontier reaches it.

**Not yet specified** excludes what's already decided (Decisions so far), what's already a live ticket, and what's out of scope (the next section).

## Out of scope

Fog only ever gathers _toward_ the destination. The destination fixes the scope, so work beyond it is **out of scope**: it isn't fog, and it doesn't belong in **Not yet specified**. It gets its own **Out of scope** section on the map: work you've consciously ruled out of _this_ effort. Scope, not sharpness, lands it here.

Out-of-scope work never graduates (the frontier stops at the destination), so it returns only if the destination is redrawn, and then as a fresh effort, not a resumption.

Ruling something out of scope is a scoping act, not a step on the route. When a ticket that already exists turns out to sit past the destination (mis-scoped in while charting, or exposed by a resolution), **drop it** with `board -C <board> tasks drop --path <ticket>` (a dropped ticket is unambiguously off the frontier) and leave one line in the **Out of scope** section: the gist plus why it's out of scope, with the dropped ticket's path. It stays out of **Decisions so far**, which records the route actually walked; a scope boundary isn't a step on it.

## Invocation

Two modes. Either way, **never resolve more than one ticket per session**, with the exception of research tickets.

### Chart the map

User invokes with a loose idea.

1. **Name the destination.** Call the Skill tool twice, for "grilling" and "domain-modeling", to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it's settled first.
2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** (the way to the destination is already clear, the whole journey small enough for one session), you don't need a map. Stop and ask the user how they'd like to proceed.
3. **Create the map**: `board -C <board> tasks add --kind project --title '<destination in a few words>' --text '<map body>'`, with Destination and Notes filled in, Decisions-so-far empty, and the fog sketched into **Not yet specified**. Note the path it prints.
4. **Create the tickets you can specify now** as child tasks of the map, blockers first, so each ticket's `after` can name the tickets that block it. Pass each as JSON on stdin, because `after` goes on stdin and a flag makes `tasks.add` ignore stdin:

       echo '{"title": "<ticket title>", "parent": "<map path>", "text": "<ticket body>", "after": ["<blocking ticket path>"]}' | board -C <board> tasks add

   `parent` is the map's path as printed, and each `after` entry drops the mount prefix, as [Tickets](#tickets) says. `after` sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog: the **Not yet specified** section.

   Then run `board -C <board> tasks tree --path <map path>` and check that every ticket is under the map and that each one's `blocked_by` lists the tickets you meant to block it. This step is done when the tree matches.
5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that calls the Skill tool with "research" to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch. Each subagent records its answer as step 4 of [Work through the map](#work-through-the-map) says.
6. Stop: charting is one session's work; it hand-resolves nothing.

Tell the user the map's path; the next session starts from it.

### Work through the map

User invokes with a map (its task path or title). A ticket is **optional**: without one, you pick the next decision, not the user.

1. Load the **map**: `board -C <board> get <map path>` for the low-res view, and `board -C <board> tasks tree --path <map path>` for its tickets, not every ticket body.
2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. **Claim it** with `tasks.claim` before any work.
3. Resolve it. **Zoom as needed**: read the full body of any related ticket, and any decision the map lists, with `board -C <board> get <path>`; call the Skill tool for whichever skills the `## Notes` block names. If in doubt, call the Skill tool twice, for "grilling" and "domain-modeling".
4. Record the resolution: write the answer as a `plans/decision/v1`, as the `plans` skill describes, with the ticket's path and the map's path in `refs`, `{"person": "<the user>"}` in `by` when a human decided it, and any assets in `urls` or `refs`. Then finish the ticket with `board -C <board> tasks done --path <ticket>`, and **append a context pointer** (the ticket's title, the decision's path and a one-line gist) to the map's Decisions-so-far. A `task` ticket's decision records what was done and the facts later tickets depend on.
5. Add newly-surfaced tickets (blockers first, as in charting); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals that a ticket (this one or another) sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, edit those tickets or drop them.

The user may run unblocked tickets in parallel, so expect other sessions to be editing the map and its tickets concurrently.
