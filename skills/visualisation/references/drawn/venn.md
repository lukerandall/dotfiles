# Two-set Venn diagram

Use it for: How two sets overlap, as a schematic, when the reader needs the idea of an intersection and three counts.

Data needed: Three counts: only A, both, only B.

## Draw it

1. Draw two translucent circles that overlap, one per set, with radius in proportion to the square root of the set's size.
2. Print the three counts inside their regions and name the sets above the circles.
3. Say that the overlap is schematic, unless you computed it from the areas.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Do not draw a Venn for three or more sets (Lex and others 2014): use `drawn/upset`. The Financial Times vocabulary limits Venn to schematic overlaps.

## Worked example

The SVG it produces is `examples/venn.svg`.

```ts
export function venn(): string {
  const a = 165, both = 45, b = 80;                 // counts: only A, in both, only B
  const rA = Math.sqrt(a + both) * 5, rB = Math.sqrt(b + both) * 5, cy = 100, ax = 110;
  const d = rA + rB - 16;                           // schematic overlap, not area-proportional
  const bx = ax + d;
  let body = `<circle cx="${ax}" cy="${cy}" r="${r(rA)}" fill="${S(1)}" fill-opacity="0.4"/><circle cx="${r(bx)}" cy="${cy}" r="${r(rB)}" fill="${S(2)}" fill-opacity="0.4"/>`;
  body += T(ax - rA / 2, cy, String(a), "middle") + T(bx + rB / 2, cy, String(b), "middle") + T((ax + rA + bx - rB) / 2, cy, String(both), "middle");
  body += T(ax, cy - rA - 8, "Reads weekly", "middle") + T(bx, cy - rA - 8, "Exports weekly", "middle");
  return svg(cy + rA + 10, "Of 290 users, 165 only read, 80 only export and 45 do both.", body, 480);
}
```
