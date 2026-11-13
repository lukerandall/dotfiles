# The four forms

Read this when step 2 of `SKILL.md` leaves more than one form possible. Each form below has the finding it suits, a spec for `scripts/chart.ts`, and the rule that rules it out.

## Sparkline

Suits: the shape of one series inside a sentence, a table cell or a row of a list. It shows the last value and, by default, the minimum and maximum.

```json
{"form":"sparkline","x":"week","y":"errors","finding":"Errors fell after the fix.","rows":[{"week":"2026-10-05","errors":40},{"week":"2026-10-12","errors":31},{"week":"2026-10-19","errors":12},{"week":"2026-10-26","errors":9}]}
```

Not suited: a chart the reader must read values from. Use `line`.

## Annotated line

Suits: one to eight series over time, with one event or turning point to point at. Names sit at the line ends, and the axes are range frames. Use `form: "line"`, with `series` for several lines and `annotations` for the finding.

```json
{"form":"line","x":"month","y":"signups","series":"plan","finding":"Pro signups overtook Free in March.","annotations":[{"at":{"x":"2026-03","series":"pro"},"text":"Pro passes Free"}],"rows":[{"month":"2026-01","plan":"free","signups":120},{"month":"2026-02","plan":"free","signups":125},{"month":"2026-03","plan":"free","signups":126},{"month":"2026-01","plan":"pro","signups":80},{"month":"2026-02","plan":"pro","signups":110},{"month":"2026-03","plan":"pro","signups":140}]}
```

Not suited: more than eight series (the helper refuses with `too_many_series`) or end labels that collide (`labels_collide`). Use small multiples.

## Small multiples

Suits: many series that each need reading, such as twelve entities with a trend each. Every panel shares the x and y scales, so the reader compares shape and level. Use `form: "multiples"` with `series`, and `columns` to set the grid. When the panels are table rows, a table with a sparkline in each row is the alternative.

Not suited: two or three series that cross each other. Use `line`.

## Slopegraph

Suits: a before and after value for each category, where the finding is which rose, which fell and which changed rank. `x` holds exactly two positions, and every series has one row at each. Use `form: "slope"`.

Not suited: more than two moments. Use `line`.
