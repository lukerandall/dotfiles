/**
 * Static SVG charts: sparkline, line, small multiples, slope, dot plot (and
 * dumbbell), bump chart and strip plot. The interface comes first in this
 * file and the implementation follows `render`.
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
 * In `slope`, `dot` and `strip`, `x` is a label: one of the two positions, a
 * category or a group. It can be any string or number, and a number or a date
 * is never put on a scale.
 *
 * In `bump`, `x` is a position in an ordered sequence. `BumpSpec` says how
 * the order is found.
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
 * exactly one row, except in `strip`, where equal observations are separate
 * dots and `at` takes the first. The helper chooses where the text goes and adds a thin
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
 * The most series a `line` chart draws, and the most series a `bump` chart
 * colours. The `dataviz` palette has this many categorical colours and a ninth
 * is never generated.
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

/**
 * Fields every form accepts. A field that no form declares is refused.
 *
 * `x` and `y` name columns by the role of their data. `y` is always the
 * measured value, a finite number, and `x` is where the value sits: a time or
 * number, a category, or a position. The names say nothing about the axis a
 * column is drawn on: `dot` and `strip` draw `y` along the horizontal axis so
 * that category names read as horizontal text. One table can therefore move
 * between `slope`, `dot` and `line` by changing `form` alone.
 */
interface CommonSpec {
  /**
   * The table to draw, in any row order. Each form says how many rows it
   * needs, and which rows may share an `x` value.
   */
  rows: readonly Row[];
  /** Column that says where each value sits. See `XValue` and each form. */
  x: Column;
  /** Column that holds the value. Every value must be a finite number. */
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
}

/**
 * Fields of every form that draws `y` on a numeric scale and prints `y`
 * values. `bump` is the one form that does neither, because it draws ranks.
 */
interface ScaledSpec extends CommonSpec {
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
export interface SparklineSpec extends ScaledSpec {
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
interface LineBase extends ScaledSpec {
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
export interface MultiplesSpec extends ScaledSpec {
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
export interface SlopeSpec extends ScaledSpec {
  form: "slope";
  /** Column that names the series. Every value must be a string. */
  series: Column;
  annotations?: readonly Annotation<SeriesPoint>[];
}

/** The most categories a `dot` chart draws, one row each. */
export const MAX_DOT_CATEGORIES = 60;

/** The most groups a `strip` chart draws, one strip each. */
export const MAX_STRIP_GROUPS = 12;

/** The most observations a `strip` chart lays out. */
export const MAX_STRIP_POINTS = 5000;

/**
 * A line drawn across a `dot` chart at a value, with a direct label at its end.
 * Use it for the target, the average or the zero that the finding is measured
 * against.
 */
export interface ReferenceLine {
  /** Where the line crosses the value axis. The scale grows to include it. */
  value: number;
  /** What the value is, as a few words. Printed once, at the line. */
  label: string;
}

/** The data point of a `strip` chart: one observation in one group. */
export interface StripPoint extends Point {
  /** The observation's value. The first row with this `x` and `y` is used. */
  y: number;
}

/**
 * Fields of both kinds of dot chart. One row per category along the vertical
 * axis, its value as a dot on a shared horizontal scale. The category names
 * are the row labels at the left and each dot's value is printed beside it.
 * The value axis is a range frame: a line from the scale's minimum to its
 * maximum, labelled with those two values. Rows are in the order `sort` gives.
 *
 * `x` names the category column. A category is a label, printed as the row
 * wrote it, and is never read as a date or a number. `y` is the value. There
 * are at least two categories and at most `MAX_DOT_CATEGORIES`, and height
 * grows with their number.
 */
interface DotBase extends ScaledSpec {
  form: "dot";
  /**
   * A value that the finding is measured against, drawn as a thin line with
   * its label. Default none.
   */
  reference?: ReferenceLine;
}

/**
 * A dot plot: one dot per category. `rows` has exactly one row per category,
 * and two rows with one `x` are refused with `duplicate_point`.
 */
export interface OneDotSpec extends DotBase {
  series?: never;
  /**
   * `"value"` puts the largest value at the top. `"none"` keeps the order in
   * which categories first appear in `rows`, for categories that have an
   * order of their own, such as sizes or age bands. Default `"value"`.
   */
  sort?: "value" | "none";
  annotations?: readonly Annotation<Point>[];
}

/**
 * A dumbbell: two dots per category joined by a thin line, to show how far
 * one value moved to the other. `series` names the measure, such as "2025" and
 * "2026", and must hold exactly two distinct strings. Every category needs one
 * row for each, and a spec that breaks either rule is refused with
 * `dumbbell_needs_two_measures`. The measure that first appears in `rows` is
 * the first, and its dots take `--series-1`; the second takes `--series-2`.
 * Each measure is named once, by a direct label at its dot on the top row, so
 * the reader never has to tell the two apart by colour alone.
 */
export interface DumbbellSpec extends DotBase {
  /** Column that names the two measures. Every value must be a string. */
  series: Column;
  /**
   * `"difference"` sorts by the second measure minus the first, with its sign:
   * the largest rise is at the top and the largest fall at the bottom, so
   * the direction of a change is read from its place as well as its colours.
   * `"value"` sorts by the first measure, largest at the top. `"none"` keeps
   * the order of first appearance. Default `"difference"`.
   */
  sort?: "value" | "difference" | "none";
  annotations?: readonly Annotation<SeriesPoint>[];
}

/** A dot chart. Naming a `series` column selects the dumbbell. */
export type DotSpec = OneDotSpec | DumbbellSpec;

/**
 * Ranking change: one line per series across ordered positions, drawn at each
 * position's rank, with 1 at the top. Each line is named at both ends and the
 * rank is printed beside the name, so the ranks need no axis. Each position's
 * name is printed above the chart. Height grows with the number of series so
 * that labels fit, and a width too small for the position names is refused
 * with `invalid_spec`.
 *
 * `x` names the position column. When every value is a number, or every value
 * is an ISO 8601 date string, the positions are in order of value. Otherwise
 * they are in the order they first appear in `rows`, so a label such as
 * `"2025 Q1"` works. Positions are evenly spaced.
 *
 * `y` is a rank or a score. Within each position the helper ranks the series
 * by `y`, and `first` says which end of `y` is rank 1. Two series with equal
 * `y` at one position are refused with `tied_rank`, because the helper cannot
 * know the ranking's tie rule and any order it chose would be drawn as fact.
 * Every series needs one row at every position, or the spec is refused with
 * `series_incomplete`, and two rows of one series at one position are refused
 * with `duplicate_point`. There are at least two positions and two series.
 *
 * `yFormat` and `yRange` are not fields of this form: it prints ranks, which
 * are whole numbers, and never prints `y`.
 */
export interface BumpSpec extends CommonSpec {
  form: "bump";
  /** Column that names the series. Every value must be a string. */
  series: Column;
  /**
   * Which `y` is rank 1 at each position. `"lowest"` suits a rank column,
   * where 1 is first, and a measure such as a lap time. `"highest"` suits a
   * score. It is required, because the wrong direction draws the whole chart
   * upside down and no check could catch it.
   */
  first: "lowest" | "highest";
  /**
   * Names of the series the finding is about, from 1 to `MAX_LINE_SERIES` of
   * them, each a value of the `series` column and named once. They take the
   * series colours in the order given, and every other line is drawn in a
   * fainter `currentColor`, labelled in the same way. Required when there are
   * more than `MAX_LINE_SERIES` series; without it such a chart is refused
   * with `highlight_needed`. Default: every series coloured, in the order
   * series first appear in `rows`.
   */
  highlight?: readonly [string, ...string[]];
  annotations?: readonly Annotation<SeriesPoint>[];
}

/**
 * Raw observations by group, each as a dot on one shared horizontal value
 * scale, one strip per group. Where dots would overlap they are moved apart
 * across the strip, which makes the strip a beeswarm; with no overlap it stays
 * one line of dots. The strip's height follows from the most crowded value.
 * With `median`, a short thin line marks each group's median and its value is
 * printed.
 *
 * `x` names the group column, and a group is a label, as a `dot` category is.
 * `y` is the observed value. Each row is one observation. Rows may repeat `x`
 * and `y`, and `duplicate_point` does not apply. One group is enough. There
 * are at most `MAX_STRIP_GROUPS` groups and `MAX_STRIP_POINTS` rows. Dots that
 * still overlap when a strip has reached its greatest height are refused with
 * `points_collide`; the helper never draws one dot over another.
 */
export interface StripSpec extends ScaledSpec {
  form: "strip";
  /**
   * `"median"` orders groups by median, the largest at the top. `"none"` keeps
   * the order of first appearance. Default `"median"`.
   */
  sort?: "median" | "none";
  /** Mark and print each group's median. Default true. */
  median?: boolean;
  annotations?: readonly Annotation<StripPoint>[];
}

/** Every spec the helper accepts. `form` selects the member. */
export type ChartSpec =
  | SparklineSpec
  | LineSpec
  | MultiplesSpec
  | SlopeSpec
  | DotSpec
  | BumpSpec
  | StripSpec;

/**
 * Why a spec was refused. Each code has one recovery, and the message states
 * it with the offending field, row or series.
 */
export type ChartErrorCode =
  /**
   * The input is not JSON, or a spec field is missing, of the wrong type, out
   * of its stated bounds, or not a field of the form. A `highlight` name that
   * is not a value of the `series` column is out of bounds. Recovery: correct the
   * field the message names; the message lists what the field accepts.
   */
  | "invalid_spec"
  /**
   * `rows` is empty, a line has fewer than two rows, a `dot` chart has fewer
   * than two categories, or a `bump` chart has fewer than two positions or
   * two series. Recovery: supply more rows, or state the value in a sentence
   * and draw no chart.
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
   * Two rows of one line share an `x` value. A `dot` category's measure and a
   * `bump` series count as a line here. Recovery: aggregate the rows so each
   * line has one row per `x`.
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
   * A `bump` chart has more than `MAX_LINE_SERIES` series and no `highlight`.
   * Recovery: set `highlight` to the series the finding is about.
   */
  | "highlight_needed"
  /**
   * A `bump` series has no row at one of the positions. Recovery: give the
   * series the message names one row at every position, or drop it.
   */
  | "series_incomplete"
  /**
   * Two `bump` series have the same `y` at one position. Recovery: give the
   * two rows the message names different `y` values by the ranking's own tie
   * rule, such as the rank column of the source.
   */
  | "tied_rank"
  /**
   * A dumbbell's `series` does not hold exactly two distinct values, or a
   * category lacks a row for one of them. Recovery: give every category one
   * row for each of two measures.
   */
  | "dumbbell_needs_two_measures"
  /**
   * A `dot` chart has more than `MAX_DOT_CATEGORIES` categories, or a `strip`
   * chart more than `MAX_STRIP_GROUPS` groups. Recovery: keep the categories
   * the reader needs, such as the largest and smallest, and say in the
   * surrounding text how many were left out.
   */
  | "too_many_categories"
  /**
   * A `strip` chart has more than `MAX_STRIP_POINTS` rows. Recovery: sample
   * the rows or aggregate them into a histogram, which `references/drawn/`
   * shows how to draw.
   */
  | "too_many_rows"
  /**
   * A `strip` chart's dots still overlap after the layout has used all the
   * height it may take. Recovery: raise `width`, or aggregate the rows into a
   * histogram, which `references/drawn/` shows how to draw.
   */
  | "points_collide"
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
  if (isObj(spec)) {
    if (spec.form === "dot") return drawDot(parseDot(spec));
    if (spec.form === "bump") return drawBump(parseBump(spec));
    if (spec.form === "strip") return drawStrip(parseStrip(spec));
  }
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

const ALL_FORMS = [
  "sparkline",
  "line",
  "multiples",
  "slope",
  "dot",
  "bump",
  "strip",
];
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
      `"form" must be one of ${ALL_FORMS.join(", ")}; got ${
        JSON.stringify(form)
      }.`,
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
  const yRange = parseRange(input.yRange);
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

function parseRange(v: unknown): readonly [number, number] | undefined {
  if (v === undefined) return undefined;
  if (
    !Array.isArray(v) || v.length !== 2 || !isNum(v[0]) || !isNum(v[1]) ||
    v[0] > v[1]
  ) {
    fail("invalid_spec", `"yRange" must be two numbers, the lower first.`);
  }
  return [v[0], v[1]];
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
    for (const d of [6, 18, 32, 52, 80]) {
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

// Shared reading of dot, bump and strip specs --------------------------------

interface Frame {
  rows: unknown[];
  xCol: string;
  yCol: string;
  finding: string;
  width: number | undefined;
}

/** Check the fields every form shares, and that `rows` is a non-empty array. */
function readFrame(input: Obj, form: string, extra: string[]): Frame {
  checkKeys(
    input,
    ["form", "rows", "x", "y", "finding", "width", ...extra],
    `A ${form} spec`,
  );
  for (const k of ["x", "y"]) {
    if (typeof input[k] !== "string" || input[k] === "") {
      fail("invalid_spec", `"${k}" must name a column, as a non-empty string.`);
    }
  }
  if (typeof input.finding !== "string" || input.finding.trim() === "") {
    fail("invalid_spec", `"finding" must be a non-empty sentence.`);
  }
  let width: number | undefined;
  if (input.width !== undefined) {
    if (!isNum(input.width) || input.width < 40) {
      fail("invalid_spec", `"width" must be a number of at least 40.`);
    }
    width = input.width;
  }
  if (!Array.isArray(input.rows)) {
    fail("invalid_spec", `"rows" must be an array of objects.`);
  }
  return {
    rows: input.rows,
    xCol: String(input.x),
    yCol: String(input.y),
    finding: input.finding,
    width,
  };
}

function nonEmptyRows(f: Frame): void {
  if (f.rows.length === 0) {
    fail(
      "too_few_rows",
      "rows is empty. Supply rows, or state the finding in a sentence and draw no chart.",
    );
  }
}

function readRow(raw: unknown, i: number, cols: string[]): Obj {
  if (!isObj(raw)) fail("invalid_spec", `rows[${i}] must be an object.`, i);
  for (const col of cols) {
    if (!Object.hasOwn(raw, col)) {
      fail(
        "missing_column",
        `rows[${i}] has no column "${col}". Add it, or change the spec to name an existing column.`,
        i,
      );
    }
  }
  return raw;
}

function readValue(row: Obj, i: number, col: string): number {
  const y = row[col];
  if (!isNum(y)) {
    fail(
      "invalid_value",
      `rows[${i}].${col} is ${
        JSON.stringify(y)
      }; y must be a finite number. Fix or drop the row.`,
      i,
    );
  }
  return y;
}

function readName(row: Obj, i: number, col: string): string {
  const s = row[col];
  if (typeof s !== "string") {
    fail(
      "invalid_value",
      `rows[${i}].${col} is ${
        JSON.stringify(s)
      }; a series must be a string. Fix or drop the row.`,
      i,
    );
  }
  return s;
}

function readLabel(row: Obj, i: number, col: string): string | number {
  const v = row[col];
  if (!(isNum(v) || typeof v === "string")) {
    fail(
      "invalid_value",
      `rows[${i}].${col} is ${
        JSON.stringify(v)
      }; a category, group or position must be a string or a number. Fix or drop the row.`,
      i,
    );
  }
  return v;
}

/** The identity of a label: a string and a number never match. */
function labelKey(v: string | number): string {
  return `${typeof v}:${v}`;
}

interface RawNote {
  at: Obj;
  text: string;
}

/** Check the shape of annotations; matching them to rows is left to the form. */
function readNotes(v: unknown, atKeys: string[]): RawNote[] {
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
      fail(
        "invalid_spec",
        `${where}.at must be an object with ${
          atKeys.map((k) => `"${k}"`).join(" and ")
        }.`,
      );
    }
    checkKeys(at, atKeys, `${where}.at`);
    for (const k of atKeys) {
      const ok = k === "series"
        ? typeof at[k] === "string"
        : k === "y"
        ? isNum(at[k])
        : isNum(at[k]) || typeof at[k] === "string";
      if (!ok) {
        fail(
          "invalid_spec",
          `${where}.at needs "${k}" as a ${
            k === "series"
              ? "string"
              : k === "y"
              ? "number"
              : "string or number"
          }.`,
        );
      }
    }
    const count = [...a.text].length;
    if (count > MAX_ANNOTATION_CHARS) {
      fail(
        "annotation_too_long",
        `${where}.text has ${count} characters; the limit is ${MAX_ANNOTATION_CHARS}. Shorten it.`,
      );
    }
    return { at, text: a.text };
  });
}

function noRowFor(i: number, at: Obj): never {
  return fail(
    "annotation_matches_no_row",
    `annotations[${i}].at matches no row (${
      Object.entries(at).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")
    }). Copy "at" from a row.`,
  );
}

interface Placed {
  px: number;
  py: number;
  text: string;
}

/** Place each annotation beside its point, or refuse the one that cannot fit. */
function placeNotes(placer: Placer, notes: Placed[]): string[] {
  return notes.map(({ px, py, text }) => {
    const s = placer.place(px, py, text);
    if (!s) {
      fail(
        "annotation_does_not_fit",
        `The annotation "${text}" cannot be placed without covering data or another label. Remove it, or raise width.`,
      );
    }
    return s;
  });
}

/** Where a label centred at `x` goes so that it stays inside the chart. */
function inside(
  x: number,
  text: string,
  width: number,
): ["start" | "middle" | "end", number] {
  const w = tw(text);
  if (x - w / 2 < 2) return ["start", Math.max(2, x - 2)];
  if (x + w / 2 > width - 2) return ["end", Math.min(width - 2, x + 2)];
  return ["middle", x];
}

function dotRect(x: number, y: number, r: number): Rect {
  return { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
}

function circleEl(
  x: number,
  y: number,
  r: number,
  fill: string,
  faint = false,
) {
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${fill}"${
    faint ? ` fill-opacity="0.35"` : ""
  }/>`;
}

/** Which values the chart's value axis spans, widened by the optional pieces. */
function valueSpan(
  values: number[],
  yRange: readonly [number, number] | undefined,
): [number, number] {
  let [lo, hi] = span(values);
  if (yRange) {
    lo = Math.min(lo, yRange[0]);
    hi = Math.max(hi, yRange[1]);
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  return [lo, hi];
}

/** Draw the horizontal range frame: a line from lo to hi, labelled at both ends. */
function frameBelow(
  sx: (v: number) => number,
  lo: number,
  hi: number,
  y: number,
  label: (v: number) => string,
  placer: Placer,
): string[] {
  const l = label(lo);
  const h = label(hi);
  placer.add(textRect(sx(lo), y + 13, l, "start"));
  placer.add(textRect(sx(hi), y + 13, h, "end"));
  return [
    pathEl(`M${n(sx(lo))},${n(y)}H${n(sx(hi))}`, "currentColor", 1, 0.5),
    textEl(sx(lo), y + 13, l, "start", true),
    textEl(sx(hi), y + 13, h, "end", true),
  ];
}

// Dot plot and dumbbell ------------------------------------------------------

interface DotCat {
  label: string | number;
  /** The value of each measure; one entry in a dot plot, two in a dumbbell. */
  vals: number[];
}

interface DotModel {
  finding: string;
  width: number | undefined;
  fmt: NumberFormat;
  yRange: readonly [number, number] | undefined;
  reference: ReferenceLine | undefined;
  /** The two measure names of a dumbbell, or none. */
  measures: string[];
  cats: DotCat[];
  notes: { cat: number; measure: number; text: string }[];
}

function parseReference(v: unknown): ReferenceLine | undefined {
  if (v === undefined) return undefined;
  if (!isObj(v)) {
    fail(
      "invalid_spec",
      `"reference" must be an object with "value" and "label".`,
    );
  }
  checkKeys(v, ["value", "label"], `"reference"`);
  if (!isNum(v.value)) {
    fail("invalid_spec", `"reference.value" must be a finite number.`);
  }
  if (typeof v.label !== "string" || v.label === "") {
    fail("invalid_spec", `"reference.label" must be a non-empty string.`);
  }
  return { value: v.value, label: v.label };
}

function parseDot(input: Obj): DotModel {
  const f = readFrame(input, "dot", [
    "yFormat",
    "yRange",
    "annotations",
    "series",
    "sort",
    "reference",
  ]);
  const named = input.series !== undefined;
  if (named && (typeof input.series !== "string" || input.series === "")) {
    fail("invalid_spec", `"series" must name a column, as a non-empty string.`);
  }
  const sCol = named ? String(input.series) : undefined;
  const sorts = named ? ["value", "difference", "none"] : ["value", "none"];
  const sort = input.sort === undefined
    ? (named ? "difference" : "value")
    : input.sort;
  if (typeof sort !== "string" || !sorts.includes(sort)) {
    fail(
      "invalid_spec",
      `"sort" for ${named ? "a dumbbell" : "a dot plot"} must be one of ${
        sorts.join(", ")
      }; got ${JSON.stringify(sort)}.`,
    );
  }
  const reference = parseReference(input.reference);
  const fmt = parseFormat(input.yFormat);
  const yRange = parseRange(input.yRange);
  const raw = readNotes(input.annotations, named ? ["x", "series"] : ["x"]);
  nonEmptyRows(f);

  const cols = [f.xCol, f.yCol, ...(sCol ? [sCol] : [])];
  const cats = new Map<string, DotCat>();
  const measures: string[] = [];
  f.rows.forEach((r, i) => {
    const row = readRow(r, i, cols);
    const y = readValue(row, i, f.yCol);
    let mi = 0;
    if (sCol) {
      const s = readName(row, i, sCol);
      mi = measures.indexOf(s);
      if (mi < 0) mi = measures.push(s) - 1;
    }
    const label = readLabel(row, i, f.xCol);
    const key = labelKey(label);
    let cat = cats.get(key);
    if (!cat) {
      cat = { label, vals: [] };
      cats.set(key, cat);
    }
    if (cat.vals[mi] !== undefined) {
      fail(
        "duplicate_point",
        `rows[${i}] repeats the category ${JSON.stringify(label)}${
          sCol ? ` for the measure "${measures[mi]}"` : ""
        }. Aggregate the rows so each category has one row${
          sCol ? " per measure" : ""
        }.`,
        i,
      );
    }
    cat.vals[mi] = y;
  });
  let list = [...cats.values()];
  if (sCol) {
    if (measures.length !== 2) {
      fail(
        "dumbbell_needs_two_measures",
        `"${sCol}" holds ${measures.length} distinct values; a dumbbell needs exactly 2. Give every category one row for each of two measures.`,
      );
    }
    for (const c of list) {
      if (c.vals[0] === undefined || c.vals[1] === undefined) {
        fail(
          "dumbbell_needs_two_measures",
          `The category ${
            JSON.stringify(c.label)
          } lacks a row for one of the two measures. Give every category one row for each.`,
        );
      }
    }
  }
  if (list.length < 2) {
    fail(
      "too_few_rows",
      "A dot chart needs at least two categories. Supply more rows, or state the value in a sentence.",
    );
  }
  if (list.length > MAX_DOT_CATEGORIES) {
    fail(
      "too_many_categories",
      `A dot chart draws at most ${MAX_DOT_CATEGORIES} categories and this has ${list.length}. Keep the categories the reader needs, and say in the text how many were left out.`,
    );
  }
  if (sort !== "none") {
    const key = (c: DotCat) =>
      sort === "difference" ? c.vals[1] - c.vals[0] : c.vals[0];
    list = list.map((c, i) => ({ c, i })).sort((a, b) =>
      key(b.c) - key(a.c) || a.i - b.i
    ).map((e) => e.c);
  }
  const notes = raw.map((a, i) => {
    const cat = list.findIndex((c) => c.label === a.at.x);
    const measure = sCol ? measures.indexOf(String(a.at.series)) : 0;
    if (cat < 0 || measure < 0) noRowFor(i, a.at);
    return { cat, measure, text: a.text };
  });
  return {
    finding: f.finding,
    width: f.width,
    fmt,
    yRange,
    reference,
    measures: sCol ? measures : [],
    cats: list,
    notes,
  };
}

function drawDot(m: DotModel): string {
  const W = m.width ?? 640;
  const named = m.measures.length === 2;
  const all = m.cats.flatMap((c) => c.vals);
  const [lo, hi] = valueSpan(
    [...all, ...(m.reference ? [m.reference.value] : [])],
    m.yRange,
  );
  const d = m.fmt.decimals ?? defaultDecimals(lo, hi, all);
  const label = (v: number) => formatNumber(v, m.fmt, d);
  const printed = m.cats.map((c) => {
    if (!named) return { left: undefined, right: label(c.vals[0]) };
    const a = c.vals[0];
    const b = c.vals[1];
    return {
      left: a === b ? undefined : label(Math.min(a, b)),
      right: label(Math.max(a, b)),
    };
  });
  const leftM = Math.max(...m.cats.map((c) => tw(String(c.label)))) + 12;
  const leftPad = Math.max(
    8,
    ...printed.map((p) => p.left ? tw(p.left) + 12 : 0),
  );
  // A measure name stands beside its dot on the top row, so the right edge
  // leaves room for the longest name as well as for the value labels.
  const rightPad = Math.max(
    ...printed.map((p) => tw(p.right) + 12),
    ...(named ? m.measures.map((s) => tw(s) + 3) : []),
  );
  const x0 = leftM + leftPad;
  const x1 = W - rightPad;
  if (x1 - x0 < 40) {
    fail(
      "invalid_spec",
      `width ${W} is too small for these labels. Raise it to at least ${
        Math.ceil(W + 40 - (x1 - x0))
      }.`,
    );
  }
  const PITCH = 20;
  const header = (named ? 1 : 0) + (m.reference ? 1 : 0);
  const top = 6 + header * 14;
  const rowY = (i: number) => top + 10 + i * PITCH;
  const lastY = rowY(m.cats.length - 1);
  const axisY = lastY + 18;
  const H = axisY + 22;
  const sx = scaleLinear().domain([lo, hi]).range([x0, x1]);
  const placer = new Placer({ x0: 0, y0: 0, x1: W, y1: H });
  const body: string[] = [];

  if (m.reference) {
    const rx = sx(m.reference.value);
    const base = top + 1 - (named ? 14 : 0);
    const [anchor, tx] = inside(rx, m.reference.label, W);
    body.push(
      pathEl(
        `M${n(rx)},${n(base + 4)}V${n(lastY + 8)}`,
        "currentColor",
        1,
        0.5,
      ),
    );
    body.push(textEl(tx, base, m.reference.label, anchor, true));
    placer.add(textRect(tx, base, m.reference.label, anchor));
  }
  m.cats.forEach((c, i) => {
    const y = rowY(i);
    const name = String(c.label);
    body.push(textEl(leftM, y, name, "end", false, true));
    placer.add(textRect(leftM, y, name, "end", true));
    if (named) {
      const [a, b] = [sx(c.vals[0]), sx(c.vals[1])];
      body.push(
        pathEl(
          `M${n(Math.min(a, b))},${n(y)}H${n(Math.max(a, b))}`,
          "currentColor",
          1.5,
          0.35,
        ),
      );
      placer.segs.push([Math.min(a, b), y, Math.max(a, b), y]);
    }
    c.vals.forEach((v, k) => {
      body.push(circleEl(sx(v), y, 3.5, color(k)));
      placer.add(dotRect(sx(v), y, 4));
    });
    const lowX = sx(Math.min(...c.vals));
    const highX = sx(Math.max(...c.vals));
    const p = printed[i];
    if (p.left) {
      body.push(textEl(lowX - 7, y, p.left, "end", false, true));
      placer.add(textRect(lowX - 7, y, p.left, "end", true));
    }
    body.push(textEl(highX + 7, y, p.right, "start", false, true));
    placer.add(textRect(highX + 7, y, p.right, "start", true));
  });
  if (named) {
    // Each measure is named at its own dot on the top row, above the row.
    const c = m.cats[0];
    const [a, b] = c.vals;
    const lowFirst = a <= b;
    m.measures.forEach((name, k) => {
      const isLow = k === 0 ? lowFirst : !lowFirst;
      const px = sx(c.vals[k]);
      const anchor = isLow ? "end" : "start";
      const tx = px + (isLow ? -3 : 3);
      body.push(textEl(tx, top + 1, name, anchor, true));
      placer.add(textRect(tx, top + 1, name, anchor));
    });
  }
  body.push(...frameBelow(sx, lo, hi, axisY, label, placer));
  body.push(...placeNotes(
    placer,
    m.notes.map((nt) => ({
      px: sx(m.cats[nt.cat].vals[nt.measure]),
      py: rowY(nt.cat),
      text: nt.text,
    })),
  ));
  return svgWrap(W, H, m.finding, body);
}

// Bump chart -----------------------------------------------------------------

interface BumpSeries {
  name: string;
  /** Rank at each position, 1 first. */
  ranks: number[];
}

interface BumpModel {
  finding: string;
  width: number | undefined;
  positions: (string | number)[];
  series: BumpSeries[];
  highlight: readonly string[] | undefined;
  notes: { series: number; pos: number; text: string }[];
}

function parseBump(input: Obj): BumpModel {
  const f = readFrame(input, "bump", [
    "series",
    "first",
    "highlight",
    "annotations",
  ]);
  if (typeof input.series !== "string" || input.series === "") {
    fail("invalid_spec", `A bump spec needs "series", the name of a column.`);
  }
  const sCol = input.series;
  if (input.first !== "lowest" && input.first !== "highest") {
    fail(
      "invalid_spec",
      `A bump spec needs "first": "lowest" or "highest", saying which y is rank 1; got ${
        JSON.stringify(input.first)
      }.`,
    );
  }
  const lowestFirst = input.first === "lowest";
  let highlight: string[] | undefined;
  if (input.highlight !== undefined) {
    const h = input.highlight;
    if (
      !Array.isArray(h) || h.length === 0 || h.length > MAX_LINE_SERIES ||
      !h.every((s) => typeof s === "string") || new Set(h).size !== h.length
    ) {
      fail(
        "invalid_spec",
        `"highlight" must list 1 to ${MAX_LINE_SERIES} different series names, as strings.`,
      );
    }
    highlight = h;
  }
  const raw = readNotes(input.annotations, ["x", "series"]);
  nonEmptyRows(f);

  const cols = [f.xCol, f.yCol, sCol];
  const names: string[] = [];
  const posRaw: (string | number)[] = [];
  const posKeys: string[] = [];
  const cells = new Map<string, number>();
  f.rows.forEach((r, i) => {
    const row = readRow(r, i, cols);
    const y = readValue(row, i, f.yCol);
    const name = readName(row, i, sCol);
    const label = readLabel(row, i, f.xCol);
    if (!names.includes(name)) names.push(name);
    const pk = labelKey(label);
    if (!posKeys.includes(pk)) {
      posKeys.push(pk);
      posRaw.push(label);
    }
    const ck = `${name}\u0000${pk}`;
    if (cells.has(ck)) {
      fail(
        "duplicate_point",
        `rows[${i}] repeats series "${name}" at ${
          JSON.stringify(label)
        }. Aggregate the rows so each series has one row per position.`,
        i,
      );
    }
    cells.set(ck, y);
  });
  if (names.length < 2 || posRaw.length < 2) {
    fail(
      "too_few_rows",
      `A bump chart needs at least two series and two positions; this has ${names.length} and ${posRaw.length}. Supply more rows, or state the finding in a sentence.`,
    );
  }
  // Put positions in order: by value for numbers and ISO dates, else as seen.
  let positions = posRaw;
  if (posRaw.every((p) => typeof p === "number")) {
    positions = [...posRaw].sort((a, b) => Number(a) - Number(b));
  } else if (
    posRaw.every((p) => typeof p === "string" && parseDate(p) !== undefined)
  ) {
    positions = [...posRaw].sort((a, b) =>
      (parseDate(String(a)) ?? 0) - (parseDate(String(b)) ?? 0)
    );
  }
  for (const name of names) {
    for (const p of positions) {
      if (!cells.has(`${name}\u0000${labelKey(p)}`)) {
        fail(
          "series_incomplete",
          `Series "${name}" has no row at ${
            JSON.stringify(p)
          }. Give it one row at every position, or drop it.`,
        );
      }
    }
  }
  if (highlight) {
    for (const h of highlight) {
      if (!names.includes(h)) {
        fail(
          "invalid_spec",
          `"highlight" names "${h}", which is not a value of the "${sCol}" column.`,
        );
      }
    }
  } else if (names.length > MAX_LINE_SERIES) {
    fail(
      "highlight_needed",
      `A bump chart colours at most ${MAX_LINE_SERIES} series and this has ${names.length}. Set "highlight" to the series the finding is about.`,
    );
  }
  const ranks = names.map(() => new Array<number>(positions.length));
  positions.forEach((p, pi) => {
    const ys = names.map((name, si) => ({
      si,
      y: cells.get(`${name}\u0000${labelKey(p)}`) ?? 0,
    }));
    ys.sort((a, b) => lowestFirst ? a.y - b.y : b.y - a.y);
    ys.forEach((e, k) => {
      if (k > 0 && ys[k - 1].y === e.y) {
        fail(
          "tied_rank",
          `Series "${names[ys[k - 1].si]}" and "${
            names[e.si]
          }" both have y=${e.y} at ${
            JSON.stringify(p)
          }. Give the two rows different y values by the ranking's own tie rule.`,
        );
      }
      ranks[e.si][pi] = k + 1;
    });
  });
  const notes = raw.map((a, i) => {
    const series = names.indexOf(String(a.at.series));
    const pos = positions.findIndex((p) => p === a.at.x);
    if (series < 0 || pos < 0) noRowFor(i, a.at);
    return { series, pos, text: a.text };
  });
  return {
    finding: f.finding,
    width: f.width,
    positions,
    series: names.map((name, si) => ({ name, ranks: ranks[si] })),
    highlight,
    notes,
  };
}

function drawBump(m: BumpModel): string {
  const W = m.width ?? 640;
  const P = m.positions.length;
  const left = m.series.map((s) => `${s.name} ${s.ranks[0]}`);
  const right = m.series.map((s) => `${s.ranks[P - 1]} ${s.name}`);
  const heads = m.positions.map(String);
  const x0 = Math.max(
    Math.max(...left.map(tw)) + 14,
    tw(heads[0]) / 2 + 2,
  );
  const x1 = Math.min(
    W - Math.max(...right.map(tw)) - 14,
    W - tw(heads[P - 1]) / 2 - 2,
  );
  const step = (x1 - x0) / (P - 1);
  const need = Math.max(...heads.map(tw)) + 8;
  if (x1 - x0 < 60 || step < need) {
    fail(
      "invalid_spec",
      `width ${W} is too small for these labels. Raise it to at least ${
        Math.ceil(W + Math.max(60 - (x1 - x0), (need - step) * (P - 1)))
      }.`,
    );
  }
  const PITCH = 26;
  const top = 34;
  const S = m.series.length;
  const H = top + (S - 1) * PITCH + 16;
  const px = (pi: number) => x0 + step * pi;
  const py = (rank: number) => top + (rank - 1) * PITCH;
  const body: string[] = [];
  const placer = new Placer({ x0: 0, y0: 0, x1: W, y1: H });
  heads.forEach((h, pi) => {
    body.push(textEl(px(pi), 11, h, "middle", true));
    placer.add(textRect(px(pi), 11, h, "middle"));
  });
  const colourOf = (si: number): number | undefined =>
    m.highlight
      ? (m.highlight.indexOf(m.series[si].name) >= 0
        ? m.highlight.indexOf(m.series[si].name)
        : undefined)
      : si;
  const order = m.series.map((_, si) => si);
  const faint = order.filter((si) => colourOf(si) === undefined);
  const strong = order.filter((si) => colourOf(si) !== undefined);
  for (const si of [...faint, ...strong]) {
    const s = m.series[si];
    const ci = colourOf(si);
    const pts = s.ranks.map((r, pi): [number, number] => [px(pi), py(r)]);
    if (ci === undefined) {
      body.push(pathEl(linePath(pts), "currentColor", 1.25, 0.35));
    } else {
      body.push(pathEl(linePath(pts), color(ci), 2));
    }
    placer.segs.push(...segsOf(pts));
    for (const [x, y] of pts) {
      body.push(
        ci === undefined
          ? circleEl(x, y, 3, "currentColor", true)
          : circleEl(x, y, 3, color(ci)),
      );
      placer.add(dotRect(x, y, 3.5));
    }
    const isFaint = ci === undefined;
    body.push(
      textEl(
        x0 - 7,
        py(s.ranks[0]),
        `${s.name} ${s.ranks[0]}`,
        "end",
        isFaint,
        true,
      ),
    );
    body.push(
      textEl(
        x1 + 7,
        py(s.ranks[P - 1]),
        `${s.ranks[P - 1]} ${s.name}`,
        "start",
        isFaint,
        true,
      ),
    );
    placer.add(
      textRect(x0 - 7, py(s.ranks[0]), `${s.name} ${s.ranks[0]}`, "end", true),
    );
    placer.add(
      textRect(
        x1 + 7,
        py(s.ranks[P - 1]),
        `${s.ranks[P - 1]} ${s.name}`,
        "start",
        true,
      ),
    );
  }
  body.push(...placeNotes(
    placer,
    m.notes.map((nt) => ({
      px: px(nt.pos),
      py: py(m.series[nt.series].ranks[nt.pos]),
      text: nt.text,
    })),
  ));
  return svgWrap(W, H, m.finding, body);
}

// Strip plot -----------------------------------------------------------------

interface StripGroup {
  label: string | number;
  values: number[];
}

interface StripModel {
  finding: string;
  width: number | undefined;
  fmt: NumberFormat;
  yRange: readonly [number, number] | undefined;
  median: boolean;
  groups: StripGroup[];
  notes: { group: number; index: number; text: string }[];
}

function medianOf(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function parseStrip(input: Obj): StripModel {
  const f = readFrame(input, "strip", [
    "yFormat",
    "yRange",
    "annotations",
    "sort",
    "median",
  ]);
  const sort = input.sort === undefined ? "median" : input.sort;
  if (sort !== "median" && sort !== "none") {
    fail(
      "invalid_spec",
      `"sort" for a strip must be "median" or "none"; got ${
        JSON.stringify(sort)
      }.`,
    );
  }
  if (input.median !== undefined && typeof input.median !== "boolean") {
    fail("invalid_spec", `"median" must be true or false.`);
  }
  const fmt = parseFormat(input.yFormat);
  const yRange = parseRange(input.yRange);
  const raw = readNotes(input.annotations, ["x", "y"]);
  nonEmptyRows(f);
  if (f.rows.length > MAX_STRIP_POINTS) {
    fail(
      "too_many_rows",
      `A strip chart lays out at most ${MAX_STRIP_POINTS} observations and this has ${f.rows.length}. Sample the rows, or draw a histogram.`,
    );
  }
  const groups = new Map<string, StripGroup>();
  const firstRow = new Map<string, number>();
  f.rows.forEach((r, i) => {
    const row = readRow(r, i, [f.xCol, f.yCol]);
    const y = readValue(row, i, f.yCol);
    const label = readLabel(row, i, f.xCol);
    const key = labelKey(label);
    let g = groups.get(key);
    if (!g) {
      g = { label, values: [] };
      groups.set(key, g);
      firstRow.set(key, i);
    }
    g.values.push(y);
  });
  let list = [...groups.values()];
  if (list.length > MAX_STRIP_GROUPS) {
    fail(
      "too_many_categories",
      `A strip chart draws at most ${MAX_STRIP_GROUPS} groups and this has ${list.length}. Keep the groups the reader needs, and say in the text how many were left out.`,
    );
  }
  if (sort === "median") {
    list = list.map((g, i) => ({ g, i, m: medianOf(g.values) })).sort((a, b) =>
      b.m - a.m || a.i - b.i
    ).map((e) => e.g);
  }
  const notes = raw.map((a, i) => {
    const group = list.findIndex((g) => g.label === a.at.x);
    const index = group < 0 ? -1 : list[group].values.indexOf(Number(a.at.y));
    if (index < 0) noRowFor(i, a.at);
    return { group, index, text: a.text };
  });
  return {
    finding: f.finding,
    width: f.width,
    fmt,
    yRange,
    median: input.median !== false,
    groups: list,
    notes,
  };
}

const STRIP_R = 2;
const STRIP_GAP = 2 * STRIP_R + 0.5;
/** The farthest a dot may sit from the middle of its strip. */
const STRIP_REACH = 80;

/**
 * Offsets across the strip for dots at horizontal positions `xs`, so that no
 * two centres are closer than `gap`. Each dot, taken in order of position,
 * goes to the free spot nearest the middle. Returns undefined when a dot
 * would have to sit beyond `reach`.
 */
function swarm(xs: number[], gap: number, reach: number): number[] | undefined {
  const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b] || a - b);
  const placed: { x: number; off: number }[] = [];
  const out = new Array<number>(xs.length).fill(0);
  for (const i of order) {
    const x = xs[i];
    const near: { x: number; off: number }[] = [];
    for (let k = placed.length - 1; k >= 0 && x - placed[k].x < gap; k--) {
      near.push(placed[k]);
    }
    const spots = [0];
    for (const q of near) {
      const h = Math.sqrt(Math.max(0, gap * gap - (x - q.x) ** 2));
      spots.push(q.off + h, q.off - h);
    }
    spots.sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
    let chosen: number | undefined;
    for (const s of spots) {
      if (Math.abs(s) > reach) break;
      if (near.every((q) => Math.hypot(x - q.x, s - q.off) >= gap - 1e-6)) {
        chosen = s;
        break;
      }
    }
    if (chosen === undefined) return undefined;
    placed.push({ x, off: chosen });
    out[i] = chosen;
  }
  return out;
}

function drawStrip(m: StripModel): string {
  const W = m.width ?? 640;
  const all = m.groups.flatMap((g) => g.values);
  const [lo, hi] = valueSpan(all, m.yRange);
  const medians = m.groups.map((g) => medianOf(g.values));
  const d = m.fmt.decimals ?? defaultDecimals(lo, hi, medians);
  const label = (v: number) => formatNumber(v, m.fmt, d);
  const leftM = Math.max(...m.groups.map((g) => tw(String(g.label)))) + 12;
  const medText = medians.map((v) => `median ${label(v)}`);
  const rightM = m.median ? Math.max(...medText.map(tw)) + 16 : 12;
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
  const sx = scaleLinear().domain([lo, hi]).range([x0, x1]);
  const lanes = m.groups.map((g, gi) => {
    const xs = g.values.map((v) => sx(v));
    const offs = swarm(xs, STRIP_GAP, STRIP_REACH);
    if (!offs) {
      fail(
        "points_collide",
        `The dots of group ${
          JSON.stringify(g.label)
        } still overlap at the greatest strip height. Raise width, or draw a histogram.`,
      );
    }
    const reach = Math.max(0, ...offs.map(Math.abs));
    return { gi, xs, offs, h: Math.max(24, 2 * reach + 2 * STRIP_R + 12) };
  });
  let y = 8;
  const centres = lanes.map((l) => {
    const c = y + l.h / 2;
    y += l.h;
    return c;
  });
  const axisY = y + 4;
  const H = axisY + 22;
  const body: string[] = [];
  const placer = new Placer({ x0: 0, y0: 0, x1: W, y1: H });
  lanes.forEach((l, gi) => {
    const g = m.groups[gi];
    const cy = centres[gi];
    const name = String(g.label);
    body.push(textEl(leftM, cy, name, "end", false, true));
    placer.add(textRect(leftM, cy, name, "end", true));
    l.xs.forEach((x, k) => {
      body.push(circleEl(x, cy + l.offs[k], STRIP_R, color(0)));
      placer.add(dotRect(x, cy + l.offs[k], STRIP_R + 0.5));
    });
    if (m.median) {
      const mx = sx(medians[gi]);
      const half = l.h / 2 - 4;
      body.push(
        pathEl(
          `M${n(mx)},${n(cy - half)}V${n(cy + half)}`,
          "currentColor",
          1.5,
          0.8,
        ),
      );
      body.push(textEl(x1 + 10, cy, medText[gi], "start", false, true));
      placer.add(textRect(x1 + 10, cy, medText[gi], "start", true));
    }
  });
  body.push(...frameBelow(sx, lo, hi, axisY, label, placer));
  body.push(...placeNotes(
    placer,
    m.notes.map((nt) => ({
      px: lanes[nt.group].xs[nt.index],
      py: centres[nt.group] + lanes[nt.group].offs[nt.index],
      text: nt.text,
    })),
  ));
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
