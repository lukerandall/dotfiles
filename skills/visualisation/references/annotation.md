# Labels and annotations

Read this when step 3 or 4 of `SKILL.md` needs a label placed, or a placement fails.

## Direct labels

- Put the series name at the right end of its line, in the page's text colour. Series colours are for marks. Text in a series colour fails contrast in one of the two themes.
- Leave at least one line of text height (about 13 units) between neighbouring end labels.
- When labels sit closer than that, move them apart and draw a thin leader line from each line end to its label. The helper does this.
- When the labels still do not fit, stop labelling and use small multiples. A legend is the last choice.

## Annotations

- Write the finding as a sentence of at most 80 characters, beside the point it explains: "Pro passes Free", not "March".
- Use plain text. A leader line is allowed only when the text had to move away from its point, and it is a thin line in the text colour at half opacity.
- Draw no box, no callout bubble and no background behind text.
- Annotate a point that exists in the data. A reader who looks for the value finds it in the row.

## Collisions

The helper tries eight positions around the point at three distances. It refuses with `annotation_does_not_fit` when none clears the line, the axis labels and the other annotations. Remove that annotation or raise `width`. When drawing by hand, check every label against the lines and against the other labels.
