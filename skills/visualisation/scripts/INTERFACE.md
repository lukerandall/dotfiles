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
adds three forms to the helper. This section states their interface as it stands
after the review below. The types are in `chart.ts` and `render` throws a plain
error for the three forms until they are built.

### The three forms

| `form`  | Extra fields                   | What it draws                                                                                  |
| ------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `dot`   | `series`, `sort`, `reference`  | One row per category with its value as a dot. With `series` of two measures it is a dumbbell.  |
| `bump`  | `series`, `first`, `highlight` | One line per series across ordered positions, drawn at each position's rank.                   |
| `strip` | `sort`, `median`               | One strip per group of raw observations, moved apart into a beeswarm where dots would overlap. |

### Choices

- **`y` is always the value, `x` is where it sits.** The existing forms put `x`
  on the horizontal axis. A dot plot and a strip put the value on the horizontal
  axis, as Cleveland's dot plot does, so that the category names read as
  horizontal text. Keeping `x` for the category and `y` for the value lets
  `yFormat`, `yRange` and every refusal about `y` mean one thing in all seven
  forms, and lets one table move between `slope`, `dot` and `line` by changing
  `form` alone.
- **A category or a group is a label.** In `dot` and `strip`, `x` can be any
  string or number, as in `slope`, and is printed as written.
- **The common fields are split in two.** `CommonSpec` holds `rows`, `x`, `y`,
  `finding` and `width`. `ScaledSpec` adds `yFormat` and `yRange`. `bump`
  extends only `CommonSpec`, because it prints ranks and never prints `y`.
- **A dumbbell is a `dot` spec with `series`.** It uses the same selection that
  `line` uses: naming a `series` column picks the variant, and the types are a
  union. The two measures are rows in long format, as in `slope`. The first
  measure in `rows` takes the first colour, and each measure is named by a
  direct label at its dot on the top row.
- **`sort` says what it sorts by.** A dot plot sorts by `"value"`. A dumbbell
  sorts by `"difference"` by default, which is the second measure minus the
  first with its sign, so rises are at the top and falls at the bottom. A strip
  sorts by `"median"`. Every form accepts `"none"` for categories with their own
  order. A value that a form does not accept is a type error.
- **`reference` is one field, with a label.** Deviation from a target is one of
  the tasks the plan lists for the dot plot. The label is required so that the
  line is named directly. No interval field exists: a dot with an interval needs
  two more columns, and the plan keeps it as a drawn form.
- **`bump` ranks inside the helper, and `first` is required.** An agent gives a
  score or a rank and the helper computes each position's order. `first` says
  whether the lowest or the highest `y` is rank 1. Equal `y` values at one
  position are refused with `tied_rank`.
- **`bump` positions are ordered categories.** Quarters such as `"2025 Q1"` are
  not ISO dates, and a ranking is read position by position, so positions are
  evenly spaced. Numbers and ISO dates are put in value order, and any other
  strings keep first-appearance order.
- **`bump` needs every series at every position**, refused with
  `series_incomplete`. A gap would need a rule for drawing a series that leaves
  the ranking and returns.
- **`highlight` stands in for a palette of ten.** The plan's ranking case has
  ten teams, and `dataviz` never generates a ninth colour. The named series, at
  most `MAX_LINE_SERIES`, take the series colours and the rest are drawn in
  fainter `currentColor`. A chart with more than eight series and no `highlight`
  is refused with `highlight_needed`.
- **`strip` always lays out as a beeswarm.** With no overlap the layout is one
  line of dots, so the spec has no `layout` field. The strip grows taller up to
  a fixed limit, and past it the helper refuses with `points_collide` and never
  draws one dot over another.
- **`strip` rows are observations.** `duplicate_point` does not apply, and an
  annotation's `at` is `{ x, y }` because a group has many rows. The annotation
  uses the first row that matches both.
- **`median` is on by default.** A swarm shows the shape and a median tick gives
  the reader one number to compare.
- **Limits are constants.** `MAX_DOT_CATEGORIES` (60), `MAX_STRIP_GROUPS` (12)
  and `MAX_STRIP_POINTS` (5000) are exported with the existing limits.

### New refusal codes

| Code                          | When                                                                              | Recovery                                                             |
| ----------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `highlight_needed`            | A `bump` chart has over 8 series and no `highlight`.                              | Set `highlight` to the series the finding is about.                  |
| `series_incomplete`           | A `bump` series has no row at one of the positions.                               | Give the series one row at every position, or drop it.               |
| `tied_rank`                   | Two `bump` series have the same `y` at one position.                              | Give the two rows different `y` values by the ranking's tie rule.    |
| `dumbbell_needs_two_measures` | A dumbbell's `series` does not hold two distinct values, or a category lacks one. | Give every category one row for each of two measures.                |
| `too_many_categories`         | A `dot` chart has over 60 categories, or a `strip` chart over 12 groups.          | Keep the categories the reader needs and say how many were left out. |
| `too_many_rows`               | A `strip` chart has over 5000 rows.                                               | Sample the rows or draw a histogram.                                 |
| `points_collide`              | Strip dots still overlap at the tallest allowed strip.                            | Raise `width`, or draw a histogram.                                  |

Three existing codes widen without a new recovery. `too_few_rows` covers a `dot`
chart with one category and a `bump` chart with one position or one series.
`duplicate_point` covers two rows for one measure of a `dot` category and two
rows of a `bump` series at one position. `invalid_spec` covers a `highlight`
name that is not a value of the `series` column. `too_many_series` is unchanged
and stays a `line` code.

## Review: dot, bump, strip

An independent review on 2026-11-13 judged the proposal at 67912f71 and made the
changes below. The reviewer had not seen the design discussion.

### Verdict

The interface stays a deep module. The three forms add no function, and the spec
union still hides scales, ranking, swarm layout, sorting and label placement. No
d3 type appears in a spec. The proposal reused the existing patterns well: the
`series` field selects the dumbbell as it selects several lines, and the limits
are constants with codes. The proposal had three faults. Two codes each joined
causes that have different recoveries. A bump chart could state a false ranking
with no refusal, through a default direction or a silent tie-break. Three names
did not say what they meant.

### Answers to the open questions

1. **`x` and `y` stay, and `category` and `value` are not added.** `slope`
   already uses `x` for a label, so the meaning "where the value sits" is
   established. With one vocabulary, `yFormat`, `yRange` and the refusals about
   `y` need no second wording, and an agent that returns from the skill's check
   step to choose another form changes `form` and keeps its columns. The comment
   on `CommonSpec` now says that the names do not say which axis a column is
   drawn on.
2. **`reference` stays.** The plan's choosing guide names "dot plot against a
   reference line" as the form for deviation, so a case needs it now. It is one
   optional field of two parts and adds no refusal.
3. **`bump` accepts a rank or a score, and the direction is required.** A rank
   column is a score where the lowest is first, so one rule covers both and the
   helper does the sorting. The field is now `first: "lowest" | "highest"` with
   no default.
4. **One code with two recoveries is not acceptable.** The first review split
   every code that joined two recoveries, and the file states the rule as one
   recovery per code. A `bump` chart over eight series with no `highlight` now
   gets `highlight_needed`, and `too_many_series` keeps its one recovery, which
   is `multiples`.

### Changes

- **`better` became `first`, and it is required.** A wrong direction draws the
  whole chart upside down, and no check can catch it, so the spec must state it.
  `better` also judged the measure: the series with the most errors ranks first
  and is not better. `first: "lowest" | "highest"` says which `y` is rank 1.
- **Equal `y` values at one position are refused with `tied_rank`.** The
  proposal broke a tie by the order of the rows. The chart would then show one
  of two equal series above the other as a fact. The helper cannot know the
  ranking's tie rule, so the agent supplies it in the rows.
- **`highlight_needed` was added.** See answer 4.
- **`dumbbell_needs_two_measures` was added and `series_incomplete` is a `bump`
  code only.** The proposal gave no code to a dumbbell whose `series` holds one
  or three measures. `slope` has the same pair of causes under
  `slope_needs_two_positions`, with one recovery, and the dumbbell now follows
  that pattern.
- **A dumbbell's `"difference"` sort is signed.** The proposal sorted by
  distance. The second measure minus the first puts rises at the top and falls
  at the bottom, so the reader gets the direction of a change from its place and
  does not depend on telling two colours apart.
- **A strip's sort value is `"median"`.** The proposal called it `"value"`, and
  a strip has many values per group. The name now says what the helper computes.
- **A category or a group can be a string or a number.** The proposal required a
  string. `slope` already accepts either as a label, and a table keyed by a year
  or an id would have been refused for no gain.
- **`highlight` cannot be empty.** Its type is a tuple of at least one name. A
  name outside the `series` column, a repeated name or more than eight names is
  refused with `invalid_spec`.
- **`FrameSpec` became `CommonSpec` and `BaseSpec` became `ScaledSpec`.** The
  split is right, because `bump` prints no `y` value and has no numeric scale.
  The names were not. This document uses "range frame" for an axis, so
  `FrameSpec` read as a kind of axis, and `BaseSpec` was no longer the base.
  Neither type is exported.
- **Lower bounds and widened codes are stated.** A `dot` chart needs two
  categories, and one is refused with `too_few_rows`, whose recovery already
  says to write a sentence. A strip may have one group. The comments on
  `too_few_rows`, `duplicate_point` and `invalid_spec` name the new cases.
- **The comment on `Annotation` states the strip exception.** It said `at`
  matches exactly one row, and a strip's `at` takes the first of equal
  observations.
- **The comment on `MAX_LINE_SERIES` names its second use.** It also bounds the
  series a `bump` chart colours. The name stays, because the tests import it.

### Considered and not changed

- **`dot` and `strip` have no ascending sort.** Largest at the top answers
  "which is most", and `"none"` lets the agent supply any other order in the
  rows.
- **`reference` stays on the dumbbell.** A target beside a before and an after
  is a plain case, and a separate type for it would add a type to save nothing.
- **`bump` infers the order of positions.** Numbers and ISO dates are sorted and
  other labels keep the order of the rows. `line` already infers numbers and
  dates in the same way, so the rule adds no field.
- **`too_many_rows` and `points_collide` stay separate.** The first is checked
  before layout and its recovery is to reduce the rows. The second depends on
  the layout, and a greater `width` can clear it.
- **`points_collide` and `labels_collide` keep recoveries of two parts.** Each
  is one sentence that the message states, as the first review accepted.
- **A dumbbell of categories of very different size is not refused.** The small
  categories draw as short lines on a common scale. Whether to draw a percentage
  change is a choice of data, which the choosing guide covers.
