/**
 * Static SVG charts in four Tufte forms. This file is the interface only:
 * every function body throws until the implementation lands.
 *
 * Command line: `deno run chart.ts < spec.json > chart.svg`. A refused spec
 * writes nothing to stdout, prints the error's message to stderr and exits 2.
 * Other code imports `render` and nothing else.
 *
 * Planned libraries (see /evals/visualisation-helper-library): d3-scale,
 * d3-shape and d3-array, pinned to exact versions. No type from them appears
 * here, so the choice can change without changing a spec.
 */

/** One record of the input table. Column values are read by name. */
export type Row = Readonly<Record<string, string | number | null>>;

/**
 * A column name in `rows`. The alias exists so a spec reads as documentation;
 * `render` checks that every named column exists in every row.
 */
export type Column = string;

/**
 * A sentence written next to one data point. The text is plain, drawn with no
 * box, and is limited to `MAX_ANNOTATION_CHARS` characters. The point is the
 * row whose `x` column equals `at.x` and, when the form has series, whose
 * series column equals `at.series`.
 */
export interface Annotation {
  at: { x: string | number; series?: string };
  /** The finding, as a sentence. It is not a caption or a value label. */
  text: string;
}

export const MAX_ANNOTATION_CHARS = 80;

/** Fields every form accepts. */
export interface BaseSpec {
  /** The table to draw. Must be non-empty. */
  rows: readonly Row[];
  /** Column on the horizontal axis (time, or the two slope positions). */
  x: Column;
  /** Column on the vertical axis. Every value must be a finite number. */
  y: Column;
  /**
   * The finding the chart shows, as a sentence. It becomes the root's
   * `aria-label`, so it is required.
   */
  finding: string;
  /** Output width in SVG user units. Height follows from the form. Default 640. */
  width?: number;
  /** Inline findings placed beside their points. Default none. */
  annotations?: readonly Annotation[];
}

/** One small line with no axes and the last value printed after it. */
export interface SparklineSpec extends BaseSpec {
  form: "sparkline";
  /** Mark the minimum and maximum points and print their values. Default true. */
  extremes?: boolean;
}

/**
 * Several lines on one scale. Each series is named at the end of its line.
 * The y axis is a range frame: a line spanning the data minimum to maximum
 * with those two values as its only labels.
 */
export interface LineSpec extends BaseSpec {
  form: "line";
  /** Column that names the series. */
  series: Column;
}

/**
 * One panel per series, in a grid, on a shared y scale. Each panel is a
 * sparkline-sized line titled with its series name and last value.
 */
export interface MultiplesSpec extends BaseSpec {
  form: "multiples";
  series: Column;
  /** Panels per row. Default is chosen so panels are at least 120 units wide. */
  columns?: number;
}

/**
 * Two vertical positions joined by one line per series. `x` must hold exactly
 * two distinct values; the first (in row order) is the left position. Each
 * line is labelled with its series name and value at both ends.
 */
export interface SlopeSpec extends BaseSpec {
  form: "slope";
  series: Column;
}

/** Every spec the helper accepts. `form` selects the member. */
export type ChartSpec = SparklineSpec | LineSpec | MultiplesSpec | SlopeSpec;

export type ChartForm = ChartSpec["form"];

/** Why a spec was refused. Each code has one recovery, named in the message. */
export type ChartErrorCode =
  /** `form` is missing or not one of the four. Message lists the four. */
  | "unknown_form"
  /** A named column is absent from some row. Message names column and row. */
  | "missing_column"
  /** `rows` is empty, or a `y` value is not a finite number. Names first bad row. */
  | "bad_rows"
  /** A slope's `x` does not hold exactly two distinct values. */
  | "slope_needs_two_positions"
  /** An annotation's point matches no row, or its text exceeds the limit. */
  | "bad_annotation"
  /** Direct labels still collide after layout. Message says to use `multiples`. */
  | "labels_collide";

/** The only error `render` throws. The command line maps it to exit code 2. */
export class ChartError extends Error {
  constructor(
    readonly code: ChartErrorCode,
    message: string,
    /** Zero-based index of the first offending row, when the error has one. */
    readonly row?: number,
  ) {
    super(message);
    this.name = "ChartError";
  }
}

/**
 * Draw `spec` as one SVG fragment.
 *
 * The output has a `viewBox`, `role="img"`, an `aria-label` equal to
 * `spec.finding`, and `currentColor` for text and axes. Series colours are
 * `var(--chart-N, <fallback>)`. It never contains `<script>`, `<style>` or
 * `<foreignObject>`, so it is safe under a content security policy with no
 * scripts.
 *
 * The spec is validated completely before any drawing, so a thrown
 * `ChartError` means nothing was produced.
 *
 * @throws {ChartError}
 */
export function render(_spec: ChartSpec): string {
  throw new Error("not implemented");
}

/**
 * Command-line entry: read JSON from stdin, write SVG to stdout. On
 * `ChartError`, write `message` to stderr and exit 2. Runs only when this file
 * is the main module.
 */
export function main(): Promise<void> {
  throw new Error("not implemented");
}
