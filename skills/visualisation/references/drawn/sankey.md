# Sankey and alluvial diagram

Use it for: Where customers or items go between states over two or more periods, such as plans and churn.

Data needed: Counts for every from-to pair in each period. States that exist at every stage, and an end state such as churn.

## Draw it

1. Use `d3-sankey` 0.12.3: `sankey().nodeAlign(sankeyLeft).extent(...)` computes node positions and link widths, and `sankeyLinkHorizontal()` gives each link's path.
2. Give each stage one node per state. Add the end-state node only from the stage in which it first appears, and carry it forward with one link.
3. Colour each link by its source state, with the end-state links in a neutral colour, and print a count on every node (beside its name) and on every flow (on its band, midway between the stages). A flow label needs no more than the value, and labels in one column are spread apart so that they do not overlap. The reader of a flow diagram asks how many moved, and the band width alone cannot answer.
4. An alluvial diagram is the same drawing with the order of nodes in each stage kept the same, so that bands do not cross when a state does not change.

The example uses `d3-sankey@0.12.3`, `d3-shape@3.2.0`, `d3-scale@4.0.2`, pinned, with the helpers in `common.md`. It writes a static SVG with no script, style or id: text in `currentColor` and colours as `var(--series-N, fallback)`.

## When not

Wilke notes that crossing bands make the chart busy, and that the order of the sets and the choice of colouring variable decide how readable it is. With few states, `drawn/transition-table` states every count.

## Worked example

The SVG it produces is `examples/sankey.svg`.

```ts
import { sankey, sankeyLeft, sankeyLinkHorizontal } from "npm:d3-sankey@0.12.3";

export function sankeyChart(): string {
  const names = ["Free", "Pro", "Team", "Churned"];
  const stages = ["Jan", "Apr", "Jul"];
  // flow[stage][from][to] counts customers who moved from plan `from` to `to` in that period.
  const flow = [
    [[270, 30, 0, 30], [0, 150, 20, 20], [0, 0, 85, 5]],
    [[235, 15, 0, 20], [0, 160, 10, 10], [0, 0, 100, 5]],
  ];
  // One node per plan per stage. Churned customers get a node only from the stage they leave.
  const nodes: { name: string; stage: number }[] = [];
  const id = new Map<string, number>();
  stages.forEach((_, st) => names.forEach((n) => { if (n !== "Churned" || st > 0) { id.set(`${st}:${n}`, nodes.length); nodes.push({ name: n, stage: st }); } }));
  const links: { source: number; target: number; value: number; from: number }[] = [];
  flow.forEach((m, st) => m.forEach((row, from) => row.forEach((v, to) => {
    if (v) links.push({ source: id.get(`${st}:${names[from]}`)!, target: id.get(`${st + 1}:${names[to]}`)!, value: v, from });
  })));
  const gone = flow[0].reduce((a, row) => a + row[3], 0);              // already churned in the first period
  links.push({ source: id.get("1:Churned")!, target: id.get("2:Churned")!, value: gone, from: 3 });
  const g = sankey<any, any>().nodeWidth(14).nodePadding(14).nodeAlign(sankeyLeft).extent([[10, 22], [590, 230]]);
  const { nodes: ns, links: ls } = g({ nodes: nodes.map((d) => ({ ...d })), links: links.map((d) => ({ ...d })) });
  const path = sankeyLinkHorizontal();
  let body = "";
  for (const l of ls) body += `<path d="${path(l)}" fill="none" stroke="${l.from === 3 ? "currentColor" : S(l.from + 1)}" stroke-opacity="${l.from === 3 ? 0.2 : 0.4}" stroke-width="${r(Math.max(1, l.width))}"/>`;
  for (const n of ns) {
    body += `<path d="M${r(n.x0)},${r(n.y0)}H${r(n.x1)}V${r(n.y1)}H${r(n.x0)}z" fill="${n.name === "Churned" ? "currentColor" : S(names.indexOf(n.name) + 1)}"${n.name === "Churned" ? ' fill-opacity="0.5"' : ""}/>`;
    body += T(n.stage === 2 ? n.x0 - 6 : n.x1 + 6, (n.y0 + n.y1) / 2, `${n.name} ${n.value}`, n.stage === 2 ? "end" : "start");
  }
  // Every flow carries its count on its band, midway between the stages. Labels in one column are spread 12 px apart.
  for (const st of [0, 1]) {
    const col = ls.filter((l: any) => l.source.stage === st).map((l: any) => ({ x: (l.source.x1 + l.target.x0) / 2, y: (l.y0 + l.y1) / 2, v: l.value }));
    col.sort((a: any, b: any) => a.y - b.y);
    col.forEach((c: any, i: number) => { if (i && c.y < col[i - 1].y + 12) c.y = col[i - 1].y + 12; });
    for (const c of col) body += T(c.x, c.y, String(c.v), "middle");
  }
  stages.forEach((s, i) => (body += T(i === 0 ? 10 : i === 1 ? 300 : 590, 8, s, i === 0 ? "start" : i === 1 ? "middle" : "end", true)));
  return svg(244, "Customers moving between plans and churn, January to July: Free loses the most to churn.", body, 600);
}
```
