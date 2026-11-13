# Chart helper interface

`chart.ts` is the reviewed interface. It has no implementation yet.

## What the helper does

It turns a table of rows into one static SVG fragment. The spec is JSON, so an
agent writes it without writing code. `render(spec): string` is the only
function other code calls, and the command line is a thin wrapper around it.

## The spec

Every form takes `rows`, the column names `x` and `y`, a `finding`, and the
optional `width`, `yFormat`, `yRange` and `annotations`. The forms add what they
need:

| Form        | Adds                | Draws                                                                                |
| ----------- | ------------------- | ------------------------------------------------------------------------------------ |
| `sparkline` | `extremes`          | One small line, no axes, last value after it.                                        |
| `line`      | optional `series`   | One line, or several with each series named at its line end. Range-frame axes.       |
| `multiples` | `series`, `columns` | One panel per series on shared x and y scales.                                       |
| `slope`     | `series`            | One line per series between two positions, labelled with name and value at each end. |

The spec is a union keyed by `form`, so a field that one form does not use is a
type error in the others. `series` is absent from `sparkline` because a
sparkline is one line. A `line` spec without `series` draws one line, and its
annotations name a point by `x` alone. A spec with `series` requires each
annotation to name the series too.

## What `x` and `y` hold

- `y` is a finite number in every row.
- In `sparkline`, `line` and `multiples`, `x` is a number in every row or an ISO
  8601 date string in every row (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`, or a date-time
  with `Z` or an offset). Dates are read as UTC.
- In `slope`, `x` names the two positions and can be any string or number.
- The chart prints an `x` value exactly as the row wrote it.
- `yFormat` sets how `y` values are printed: `decimals`, `prefix` and `suffix`.
- `yRange` names two values the y scale must include. The scale widens to hold
  them and never cuts data off.

## Why the abstractions are these

- **`finding` is required.** The skill's first step is to state the finding.
  Requiring it puts the sentence in the `aria-label` and makes a chart without a
  finding impossible to request.
- **Annotations are `{ at, text }` only.** The skill forbids boxes and cards, so
  the spec offers no styling. The helper chooses the position and adds a thin
  leader line only when it must move the text.
- **No legend option.** Direct labels replace legends. When the labels of a
  `line` chart collide, the helper refuses with `labels_collide` and names
  `multiples`.
- **No colour option.** Colour comes from the `--series-N` variables that
  `dataviz` defines, with its palette as fallback, so a page theme controls it.
- **No height option.** Height follows from the form and the width, so every
  chart of one form has the same proportions.
- **No library types in the interface.** The helper may change from d3 to
  another library without a spec change. Number formatting is three plain fields
  for the same reason: a d3-format string would tie the spec to d3.
- **One error type with a code.** Each code has one recovery, so an agent can
  fix its spec from the message alone. The command line prints
  `<code>: <message>` and exits 2; stdout stays empty.

## Refusals

| Code                        | Cause                                                                         | Recovery                                       |
| --------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| `invalid_spec`              | Input is not JSON, or a field is missing, mistyped, out of bounds or unknown. | Correct the field the message names.           |
| `too_few_rows`              | `rows` is empty, or a line has fewer than two rows.                           | Supply more rows, or write a sentence instead. |
| `missing_column`            | A named column is absent from a row.                                          | Add the column or fix the name.                |
| `invalid_value`             | A cell holds a value its column cannot take.                                  | Fix or drop the row.                           |
| `duplicate_point`           | Two rows of one line share an `x` value.                                      | Aggregate to one row per `x`.                  |
| `slope_needs_two_positions` | `x` does not hold two distinct values, or a series lacks one of them.         | Give every series one row at each of two `x`.  |
| `annotation_matches_no_row` | An annotation's `at` matches no row.                                          | Copy `at` from a row.                          |
| `annotation_too_long`       | An annotation's `text` exceeds 80 characters.                                 | Shorten the text.                              |
| `annotation_does_not_fit`   | An annotation cannot be placed without covering data or a label.              | Remove that annotation, or raise `width`.      |
| `too_many_series`           | A `line` chart has more than 8 series.                                        | Use `multiples`.                               |
| `labels_collide`            | A `line` chart's end labels still collide after layout.                       | Use `multiples`.                               |

## Output guarantees

One `<svg>` element with a `viewBox`, `role="img"` and an `aria-label` equal to
the finding. Text and axes use `currentColor`. The output has none of
`<script>`, `<style>` or `<foreignObject>` and no `id` attribute. Every string
from the spec is escaped. The same spec gives the same bytes. The library eval
at `/evals/visualisation-helper-library` found that Observable Plot always
writes a `<style>` element, which is why the d3 pieces were chosen.

## Review

An independent review on 2026-11-13 judged the proposal and made the changes
below. The reviewer had not seen the design discussion.

### Verdict

The module is deep. One function and one JSON union hide scales, layout, label
placement, collision handling, escaping and theming. The interface leaks no d3
type. The proposal left out four things the forms need, and its error codes
joined causes that have different recoveries.

### Answers to the open questions

1. **`x` accepts ISO date strings as well as numbers.** Most time series an
   agent holds are keyed by date, and converting dates to numbers by hand is the
   scale error the helper exists to prevent. The kind is inferred from the
   values, so the spec gains no field. `x` values are printed as written, so the
   helper needs no date formatter.
2. **`multiples` gets no `shareY` option.** The skill and the eval rubric both
   require a shared scale. An agent that wants independent scales calls
   `sparkline` once per series, which states that choice openly.
3. **`finding` stays a required top-level field.** Every form needs an
   `aria-label`, and a sparkline or a set of multiples often has no annotation.
   An annotation belongs to one point, and the finding belongs to the whole
   chart. A line chart whose one annotation is the finding repeats the sentence,
   which costs one line of JSON.

### Changes

- **`line` accepts one line.** `series` was required, so the commonest annotated
  line chart, which has one series, could not be requested. `LineSpec` is now
  `OneLineSpec | ManyLinesSpec`, selected by whether `series` is present.
- **Annotations are typed per form.** `at.series` was optional everywhere. It is
  now absent where the chart draws one line and required where the spec names a
  series column, so the compiler refuses an annotation that cannot match a row.
- **`XValue` states what `x` may hold.** The proposal did not say whether `x`
  was a number, a date or a category. The type's comment now gives the rule for
  each form.
- **`yFormat` was added.** The forms print values at line ends, at extremes and
  on the range frame, and the proposal had no way to print a unit or fix the
  decimals. The three fields use no library's format language.
- **`yRange` was added.** Two charts on one page could not share a scale, and a
  chart could not include zero. The range widens the scale and never cuts data
  off, so it adds no refusal that depends on the data.
- **`width` has a lower bound and a sparkline default.** A sparkline 640 units
  wide is not a sparkline. Its default is 160.
- **Unknown fields are refused.** A misspelt optional field, such as
  `anotations`, was silently ignored, and the agent got a chart without its
  annotations.
- **`unknown_form` became `invalid_spec`.** The proposal had a code for a bad
  `form` and none for any other bad field. One code covers every field, because
  the recovery is the same: correct the named field.
- **`bad_rows` was split** into `too_few_rows` and `invalid_value`, and
  `bad_annotation` into `annotation_matches_no_row` and `annotation_too_long`.
  Each pair joined two causes with different recoveries.
- **`duplicate_point` was added.** Two rows at one `x` make a line ambiguous and
  make an annotation's `at` match two rows.
- **`too_many_series` and `MAX_LINE_SERIES` were added.** The `dataviz` palette
  has eight categorical colours and forbids generating a ninth.
- **`annotation_does_not_fit` was added, and `labels_collide` is limited to
  `line`.** `multiples` is no recovery for a slopegraph, so a slopegraph grows
  taller until its labels fit, and an annotation that cannot be placed has its
  own code.
- **`slope_needs_two_positions` also covers a series with one position.** The
  recovery is the same sentence.
- **Series colours use `--series-N`.** The proposal used `--chart-N`. `dataviz`
  already defines `--series-N`, so a page that follows `dataviz` themes the
  chart with no extra work.
- **Four output guarantees were added.** The output has no `id` attribute, so
  several charts can share a page. Spec strings are escaped, so a row value
  cannot add markup to a hangar page. The output is deterministic, so tests can
  compare text. Text never takes a series colour, which `dataviz` requires.
- **The command line prints `<code>: <message>`**, and input that is not JSON is
  refused with `invalid_spec`, so every refusal an agent sees has a code.
- **`render` checks its argument at run time.** The command line passes parsed
  JSON, which the compiler never saw, and crumbkit's BASE-3 forbids the type
  assertion that would otherwise be needed.
- **`main`, `BaseSpec` and `ChartForm` are no longer exported.** The header says
  other code imports `render` and nothing else. `ChartForm` had no user.
- **`ChartError` declares its fields.** Constructor parameter properties are not
  erasable syntax, which crumbkit's BASE-4 forbids.

### Considered and not changed

- **`render` still throws.** crumbkit's BASE-23 would make a refusal a member of
  a result union. The approved plan fixes `render(spec): string`, the dotfiles
  repository does not adopt those standards, and the command line is the main
  caller. The owner can reverse this before the build at low cost.
- **A `null` in `y` is refused.** Drawing a gap would need rules for the last
  value and the extremes. The agent drops the row.
- **`columns` and `extremes` stay.** Each is one optional field with a default.
