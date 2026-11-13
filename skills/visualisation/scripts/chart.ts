/**
 * Static SVG charts in four Tufte forms. This file is the interface only:
 * every function body throws until the implementation lands.
 *
 * Command line: `deno run chart.ts < spec.json > chart.svg`. A refused spec
 * writes nothing to stdout, prints `<code>: <message>` to stderr and exits 2.
 * Input that is not JSON is refused the same way, with code `invalid_spec`.
 * Other code imports `render` and nothing else.
 *
 * Planned libraries (see /evals/visualisation-helper-library): d3-scale 4.0.2,
 * d3-shape 3.2.0 and d3-array 3.2.4. No type or format string from them
 * appears here, so the choice can change without changing a spec.
 */

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
   * most 2, that print the data's minimum and maximum as different numbers.
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
   * A `line` chart's end-of-line labels still collide after layout.
   * Recovery: use `multiples`.
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
export function render(_spec: ChartSpec): string {
  throw new Error("not implemented");
}

/**
 * Command-line entry: read JSON from stdin and write SVG to stdout. On
 * `ChartError`, write `<code>: <message>` to stderr and exit 2.
 */
function main(): Promise<void> {
  throw new Error("not implemented");
}

if (import.meta.main) {
  await main();
}
