# Ridgeline plot

Use it for: The same distribution measured for many groups, or one distribution changing over time, such as response times for each month.

Data needed: At least a few dozen raw values per group, so that a density estimate is honest.

## Draw it

1. Estimate a density for each group with one bandwidth, and print the bandwidth in the caption when it matters.
2. Draw each density with `area` from `d3-shape`, from the top group down, so that lower ridges overlap the ones above.
3. Label each ridge at its baseline and give the x axis a range frame.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Wilke warns against ridgelines built from histograms, whose bars from different groups align confusingly. Use density curves. A density curve with few points misleads and can extend past values that cannot occur, so check its ends.

## Worked example

The SVG it produces is `examples/ridgeline.svg`.

```ts
export function ridgeline(): string {
  const rnd = lcg(11);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const x = scaleLinear().domain([0, 400]).range([60, 600]);
  const kde = (xs: number[], bw: number) => (t: number) => xs.reduce((s, v) => s + Math.exp(-0.5 * ((t - v) / bw) ** 2), 0) / (xs.length * bw * Math.sqrt(2 * Math.PI));
  const pitch = 34, base0 = 62;
  let body = "";
  months.forEach((m, i) => {
    const n = 150;
    const xs = Array.from({ length: n }, () => (rnd() < 0.15 + i * 0.07 ? 280 + gauss(rnd) * 40 : 100 + gauss(rnd) * 25));
    const f = kde(xs, 12);
    const grid = Array.from({ length: 81 }, (_, k) => k * 5);
    const y = scaleLinear().domain([0, 0.016]).range([0, 52]);
    const base = base0 + i * pitch;
    const d = area<number>().digits(1).x((t) => x(t)).y0(base).y1((t) => base - y(f(t)))(grid);
    body += `<path d="${d}" fill="${S(1)}" fill-opacity="0.55" stroke="${S(1)}" stroke-width="1.25"/>`;
    body += L(60, base, 600, base, 0.25) + T(54, base, m, "end");
  });
  const yb = base0 + months.length * pitch;
  body += L(x(0), yb + 8, x(400), yb + 8) + T(x(0), yb + 21, "0 ms", "start", true) + T(x(400), yb + 21, "400 ms", "end", true);
  return svg(yb + 30, "Response times by month: a second, slower group of requests near 280 ms grows from January to June.", body);
}
```
