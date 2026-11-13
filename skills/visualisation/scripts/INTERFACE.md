# Chart helper interface

`chart.ts` is a proposed interface. It has no implementation yet. A review
refines it before the helper is built.

## What the helper does

It turns a table of rows into one static SVG fragment. The spec is JSON, so an
agent writes it without writing code. `render(spec): string` is the only
function other code calls, and the command line is a thin wrapper around it.

## The spec

Every form takes `rows`, the column names `x` and `y`, a `finding`, and an
optional `width` and list of `annotations`. The forms add what they need:

| Form | Adds | Draws |
| --- | --- | --- |
| `sparkline` | `extremes` | One small line, no axes, last value after it. |
| `line` | `series` | Several lines, a range-frame y axis, each series named at its line end. |
| `multiples` | `series`, `columns` | One panel per series on a shared y scale. |
| `slope` | `series` | One line per series between two positions, labelled at both ends. |

The spec is a union keyed by `form`, so a field that one form does not use is a
type error in the others. `series` is absent from `sparkline` because a
sparkline is one line.

## Why the abstractions are these

- **`finding` is required.** The skill's first step is to state the finding.
  Requiring it puts the sentence in the `aria-label` and makes a chart without
  a finding impossible to request.
- **Annotations are `{ at, text }` only.** The skill forbids boxes and cards,
  so the spec offers no styling. The helper chooses the position and adds a
  thin leader line only when it must move the text.
- **No legend option.** Direct labels replace legends. When labels collide, the
  helper refuses with `labels_collide` and names `multiples`.
- **No colour option.** Colour comes from `--chart-N` variables with the
  `dataviz` palette as fallback, so a page theme controls it.
- **No library types in the interface.** The helper may change from d3 to
  another library without a spec change.
- **One error type with a code.** Each code has one recovery, so an agent can
  fix its spec from the message alone. The command line prints the message and
  exits 2; stdout stays empty.

## Output guarantees

A `viewBox`, `role="img"`, `aria-label` equal to the finding, `currentColor` for
text and axes, and none of `<script>`, `<style>` or `<foreignObject>`. The
library eval at `/evals/visualisation-helper-library` found that Observable Plot
always writes a `<style>` element, which is why the d3 pieces were chosen.

## Open questions for the reviewer

- Should `x` accept dates as ISO strings and parse them, or numbers only?
- Should `multiples` accept a `shareY: false` option? The skill says panels
  share a scale, so the interface omits it.
- Is `finding` better placed in `annotations` for the line form, where one
  annotation often is the finding?
