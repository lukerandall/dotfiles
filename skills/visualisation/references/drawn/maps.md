# Small-multiple maps

Use it for: A trend or a value for each region, when position in the country helps the reader find a region.

Data needed: One series per region, and a rough grid position for each region. No map geometry is needed.

## Draw it

1. Arrange one tile per region on a grid that follows its position, and draw a small line chart in each tile on a shared scale.
2. Colour only the region the finding is about, and print the last value at each tile's right.
3. For a choropleth, which needs region shapes, bin the values into four to six steps and use a density, not a count (Wilke). This example does not draw one, because it needs boundary data.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Wilke notes that a choropleth lets large regions dominate. A tile grid gives every region the same area. When place is only a label, draw `helper dot`.

## Worked example

The SVG it produces is `examples/maps.svg`.

```ts
export function maps(): string {
  const rnd = lcg(9);
  // A tile grid: one tile per region at its rough geographic position.
  const tiles: [string, number, number][] = [["NW", 0, 0], ["N", 1, 0], ["NE", 2, 0], ["W", 0, 1], ["C", 1, 1], ["E", 2, 1], ["SW", 0, 2], ["S", 1, 2], ["SE", 2, 2]];
  const tw = 170, th = 62;
  let body = "";
  tiles.forEach(([name, col, row], i) => {
    const ox = 20 + col * (tw + 20), oy = 22 + row * (th + 24);
    const vals = Array.from({ length: 12 }, (_, k) => 50 + (i % 3 - 1) * 12 * (k / 11) + gauss(rnd) * 4 + (i === 4 ? k * 3 : 0));
    const x = scaleLinear().domain([0, 11]).range([ox, ox + tw]), y = scaleLinear().domain([30, 90]).range([oy + th, oy]);
    body += T(ox, oy - 10, name, "start") + `<path d="${line<number>().digits(1).x((_, k) => x(k)).y((v) => y(v))(vals)}" fill="none" stroke="${i === 4 ? S(1) : "currentColor"}" stroke-opacity="${i === 4 ? 1 : 0.55}" stroke-width="${i === 4 ? 2 : 1.25}"/>`;
    body += T(ox + tw + 4, y(vals[11]), String(Math.round(vals[11])), "start", i !== 4);
  });
  return svg(22 + 3 * (th + 24), "Monthly orders in nine regions laid out by position; only the centre region rises sharply.", body);
}
```
