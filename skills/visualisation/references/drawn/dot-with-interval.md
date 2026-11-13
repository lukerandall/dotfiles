# Dot with interval

Use it for: An estimate and its uncertainty for each of a few categories, such as a change in a score with a 95 percent interval.

Data needed: An estimate, a lower and an upper bound per category, and what the bounds are.

## Draw it

1. Draw a reference line at the value that matters, such as no change.
2. Draw the interval as a line and the estimate as a dot on it, sorted by estimate.
3. Print the bounds and say in the caption what they are, such as the 95 percent interval (Wilke).

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Do not draw bars with error bars (Correll and Gleicher 2014), and do not mix standard deviation and standard error. When the plausibility across the range matters, draw `drawn/gradient-interval`.

## Worked example

The SVG it produces is `examples/dot-with-interval.svg`.

```ts
export function dotWithInterval(): string {
  const rows: [string, number, number, number][] = [["Checkout", 18, 12, 24], ["Search", 9, 5, 13], ["Onboarding", 4, -3, 11], ["Billing", -3, -9, 3], ["Reports", -11, -14, -8]];
  const x = scaleLinear().domain([-16, 26]).range([110, 560]);
  let body = L(x(0), 8, x(0), 12 + rows.length * 28 - 4, 0.4) + T(x(0), 12 + rows.length * 28 + 8, "no change", "middle", true);
  rows.forEach(([name, v, lo, hi], i) => {
    const y = 20 + i * 28;
    body += T(100, y, name, "end") + L(x(lo), y, x(hi), y, 0.8, 2) + `<circle cx="${r(x(v))}" cy="${y}" r="4" fill="${S(1)}"/>`;
    body += T(x(hi) + 8, y, `${v > 0 ? "+" : "−"}${Math.abs(v)} (${lo} to ${hi})`.replace("-", "−"), "start", true);
  });
  return svg(12 + rows.length * 28 + 18, "Change in task success by flow with 95 percent intervals: Checkout and Search rose, Reports fell.", body);
}
```
