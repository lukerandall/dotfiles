# Chart helper interface

`chart.ts` holds this interface and its implementation. The spec and the
refusals below are what `render` accepts and throws.

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
| `multiples` | `series`, `columns` | One panel per series on shared x and y scales, with the scale printed once.          |
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

| Code                        | Cause                                                                                                          | Recovery                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `invalid_spec`              | Input is not JSON, or a field is missing, mistyped, out of bounds or unknown.                                  | Correct the field the message names.                       |
| `too_few_rows`              | `rows` is empty, or a line has fewer than two rows.                                                            | Supply more rows, or write a sentence instead.             |
| `missing_column`            | A named column is absent from a row.                                                                           | Add the column or fix the name.                            |
| `invalid_value`             | A cell holds a value its column cannot take.                                                                   | Fix or drop the row.                                       |
| `duplicate_point`           | Two rows of one line share an `x` value.                                                                       | Aggregate to one row per `x`.                              |
| `slope_needs_two_positions` | `x` does not hold two distinct values, or a series lacks one of them.                                          | Give every series one row at each of two `x`.              |
| `annotation_matches_no_row` | An annotation's `at` matches no row.                                                                           | Copy `at` from a row.                                      |
| `annotation_too_long`       | An annotation's `text` exceeds 80 characters.                                                                  | Shorten the text.                                          |
| `annotation_does_not_fit`   | An annotation cannot be placed without covering data or a label.                                               | Remove that annotation, or raise `width`.                  |
| `too_many_series`           | A `line` chart has more than 8 series.                                                                         | Use `multiples`.                                           |
| `labels_collide`            | A `line` chart's end labels still collide after layout, or one for a series that ends early has no free place. | Use `multiples`, or supply rows up to the common last `x`. |

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
  JSON, which the compiler never saw. The implementation narrows unknown values
  with type guards and uses no type assertion.
- **`main`, `BaseSpec` and `ChartForm` are no longer exported.** The header says
  other code imports `render` and nothing else. `ChartForm` had no user.
- **`ChartError` declares its fields.** Constructor parameter properties are not
  erasable syntax, so the file stays valid under tools that strip only erasable
  syntax.

### Considered and not changed

- **`render` still throws.** A result union would suit a library better. The
  approved plan fixes `render(spec): string`, and the command line is the main
  caller. The owner can reverse this at low cost.
- **A `null` in `y` is refused.** Drawing a gap would need rules for the last
  value and the extremes. The agent drops the row.
- **`columns` and `extremes` stay.** Each is one optional field with a default.

## Proposed: dot, bump, strip

The revised plan (`/changes/visualisation-skill/plans/20261113T023157058399Z`)
adds three forms to the helper. This section proposes their interface. The types
are in `chart.ts` and `render` throws a plain error for the three forms until
they are built. A reviewer reads this section before any drawing code is
written.

### The three forms

| `form`  | Extra fields                    | What it draws                                                                                  |
| ------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `dot`   | `series`, `sort`, `reference`   | One row per category with its value as a dot. With `series` of two measures it is a dumbbell.  |
| `bump`  | `series`, `better`, `highlight` | One line per series across ordered positions, drawn at each position's rank.                   |
| `strip` | `sort`, `median`                | One strip per group of raw observations, moved apart into a beeswarm where dots would overlap. |

### Choices

- **`y` is always the value, `x` is where it sits.** The existing forms put `x`
  on the horizontal axis. A dot plot and a strip put the value on the horizontal
  axis, as Cleveland's dot plot does, so that the category names read as
  horizontal text. Renaming the columns per form would give each form its own
  vocabulary. Keeping `x` for the category and `y` for the value lets `yFormat`,
  `yRange` and every refusal about `y` mean one thing in all seven forms. The
  doc comment on `FrameSpec` says so, and each form's comment says which way the
  value axis runs.
- **`BaseSpec` is split.** `FrameSpec` holds `rows`, `x`, `y`, `finding` and
  `width`. `BaseSpec` adds `yFormat` and `yRange`. `bump` extends only
  `FrameSpec`, because ranks print as whole numbers on a fixed scale, and the
  helper refuses a field that no form declares.
- **A dumbbell is a `dot` spec with `series`.** It uses the same selection that
  `line` uses: naming a `series` column picks the variant, and the types are a
  union. The two measures are rows in long format, as in `slope`, so one table
  feeds `slope`, `dumbbell` or a `line` chart. The dumbbell is the form for two
  values per category when the categories, not the two moments, are what the
  reader compares. The default sort is by difference, because that is the
  question a dumbbell answers.
- **`sort` defaults to `"value"` and the type says which values apply.** Sorted
  dots are what makes position on a common scale easy to judge. A `"none"`
  option exists for categories with their own order. `"difference"` exists only
  for the dumbbell, and the union makes it a type error elsewhere.
- **`reference` is one field, with a label.** Deviation from a target is one of
  the tasks the plan lists for the dot plot. The label is required so that the
  line is named directly, which the skill requires of every mark. No interval
  field is proposed: a dot with an interval needs two more columns, and the plan
  keeps it as a drawn form.
- **`bump` ranks inside the helper.** An agent gives a score or a rank and the
  helper computes each position's order, so a mistake in sorting cannot reach
  the picture. `better` says which direction ranks first. Ties keep the order in
  which series first appear, which is deterministic and stated.
- **`bump` positions are ordered categories.** Quarters such as `"2025 Q1"` are
  not ISO dates, and a ranking is read position by position, so positions are
  evenly spaced. Numbers and ISO dates are put in value order, and any other
  strings keep first-appearance order. No `XValue` change is needed.
- **`bump` needs every series at every position**, refused with the new code
  `series_incomplete`. A gap would need a rule for drawing a series that leaves
  the ranking and returns. The agent drops the series or fills the rows. The
  dumbbell uses the same code when a category lacks one of its two measures.
- **`highlight` stands in for a palette of ten.** The plan's ranking case has
  ten teams, and `dataviz` never generates a ninth colour. With `highlight`, the
  named series (at most `MAX_LINE_SERIES`) take the series colours and the rest
  are drawn in fainter `currentColor`, which is the standard way to show one
  team's story among many. Without it, more than eight series refuse with
  `too_many_series`. That code now has two recoveries in two forms, and the
  message names the one that applies. A separate code would give the agent two
  codes for one cause.
- **`strip` always lays out as a beeswarm.** With no overlap the layout is one
  line of dots, so the plan's "beeswarm when points overlap" needs no `layout`
  field. The strip grows taller up to a fixed limit, and past it the helper
  refuses with `points_collide` instead of letting dots overlap. The recovery
  names the drawn histogram in `references/drawn/`.
- **`strip` rows are observations.** `duplicate_point` does not apply, and an
  annotation's `at` is `{ x, y }` because a group has many rows. The annotation
  uses the first row that matches both.
- **`median` is on by default.** A swarm shows the shape and a median tick gives
  the reader one number to compare. It is one boolean, as `extremes` is for the
  sparkline.
- **Limits are constants, with codes.** `MAX_DOT_CATEGORIES` (60),
  `MAX_STRIP_GROUPS` (12) and `MAX_STRIP_POINTS` (5000) are exported with the
  existing limits. A dot or strip chart over a limit refuses with
  `too_many_categories`, and a strip over the point limit with `too_many_rows`.
  The swarm's collision search grows with the number of points, so the point
  limit keeps a run short.

### New refusal codes

| Code                  | When                                                                      | Recovery                                                             |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `series_incomplete`   | A `bump` series lacks a position, or a dumbbell category lacks a measure. | Give every series one row at each, or drop the series.               |
| `too_many_categories` | A `dot` chart has over 60 categories, or a `strip` chart over 12 groups.  | Keep the categories the reader needs and say how many were left out. |
| `too_many_rows`       | A `strip` chart has over 5000 rows.                                       | Sample the rows or draw a histogram.                                 |
| `points_collide`      | Strip dots still overlap at the tallest allowed strip.                    | Raise `width`, or draw a histogram.                                  |

`too_many_series` changes its description only: a `bump` chart over eight series
with no `highlight` also gets it.

### Questions for the reviewer

1. Is `x` as category and `y` as value, drawn on the horizontal axis for `dot`
   and `strip`, clearer than adding `category` and `value` fields?
2. Should `reference` be dropped until a case needs it?
3. Should `bump` take `better: "low" | "high"`, or should it accept ranks only?
4. Is one `too_many_series` code with two recoveries acceptable?
