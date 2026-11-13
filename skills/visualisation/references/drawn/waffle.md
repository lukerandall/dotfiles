# Waffle chart

Use it for: One percentage as a count of squares, when the whole is a round number and the reader should see a fraction of it.

Data needed: A part and a whole that is 100 or another small whole number.

## Draw it

1. Draw a 10 by 10 grid of squares and fill the first N from the bottom left.
2. Print the number beside the grid in large type, and say what one square is.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

The Financial Times vocabulary says a grid plot suits whole numbers. Do not round a fractional value to squares, and do not draw several waffles to compare values: use `helper dot`.

## Worked example

The SVG it produces is `examples/waffle.svg`.

```ts
export function waffle(): string {
  const n = 62, size = 22, gap = 3;
  let body = "";
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10), col = i % 10;
    body += `<path d="M${40 + col * (size + gap)},${10 + (9 - row) * (size + gap)}h${size}v${size}h${-size}z" fill="${i < n ? S(1) : "currentColor"}"${i < n ? "" : ' fill-opacity="0.15"'}/>`;
  }
  body += T(320, 60, "62 of 100", "start").replace("<text", '<text font-size="28"') + T(320, 96, "customers renewed.", "start") + T(320, 118, "Each square is one customer.", "start", true);
  return svg(260, "62 of 100 customers renewed.", body);
}
```
