/**
 * Static SVG charts in four Tufte forms. The interface comes
 * first in this file and the implementation follows `render`.
 *
 * Command line: `deno run chart.ts < spec.json > chart.svg`. A refused spec
 * writes nothing to stdout, prints `<code>: <message>` to stderr and exits 2.
 * Input that is not JSON is refused the same way, with code `invalid_spec`.
 * Other code imports `render` and nothing else.
 *
 * Libraries (see /evals/visualisation-helper-library): d3-scale 4.0.2,
 * d3-shape 3.2.0 and d3-array 3.2.4. No type or format string from them
 * appears in the interface, so the choice can change without changing a spec.
 */

import { scaleLinear } from "npm:d3-scale@4.0.2";
import { line as d3line } from "npm:d3-shape@3.2.0";
import { extent } from "npm:d3-array@3.2.4";

/** One record of the input table. Column values are read by name. */
export type Row = Readonly<Record<string, string | number | null>>;

/**
 * A column name in `rows`. The alias exists so a spec reads as documentation;
 * `render` checks that every named column exists in every row.
 */
export type Column = string;

/**
 * A value of the `x` column.
 *
 * In `sparkline`, `line` and `multiples`, `x` is a position on a continuous
 * scale. Every value is a finite number, or every value is an ISO 8601 date
 * string: `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, or a date-time with `Z` or an
 * offset. Dates are read as UTC. One spec never mixes numbers and dates.
 *
 * In `slope`, `x` names one of the two positions and can be any string or
 * number.
 *
 * Where the chart prints an `x` value, it prints the value as the row wrote
 * it. The helper never reformats `x`.
 */
export type XValue = string | number;

/** The data point at one `x` value of a chart that draws one line. */
export interface Point {
  x: XValue;
}

/** The data point at one `x` value of one series. */
export interface SeriesPoint extends Point {
  /** A value of the spec's `series` column. */
  series: string;
}

/**
 * A sentence written next to one data point. The text is plain, drawn with no
 * box, and is limited to `MAX_ANNOTATION_CHARS` characters. `at` must match
 * exactly one row. The helper chooses where the text goes and adds a thin
 * leader line only when it must move the text away from the point.
 */
export interface Annotation<At extends Point = Point> {
  at: At;
  /** The finding, as a sentence. It is not a caption or a value label. */
  text: string;
}

/** The most characters an annotation's `text` may hold. */
export const MAX_ANNOTATION_CHARS = 80;

/**
 * The most series a `line` chart draws. The `dataviz` palette has this many
 * categorical colours and a ninth is never generated.
 */
export const MAX_LINE_SERIES = 8;

/**
 * How the chart prints `y` values. It applies to every printed value: end
 * labels, extremes and the range frame. Digits are grouped in threes with a
 * comma, and the decimal mark is a point.
 */
export interface NumberFormat {
  /**
   * Digits after the decimal point, 0 to 6. Default: the fewest digits, at
   * most 2, that print the data's minimum and maximum as different numbers and
   * print no other shown value (a last value, a slope end) the same as either.
   */
  decimals?: number;
  /** Text before each number, such as `"$"`. Default none. */
  prefix?: string;
  /** Text after each number, such as `"%"` or `" ms"`. Default none. */
  suffix?: string;
}

/** Fields every form accepts. A field that no form declares is refused. */
interface BaseSpec {
  /**
   * The table to draw, in any row order. Each line needs at least two rows,
   * and no two rows of one line share an `x` value.
   */
  rows: readonly Row[];
  /** Column on the horizontal axis. See `XValue` for what it may hold. */
  x: Column;
  /** Column on the vertical axis. Every value must be a finite number. */
  y: Column;
  /**
   * The finding the chart shows, as a non-empty sentence. It becomes the
   * root's `aria-label` and is not drawn. The page's prose or an annotation
   * states it for readers who see the chart.
   */
  finding: string;
  /**
   * Output width in SVG user units, at least 40. Height follows from the
   * form. Default 640, or 160 for a sparkline.
   */
  width?: number;
  /** How `y` values are printed. */
  yFormat?: NumberFormat;
  /**
   * Two values, lower first, that the y scale must include. The scale is the
   * data's minimum to maximum, widened to hold both values, so data is never
   * cut off. Use it to draw zero, or to give two charts on one page the same
   * scale. Default: the data's minimum and maximum.
   */
  yRange?: readonly [number, number];
}

/** One small line with no axes and the last value printed after it. */
export interface SparklineSpec extends BaseSpec {
  form: "sparkline";
  /** Mark the minimum and maximum points and print their values. Default true. */
  extremes?: boolean;
  /** Inline findings placed beside their points. Default none. */
  annotations?: readonly Annotation<Point>[];
}

/**
 * Fields of both kinds of line chart. The y axis is a range frame: a line
 * spanning the y scale's minimum to maximum with those two values as its only
 * labels. The x axis is a range frame in the same way.
 */
interface LineBase extends BaseSpec {
  form: "line";
}

/** One line. It carries no name, because `finding` says what it is. */
export interface OneLineSpec extends LineBase {
  series?: never;
  annotations?: readonly Annotation<Point>[];
}

/**
 * Several lines on one scale, at most `MAX_LINE_SERIES`. Each series is named
 * at the end of its line. Colours are assigned in the order series first
 * appear in `rows`.
 */
export interface ManyLinesSpec extends LineBase {
  /** Column that names the series. Every value must be a string. */
  series: Column;
  annotations?: readonly Annotation<SeriesPoint>[];
}

/** A line chart. Naming a `series` column selects several lines. */
export type LineSpec = OneLineSpec | ManyLinesSpec;

/**
 * One panel per series, in a grid, on shared x and y scales. Each panel is a
 * sparkline-sized line titled with its series name and last value. Panels are
 * in the order series first appear in `rows`. Every panel is one colour.
 */
export interface MultiplesSpec extends BaseSpec {
  form: "multiples";
  /** Column that names the series. Every value must be a string. */
  series: Column;
  /**
   * Panels per row, a whole number of at least 1. Default: the largest count
   * that keeps panels at least 120 units wide.
   */
  columns?: number;
  annotations?: readonly Annotation<SeriesPoint>[];
}

/**
 * Two vertical positions joined by one line per series. `x` must hold exactly
 * two distinct values, and every series needs one row at each. The value that
 * appears first in `rows` is the left position. Each line is labelled with
 * its series name and value at both ends. Height grows with the number of
 * series so that the labels fit, and every line is one colour.
 */
export interface SlopeSpec extends BaseSpec {
  form: "slope";
  /** Column that names the series. Every value must be a string. */
  series: Column;
  annotations?: readonly Annotation<SeriesPoint>[];
}

/** Every spec the helper accepts. `form` selects the member. */
export type ChartSpec = SparklineSpec | LineSpec | MultiplesSpec | SlopeSpec;

/**
 * Why a spec was refused. Each code has one recovery, and the message states
 * it with the offending field, row or series.
 */
export type ChartErrorCode =
  /**
   * The input is not JSON, or a spec field is missing, of the wrong type, out
   * of its stated bounds, or not a field of the form. Recovery: correct the
   * field the message names; the message lists what the field accepts.
   */
  | "invalid_spec"
  /**
   * `rows` is empty, or a line has fewer than two rows. Recovery: supply more
   * rows, or state the value in a sentence and draw no chart.
   */
  | "too_few_rows"
  /** A named column is absent from a row. Recovery: add it or fix the name. */
  | "missing_column"
  /**
   * A cell holds a value its column cannot take: a `y` that is not a finite
   * number, an `x` that is neither a number nor an ISO date or that mixes the
   * two, or a `series` that is not a string. Recovery: fix or drop the row.
   */
  | "invalid_value"
  /**
   * Two rows of one line share an `x` value. Recovery: aggregate the rows so
   * each line has one row per `x`.
   */
  | "duplicate_point"
  /**
   * A slope's `x` does not hold exactly two distinct values, or a series
   * lacks a row at one of them. Recovery: give every series one row at each
   * of two `x` values.
   */
  | "slope_needs_two_positions"
  /** An annotation's `at` matches no row. Recovery: copy `at` from a row. */
  | "annotation_matches_no_row"
  /** An annotation's `text` exceeds `MAX_ANNOTATION_CHARS`. Recovery: shorten it. */
  | "annotation_too_long"
  /**
   * An annotation cannot be placed without covering data or another label.
   * Recovery: remove the annotation the message names, or raise `width`.
   */
  | "annotation_does_not_fit"
  /**
   * A `line` chart has more than `MAX_LINE_SERIES` series. Recovery: use
   * `multiples`.
   */
  | "too_many_series"
  /**
   * A `line` chart's end-of-line labels still collide after layout, or the
   * label of a series that ends early has no free place. Recovery: use
   * `multiples`, or supply rows up to the common last `x`.
   */
  | "labels_collide";

/**
 * The only error `render` throws for a refused spec. `message` alone is
 * enough to correct the spec; `code` and `row` exist for tests and callers
 * that branch.
 */
export class ChartError extends Error {
  readonly code: ChartErrorCode;
  /** Zero-based index of the first offending row, when the error has one. */
  readonly row: number | undefined;

  constructor(code: ChartErrorCode, message: string, row?: number) {
    super(message);
    this.name = "ChartError";
    this.code = code;
    this.row = row;
  }
}

/**
 * Draw `spec` as one SVG fragment.
 *
 * `render` checks the spec at run time as if it were untyped, so a spec read
 * from JSON gets the same checks as one the compiler saw. The whole spec is
 * checked before any drawing, so a thrown `ChartError` means nothing was
 * produced.
 *
 * The output:
 * - is one `<svg>` element with a `viewBox`, `role="img"` and an `aria-label`
 *   equal to `spec.finding`;
 * - draws text and axes in `currentColor` and inherits the page's font;
 * - draws series lines in `var(--series-N, <fallback>)`, where N counts from
 *   1 and the fallback is the `dataviz` palette's light value, and never
 *   colours text with a series colour;
 * - contains no `<script>`, `<style>` or `<foreignObject>` and no `id`
 *   attribute, so it is safe under a content security policy with no scripts
 *   and several charts can share one page;
 * - escapes every string taken from the spec, so no spec value can add markup;
 * - is the same text for the same spec, byte for byte.
 *
 * @throws {ChartError} when the spec is refused.
 */
export function render(spec: ChartSpec): string {
  return renderUnknown(spec);
}

/** `render` for a value of unknown type, such as parsed JSON. */
function renderUnknown(spec: unknown): string {
  const model = parse(spec);
  switch (model.form) {
    case "sparkline":
      return drawSparkline(model);
    case "line":
      return drawLine(model);
    case "multiples":
      return drawMultiples(model);
    case "slope":
      return drawSlope(model);
  }
}

// Validation ---------------------------------------------------------------

type Obj = Record<string, unknown>;

interface Pt {
  /** Position on the scale: a number, a date in milliseconds, or 0 or 1 in a slope. */
  x: number;
  /** The x cell as the row wrote it. */
  raw: string | number;
  y: number;
  row: number;
}

interface Series {
  name: string | null;
  pts: Pt[];
}

interface Note {
  series: string | null;
  pt: Pt;
  text: string;
}

interface Model {
  form: "sparkline" | "line" | "multiples" | "slope";
  finding: string;
  width: number | undefined;
  fmt: NumberFormat;
  yRange: readonly [number, number] | undefined;
  extremes: boolean;
  columns: number | undefined;
  lines: Series[];
  notes: Note[];
  /** For a slope: the two positions as written, left first. */
  positions: [string | number, string | number] | undefined;
}

const FORMS: Model["form"][] = ["sparkline", "line", "multiples", "slope"];
const BASE_KEYS = [
  "form",
  "rows",
  "x",
  "y",
  "finding",
  "width",
  "yFormat",
  "yRange",
  "annotations",
];
const EXTRA_KEYS: Record<string, string[]> = {
  sparkline: ["extremes"],
  line: ["series"],
  multiples: ["series", "columns"],
  slope: ["series"],
};

function fail(code: ChartErrorCode, message: string, row?: number): never {
  throw new ChartError(code, message, row);
}

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isForm(v: unknown): v is Model["form"] {
  return v === "sparkline" || v === "line" || v === "multiples" ||
    v === "slope";
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function checkKeys(o: Obj, allowed: string[], where: string): void {
  for (const k of Object.keys(o)) {
    if (!allowed.includes(k)) {
      fail(
        "invalid_spec",
        `${where} has the unknown field "${k}". It accepts: ${
          allowed.join(", ")
        }.`,
      );
    }
  }
}

const ISO =
  /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?)?)?$/;

/** Milliseconds since the epoch for an ISO 8601 string, or undefined. */
function parseDate(s: string): number | undefined {
  const m = ISO.exec(s);
  if (!m) return undefined;
  const [year, month, day, hour, minute, second] = [
    Number(m[1]),
    Number(m[2] ?? 1),
    Number(m[3] ?? 1),
    Number(m[4] ?? 0),
    Number(m[5] ?? 0),
    Number(m[6] ?? 0),
  ];
  if (hour > 23 || minute > 59 || second > 59) return undefined;
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, minute, second, 0);
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return undefined;
  let ms = d.getTime();
  const zone = m[7];
  if (zone && zone !== "Z") {
    const sign = zone.startsWith("-") ? -1 : 1;
    ms -= sign * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4, 6))) *
      60000;
  }
  return ms;
}

function parse(input: unknown): Model {
  if (!isObj(input)) {
    fail(
      "invalid_spec",
      "The spec must be a JSON object with a form and rows.",
    );
  }
  const form = input.form;
  if (!isForm(form)) {
    fail(
      "invalid_spec",
      `"form" must be one of ${FORMS.join(", ")}; got ${JSON.stringify(form)}.`,
    );
  }
  checkKeys(input, [...BASE_KEYS, ...EXTRA_KEYS[form]], `A ${form} spec`);
  for (const k of ["x", "y"]) {
    if (typeof input[k] !== "string" || input[k] === "") {
      fail("invalid_spec", `"${k}" must name a column, as a non-empty string.`);
    }
  }
  if (typeof input.finding !== "string" || input.finding.trim() === "") {
    fail("invalid_spec", `"finding" must be a non-empty sentence.`);
  }
  const hasSeries = form !== "sparkline" && input.series !== undefined;
  if (form === "multiples" || form === "slope") {
    if (typeof input.series !== "string" || input.series === "") {
      fail(
        "invalid_spec",
        `A ${form} spec needs "series", the name of a column.`,
      );
    }
  } else if (
    input.series !== undefined &&
    (typeof input.series !== "string" || input.series === "")
  ) {
    fail("invalid_spec", `"series" must name a column, as a non-empty string.`);
  }
  let width: number | undefined;
  if (input.width !== undefined) {
    if (!isNum(input.width) || input.width < 40) {
      fail("invalid_spec", `"width" must be a number of at least 40.`);
    }
    width = input.width;
  }
  const fmt = parseFormat(input.yFormat);
  let yRange: readonly [number, number] | undefined;
  if (input.yRange !== undefined) {
    const r = input.yRange;
    if (
      !Array.isArray(r) || r.length !== 2 || !isNum(r[0]) || !isNum(r[1]) ||
      r[0] > r[1]
    ) {
      fail("invalid_spec", `"yRange" must be two numbers, the lower first.`);
    }
    yRange = [r[0], r[1]];
  }
  if (input.extremes !== undefined && typeof input.extremes !== "boolean") {
    fail("invalid_spec", `"extremes" must be true or false.`);
  }
  let columns: number | undefined;
  if (input.columns !== undefined) {
    if (
      !isNum(input.columns) || !Number.isInteger(input.columns) ||
      input.columns < 1
    ) {
      fail("invalid_spec", `"columns" must be a whole number of at least 1.`);
    }
    columns = input.columns;
  }

  const xCol = String(input.x);
  const yCol = String(input.y);
  const sCol = hasSeries || form === "multiples" || form === "slope"
    ? String(input.series)
    : undefined;
  const rows = input.rows;
  if (!Array.isArray(rows)) {
    fail("invalid_spec", `"rows" must be an array of objects.`);
  }
  if (rows.length === 0) {
    fail(
      "too_few_rows",
      "rows is empty. Supply rows, or state the finding in a sentence and draw no chart.",
    );
  }

  const byName = new Map<string, Series>();
  let kind: "number" | "date" | undefined;
  rows.forEach((row: unknown, i: number) => {
    if (!isObj(row)) fail("invalid_spec", `rows[${i}] must be an object.`, i);
    for (const col of [xCol, yCol, ...(sCol ? [sCol] : [])]) {
      if (!Object.hasOwn(row, col)) {
        fail(
          "missing_column",
          `rows[${i}] has no column "${col}". Add it, or change the spec to name an existing column.`,
          i,
        );
      }
    }
    const y = row[yCol];
    if (!isNum(y)) {
      fail(
        "invalid_value",
        `rows[${i}].${yCol} is ${
          JSON.stringify(y)
        }; y must be a finite number. Fix or drop the row.`,
        i,
      );
    }
    let name: string | null = null;
    if (sCol) {
      const s = row[sCol];
      if (typeof s !== "string") {
        fail(
          "invalid_value",
          `rows[${i}].${sCol} is ${
            JSON.stringify(s)
          }; a series must be a string. Fix or drop the row.`,
          i,
        );
      }
      name = s;
    }
    const raw = row[xCol];
    let x: number;
    if (form === "slope") {
      if (!(isNum(raw) || typeof raw === "string")) {
        fail(
          "invalid_value",
          `rows[${i}].${xCol} is ${
            JSON.stringify(raw)
          }; a slope position must be a string or a number.`,
          i,
        );
      }
      x = 0;
    } else if (isNum(raw)) {
      if (kind === "date") mixed(i, xCol);
      kind = "number";
      x = raw;
    } else if (typeof raw === "string") {
      const ms = parseDate(raw);
      if (ms === undefined) {
        fail(
          "invalid_value",
          `rows[${i}].${xCol} is ${
            JSON.stringify(raw)
          }, which is neither a number nor an ISO 8601 date with a zone when it has a time. Fix or drop the row.`,
          i,
        );
      }
      if (kind === "number") mixed(i, xCol);
      kind = "date";
      x = ms;
    } else {
      fail(
        "invalid_value",
        `rows[${i}].${xCol} is ${
          JSON.stringify(raw)
        }; x must be a number or an ISO 8601 date string.`,
        i,
      );
    }
    const key = name ?? "";
    let line = byName.get(key);
    if (!line) {
      line = { name, pts: [] };
      byName.set(key, line);
    }
    line.pts.push({ x, raw, y, row: i });
  });

  const lines = [...byName.values()];
  let positions: Model["positions"];

  // Duplicate points come before the checks that count rows or positions.
  for (const l of lines) {
    const seen = new Set<string>();
    for (const p of l.pts) {
      const k = form === "slope" ? `${typeof p.raw}:${p.raw}` : String(p.x);
      if (seen.has(k)) {
        fail(
          "duplicate_point",
          `rows[${p.row}] repeats x=${JSON.stringify(p.raw)}${
            l.name ? ` in series "${l.name}"` : ""
          }. Aggregate the rows so each line has one row per x.`,
          p.row,
        );
      }
      seen.add(k);
    }
  }

  if (form === "slope") {
    const keys: string[] = [];
    const raws: (string | number)[] = [];
    for (const l of lines) {
      for (const p of l.pts) {
        const k = `${typeof p.raw}:${p.raw}`;
        if (!keys.includes(k)) {
          keys.push(k);
          raws.push(p.raw);
        }
      }
    }
    if (keys.length !== 2) {
      fail(
        "slope_needs_two_positions",
        `x holds ${keys.length} distinct values; a slope needs exactly 2. Give every series one row at each of two x values.`,
      );
    }
    for (const l of lines) {
      if (l.pts.length !== 2) {
        fail(
          "slope_needs_two_positions",
          `Series "${l.name}" has a row at only one of the two x values. Give every series one row at each.`,
        );
      }
      for (const p of l.pts) p.x = keys.indexOf(`${typeof p.raw}:${p.raw}`);
      l.pts.sort((a, b) => a.x - b.x);
    }
    positions = [raws[0], raws[1]];
  } else {
    if (form === "line" && hasSeries && lines.length > MAX_LINE_SERIES) {
      fail(
        "too_many_series",
        `A line chart draws at most ${MAX_LINE_SERIES} series and this has ${lines.length}. Use form "multiples".`,
      );
    }
    for (const l of lines) {
      if (l.pts.length < 2) {
        fail(
          "too_few_rows",
          `${
            l.name ? `Series "${l.name}" has` : "The line has"
          } one row; a line needs at least two. Supply more rows, or state the value in a sentence.`,
        );
      }
      l.pts.sort((a, b) => a.x - b.x);
    }
  }

  const notes = parseNotes(input.annotations, lines, sCol !== undefined);
  return {
    form,
    finding: input.finding,
    width,
    fmt,
    yRange,
    extremes: input.extremes !== false,
    columns,
    lines,
    notes,
    positions,
  };
}

function mixed(i: number, col: string): never {
  return fail(
    "invalid_value",
    `rows[${i}].${col} mixes numbers and date strings in one x column. Use one kind throughout.`,
    i,
  );
}

function parseFormat(v: unknown): NumberFormat {
  if (v === undefined) return {};
  if (!isObj(v)) fail("invalid_spec", `"yFormat" must be an object.`);
  checkKeys(v, ["decimals", "prefix", "suffix"], `"yFormat"`);
  const out: NumberFormat = {};
  if (v.decimals !== undefined) {
    if (
      !isNum(v.decimals) || !Number.isInteger(v.decimals) || v.decimals < 0 ||
      v.decimals > 6
    ) {
      fail(
        "invalid_spec",
        `"yFormat.decimals" must be a whole number from 0 to 6.`,
      );
    }
    out.decimals = v.decimals;
  }
  const affixes: ("prefix" | "suffix")[] = ["prefix", "suffix"];
  for (const k of affixes) {
    const f = v[k];
    if (f !== undefined) {
      if (typeof f !== "string") {
        fail("invalid_spec", `"yFormat.${k}" must be a string.`);
      }
      out[k] = f;
    }
  }
  return out;
}

function parseNotes(v: unknown, lines: Series[], named: boolean): Note[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    fail("invalid_spec", `"annotations" must be an array.`);
  }
  return v.map((a: unknown, i: number) => {
    const where = `annotations[${i}]`;
    if (!isObj(a)) {
      fail("invalid_spec", `${where} must be an object with "at" and "text".`);
    }
    checkKeys(a, ["at", "text"], where);
    if (typeof a.text !== "string" || a.text === "") {
      fail("invalid_spec", `${where}.text must be a non-empty string.`);
    }
    const at = a.at;
    if (!isObj(at)) {
      fail("invalid_spec", `${where}.at must be an object with "x".`);
    }
    checkKeys(at, named ? ["x", "series"] : ["x"], `${where}.at`);
    if (!(isNum(at.x) || typeof at.x === "string")) {
      fail("invalid_spec", `${where}.at.x must be a string or a number.`);
    }
    if (named && typeof at.series !== "string") {
      fail(
        "invalid_spec",
        `${where}.at needs "series", because this chart has a series column.`,
      );
    }
    const count = [...a.text].length;
    if (count > MAX_ANNOTATION_CHARS) {
      fail(
        "annotation_too_long",
        `${where}.text has ${count} characters; the limit is ${MAX_ANNOTATION_CHARS}. Shorten it.`,
      );
    }
    const line = lines.find((l) =>
      (l.name ?? null) === (named ? at.series : null)
    );
    const pt = line?.pts.find((p) => p.raw === at.x);
    if (!line || !pt) {
      fail(
        "annotation_matches_no_row",
        `${where}.at matches no row (x=${JSON.stringify(at.x)}${
          named ? `, series=${JSON.stringify(at.series)}` : ""
        }). Copy "at" from a row.`,
      );
    }
    return { series: line.name, pt, text: a.text };
  });
}

// Numbers and text ---------------------------------------------------------

const FONT = 11;
const LINE_H = 13;
/** The dataviz categorical palette, light values, in slot order. */
const PALETTE = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
];

function color(i: number): string {
  return `var(--series-${i + 1}, ${PALETTE[i % PALETTE.length]})`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Estimated width of `s` in user units at the chart's font size. */
function tw(s: string): number {
  return Math.round([...s].length * FONT * 0.57 * 10) / 10;
}

function n(v: number): string {
  const r = Math.round(v * 100) / 100;
  return String(r === 0 ? 0 : r);
}

function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatNumber(v: number, fmt: NumberFormat, decimals: number): string {
  const fixed = Math.abs(v).toFixed(decimals);
  const [whole, frac] = fixed.split(".");
  const body = group(whole) + (frac ? `.${frac}` : "");
  const negative = v < 0 && Number(fixed) !== 0;
  return `${negative ? "-" : ""}${fmt.prefix ?? ""}${body}${fmt.suffix ?? ""}`;
}

/**
 * Digits, at most 2, that print `lo` and `hi` as different numbers and print
 * no other shown value the same as either of them.
 */
function defaultDecimals(lo: number, hi: number, shown: number[]): number {
  for (let d = 0; d < 2; d++) {
    const flo = formatNumber(lo, {}, d);
    const fhi = formatNumber(hi, {}, d);
    if (flo === fhi) continue;
    const clash = shown.some((v) => {
      if (v === lo || v === hi) return false;
      const f = formatNumber(v, {}, d);
      return f === flo || f === fhi;
    });
    if (!clash) return d;
  }
  return 2;
}

/** Minimum and maximum of a list that has at least one number. */
function span(values: number[]): [number, number] {
  const [lo, hi] = extent(values);
  if (lo === undefined || hi === undefined) {
    return fail("too_few_rows", "There are no values to draw.");
  }
  return [lo, hi];
}

interface Scale {
  lo: number;
  hi: number;
  label: (v: number) => string;
}

function yScale(m: Model): Scale {
  const ys = m.lines.flatMap((l) => l.pts.map((p) => p.y));
  let [lo, hi] = span(ys);
  if (m.yRange) {
    lo = Math.min(lo, m.yRange[0]);
    hi = Math.max(hi, m.yRange[1]);
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const shown = m.lines.flatMap((l) => {
    const first = l.pts[0].y;
    const last = l.pts[l.pts.length - 1].y;
    return m.form === "slope"
      ? [first, last]
      : [last, ...(m.form === "sparkline" ? span(l.pts.map((p) => p.y)) : [])];
  });
  const d = m.fmt.decimals ?? defaultDecimals(lo, hi, shown);
  return { lo, hi, label: (v) => formatNumber(v, m.fmt, d) };
}

function xDomain(lines: Series[]): [number, number] {
  return span(lines.flatMap((l) => l.pts.map((p) => p.x)));
}

// Drawing primitives -------------------------------------------------------

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

type Seg = [number, number, number, number];

function textEl(
  x: number,
  y: number,
  s: string,
  anchor: "start" | "middle" | "end" = "start",
  faint = false,
  centre = false,
): string {
  return `<text x="${n(x)}" y="${n(y)}"${
    anchor === "start" ? "" : ` text-anchor="${anchor}"`
  }${centre ? ` dy="0.32em"` : ""}${faint ? ` fill-opacity="0.7"` : ""}>${
    esc(s)
  }</text>`;
}

/** The box a text element occupies. `y` is the baseline unless `centre`. */
function textRect(
  x: number,
  y: number,
  s: string,
  anchor: "start" | "middle" | "end",
  centre = false,
): Rect {
  const w = tw(s);
  const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  const top = centre ? y - FONT / 2 : y - FONT + 2;
  return { x0, y0: top, x1: x0 + w, y1: top + FONT };
}

function pathEl(
  d: string,
  stroke: string,
  width: number,
  opacity?: number,
): string {
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}"${
    opacity ? ` stroke-opacity="${opacity}"` : ""
  }${
    stroke.startsWith("var")
      ? ` stroke-linejoin="round" stroke-linecap="round"`
      : ""
  }/>`;
}

function linePath(pts: [number, number][]): string {
  const gen = d3line<[number, number]>().digits(2);
  return gen(pts) ?? "";
}

function svgWrap(
  w: number,
  h: number,
  finding: string,
  body: string[],
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${
    n(h)
  }" role="img" aria-label="${
    esc(finding)
  }" font-size="${FONT}" fill="currentColor">${body.join("")}</svg>`;
}

function segsOf(pts: [number, number][]): Seg[] {
  const out: Seg[] = [];
  for (let i = 1; i < pts.length; i++) {
    out.push([pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]]);
  }
  return out;
}

/** Where annotations may go: inside `bounds`, clear of rects and line segments. */
class Placer {
  rects: Rect[] = [];
  segs: Seg[] = [];
  bounds: Rect;

  constructor(bounds: Rect) {
    this.bounds = bounds;
  }

  add(r: Rect): void {
    this.rects.push(r);
  }

  private hitsSeg(r: Rect): boolean {
    const pad = 1.5;
    for (const [ax, ay, bx, by] of this.segs) {
      const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 1.5) + 1;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = ax + (bx - ax) * t;
        const py = ay + (by - ay) * t;
        if (
          px >= r.x0 - pad && px <= r.x1 + pad && py >= r.y0 - pad &&
          py <= r.y1 + pad
        ) {
          return true;
        }
      }
    }
    return false;
  }

  fits(r: Rect): boolean {
    const b = this.bounds;
    if (r.x0 < b.x0 || r.x1 > b.x1 || r.y0 < b.y0 || r.y1 > b.y1) return false;
    for (const o of this.rects) {
      if (
        r.x0 < o.x1 + 1 && r.x1 > o.x0 - 1 && r.y0 < o.y1 + 1 && r.y1 > o.y0 - 1
      ) {
        return false;
      }
    }
    return !this.hitsSeg(r);
  }

  /** Draw `text` beside (px, py), or return undefined when nothing fits. */
  place(px: number, py: number, text: string): string | undefined {
    const w = tw(text);
    const h = FONT;
    for (const d of [6, 18, 32]) {
      const spots: {
        x0: number;
        y1: number;
        anchor: "start" | "middle" | "end";
      }[] = [
        { x0: px - w / 2, y1: py - d, anchor: "middle" },
        { x0: px - 2, y1: py - d, anchor: "start" },
        { x0: px - w + 2, y1: py - d, anchor: "end" },
        { x0: px - w / 2, y1: py + d + h, anchor: "middle" },
        { x0: px - 2, y1: py + d + h, anchor: "start" },
        { x0: px - w + 2, y1: py + d + h, anchor: "end" },
        { x0: px + d, y1: py + h / 2, anchor: "start" },
        { x0: px - d - w, y1: py + h / 2, anchor: "end" },
      ];
      for (const s of spots) {
        const rect: Rect = { x0: s.x0, x1: s.x0 + w, y0: s.y1 - h, y1: s.y1 };
        if (!this.fits(rect)) continue;
        this.add(rect);
        const tx = s.anchor === "start"
          ? rect.x0
          : s.anchor === "end"
          ? rect.x1
          : (rect.x0 + rect.x1) / 2;
        const ty = rect.y1 - 2;
        const out: string[] = [];
        if (d > 6) {
          const ex = Math.min(Math.max(px, rect.x0), rect.x1);
          const ey = py < rect.y0
            ? rect.y0
            : py > rect.y1
            ? rect.y1
            : (rect.y0 + rect.y1) / 2;
          out.push(
            pathEl(
              `M${n(px)},${n(py)}L${n(ex)},${n(ey)}`,
              "currentColor",
              0.75,
              0.5,
            ),
          );
        }
        out.push(textEl(tx, ty, text, s.anchor));
        return out.join("");
      }
    }
    return undefined;
  }
}

function drawNotes(
  placer: Placer,
  notes: Note[],
  at: (n: Note) => [number, number],
): string[] {
  const out: string[] = [];
  for (const note of notes) {
    const [px, py] = at(note);
    const s = placer.place(px, py, note.text);
    if (!s) {
      fail(
        "annotation_does_not_fit",
        `The annotation "${note.text}" cannot be placed without covering data or another label. Remove it, or raise width.`,
      );
    }
    out.push(s);
  }
  return out;
}

/**
 * Spread label positions at least `gap` apart, keeping their order. Returns
 * undefined when they cannot fit between `lo` and `hi`.
 */
function spread(
  ideal: number[],
  gap: number,
  lo: number,
  hi: number,
): number[] | undefined {
  const order = ideal.map((_, i) => i).sort((a, b) =>
    ideal[a] - ideal[b] || a - b
  );
  const pos = order.map((i) => Math.max(ideal[i], lo));
  for (let i = 1; i < pos.length; i++) {
    pos[i] = Math.max(pos[i], pos[i - 1] + gap);
  }
  if (pos.length && pos[pos.length - 1] > hi) {
    pos[pos.length - 1] = hi;
    for (let i = pos.length - 2; i >= 0; i--) {
      pos[i] = Math.min(pos[i], pos[i + 1] - gap);
    }
    if (pos[0] < lo - 1e-9) return undefined;
  }
  const out: number[] = [];
  order.forEach((idx, k) => (out[idx] = pos[k]));
  return out;
}

// Sparkline ----------------------------------------------------------------

function drawSparkline(m: Model): string {
  const W = m.width ?? 160;
  const withNotes = m.notes.length > 0;
  const H = withNotes ? 72 : 40;
  const pad = withNotes ? 28 : 14;
  const ys = yScale(m);
  const pts = m.lines[0].pts;
  const last = pts[pts.length - 1];
  const lastLabel = ys.label(last.y);
  const x0 = 4;
  const x1 = W - tw(lastLabel) - 10;
  if (x1 - x0 < 20) {
    fail(
      "invalid_spec",
      `width ${W} is too small for the last value's label. Raise it to at least ${
        Math.ceil(W + 20 - (x1 - x0))
      }.`,
    );
  }
  const [dx0, dx1] = xDomain(m.lines);
  const sx = scaleLinear().domain([dx0, dx1]).range([x0, x1]);
  const sy = scaleLinear().domain([ys.lo, ys.hi]).range([H - pad, pad]);
  const xy = pts.map((p): [number, number] => [sx(p.x), sy(p.y)]);
  const body: string[] = [pathEl(linePath(xy), color(0), 1.5)];
  const placer = new Placer({ x0: 0, y0: 0, x1: W, y1: H });
  placer.segs = segsOf(xy);
  const lx = xy[xy.length - 1][0] + 6;
  const ly = xy[xy.length - 1][1];
  body.push(textEl(lx, ly, lastLabel, "start", false, true));
  placer.add(textRect(lx, ly, lastLabel, "start", true));
  if (m.extremes) {
    let lo = 0;
    let hi = 0;
    pts.forEach((p, i) => {
      if (p.y < pts[lo].y) lo = i;
      if (p.y > pts[hi].y) hi = i;
    });
    const marks = lo === hi ? [hi] : [hi, lo];
    for (const i of marks) {
      const [px, py] = xy[i];
      body.push(
        `<circle cx="${n(px)}" cy="${n(py)}" r="2" fill="${
          color(0)
        }" stroke="none"/>`,
      );
      // The last point already prints its value after the line.
      if (i === pts.length - 1) continue;
      const label = ys.label(pts[i].y);
      const w = tw(label);
      const tx = Math.min(Math.max(px, w / 2), W - w / 2);
      const above = i === hi;
      const ty = above ? py - 5 : py + FONT + 1;
      body.push(textEl(tx, ty, label, "middle", true));
      placer.add(textRect(tx, ty, label, "middle"));
    }
  }
  body.push(...drawNotes(placer, m.notes, (note) => {
    const i = pts.indexOf(note.pt);
    return xy[i];
  }));
  return svgWrap(W, H, m.finding, body);
}

// Line ---------------------------------------------------------------------

function drawLine(m: Model): string {
  const W = m.width ?? 640;
  const H = Math.max(80, Math.round(W * 0.3));
  const ys = yScale(m);
  const many = m.lines[0].name !== null;
  const loLabel = ys.label(ys.lo);
  const hiLabel = ys.label(ys.hi);
  const leftM = Math.max(tw(loLabel), tw(hiLabel)) + 12;
  const rightM = many
    ? Math.max(...m.lines.map((l) => tw(l.name ?? ""))) + 14
    : 8;
  const top = 12;
  const bottom = 28;
  const x0 = leftM + 8;
  const x1 = W - rightM;
  if (x1 - x0 < 40) {
    fail(
      "invalid_spec",
      `width ${W} is too small for these labels. Raise it to at least ${
        Math.ceil(W + 40 - (x1 - x0))
      }.`,
    );
  }
  const y0 = top;
  const y1 = H - bottom;
  const [dx0, dx1] = xDomain(m.lines);
  const sx = scaleLinear().domain([dx0, dx1]).range([x0, x1]);
  const sy = scaleLinear().domain([ys.lo, ys.hi]).range([y1, y0]);
  const body: string[] = [];
  const placer = new Placer({ x0: 0, y0: 0, x1: W, y1: H });

  // Range frame: each axis spans the scale's minimum to maximum.
  const ax = leftM + 2;
  body.push(
    pathEl(`M${n(ax)},${n(sy(ys.lo))}V${n(sy(ys.hi))}`, "currentColor", 1, 0.5),
  );
  body.push(textEl(ax - 4, sy(ys.hi), hiLabel, "end", true, true));
  body.push(textEl(ax - 4, sy(ys.lo), loLabel, "end", true, true));
  placer.add(textRect(ax - 4, sy(ys.hi), hiLabel, "end", true));
  placer.add(textRect(ax - 4, sy(ys.lo), loLabel, "end", true));
  const first = m.lines.flatMap((l) => l.pts).reduce((
    a,
    p,
  ) => (p.x < a.x ? p : a));
  const lastX = m.lines.flatMap((l) => l.pts).reduce((
    a,
    p,
  ) => (p.x > a.x ? p : a));
  const axisY = y1 + 10;
  body.push(
    pathEl(`M${n(sx(dx0))},${n(axisY)}H${n(sx(dx1))}`, "currentColor", 1, 0.5),
  );
  const fl = String(first.raw);
  const ll = String(lastX.raw);
  body.push(textEl(sx(dx0), axisY + 13, fl, "start", true));
  body.push(textEl(sx(dx1), axisY + 13, ll, "end", true));
  placer.add(textRect(sx(dx0), axisY + 13, fl, "start"));
  placer.add(textRect(sx(dx1), axisY + 13, ll, "end"));

  const xyAll = m.lines.map((l) =>
    l.pts.map((p): [number, number] => [sx(p.x), sy(p.y)])
  );
  m.lines.forEach((_l, i) => {
    body.push(pathEl(linePath(xyAll[i]), color(i), 1.5));
    placer.segs.push(...segsOf(xyAll[i]));
  });

  if (many) {
    // Series that reach the last x share one column of labels, spread apart.
    // A series that stops earlier gets its label beside its own end, placed
    // clear of the lines and labels already drawn.
    const ends = xyAll.map((xy) => xy[xy.length - 1]);
    const full = m.lines.map((l) => l.pts[l.pts.length - 1].x === dx1);
    const idx = m.lines.map((_l, i) => i).filter((i) => full[i]);
    const slots = spread(idx.map((i) => ends[i][1]), LINE_H, y0 - 4, y1 + 4);
    if (!slots) {
      fail(
        "labels_collide",
        `The ${idx.length} end-of-line labels do not fit without overlapping. Use form "multiples".`,
      );
    }
    idx.forEach((i, k) => {
      const [px, py] = ends[i];
      const ly = slots[k];
      const name = m.lines[i].name ?? "";
      if (Math.abs(ly - py) > 3) {
        body.push(
          pathEl(
            `M${n(px + 1)},${n(py)}L${n(px + 5)},${n(ly)}`,
            "currentColor",
            0.75,
            0.5,
          ),
        );
      }
      body.push(textEl(px + 7, ly, name, "start", false, true));
      placer.add(textRect(px + 7, ly, name, "start", true));
    });
    m.lines.forEach((l, i) => {
      if (full[i]) return;
      const [px, py] = ends[i];
      const s = placer.place(px, py, l.name ?? "");
      if (!s) {
        fail(
          "labels_collide",
          `The label for series "${l.name}", which ends before the others, cannot be placed without covering a line or a label. Supply rows to the common last x, or use form "multiples".`,
        );
      }
      body.push(s);
    });
  }

  body.push(...drawNotes(placer, m.notes, (note) => {
    const li = m.lines.findIndex((l) => l.name === note.series);
    const pi = m.lines[li].pts.indexOf(note.pt);
    return xyAll[li][pi];
  }));
  return svgWrap(W, H, m.finding, body);
}

// Small multiples ----------------------------------------------------------

function drawMultiples(m: Model): string {
  const W = m.width ?? 640;
  const gap = 14;
  const count = m.lines.length;
  const cols = Math.min(
    m.columns ?? Math.max(1, Math.floor((W + gap) / (120 + gap))),
    count,
  );
  const pw = (W - (cols - 1) * gap) / cols;
  if (pw < 40) {
    fail(
      "invalid_spec",
      `width ${W} is too small for ${cols} columns. Raise width or lower columns.`,
    );
  }
  const ph = 68;
  const rows = Math.ceil(count / cols);
  const H = rows * ph + (rows - 1) * 10;
  const ys = yScale(m);
  const [dx0, dx1] = xDomain(m.lines);
  const body: string[] = [];
  m.lines.forEach((l, i) => {
    const ox = (i % cols) * (pw + gap);
    const oy = Math.floor(i / cols) * (ph + 10);
    const sx = scaleLinear().domain([dx0, dx1]).range([ox + 3, ox + pw - 3]);
    const sy = scaleLinear().domain([ys.lo, ys.hi]).range([
      oy + ph - 5,
      oy + 24,
    ]);
    const xy = l.pts.map((p): [number, number] => [sx(p.x), sy(p.y)]);
    const title = `${l.name} ${ys.label(l.pts[l.pts.length - 1].y)}`;
    body.push(textEl(ox, oy + 11, title, "start"));
    body.push(pathEl(linePath(xy), color(0), 1.5));
    const placer = new Placer({ x0: ox, y0: oy, x1: ox + pw, y1: oy + ph });
    placer.segs = segsOf(xy);
    placer.add(textRect(ox, oy + 11, title, "start"));
    const mine = m.notes.filter((note) => note.series === l.name);
    body.push(...drawNotes(placer, mine, (note) => xy[l.pts.indexOf(note.pt)]));
  });
  const pts = m.lines.flatMap((l) => l.pts);
  const firstX = pts.reduce((a, p) => (p.x < a.x ? p : a));
  const lastX = pts.reduce((a, p) => (p.x > a.x ? p : a));
  body.push(
    textEl(
      0,
      H + 14,
      `Same scale in every panel: ${ys.label(ys.lo)} to ${ys.label(ys.hi)}, ${
        String(firstX.raw)
      } to ${String(lastX.raw)}`,
      "start",
      true,
    ),
  );
  return svgWrap(W, H + 20, m.finding, body);
}

// Slopegraph ---------------------------------------------------------------

function drawSlope(m: Model): string {
  const W = m.width ?? 640;
  const ys = yScale(m);
  const positions = m.positions ?? [0, 1];
  const left = m.lines.map((l) => `${l.name} ${ys.label(l.pts[0].y)}`);
  const right = m.lines.map((l) => `${ys.label(l.pts[1].y)} ${l.name}`);
  const x0 = Math.max(...left.map(tw)) + 14;
  const x1 = W - Math.max(...right.map(tw)) - 14;
  if (x1 - x0 < 60) {
    fail(
      "invalid_spec",
      `width ${W} is too small for these labels. Raise it to at least ${
        Math.ceil(W + 60 - (x1 - x0))
      }.`,
    );
  }
  const top = 24;
  const plotH = Math.max(160, m.lines.length * 14);
  const sy = scaleLinear().domain([ys.lo, ys.hi]).range([top + plotH, top]);
  const idealL = m.lines.map((l) => sy(l.pts[0].y));
  const idealR = m.lines.map((l) => sy(l.pts[1].y));
  const slotL = spread(idealL, LINE_H, top - 6, Infinity) ?? idealL;
  const slotR = spread(idealR, LINE_H, top - 6, Infinity) ?? idealR;
  const H = Math.max(top + plotH + 14, Math.max(...slotL, ...slotR) + 14);
  const body: string[] = [];
  const placer = new Placer({ x0: x0 + 4, y0: top - 6, x1: x1 - 4, y1: H });
  const hl = String(positions[0]);
  const hr = String(positions[1]);
  body.push(textEl(x0, 11, hl, "middle", true));
  body.push(textEl(x1, 11, hr, "middle", true));
  m.lines.forEach((_l, i) => {
    body.push(
      pathEl(
        `M${n(x0)},${n(idealL[i])}L${n(x1)},${n(idealR[i])}`,
        color(0),
        1.5,
      ),
    );
    placer.segs.push([x0, idealL[i], x1, idealR[i]]);
    if (Math.abs(slotL[i] - idealL[i]) > 3) {
      body.push(
        pathEl(
          `M${n(x0 - 1)},${n(idealL[i])}L${n(x0 - 5)},${n(slotL[i])}`,
          "currentColor",
          0.75,
          0.5,
        ),
      );
    }
    if (Math.abs(slotR[i] - idealR[i]) > 3) {
      body.push(
        pathEl(
          `M${n(x1 + 1)},${n(idealR[i])}L${n(x1 + 5)},${n(slotR[i])}`,
          "currentColor",
          0.75,
          0.5,
        ),
      );
    }
    body.push(textEl(x0 - 7, slotL[i], left[i], "end", false, true));
    body.push(textEl(x1 + 7, slotR[i], right[i], "start", false, true));
  });
  body.push(...drawNotes(placer, m.notes, (note) => {
    const li = m.lines.findIndex((l) => l.name === note.series);
    return note.pt.x === 0 ? [x0, idealL[li]] : [x1, idealR[li]];
  }));
  return svgWrap(W, H, m.finding, body);
}

// Command line -------------------------------------------------------------

async function main(): Promise<void> {
  const text = await new Response(Deno.stdin.readable).text();
  try {
    let spec: unknown;
    try {
      spec = JSON.parse(text);
    } catch (e) {
      fail(
        "invalid_spec",
        `The input is not JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    const svg = renderUnknown(spec);
    await Deno.stdout.write(new TextEncoder().encode(svg + "\n"));
  } catch (e) {
    if (e instanceof ChartError) {
      await Deno.stderr.write(
        new TextEncoder().encode(`${e.code}: ${e.message}\n`),
      );
      Deno.exit(2);
    }
    throw e;
  }
}

if (import.meta.main) {
  await main();
}
