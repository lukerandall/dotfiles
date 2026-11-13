---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Before the first round, read what the board already settled. Use the board that holds the work (the board the `work` skill names for its repository), and the project the work belongs to, such as the repository's name:

1. Run `board -C <board> ls /projects/<project>/decisions`, and read each decision that bears on the plan with `board -C <board> get <path>`. `board::path::not_found` means the project has no decision yet.
2. Run `board -C <board> plans open --path /projects/<project>` to list the questions still waiting for an answer.

A recorded decision is a settled branch of the tree: cite it instead of asking it again, unless the plan contradicts it. An open question that bears on the plan joins the frontier. This step is done when every decision and open question that bears on the plan is either cited or placed on the frontier.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

When the user defers a question (they want to think about it, or another person must answer it), record it before the session ends, so a later session finds it. Write each deferred question as a `plans/question/v1` with your recommended answer, as the `plans` skill describes:

    echo '{"$type": "plans/question/v1", "question": "<the question>", "options": [{"id": "a", "text": "<option a>"}, {"id": "b", "text": "<option b>"}], "recommendation": "a", "why": "<why you recommend it>", "blocked_work": "<what waits on it, in words>", "by": {"session": "<your local_ id>"}, "asked": "<UTC now>", "status": "open"}' | board -C <board> put --new --var project=<project>

Add `"blocks": "/changes/<name>"` when a change waits on the answer. A deferred question that stays only in the conversation is lost when the session is archived.

When the user is Luke and he signs off what the grilling settled, record the sign-off in the board that holds the work (the board the `work` skill names for its repository) as a `plans/decision/v1`. Put the settled decision in `decision`, his reason in `why`, `{"person": "luke"}` in `by`, list the mockup or artifact he agreed by URL in `urls`, and a board record he agreed, such as a plan, in `refs`. Leave `written_by` out. Write it with `board -C <board> put --new --var project=<project>`, the record on stdin, and when a change exists attach the path it prints with `board -C <board> call changes.attach --path /changes/<name> --ref <decision path>`.
