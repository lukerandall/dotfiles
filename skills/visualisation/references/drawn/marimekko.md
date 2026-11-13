# Marimekko (mosaic) chart

Use it for: Two categorical variables at once: column width is the size of the first, segment height is the share of the second within it.

Data needed: Counts for every pair of categories, at most about three columns and four segments.

## Draw it

1. Set each column's width in proportion to its total, and each segment's height to its share within the column.
2. Print each share inside its segment, and each column's name and total above it, so that the reader can check what they see.
3. Label the segments once, at the right of the last column.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Wilke notes that rectangles in a mosaic lack a shared baseline, so equal counts are hard to compare. When the point is one comparison, a segmented bar or a dot plot says it more exactly.

## Worked example

The SVG it produces is `examples/marimekko.svg`.

```ts
export function marimekko(): string {
  const cols = [["EMEA", 420, [50, 30, 20]], ["Americas", 380, [35, 40, 25]], ["APAC", 200, [20, 30, 50]]] as const;
  const parts = ["Free", "Pro", "Team"], total = 1000, W0 = 540, H0 = 170, ox = 50, oy = 36;
  let body = "", acc = 0;
  cols.forEach(([name, size, shares], c) => {
    const x0 = ox + (acc / total) * W0, w = (size / total) * W0;
    body += T(x0 + w / 2, oy - 18, `${name} (${size})`, "middle");
    let a = 0;
    shares.forEach((p, k) => {
      const y0 = oy + (a / 100) * H0, h = (p / 100) * H0;
      body += `<path d="M${r(x0 + 1)},${r(y0 + 1)}h${r(w - 2)}v${r(h - 2)}h${r(-(w - 2))}z" fill="${S(k + 1)}"/>`;
      body += T(x0 + w / 2, y0 + h / 2, `${p}%`, "middle").replace("<text", '<text fill="#fff"');
      if (c === 2) body += T(ox + W0 + 8, y0 + h / 2, parts[k], "start");
      a += p;
    });
    acc += size;
  });
  return svg(oy + H0 + 10, "Plan mix by region; column width is region size.", body);
}
```
