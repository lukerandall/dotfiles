---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.

When the research serves a Board change (`/changes/<name>` in the board the `work` skill names for the repository), the findings must reach the change's builders through the plan:

4. Write the findings into that board with `board -C <board> put /changes/<name>/research-<slug>.md --file < findings.md`.
5. Add the path to the plan's `uses`. Read the current plan record (the change's `plan`, from `board -C <board> get /changes/<name>`) and its text (the record's `text` path), then run `board -C <board> call changes.plan` with `{"path": "/changes/<name>", "text": <the plan text>, "paths": <its paths>, "uses": <its uses plus the findings' path>}` on stdin. The documents in `uses` may hold at most 3,000 words in all, so keep the findings short.

When no change exists but the findings concern a topic that has a record at `/topics/<slug>` in the board, write the findings to `/research/<slug>.md` in that board with `board -C <board> put /research/<slug>.md --file < findings.md`, and add that path to the topic's `refs` with `board -C <board> put /topics/<slug>`.
