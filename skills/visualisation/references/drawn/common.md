# Helpers for the drawn forms

Every file in this directory builds its SVG with these helpers. Save the block as `common.ts` beside the script that draws the chart, and import the names you use from it. The imports are pinned: `d3-scale@4.0.2`, `d3-shape@3.2.0` (`digits(1)` needs 3.2.0 or later) and `d3-array@3.2.4` match the versions `scripts/chart.ts` uses. Run a script with `deno run -A script.ts`, because Deno fetches the packages from npm.

`S(n)` is series slot n from the `dataviz` palette, and `Q(step)` a step of its sequential blue ramp. The page defines `--series-N` and `--seq-STEP`; the second argument is the light-mode fallback, so the SVG is right even where the page defines neither.

Every example is a function that returns the SVG text. `lcg` seeds the random numbers, so an example draws the same each time.

```ts
import { scaleLinear } from "npm:d3-scale@4.0.2";
import { area, line } from "npm:d3-shape@3.2.0";
import { bin, extent, max, mean, quantile } from "npm:d3-array@3.2.4";

export { area, bin, extent, line, max, mean, quantile, scaleLinear };

const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const RAMP: Record<number, string> = { 100: "#cde2fb", 250: "#86b6ef", 400: "#3987e5", 550: "#1c5cab", 700: "#0d366b" };

/** Series colour for slot n (1 to 8), themed by the page's --series-N. */
export const S = (n: number) => `var(--series-${n}, ${SERIES[n - 1]})`;
/** Sequential blue step, themed by the page's --seq-STEP. */
export const Q = (step: number) => `var(--seq-${step}, ${RAMP[step]})`;
export const r = (n: number) => +n.toFixed(2);
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Text in the text colour. `a` is the anchor; `dim` softens secondary text. */
export const T = (x: number, y: number, s: string, a: "start" | "middle" | "end" = "start", dim = false) =>
  `<text x="${r(x)}" y="${r(y)}"${a === "start" ? "" : ` text-anchor="${a}"`} dy="0.32em"${dim ? ' fill-opacity="0.7"' : ""}>${esc(s)}</text>`;
/** A straight line in the text colour at half strength. */
export const L = (x1: number, y1: number, x2: number, y2: number, o = 0.5, w = 1) =>
  `<path d="M${r(x1)},${r(y1)}L${r(x2)},${r(y2)}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-opacity="${o}"/>`;
export const svg = (h: number, label: string, body: string, w = 640) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" font-size="11" fill="currentColor">${body}</svg>`;
/** A small deterministic random generator, so an example draws the same each run. */
export const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
/** Normal variate from two uniforms. */
export const gauss = (rnd: () => number) => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
```
