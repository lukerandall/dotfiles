---
name: visualisation
description: "Chart, graph, plot, sparkline, small multiples, slopegraph, annotate a line, or a chart on a hangar page: design it the Tufte way, with direct labels, inline annotations and no boxes. Load `dataviz` beside it."
---

Design every chart in the order below. `dataviz` supplies colour, the palette, the validator, mark sizes and the anti-pattern list: read it now and do not repeat it. A diagram of a mechanism, such as an architecture or a flow, is not a chart: use `artifact-diagramming`. The page around the chart follows `artifact-design`; a hangar page takes board-ui's token stylesheet.

## Steps

1. State the one finding the chart must show, in a sentence. When the sentence or a small table shows it as well, write that and draw no chart.
2. Pick the form from `dataviz`'s form table, then check the four forms this skill adds: sparkline, small multiples, slopegraph and annotated line. `references/forms.md` says when each fits.
3. Label directly. Put each series name at the end of its line or beside its mark. Draw a legend only when direct labels would collide and small multiples do not fit.
4. Annotate inline. Write the finding next to the data point it describes, as plain text with at most a thin leader line. Draw no box, card, border or background around an annotation or around the plot. `references/annotation.md` covers placement and collisions.
5. Remove ink that carries no data: the plot frame, heavy gridlines, tick marks the labels make redundant, and decoration. Use a range frame: each axis line spans only the data's minimum to maximum, and its end labels state those values.
6. Take colour and mark sizes from `dataviz`, and run its validator.
7. Render the chart and look at it in the light and dark themes.

To draw a line, multiples, sparkline or slope from rows, run `deno run -A skills/visualisation/scripts/chart.ts < spec.json > chart.svg`. `references/helper.md` gives the spec and the refusals. Read `references/targets.md` to learn what the target page allows: a claude.ai artifact, a hangar first-version page and a later scripted hangar page differ.

## Overrides of `dataviz`

- `dataviz` requires a legend when a chart has two or more series. Use direct labels instead. The label on the mark keeps identity from depending on colour alone, which is what the legend was for.
- `dataviz` adds a hover tooltip by default. A static target gets none, because a hangar first-version page sends a content security policy that allows no scripts. Print every value the reader needs as a label, or in a table under the chart.

## Done when

- Every series is labelled on the chart.
- No box surrounds a label or the plot.
- Every annotation states a finding.
- The output contains no `<script>` when the target is hangar.
