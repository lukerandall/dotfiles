# Segmented bar

Use it for: How a few parts make up a whole, for one whole or for a few wholes compared, such as plan mix by year.

Data needed: Parts that sum to a whole, at most about five, with a fixed order of parts.

## Draw it

1. Draw one bar per whole on a shared 0 to 100 scale, with a 2 pixel gap between segments.
2. Label the parts directly above the first bar, and print each share inside its segment.
3. Keep the part order the same in every bar and take the colours in slot order from `dataviz`.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Wilke notes that middle segments sit on shifting baselines, so avoid long stacks of many segments. With more than about five parts, or when the reader must compare parts across wholes, draw ranked bars (`dataviz`) or `helper dot`.

## Worked example

The SVG it produces is `examples/segmented-bar.svg`.

```ts
export function segmentedBar(): string {
  const rows = [["2024", [52, 30, 18]], ["2025", [47, 31, 22]], ["2026", [38, 33, 29]]] as const;
  const parts = ["Free", "Pro", "Team"], x = scaleLinear().domain([0, 100]).range([60, 600]);
  let body = "";
  rows.forEach(([year, v], i) => {
    const y = 40 + i * 38;
    body += T(52, y + 11, year, "end");
    let acc = 0;
    v.forEach((p, k) => {
      body += `<path d="M${r(x(acc) + (k ? 1 : 0))},${y}H${r(x(acc + p) - 1)}V${y + 22}H${r(x(acc) + (k ? 1 : 0))}z" fill="${S(k + 1)}"/>`;
      if (i === 0) body += T((x(acc) + x(acc + p)) / 2, y - 10, parts[k], "middle");
      body += T(x(acc + p) - 6, y + 11, `${p}%`, "end").replace("<text", '<text fill="#fff"');
      acc += p;
    });
  });
  return svg(40 + 3 * 38 + 6, "Share of customers by plan, 2024 to 2026: Team grows from 18 to 29 percent.", body);
}
```
