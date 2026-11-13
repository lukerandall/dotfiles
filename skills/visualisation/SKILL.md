---
name: visualisation
description: "Chart, graph, plot, sparkline, small multiples, slopegraph, annotate a line, or a chart on a hangar page: design it the Tufte way, with direct labels, inline annotations and no boxes. Load `dataviz` beside it."
---

Design every chart in the order below. `dataviz` supplies colour, the palette, the validator, mark sizes and the anti-pattern list: read it now and do not repeat it. A diagram of a mechanism, such as an architecture or a flow, is not a chart: use `artifact-diagramming`. The page around the chart follows `artifact-design`; a hangar page takes board-ui's token stylesheet.

## Steps

1. State the one finding the chart must show, in a sentence. When the sentence or a small table shows it as well, write that and draw no chart.
2. Pick the form from `dataviz`'s form table, then check the four forms this skill adds: sparkline, small multiples, slopegraph and annotated line. `references/forms.md` says when each fits.
3. Draw with the helper when the form is a sparkline, line, multiples or slope: write the spec and run `deno run <base directory>/scripts/chart.ts < spec.json > chart.svg`. `<base directory>` is the skill's base directory, which the harness announces when it loads the skill, and which is `~/.agents/skills/visualisation` when the skill is installed. `references/helper.md` gives the spec and the refusals. Draw by hand only for another form, or when the helper cannot run (`references/targets.md`).
4. Put in the spec what the helper cannot guess: the `finding`, an annotation that states the finding next to its data point (`references/annotation.md`), `yFormat` and `yRange`. The helper labels each series at its line end and draws no legend and no box. A hand-drawn chart gets the same: direct labels, plain-text annotations with at most a thin leader line, and no box, card, border or background around an annotation or the plot.
5. Check the output for data-ink. Each axis line spans only the data's minimum to maximum and its end labels state those values (a range frame). The plot has no frame, no heavy gridlines and no decoration.
6. Take colour and mark sizes from `dataviz`, define `--series-1` onward on the page from its palette, and run its validator.
7. Render the chart and look at it in the light and dark themes.

Read `references/targets.md` to learn what the target page allows: a claude.ai artifact, a hangar first-version page and a later scripted hangar page differ.

## Overrides of `dataviz`

- `dataviz` requires a legend when a chart has two or more series. Use direct labels instead. The label on the mark keeps identity from depending on colour alone, which is what the legend was for.
- `dataviz` adds a hover tooltip by default. A static target gets none, because a hangar first-version page sends a content security policy that allows no scripts. Print every value the reader needs as a label, or in a table under the chart.

## Done when

- The chart came from `scripts/chart.ts`, or the reply says why it did not.
- Every series is labelled on the chart.
- No box surrounds a label or the plot.
- Every annotation states a finding.
- The output contains no `<script>` when the target is hangar.
