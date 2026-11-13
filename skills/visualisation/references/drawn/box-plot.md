# Box plot

Use it for: A compact summary of many distributions side by side, for a reader who knows how a box plot reads.

Data needed: Raw values per group. Say in the caption what the whiskers mean.

## Draw it

1. Compute the quartiles with `quantile` from `d3-array`, and the whiskers at the furthest values within 1.5 box heights.
2. Draw the box from the first to the third quartile, a heavy line at the median, and the outlying points as open circles.
3. Print each group's median in a column at the right so that no label collides with an outlier.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

A box plot hides the shape: a bimodal group can look like a unimodal one. When the question is about the shape or the tails, use `helper strip` or `drawn/ridgeline`.

## Worked example

The SVG it produces is `examples/box-plot.svg`.

```ts
export function boxPlot(): string {
  const rnd = lcg(21);
  const rows = [["search", 90, 20, 1], ["auth", 110, 25, 1], ["billing", 200, 45, 1], ["upload", 150, 60, 1]] as const;
  const x = scaleLinear().domain([0, 400]).range([80, 520]);
  let body = "";
  rows.forEach(([name, mu, sd], i) => {
    const xs = Array.from({ length: 200 }, () => mu + gauss(rnd) * sd + (rnd() < 0.03 ? 120 : 0)).sort((a, b) => a - b);
    const [q1, med, q3] = [0.25, 0.5, 0.75].map((p) => quantile(xs, p)!);
    const lo = Math.min(...xs.filter((v) => v >= q1 - 1.5 * (q3 - q1))), hi = Math.max(...xs.filter((v) => v <= q3 + 1.5 * (q3 - q1)));
    const y = 24 + i * 34;
    body += T(72, y, name, "end") + L(x(lo), y, x(q1), y, 0.8) + L(x(q3), y, x(hi), y, 0.8);
    body += `<path d="M${r(x(q1))},${y - 9}H${r(x(q3))}V${y + 9}H${r(x(q1))}z" fill="${S(1)}" fill-opacity="0.35" stroke="${S(1)}" stroke-width="1.25"/>`;
    body += L(x(med), y - 9, x(med), y + 9, 1, 2);
    for (const v of xs.filter((v) => v < lo || v > hi)) body += `<circle cx="${r(x(v))}" cy="${y}" r="2" fill="none" stroke="currentColor" stroke-opacity="0.7"/>`;
    body += T(540, y, `median ${Math.round(med)}`, "start", true);
  });
  body += L(x(0), 24 + 4 * 34 - 8, x(400), 24 + 4 * 34 - 8) + T(x(0), 24 + 4 * 34 + 5, "0 ms", "start", true) + T(x(400), 24 + 4 * 34 + 5, "400 ms", "end", true);
  return svg(24 + 4 * 34 + 14, "Response times for four services as box plots; billing is slowest and upload the most spread.", body);
}
```
