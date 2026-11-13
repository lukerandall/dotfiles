# Checking a chart

Do this in step 7 of the skill, after the chart renders.

## Read the chart back

1. Render the chart in the light theme and in the dark theme.
2. Read the answer to the step 1 question off the chart alone, without the surrounding text. When you cannot, the form is wrong: go back to step 3 and choose again.

## Read every printed number back

Every number printed anywhere on the chart is checked, whoever produced it. That includes the title, a headline, axis end labels, direct labels, annotations, medians, totals, and numbers the helper printed. The helper rounds, and it can only round what it was given, so it can print a figure that does not match the rows if the spec was wrong.

1. List each printed number.
2. Find the rows it came from and compare the number against them.
3. Recompute each computed value (a difference, a median, a percentage, a count, a total) from the rows with a script. Never take it from memory or by eye.
4. Correct any number that differs, then render and read it back again.

## What the helper cannot check

- Whether a value that the spec gives is the value in your source.
- Whether a number you typed into a `finding`, annotation or the page text agrees with the chart.
- A drawn form from `references/drawn/` is your own SVG, so check its labels, its viewBox and the sums in its caption the same way.

## Data-ink

Data-ink is the ink that shows data, as against ink that only frames or decorates it (Tufte). Remove gridlines, boxes, borders, backgrounds and legends that repeat what a direct label says. Keep the ink that carries a value.
