# Connected scatter plot

Use it for: Two variables that move together over time, when the loop or the cycle is the finding.

Data needed: Two numbers per moment, at least about six moments, in time order.

## Draw it

1. Draw the path with `line` from `d3-shape` in time order.
2. Label points with their dates, so direction and pace do not depend on arrowheads. Mark the first and last points larger.
3. Give both axes a range frame and name the variables.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Wilke says it must show direction and temporal scale, or it becomes unreadable, and that two line graphs are easier to read when the reader needs the simplest display. Use `helper multiples` unless the joint movement is the finding.

## Worked example

The SVG it produces is `examples/connected-scatter.svg`.

```ts
export function connectedScatter(): string {
  const pts = [[2015, 2.4, 4.1], [2016, 2.2, 4.5], [2017, 2.5, 4.9], [2018, 2.9, 5.1], [2019, 2.7, 5.6], [2020, 2.2, 4.8], [2021, 3.0, 4.6], [2022, 3.8, 5.0], [2023, 3.5, 5.7]];
  const x = scaleLinear().domain([2, 4]).range([60, 580]), y = scaleLinear().domain([4, 6]).range([190, 20]);
  const d = line<number[]>().digits(1).x((p) => x(p[1])).y((p) => y(p[2]))(pts)!;
  let body = `<path d="${d}" fill="none" stroke="${S(1)}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  pts.forEach((p, i) => {
    body += `<circle cx="${r(x(p[1]))}" cy="${r(y(p[2]))}" r="${i === 0 || i === pts.length - 1 ? 4.5 : 3}" fill="${S(1)}"/>`;
    body += T(x(p[1]) + (i % 2 ? -8 : 8), y(p[2]) - 10, String(p[0]), i % 2 ? "end" : "start");
  });
  body += L(x(2), 202, x(4), 202) + T(x(2), 215, "2.0", "start", true) + T(x(4), 215, "4.0 fuel price", "end", true);
  body += L(48, y(4), 48, y(6)) + T(44, y(4), "4.0", "end", true) + T(44, y(6), "6.0", "end", true) + T(52, 8, "miles driven", "start", true);
  return svg(224, "Fuel price against miles driven, 2015 to 2023; the path loops through 2020.", body);
}
```
