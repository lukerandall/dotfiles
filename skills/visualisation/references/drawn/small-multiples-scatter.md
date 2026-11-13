# Small multiples of scatter plots

Use it for: A relationship between two quantitative variables, compared across a few groups or across a few pairs of variables.

Data needed: Two numbers per case and a group per case, at most about six groups.

## Draw it

1. Draw one panel per group with the same x and y scales, so that the reader compares slopes by eye.
2. Give only the first panel a y range, and every panel an x range.
3. Name each panel above its top left corner.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Wilke prefers a scatter plot matrix to one crowded plot when there are more than two variables. With more than three or four variables, a correlogram hides the points: show the points where you can.

## Worked example

The SVG it produces is `examples/small-multiples-scatter.svg`.

```ts
export function scatterMultiples(): string {
  const rnd = lcg(3);
  const panels = [["North", 0.9], ["South", 0.4], ["West", -0.5]] as const;
  const w = 170, h = 140;
  let body = "";
  panels.forEach(([name, slope], i) => {
    const ox = 40 + i * (w + 30), x = scaleLinear().domain([0, 10]).range([ox, ox + w]), y = scaleLinear().domain([0, 10]).range([30 + h, 30]);
    body += T(ox, 12, name, "start");
    for (let k = 0; k < 30; k++) {
      const a = rnd() * 10, b = Math.min(10, Math.max(0, 5 + (a - 5) * slope + gauss(rnd) * 1.2));
      body += `<circle cx="${r(x(a))}" cy="${r(y(b))}" r="2.5" fill="${S(1)}" fill-opacity="0.8"/>`;
    }
    body += L(ox, 30 + h + 6, ox + w, 30 + h + 6) + T(ox, 30 + h + 19, "0", "start", true) + T(ox + w, 30 + h + 19, "10", "end", true);
    if (i === 0) body += L(ox - 6, 30, ox - 6, 30 + h) + T(ox - 10, 30, "10", "end", true) + T(ox - 10, 30 + h, "0", "end", true);
  });
  return svg(30 + h + 28, "Orders against visits in three regions on shared scales: strong in North, weak in South, negative in West.", body);
}
import { sankey, sankeyLeft, sankeyLinkHorizontal } from "npm:d3-sankey@0.12.3";
import { extent, gauss, L, lcg, line, mean, Q, r, S, scaleLinear, svg, T } from "./common.ts";
```
