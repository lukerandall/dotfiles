# Diverging bar chart

Use it for: Values above and below a baseline, such as change in a score.

Data needed: One signed value per category.

## Draw it

1. Draw a baseline at zero and one bar per category on a shared scale, sorted by value.
2. Put each category's name on the side of the baseline opposite its bar, and print its value with its sign at the bar end.
3. Use two colours, and a sign in the label so that direction does not depend on colour.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Use it only when the baseline means something. For a target that is not zero, draw `helper dot` with `reference`.

## Worked example

The SVG it produces is `examples/diverging-bar.svg`.

```ts
export function divergingBar(): string {
  const rows: [string, number][] = [["Checkout", 18], ["Search", 9], ["Onboarding", 4], ["Billing", -3], ["Reports", -11], ["Export", -16]];
  const x = scaleLinear().domain([-20, 20]).range([110, 570]), x0 = x(0);
  let body = L(x0, 8, x0, 8 + rows.length * 28, 0.6);
  rows.forEach(([name, v], i) => {
    const y = 12 + i * 28;
    body += `<path d="M${r(x0)},${y}H${r(x(v))}V${y + 18}H${r(x0)}z" fill="${v > 0 ? S(1) : S(2)}"/>`;
    body += T(v > 0 ? x0 - 8 : x0 + 8, y + 9, name, v > 0 ? "end" : "start");
    body += T(x(v) + (v > 0 ? 8 : -8), y + 9, (v > 0 ? "+" : "−") + Math.abs(v) + " pts", v > 0 ? "start" : "end");
  });
  return svg(12 + rows.length * 28 + 6, "Change in task success by flow, in points: Checkout up 18, Export down 16.", body);
}
```
