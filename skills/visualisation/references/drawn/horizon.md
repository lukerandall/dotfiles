# Horizon chart

Use it for: Many time series that must sit in very little height, such as one row per service.

Data needed: One value per series per moment, with values above and below a baseline. At least a handful of series, or the height is not scarce.

## Draw it

1. Pick the band count: 2. Heer and others (2009) found 2-band charts more accurate than line charts under about 24 pixels, and advise against 4 or more bands.
2. Mirror the negative values into the same space (the example's blue above zero and orange below), which they found does not hurt accuracy when the reader knows how to read the chart.
3. Draw each band with `area` from `d3-shape` at 24 pixels tall: clip the value to the band, and layer a darker fill over a lighter one.
4. State the size of one band on the chart.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Above about 24 pixels of height a plain line (`helper line` or `multiples`) is easier to read. Say how to read the bands beside the chart, because readers who have not seen one cannot guess.

## Worked example

The SVG it produces is `examples/horizon.svg`.

```ts
export function horizon(): string {
  const rnd = lcg(7);
  const names = ["api", "web", "db"];
  const days = 90;
  const series = names.map((_, k) => {
    let v = 0;
    return Array.from({ length: days }, (_, i) => (v = v * 0.9 + gauss(rnd) * (2 + k * 1.5) + (k === 2 && i > 60 ? 3 : 0)));
  });
  const x = scaleLinear().domain([0, days - 1]).range([70, 560]);
  const H = 24, pitch = 34, bands = 2, M = 24;                // 2 bands, mirrored, 24 px tall
  let body = "";
  series.forEach((vals, k) => {
    const top = 14 + k * pitch;
    body += T(62, top + H / 2, names[k], "end");
    for (let b = 0; b < bands; b++) {
      for (const sign of [1, -1]) {
        const y = scaleLinear().domain([0, M / bands]).range([top + H, top]);
        const clip = (v: number) => Math.min(Math.max(sign * v - b * (M / bands), 0), M / bands);
        const d = area<number>().digits(1).x((_, i) => x(i)).y0(top + H).y1((v) => y(clip(v)))(vals);
        body += `<path d="${d}" fill="${sign > 0 ? S(1) : S(2)}" fill-opacity="${b === 0 ? 0.45 : 0.95}"/>`;
      }
    }
    body += T(566, top + H / 2, `peak ${r(Math.max(...vals.map(Math.abs)))}`, "start", true);
  });
  body += T(70, 14 + 3 * pitch + 6, `Blue is above zero, orange below. Each shade steps up by ${M / bands} units.`, "start", true);
  return svg(14 + 3 * pitch + 20, "Three services' daily deviation from baseline over 90 days; db drifts up at the end.", body);
}
```
