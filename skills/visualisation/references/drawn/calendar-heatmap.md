# Calendar heatmap

Use it for: Daily patterns by weekday and week, such as deploys per day.

Data needed: One value per day for at least several weeks.

## Draw it

1. Put weeks in columns and weekdays in rows, one cell per day, with a 2 pixel gap.
2. Map the value to a one-hue ramp from `dataviz` (the example uses five steps of the blue ramp) and draw the steps as a small key.
3. Label every fourth week and the alternate weekdays.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

The Financial Times vocabulary notes that it costs precision. When the reader needs exact values, use a line with weekday and weekend marked, or a table.

## Worked example

The SVG it produces is `examples/calendar-heatmap.svg`.

```ts
export function calendarHeatmap(): string {
  const rnd = lcg(17);
  const weeks = 26, cell = 18, gap = 2, ox = 34, oy = 24;
  const steps = [100, 250, 400, 550, 700];
  let body = "";
  ["Mon", "Wed", "Fri"].forEach((d, i) => (body += T(ox - 6, oy + i * 2 * (cell + gap) + cell / 2, d, "end", true)));
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const v = Math.max(0, Math.round((d < 5 ? 6 : 1.5) + gauss(rnd) * 2 + (w > 18 ? 3 : 0)));
      const step = steps[Math.min(4, Math.floor(v / 3))];
      body += `<path d="M${ox + w * (cell + gap)},${oy + d * (cell + gap)}h${cell}v${cell}h${-cell}z" fill="${Q(step)}"/>`;
    }
    if (w % 4 === 0) body += T(ox + w * (cell + gap), 12, `wk ${w + 1}`, "start", true);
  }
  const ly = oy + 7 * (cell + gap) + 12;
  body += T(ox, ly, "fewer", "start", true);
  steps.forEach((s, i) => (body += `<path d="M${ox + 40 + i * 20},${ly - 7}h16v14h-16z" fill="${Q(s)}"/>`));
  body += T(ox + 146, ly, "more deploys", "start", true);
  return svg(ly + 14, "Deploys per day for 26 weeks: weekdays are busy, weekends quiet, and the last seven weeks are busier.", body, ox + weeks * (cell + gap) + 10);
}
```
