---
name: visualisation
description: "Chart, graph, plot, visualise, which chart, distribution, ranking, flow, set overlap, a chart on a hangar page: choose the form that answers the reader's question, draw it with direct labels and no boxes. Names `dataviz`, which supplies colour; load it beside this skill."
---

Work through these seven steps in order. `dataviz` supplies colour, the palette, the validator, mark sizes and the anti-pattern list. A diagram of a mechanism, such as an architecture, is not a chart: use `artifact-diagramming`. The page around the chart follows `artifact-design`; a hangar page takes board-ui's token stylesheet.

1. **Question.** Write one sentence naming the reader's task: compare, change over time, distribution, parts of a whole, correlation, ranking change, deviation, flow, set overlap, geography, cycle or uncertainty.
2. **Data.** Write the column types, the counts and the shape: items, groups, periods, values per group.
3. **Choose.** Look up the task and the data shape in `references/choosing.md`. Write the form and the reason, naming the row you used. When a sentence or a small table answers the question, write that and draw no chart.
4. **Draw.** Use the helper for sparkline, line, multiples, slope, dot, dumbbell, bump and strip: write a spec (`references/forms.md` has one to copy for each) and run `deno run <base directory>/scripts/chart.ts < spec.json > chart.svg`. `<base directory>` is the skill's base directory, which is `~/.agents/skills/visualisation` when the skill is installed. `references/helper.md` lists the fields and the refusals. For every other form, follow that form's file in `references/drawn/`. `references/targets.md` says what the target page allows.
5. **Present.** Label each series on the chart and put no legend there. Put each finding beside its data point as plain text (`references/annotation.md`). Draw no box, card, border or background around a label or the plot. Each axis line spans only the data's minimum to maximum and its end labels state those values (a range frame).
6. **Colour.** Take colours and mark sizes from `dataviz`, define `--series-1` onward on the page from its palette, and run its validator.
7. **Check.** Render the chart in the light and dark themes. Read the answer to the step 1 question off the chart alone. When you cannot, go back to step 3. Then read every number printed on the chart, including the title, headline and annotations, back against the data. Recompute each computed value (a difference, a median, a percentage, a count) from the rows with a script, and never from memory or by eye. Correct any number that differs. Numbers the helper printed are its own work; any number you typed or drew into the SVG yourself needs this check.

## Overrides of `dataviz`

- `dataviz` requires a legend when a chart has two or more series. Use direct labels instead. The label on the mark keeps identity from depending on colour alone, which is what the legend was for.
- `dataviz` adds a hover tooltip by default. A static target gets none, because a hangar first-version page sends a content security policy that allows no scripts. Print every value the reader needs as a label, or in a table under the chart.

## Done when

- The question and the data shape are written down.
- The reason for the form names a row of `references/choosing.md`.
- The chart came from `scripts/chart.ts`, or names the `references/drawn/` file it followed.
- Every series is labelled on the chart, and no box surrounds a label or the plot.
- The output contains no `<script>` when the target is hangar.
- Every number printed on the chart has been read back against the data, and every computed value was recomputed from the rows by a script.
