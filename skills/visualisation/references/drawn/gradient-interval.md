# Gradient interval

Use it for: An estimate whose plausible values fade out from the centre, for readers who must decide whether a value is credible.

Data needed: An estimate and a standard error, or a density, per category.

## Draw it

1. Slice the range into thin strips and set each strip's opacity from the density at its centre. Strips need no gradient definition and no id.
2. Mark the estimate with a heavy tick, and draw a reference line at the value that matters.
3. Print the estimate beside each row and say what the shading means.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Correll and Gleicher (2014) found gradient plots better than bars with error bars for inferential tasks. Wilke notes that confidence strips are hard to read because the viewer must integrate the shading to find where a level ends, so prefer `drawn/dot-with-interval` when exact levels matter.

## Worked example

The SVG it produces is `examples/gradient-interval.svg`.

```ts
export function gradientInterval(): string {
  // A t-like density sliced into thin strips; opacity follows the density, so no gradient definition or id is needed.
  const rows: [string, number, number][] = [["Checkout", 18, 3.1], ["Search", 9, 2.2], ["Onboarding", 4, 3.6], ["Billing", -3, 3.0]];
  const x = scaleLinear().domain([-16, 28]).range([110, 570]);
  let body = L(x(0), 8, x(0), 12 + rows.length * 32 - 4, 0.4) + T(x(0), 12 + rows.length * 32 + 8, "no change", "middle", true);
  rows.forEach(([name, mu, se], i) => {
    const y = 20 + i * 32, n = 36;
    body += T(100, y, name, "end");
    for (let k = 0; k < n; k++) {
      const t0 = mu - 3.2 * se + (6.4 * se * k) / n, t1 = t0 + (6.4 * se) / n, tm = (t0 + t1) / 2;
      const dens = Math.pow(1 + ((tm - mu) / se) ** 2 / 4, -2.5);
      body += `<path d="M${r(x(t0))},${y - 8}H${r(x(t1) + 0.3)}V${y + 8}H${r(x(t0))}z" fill="${S(1)}" fill-opacity="${r(dens)}"/>`;
    }
    body += `<path d="M${r(x(mu))},${y - 10}V${y + 10}" stroke="currentColor" stroke-width="2" fill="none"/>`;
    body += T(x(mu + 3.2 * se) + 8, y, `${mu > 0 ? "+" : "−"}${Math.abs(mu)}`, "start", true);
  });
  return svg(12 + rows.length * 32 + 18, "Change in task success with the plausibility of each value: Billing straddles zero, Checkout does not.", body);
}
```
