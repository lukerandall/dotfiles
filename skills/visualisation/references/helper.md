# The chart helper

Read this before you run `scripts/chart.ts`. `scripts/INTERFACE.md` explains why the interface is shaped this way, and `scripts/chart.ts` holds every type with its doc comment.

## Run it

    deno run <base directory>/scripts/chart.ts < spec.json > chart.svg

`<base directory>` is the skill's base directory, which the harness announces when it loads the skill. An installed skill lives at `~/.agents/skills/visualisation`, so the command works from any project. The script needs no permission flag.

The spec is JSON. `form` is `sparkline`, `line`, `multiples` or `slope`. Every spec takes:

- `rows`: an array of objects, in any order.
- `x`, `y`: the column names. `y` is a number in every row. `x` is a number or an ISO 8601 date string (`2026`, `2026-03`, `2026-03-14`, or a date-time with `Z` or an offset), except in a slope, where it names one of two positions.
- `finding`: a sentence. It becomes the chart's `aria-label` and is not drawn.
- `series` (a column name): required by `multiples` and `slope`, optional for `line`, absent from `sparkline`.
- Optional: `width`, `yFormat` (`decimals`, `prefix`, `suffix`), `yRange` (two numbers the scale must include), `annotations` (`{ "at": { "x", "series" }, "text" }`), and per form `extremes` or `columns`.

The output is one `<svg>` with a `viewBox`, no `<script>`, `<style>` or `id`, text in `currentColor` and series lines in `var(--series-N, fallback)`. The fallback is the `dataviz` palette's light value for slot N. A `line` chart labels each series at its own last point, and a series that ends before the others gets its label placed beside that end. Multiples print the shared y range and x span once under the panels.

## Refusals

A refused spec writes nothing to stdout, prints `<code>: <message>` to stderr and exits 2. Each code has one recovery.

| Code | Recovery |
| --- | --- |
| `invalid_spec` | Correct the field the message names. |
| `too_few_rows` | Supply more rows, or write a sentence. |
| `missing_column` | Add the column or fix the name. |
| `invalid_value` | Fix or drop the row the message names. |
| `duplicate_point` | Aggregate to one row per `x`. |
| `slope_needs_two_positions` | Give every series one row at each of two `x`. |
| `annotation_matches_no_row` | Copy `at` from a row. |
| `annotation_too_long` | Shorten the text to 80 characters. |
| `annotation_does_not_fit` | Remove that annotation, or raise `width`. |
| `too_many_series` | Use `multiples`. |
| `labels_collide` | Use `multiples`, or supply rows up to the common last `x` when one series ends early. |
