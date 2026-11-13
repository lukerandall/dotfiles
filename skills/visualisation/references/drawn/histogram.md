# Histogram multiples

Use it for: The shape of one distribution, or the same distribution for a few groups.

Data needed: A list of raw values per group. One shared bin width and one shared y scale across groups.

## Draw it

1. Choose the bin width by trying several; Wilke advises exploring multiple widths because the default is often not the best.
2. Bin every group with the same thresholds, from `bin` in `d3-array`.
3. Draw one panel per group with the same y scale, rather than overlaying or stacking groups.
4. Print the y scale's end values and the x range.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Overlaid translucent bars look like a third group, and stacked histograms give the segments no common baseline. With more than a handful of groups use `drawn/ridgeline`.

## Worked example

The SVG it produces is `examples/histogram.svg`.

```ts
export function histogram(): string {
  const rnd = lcg(5);
  const groups = [["search", 0.1], ["auth", 0.45]] as const;
  const w = 270, h = 90, binner = bin().domain([0, 400]).thresholds(20);
  let body = "";
  const data = groups.map(([, p]) => Array.from({ length: 200 }, () => (rnd() < p ? 280 + gauss(rnd) * 35 : 100 + gauss(rnd) * 28)));
  const top = Math.max(...data.map((d) => Math.max(...binner(d).map((b) => b.length))));   // one shared y scale
  groups.forEach(([name], g) => {
    const ox = 40 + g * (w + 30), y = scaleLinear().domain([0, top]).range([h, 0]), x = scaleLinear().domain([0, 400]).range([0, w]);
    body += T(ox, 8, name, "start");
    for (const b of binner(data[g])) {
      if (!b.length) continue;
      const bx = x(b.x0!), bw = x(b.x1!) - bx - 1;
      body += `<path d="M${r(ox + bx)},${20 + h}h${r(bw)}v${r(-(h - y(b.length)))}h${r(-bw)}z" fill="${S(1)}"/>`;
    }
    body += L(ox, 20 + h + 4, ox + w, 20 + h + 4) + T(ox, 20 + h + 17, "0", "start", true) + T(ox + w, 20 + h + 17, "400 ms", "end", true);
  });
  body += T(34, 20 + h, "0", "end", true) + T(34, 20, String(top), "end", true);
  return svg(20 + h + 28, "Response-time histograms for two services on one scale; auth has a much larger slow group.", body);
}
```
