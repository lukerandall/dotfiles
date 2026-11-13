# Transition table

Use it for: Counts of items moving from each state to each state, when the reader needs the exact numbers.

Data needed: The same from-to counts that a Sankey takes.

## Draw it

1. Put the states in the same order down the rows and across the columns, and add a total column.
2. Tint each cell by its share of its row's total, so that the table also shows the shape.
3. Print a dash for zero, so that the empty cells do not look like missing data.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

A table shows exact counts and is poor for showing the shape of a flow (Tufte). When the reader's question is about the shape, draw `drawn/sankey`.

## Worked example

The SVG it produces is `examples/transition-table.svg`.

```ts
export function transitionTable(): string {
  const names = ["Free", "Pro", "Team", "Churned"];
  const m = [[270, 30, 0, 30], [0, 150, 20, 20], [0, 0, 85, 5]];
  const colX = [150, 230, 310, 410, 500], y0 = 40;
  let body = T(10, 14, "From \\ to (January to April)", "start", true);
  names.forEach((n, j) => (body += T(colX[j], 22, n, "end")));
  body += T(colX[4], 22, "Total", "end") + L(10, 30, colX[4] + 6, 30);
  m.forEach((row, i) => {
    const y = y0 + i * 26, tot = row.reduce((a, b) => a + b, 0);
    body += T(10, y + 8, names[i], "start");
    row.forEach((v, j) => {
      const share = v / tot;
      body += `<path d="M${colX[j] - 58},${y - 4}h62v24h-62z" fill="${S(1)}" fill-opacity="${r(share * 0.6)}"/>`;
      body += T(colX[j], y + 8, v ? String(v) : "–", "end");
    });
    body += T(colX[4], y + 8, String(tot), "end", true);
  });
  body += T(10, y0 + 3 * 26 + 6, "Shading is the share of each row's customers.", "start", true);
  return svg(y0 + 3 * 26 + 18, "Where January's customers were in April: 30 of 330 Free customers moved to Pro, 30 churned.", body, 520);
}
```
