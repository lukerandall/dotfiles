# Waterfall chart

Use it for: A start value, a sequence of gains and losses, and the end value, such as monthly revenue.

Data needed: An ordered list of steps with signs, whose sum links the start to the end.

## Draw it

1. Draw the totals as full bars from zero and each step as a floating bar from the running total.
2. Print each step with its sign (+ or the minus sign) so that direction does not depend on colour.
3. Join the bars with thin lines at the running total.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

The steps must be a sequence, so that the running total means something. For parts that do not run in order, use a segmented bar.

## Worked example

The SVG it produces is `examples/waterfall.svg`.

```ts
export function waterfall(): string {
  const steps: [string, number, "total" | "step"][] = [["Jan revenue", 120, "total"], ["New", 35, "step"], ["Upsell", 15, "step"], ["Churn", -40, "step"], ["Refunds", -20, "step"], ["Feb revenue", 110, "total"]];
  const x = (i: number) => 50 + i * 92, bw = 62, y = scaleLinear().domain([0, 180]).range([170, 10]);
  let body = "", run = 0;
  steps.forEach(([name, v, kind], i) => {
    const from = kind === "total" ? 0 : run, to = kind === "total" ? v : run + v;
    if (kind === "total") run = v; else run = to;
    const top = y(Math.max(from, to)), bot = y(Math.min(from, to));
    body += `<path d="M${x(i)},${r(top)}h${bw}V${r(bot)}h${-bw}z" fill="${kind === "total" ? "currentColor" : v > 0 ? S(1) : S(2)}"${kind === "total" ? ' fill-opacity="0.45"' : ""}/>`;
    body += T(x(i) + bw / 2, top - 9, kind === "total" ? String(v) : (v > 0 ? "+" : "−") + Math.abs(v), "middle");
    body += T(x(i) + bw / 2, 186, name, "middle", true);
    if (i < steps.length - 1) body += L(x(i) + bw, y(run), x(i + 1), y(run), 0.4);
  });
  return svg(200, "Monthly revenue from 120 to 110: new and upsell add 50, churn and refunds remove 60.", body);
}
```
