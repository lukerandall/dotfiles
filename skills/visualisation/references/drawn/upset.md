# UpSet plot

Use it for: Which combinations of three or more sets are most common, such as features used by each user.

Data needed: Counts per exact combination, from a membership table of items by sets.

## Draw it

1. Count items by their exact combination of sets, and sort combinations by count.
2. Draw one column per combination: a bar of its count above a matrix of dots, filled for the sets in it and joined by a line.
3. Draw each set's size as a bar at the left of its row, and label the sets.

The example uses `d3-scale@4.0.2`, `d3-shape@3.2.0` and `d3-array@3.2.4`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Lex and others (2014) built UpSet because Venn and Euler diagrams are hard to read past three or four sets. It scales to 20 or 30 sets. Show only the largest combinations when there are many.

## Worked example

The SVG it produces is `examples/upset.svg`.

```ts
export function upset(): string {
  const sets = ["Search", "Export", "API", "Alerts", "SSO"];
  const combos: [number[], number][] = [[[0], 96], [[0, 1], 61], [[2], 54], [[0, 2], 40], [[3], 31], [[0, 1, 2], 28], [[4], 14], [[0, 3], 12]];
  const sizes = sets.map((_, s) => combos.reduce((a, [m, n]) => a + (m.includes(s) ? n : 0), 0));
  const cx = (i: number) => 260 + i * 40, rowY = (s: number) => 150 + s * 24, topMax = 100;
  const bh = scaleLinear().domain([0, topMax]).range([0, 90]), bw = scaleLinear().domain([0, 250]).range([0, 70]);
  let body = "";
  combos.forEach(([m, n], i) => {
    body += `<path d="M${cx(i) - 10},${130}v${-r(bh(n))}h20v${r(bh(n))}z" fill="${S(1)}"/>` + T(cx(i), 130 - bh(n) - 8, String(n), "middle");
    sets.forEach((_, s) => (body += `<circle cx="${cx(i)}" cy="${rowY(s)}" r="5" fill="currentColor" fill-opacity="${m.includes(s) ? 1 : 0.15}"/>`));
    const ys = m.map(rowY);
    if (m.length > 1) body += L(cx(i), Math.min(...ys), cx(i), Math.max(...ys), 1, 2);
  });
  sets.forEach((nm, s) => {
    body += T(110, rowY(s), nm, "end");
    body += `<path d="M${112},${rowY(s) - 6}h${r(bw(sizes[s]))}v12h${-r(bw(sizes[s]))}z" fill="${S(2)}" transform="translate(-0,0)"/>`;
    body += T(112 + bw(sizes[s]) + 6, rowY(s), String(sizes[s]), "start", true);
  });
  body += T(260, 12, "users with exactly this combination", "start", true) + T(10, 140, "set size", "start", true);
  return svg(rowY(4) + 18, "Feature combinations across 400 users: Search alone is most common, then Search with Export.", body);
}
```
