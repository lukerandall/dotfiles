# Cycle plot

Use it for: Whether each month, or weekday, is changing across years, and whether the seasonal shape is changing.

Data needed: A value per month per year, at least three years.

## Draw it

1. Draw one small panel per month, with its years in order from left to right, and a flat line at that month's mean (Cleveland, Dunn and Terpenning 1978; Robbins 2008).
2. Use one scale for every panel and put the month name under it.
3. Read the seasonal shape from the means, and each month's trend from the slope inside its panel.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

A line per year hides the trend of one month, and one long line hides the month effect (Robbins 2008). With only one or two years, a line chart is enough.

## Worked example

The SVG it produces is `examples/cycle-plot.svg`.

```ts
export function cyclePlot(): string {
  const rnd = lcg(13);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const season = [60, 55, 62, 70, 82, 95, 105, 100, 85, 72, 64, 66];
  const trend = [1, 1, 1, 2, 3, 4, 6, 5, 3, 1, 0, 0];            // growth per year differs by month
  const pw = 44, ox = 40, h = 130, y = scaleLinear().domain([40, 150]).range([34 + h, 34]);
  let body = "";
  months.forEach((m, k) => {
    const vals = [0, 1, 2, 3].map((yr) => season[k] + trend[k] * yr * 2 + gauss(rnd) * 1.5);
    const x = scaleLinear().domain([0, 3]).range([ox + k * pw + 4, ox + k * pw + pw - 8]);
    body += `<path d="${line<number>().digits(1).x((_, i) => x(i)).y((v) => y(v))(vals)}" fill="none" stroke="${S(1)}" stroke-width="1.75"/>`;
    body += L(x(0), y(mean(vals)!), x(3), y(mean(vals)!), 0.7, 1) + T(ox + k * pw + pw / 2 - 2, 34 + h + 14, m, "middle", true);
    if (k > 0) body += L(ox + k * pw, 34, ox + k * pw, 34 + h, 0.12);
  });
  body += T(34, y(40), "40", "end", true) + T(34, y(150), "150", "end", true) + T(ox, 8, "Four years in each month, oldest at the left. The flat line is the month's mean.", "start", true);
  return svg(34 + h + 26, "Monthly values over four years: summer months grow fastest, winter months are flat.", body);
}
```
