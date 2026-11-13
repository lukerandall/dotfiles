import assert from "node:assert/strict";
import {
  ChartError,
  type ChartErrorCode,
  type ChartSpec,
  MAX_ANNOTATION_CHARS,
  MAX_DOT_CATEGORIES,
  MAX_LINE_SERIES,
  MAX_STRIP_GROUPS,
  MAX_STRIP_POINTS,
  render,
  type Row,
} from "./chart.ts";

// Helpers ------------------------------------------------------------------

const MONTHS = [
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
];

function seriesRows(names: string[], values = [10, 14, 13, 18, 22, 25]): Row[] {
  return names.flatMap((s, k) =>
    MONTHS.map((m, i) => ({ month: m, value: values[i] + k * 7, who: s }))
  );
}

function line(over: Record<string, unknown> = {}): ChartSpec {
  return {
    form: "line",
    rows: seriesRows(["north", "south"]),
    x: "month",
    y: "value",
    series: "who",
    finding: "North grew faster than south.",
    ...over,
  } as ChartSpec;
}

function oneLine(over: Record<string, unknown> = {}): ChartSpec {
  return {
    form: "line",
    rows: seriesRows(["north"]),
    x: "month",
    y: "value",
    finding: "Sales rose.",
    ...over,
  } as ChartSpec;
}

function spark(over: Record<string, unknown> = {}): ChartSpec {
  return {
    form: "sparkline",
    rows: seriesRows(["north"]),
    x: "month",
    y: "value",
    finding: "Sales rose.",
    ...over,
  } as ChartSpec;
}

function multiples(over: Record<string, unknown> = {}): ChartSpec {
  return {
    form: "multiples",
    rows: seriesRows(["north", "south", "east", "west"]),
    x: "month",
    y: "value",
    series: "who",
    finding: "All regions rose.",
    ...over,
  } as ChartSpec;
}

function slopeRows(names: string[]): Row[] {
  return names.flatMap((s, k) => [
    { when: "2024", value: 10 + k * 3, who: s },
    { when: "2025", value: 12 + ((k * 7) % 11) * 3, who: s },
  ]);
}

function slope(over: Record<string, unknown> = {}): ChartSpec {
  return {
    form: "slope",
    rows: slopeRows(["a", "b", "c"]),
    x: "when",
    y: "value",
    series: "who",
    finding: "Most categories rose.",
    ...over,
  } as ChartSpec;
}

const REGIONS = ["north", "south", "east", "west", "central"];

function dotRows(values = [42, 17, 35, 28, 50]): Row[] {
  return REGIONS.map((region, i) => ({ region, value: values[i] }));
}

function dot(over: Record<string, unknown> = {}): ChartSpec {
  return {
    form: "dot",
    rows: dotRows(),
    x: "region",
    y: "value",
    finding: "Central is highest.",
    ...over,
  } as ChartSpec;
}

/** Two measures per region. Differences: north +2, south +14, east -10... */
function dumbbellRows(): Row[] {
  const before = [20, 30, 40, 50, 60];
  const after = [22, 44, 30, 50, 75];
  return REGIONS.flatMap((region, i) => [
    { region, year: "2025", value: before[i] },
    { region, year: "2026", value: after[i] },
  ]);
}

function dumbbell(over: Record<string, unknown> = {}): ChartSpec {
  return dot({
    rows: dumbbellRows(),
    series: "year",
    finding: "Central and south rose most.",
    ...over,
  });
}

const TEAMS = ["A", "B", "C", "D"];
const QUARTERS = ["2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4"];

/** Scores by team and quarter. A leads in Q1 and Q2, D leads from Q3. */
function bumpRows(teams = TEAMS): Row[] {
  const score: Record<string, number[]> = {
    A: [90, 80, 60, 50],
    B: [70, 75, 70, 65],
    C: [60, 50, 65, 80],
    D: [40, 55, 85, 95],
  };
  return teams.flatMap((team, k) =>
    QUARTERS.map((q, i) => ({
      quarter: q,
      score: score[team]?.[i] ?? 100 - k * 5 - i,
      team,
    }))
  );
}

function bump(over: Record<string, unknown> = {}): ChartSpec {
  return {
    form: "bump",
    rows: bumpRows(),
    x: "quarter",
    y: "score",
    series: "team",
    first: "highest",
    finding: "D rose to first.",
    ...over,
  } as ChartSpec;
}

/** A repeatable stream of numbers in [0, 1). */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function stripRows(perGroup = 30, groups = ["api", "db", "web"]): Row[] {
  const rand = lcg(7);
  return groups.flatMap((g, k) =>
    Array.from({ length: perGroup }, () => ({
      service: g,
      ms: Math.round((50 + k * 40 + rand() * 100) * 10) / 10,
    }))
  );
}

function strip(over: Record<string, unknown> = {}): ChartSpec {
  return {
    form: "strip",
    rows: stripRows(),
    x: "service",
    y: "ms",
    finding: "The web service is slowest.",
    ...over,
  } as ChartSpec;
}

/** The circles of an svg as [cx, cy, r]. */
function circles(svg: string): [number, number, number][] {
  return [
    ...svg.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)"/g),
  ]
    .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
}

function order(svg: string, ...labels: string[]): number[] {
  return labels.map((l) => svg.indexOf(`>${l}</text>`));
}

function refusal(spec: unknown): ChartError {
  try {
    render(spec as ChartSpec);
  } catch (e) {
    assert.ok(e instanceof ChartError, `expected ChartError, got ${e}`);
    return e;
  }
  assert.fail("render accepted a spec that should be refused");
}

function refuses(spec: unknown, code: ChartErrorCode): ChartError {
  const e = refusal(spec);
  assert.equal(e.code, code, e.message);
  assert.ok(e.message.length > 10, "message states the recovery");
  return e;
}

function admits(spec: unknown): string {
  return render(spec as ChartSpec);
}

// Output guarantees --------------------------------------------------------

const specs: Record<string, ChartSpec> = {
  sparkline: spark(),
  line: line(),
  oneLine: oneLine(),
  multiples: multiples(),
  slope: slope(),
  dot: dot(),
  dumbbell: dumbbell(),
  bump: bump(),
  strip: strip(),
};

for (const [name, spec] of Object.entries(specs)) {
  Deno.test(`${name}: output is one static svg with the guarantees`, () => {
    const svg = admits(spec);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/);
    assert.match(svg, /role="img"/);
    assert.match(svg, new RegExp(`aria-label="${spec.finding}"`));
    assert.ok(svg.endsWith("</svg>"));
    assert.equal(svg.match(/<svg/g)?.length, 1);
    for (const banned of ["<script", "<style", "<foreignObject", "<rect"]) {
      assert.ok(!svg.includes(banned), `contains ${banned}`);
    }
    assert.ok(!/\sid=/.test(svg), "no id attribute");
    assert.ok(svg.includes("currentColor"));
  });

  Deno.test(`${name}: same spec gives the same bytes`, () => {
    assert.equal(admits(spec), admits(structuredClone(spec)));
  });
}

Deno.test("escaping: no spec string can add markup", () => {
  const evil = `"><script>alert(1)</script>&`;
  const svg = admits(
    line({
      finding: evil,
      rows: seriesRows(["<b>x</b>", "o'k"]),
      annotations: [{
        at: { x: "2025-03", series: "<b>x</b>" },
        text: `<i>&"`,
      }],
    }),
  );
  assert.ok(!svg.includes("<script"));
  assert.ok(!svg.includes("<b>"));
  assert.ok(!svg.includes("<i>"));
  assert.ok(svg.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(svg.includes("&lt;i&gt;&amp;&quot;"));
  assert.ok(svg.includes("&quot;&gt;&lt;script&gt;"));
});

Deno.test("escaping: every printed string path is escaped", () => {
  const evil = `<u>&"`;
  const out = "&lt;u&gt;&amp;&quot;";
  // yFormat prefix and suffix appear on the range frame and end labels.
  const fmt = admits(
    oneLine({ yFormat: { prefix: evil, suffix: evil, decimals: 0 } }),
  );
  assert.ok(!fmt.includes("<u>"));
  assert.ok(fmt.includes(`${out}10${out}`));
  // Slope position labels and series names.
  const rows = slopeRows(["a", "b"]).map((r) => ({
    ...r,
    when: r.when === "2024" ? evil : "2025",
    who: `${r.who}${evil}`,
  }));
  const sl = admits(slope({ rows }));
  assert.ok(!sl.includes("<u>"));
  assert.ok(sl.includes(`>${out}</text>`));
  assert.ok(sl.includes(`a${out} 10`));
  // Multiples titles and the shared scale line.
  const mu = admits(
    multiples({
      rows: seriesRows([evil, "b"]),
      yFormat: { suffix: evil },
    }),
  );
  assert.ok(!mu.includes("<u>"));
  assert.ok(mu.includes(`>${out} 25${out}</text>`));
  assert.ok(mu.includes(`10${out} to 32${out}`));
});

// Content of each form -----------------------------------------------------

Deno.test("line: names each series at its end and prints the range frame", () => {
  const svg = admits(line());
  assert.match(svg, />north<\/text>/);
  assert.match(svg, />south<\/text>/);
  assert.match(svg, />10<\/text>/); // y minimum
  assert.match(svg, />32<\/text>/); // y maximum (25 + 7)
  assert.match(svg, />2025-01<\/text>/); // x as written
  assert.match(svg, />2025-06<\/text>/);
  assert.match(svg, /var\(--series-1, #[0-9a-fA-F]{6}\)/);
  assert.match(svg, /var\(--series-2, #[0-9a-fA-F]{6}\)/);
});

Deno.test("line: row order does not change the drawing", () => {
  const rows = seriesRows(["north", "south"]);
  const shuffled = [...rows].sort((a, b) =>
    String(a.month).localeCompare(String(b.month)) * -1 ||
    String(a.who).localeCompare(String(b.who))
  );
  // The first row decides series order, so keep north first.
  const first = shuffled.findIndex((r) => r.who === "north");
  const [north] = shuffled.splice(first, 1);
  shuffled.unshift(north);
  assert.equal(admits(line({ rows: shuffled })), admits(line({ rows })));
});

Deno.test("line: one line has no series name and numbers work on x", () => {
  const rows = [1, 2, 3, 4].map((i) => ({ t: i * 10, v: i * i }));
  const svg = admits({
    form: "line",
    rows,
    x: "t",
    y: "v",
    finding: "Quadratic.",
  });
  assert.match(svg, />10<\/text>/);
  assert.match(svg, />40<\/text>/);
  assert.match(svg, />16<\/text>/);
});

Deno.test("yFormat prints prefix, suffix, grouping and decimals", () => {
  const rows = [
    { t: 1, v: 1200.5 },
    { t: 2, v: 98000.25 },
  ];
  const svg = admits({
    form: "line",
    rows,
    x: "t",
    y: "v",
    finding: "Up.",
    yFormat: { decimals: 1, prefix: "$", suffix: "k" },
  });
  assert.match(svg, />\$1,200\.5k<\/text>/);
  assert.match(svg, />\$98,000\.3k<\/text>|>\$98,000\.2k<\/text>/);
});

Deno.test("yRange widens the scale and its ends are the frame labels", () => {
  const svg = admits(oneLine({ yRange: [0, 100] }));
  assert.match(svg, />0<\/text>/);
  assert.match(svg, />100<\/text>/);
});

Deno.test("sparkline: prints the last value and marks the extremes", () => {
  const svg = admits(spark());
  assert.match(svg, />25<\/text>/);
  assert.match(svg, /<circle/);
  assert.ok(!admits(spark({ extremes: false })).includes("<circle"));
  assert.match(svg, /viewBox="0 0 160 /);
});

Deno.test("multiples: one titled panel per series on shared scales", () => {
  const svg = admits(multiples());
  for (const s of ["north", "south", "east", "west"]) {
    assert.ok(svg.includes(s), s);
  }
  assert.equal(svg.match(/<path /g)?.length! >= 4, true);
  assert.match(svg, /viewBox="0 0 640 /);
});

Deno.test("multiples: columns sets the grid", () => {
  const one = admits(multiples({ columns: 1 }));
  const four = admits(multiples({ columns: 4 }));
  const h = (s: string) => Number(s.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)![1]);
  assert.ok(h(one) > h(four));
});

Deno.test("slope: labels both ends with name and value", () => {
  const svg = admits(slope());
  assert.match(svg, />a 10<\/text>/);
  assert.match(svg, />12 a<\/text>/);
});

Deno.test("slope: the first x in rows is the left position", () => {
  const rows = slopeRows(["a", "b"]).reverse();
  const svg = admits(slope({ rows }));
  // Row order reversed puts "2025" first, so a's 2025 value is on the left.
  assert.match(svg, /text-anchor="end"[^>]*>a 12<\/text>/);
});

Deno.test("slope: grows taller until the labels fit", () => {
  const few = admits(slope());
  const many = admits(
    slope({
      rows: slopeRows(Array.from({ length: 30 }, (_, i) => `c${i}`)).map((
        r,
      ) => ({ ...r, value: 5 })),
    }),
  );
  const h = (s: string) => Number(s.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)![1]);
  assert.ok(h(many) > h(few));
});

Deno.test("annotation: plain text beside its point with no box", () => {
  const svg = admits(
    line({
      annotations: [{
        at: { x: "2025-04", series: "north" },
        text: "Launch lifted sales.",
      }],
    }),
  );
  assert.match(svg, />Launch lifted sales\.<\/text>/);
  assert.ok(!svg.includes("<rect"));
});

Deno.test("dates: year, month, day and offset date-times are accepted", () => {
  for (
    const xs of [
      ["2020", "2021", "2022"],
      ["2020-01", "2020-02", "2020-03"],
      ["2020-01-01", "2020-01-02", "2020-01-03"],
      [
        "2020-01-01T00:00:00Z",
        "2020-01-01T02:00:00+01:00",
        "2020-01-01T09:00:00Z",
      ],
    ]
  ) {
    const rows = xs.map((t, i) => ({ t, v: i + 1 }));
    const svg = admits({ form: "line", rows, x: "t", y: "v", finding: "f." });
    assert.ok(
      svg.includes(`>${xs[0]}</text>`) || svg.includes(`>${xs[2]}</text>`),
    );
  }
});

// Refusals, each with a twin that is admitted ------------------------------

Deno.test("invalid_spec: input is not an object", () => {
  refuses(null, "invalid_spec");
  refuses("line", "invalid_spec");
  refuses([], "invalid_spec");
  admits(oneLine());
});

Deno.test("invalid_spec: form", () => {
  refuses({ ...oneLine(), form: "pie" }, "invalid_spec");
  refuses({ ...oneLine(), form: undefined }, "invalid_spec");
  admits(oneLine());
});

Deno.test("invalid_spec: unknown field, including one from another form", () => {
  refuses({ ...oneLine(), anotations: [] }, "invalid_spec");
  refuses({ ...spark(), series: "who" }, "invalid_spec");
  refuses({ ...oneLine(), extremes: true }, "invalid_spec");
  refuses({ ...oneLine(), columns: 2 }, "invalid_spec");
  admits({ ...oneLine(), annotations: [] });
});

Deno.test("invalid_spec: finding", () => {
  refuses({ ...oneLine(), finding: "" }, "invalid_spec");
  refuses({ ...oneLine(), finding: 3 }, "invalid_spec");
  admits(oneLine({ finding: "x" }));
});

Deno.test("invalid_spec: width bound", () => {
  refuses(oneLine({ width: 39 }), "invalid_spec");
  refuses(oneLine({ width: "wide" }), "invalid_spec");
  refuses(oneLine({ width: Infinity }), "invalid_spec");
  admits(spark({ width: 80 }));
});

Deno.test("invalid_spec: yRange order and shape", () => {
  refuses(oneLine({ yRange: [10, 0] }), "invalid_spec");
  refuses(oneLine({ yRange: [0] }), "invalid_spec");
  refuses(oneLine({ yRange: [0, NaN] }), "invalid_spec");
  admits(oneLine({ yRange: [0, 10] }));
});

Deno.test("invalid_spec: yFormat fields", () => {
  refuses(oneLine({ yFormat: { decimals: 7 } }), "invalid_spec");
  refuses(oneLine({ yFormat: { decimals: 1.5 } }), "invalid_spec");
  refuses(oneLine({ yFormat: { prefix: 3 } }), "invalid_spec");
  refuses(oneLine({ yFormat: { digits: 2 } }), "invalid_spec");
  admits(oneLine({ yFormat: { decimals: 6 } }));
});

Deno.test("invalid_spec: columns, series and required series", () => {
  refuses(multiples({ columns: 0 }), "invalid_spec");
  refuses(multiples({ columns: 1.5 }), "invalid_spec");
  refuses({ ...multiples(), series: undefined }, "invalid_spec");
  refuses({ ...slope(), series: undefined }, "invalid_spec");
  admits(multiples({ columns: 2 }));
});

Deno.test("invalid_spec: annotation shape follows the form", () => {
  const at = { x: "2025-03" };
  refuses(line({ annotations: [{ at, text: "t" }] }), "invalid_spec");
  refuses(
    oneLine({ annotations: [{ at: { ...at, series: "north" }, text: "t" }] }),
    "invalid_spec",
  );
  admits(oneLine({ annotations: [{ at, text: "t" }] }));
});

Deno.test("invalid_spec: the width cannot hold the labels", () => {
  refuses(line({ width: 40 }), "invalid_spec");
  admits(line({ width: 300 }));
});

Deno.test("too_few_rows: no rows, or a line with one row", () => {
  refuses(oneLine({ rows: [] }), "too_few_rows");
  refuses(
    oneLine({ rows: [{ month: "2025-01", value: 1, who: "n" }] }),
    "too_few_rows",
  );
  refuses(
    line({
      rows: [...seriesRows(["a"]), { month: "2025-01", value: 1, who: "b" }],
    }),
    "too_few_rows",
  );
  admits(
    oneLine({
      rows: [{ month: "2025-01", value: 1 }, { month: "2025-02", value: 2 }],
    }),
  );
});

Deno.test("missing_column: names the row and the column", () => {
  const rows = seriesRows(["north"]);
  const broken = rows.map((r, i) =>
    i === 3 ? { month: r.month, who: r.who } : r
  );
  const e = refuses(oneLine({ rows: broken }), "missing_column");
  assert.equal(e.row, 3);
  assert.match(e.message, /value/);
  refuses(oneLine({ y: "nope" }), "missing_column");
  admits(oneLine({ rows }));
});

Deno.test("invalid_value: y must be a finite number", () => {
  const rows = seriesRows(["north"]);
  for (const bad of ["12", null, NaN, Infinity]) {
    const broken = rows.map((r, i) =>
      i === 2 ? { ...r, value: bad as number } : r
    );
    const e = refuses(oneLine({ rows: broken }), "invalid_value");
    assert.equal(e.row, 2);
  }
  admits(oneLine({ rows }));
});

Deno.test("invalid_value: x is a number or an ISO date, not a mix", () => {
  const mk = (xs: (string | number)[]) =>
    oneLine({ rows: xs.map((m, i) => ({ month: m, value: i })) });
  refuses(mk([1, "2025-01", 3]), "invalid_value");
  refuses(mk(["last week", "this week"]), "invalid_value");
  refuses(mk(["2025-13", "2025-14"]), "invalid_value");
  refuses(mk(["2025-01-01T00:00:00", "2025-01-02T00:00:00"]), "invalid_value");
  refuses(mk([1, NaN]), "invalid_value");
  admits(mk([1, 2, 3]));
  admits(mk(["2025-01", "2025-02"]));
});

Deno.test("invalid_value: series must be a string", () => {
  const rows = seriesRows(["north", "south"]).map((r, i) =>
    i === 1 ? { ...r, who: 7 } : r
  );
  refuses(line({ rows }), "invalid_value");
  admits(line());
});

Deno.test("duplicate_point: two rows of one line share an x", () => {
  const rows = [...seriesRows(["north"]), {
    month: "2025-02",
    value: 99,
    who: "north",
  }];
  const e = refuses(oneLine({ rows }), "duplicate_point");
  assert.equal(e.row, rows.length - 1);
  // The same x in different series is fine.
  admits(line());
});

Deno.test("slope_needs_two_positions: three positions or a missing end", () => {
  const rows = slopeRows(["a", "b"]);
  refuses(
    slope({ rows: [...rows, { when: "2026", value: 1, who: "a" }] }),
    "slope_needs_two_positions",
  );
  refuses(slope({ rows: rows.slice(0, 3) }), "slope_needs_two_positions");
  refuses(
    slope({ rows: rows.slice(0, 2).map((r) => ({ ...r, when: "2024" })) }),
    "duplicate_point",
  );
  admits(slope({ rows }));
});

Deno.test("annotation_matches_no_row", () => {
  const ok = { at: { x: "2025-03", series: "north" }, text: "t" };
  refuses(
    line({ annotations: [{ ...ok, at: { x: "2030-01", series: "north" } }] }),
    "annotation_matches_no_row",
  );
  refuses(
    line({ annotations: [{ ...ok, at: { x: "2025-03", series: "west" } }] }),
    "annotation_matches_no_row",
  );
  admits(line({ annotations: [ok] }));
});

Deno.test("annotation_too_long", () => {
  const at = { x: "2025-03", series: "north" };
  refuses(
    line({ annotations: [{ at, text: "x".repeat(MAX_ANNOTATION_CHARS + 1) }] }),
    "annotation_too_long",
  );
  admits(
    line({
      width: 1400,
      annotations: [{ at, text: "x".repeat(MAX_ANNOTATION_CHARS) }],
    }),
  );
});

Deno.test("annotation_does_not_fit: text wider than the chart", () => {
  const at = { x: "2025-03" };
  const text = "Sales doubled after the launch in March.";
  refuses(spark({ annotations: [{ at, text }] }), "annotation_does_not_fit");
  admits(spark({ annotations: [{ at, text: "Peak" }] }));
  admits(spark({ width: 420, annotations: [{ at, text }] }));
});

Deno.test("too_many_series: a ninth series", () => {
  const names = (n: number) => Array.from({ length: n }, (_, i) => `s${i}`);
  refuses(
    line({ rows: seriesRows(names(MAX_LINE_SERIES + 1)) }),
    "too_many_series",
  );
  admits(line({ rows: seriesRows(names(MAX_LINE_SERIES)) }));
  // multiples has no such limit.
  admits(multiples({ rows: seriesRows(names(MAX_LINE_SERIES + 1)) }));
});

Deno.test("labels_collide: end labels cannot be spread", () => {
  const names = Array.from({ length: 8 }, (_, i) => `s${i}`);
  const same = names.flatMap((s) =>
    MONTHS.map((m, i) => ({ month: m, value: 10 + i, who: s }))
  );
  refuses(line({ rows: same, width: 110 }), "labels_collide");
  // Wide chart: the labels are moved apart and still fit.
  const svg = admits(line({ rows: same, width: 640 }));
  assert.match(svg, />s7<\/text>/);
  // Few series at the narrow width fit.
  admits(line({ rows: same.filter((r) => r.who < "s2"), width: 110 }));
});

Deno.test("nothing is half drawn: a refusal throws before any output", () => {
  const e = refusal(oneLine({ rows: [] }));
  assert.equal(e.name, "ChartError");
});

// Command line -------------------------------------------------------------

async function cli(input: string) {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", new URL("./chart.ts", import.meta.url).pathname],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  const child = cmd.spawn();
  const w = child.stdin.getWriter();
  await w.write(new TextEncoder().encode(input));
  await w.close();
  const out = await child.output();
  return {
    code: out.code,
    stdout: new TextDecoder().decode(out.stdout),
    stderr: new TextDecoder().decode(out.stderr),
  };
}

Deno.test("cli: a good spec prints the svg and exits 0", async () => {
  const r = await cli(JSON.stringify(oneLine()));
  assert.equal(r.code, 0, r.stderr);
  assert.ok(r.stdout.startsWith("<svg "));
  assert.equal(r.stdout, admits(oneLine()) + "\n");
});

Deno.test("cli: a refused spec prints code and message to stderr, exit 2", async () => {
  const r = await cli(JSON.stringify(oneLine({ rows: [] })));
  assert.equal(r.code, 2);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /^too_few_rows: /);
});

Deno.test("cli: input that is not JSON is invalid_spec", async () => {
  const r = await cli("{not json");
  assert.equal(r.code, 2);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /^invalid_spec: /);
});

// Review findings ----------------------------------------------------------

Deno.test("palette: fallback colours are the dataviz light values in slot order", () => {
  const names = Array.from({ length: 8 }, (_, i) => `s${i}`);
  const rows = names.flatMap((s, k) =>
    MONTHS.map((m, i) => ({ month: m, value: i * 10 + k, who: s }))
  );
  const svg = admits(line({ rows, width: 900 }));
  const light = [
    "#2a78d6",
    "#eb6834",
    "#1baf7a",
    "#eda100",
    "#e87ba4",
    "#008300",
    "#6250d6",
    "#e34948",
  ];
  light.forEach((hex, i) => {
    assert.ok(svg.includes(`var(--series-${i + 1}, ${hex})`), `slot ${i + 1}`);
  });
});

Deno.test("line: a series that ends early is labelled clear of the other lines", () => {
  const long = [10, 14, 13, 18, 22, 25];
  const rows = [
    ...MONTHS.map((m, i) => ({ month: m, value: long[i], who: "long" })),
    ...MONTHS.slice(0, 3).map((m, i) => ({
      month: m,
      value: [11, 12, 14][i],
      who: "short",
    })),
  ];
  const svg = admits(line({ rows }));
  const tag = svg.match(
    /<text x="([\d.]+)" y="([\d.]+)"( dy="0.32em")?[^>]*>short<\/text>/,
  )!;
  assert.ok(tag, "label present");
  const x0 = Number(tag[1]);
  const mid = Number(tag[2]) + (tag[3] ? 0 : -3.5);
  const w = "short".length * 11 * 0.57;
  const d = svg.match(/<path d="([^"]+)"[^>]*stroke="var\(--series-1,/)![1];
  const nums = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);
  for (let i = 1; i < nums.length; i++) {
    for (let t = 0; t <= 1; t += 0.02) {
      const px = nums[i - 1][0] + (nums[i][0] - nums[i - 1][0]) * t;
      const py = nums[i - 1][1] + (nums[i][1] - nums[i - 1][1]) * t;
      const inside = px >= x0 - 1 && px <= x0 + w + 1 && py >= mid - 6.5 &&
        py <= mid + 6.5;
      assert.ok(!inside, `the long line crosses the label at ${px},${py}`);
    }
  }
  // Twin: series that all end together keep their labels in one column.
  const same = admits(line());
  const xs = ["north", "south"].map((n) =>
    Number(same.match(new RegExp(`<text x="([\\d.]+)"[^>]*>${n}</text>`))![1])
  );
  assert.equal(xs[0], xs[1]);
});

Deno.test("decimals: a value that is not an extreme never prints as one", () => {
  const rows = [1, 2, 9, 8.9].map((v, i) => ({ t: i, v }));
  const svg = admits({
    form: "sparkline",
    rows,
    x: "t",
    y: "v",
    finding: "f.",
  });
  assert.match(svg, />8\.9<\/text>/);
  assert.match(svg, />9\.0<\/text>/);
  // Twin: when no printed value is close to an extreme, whole numbers stay.
  const plain = admits(spark());
  assert.match(plain, />25<\/text>/);
  assert.ok(!plain.includes("25.0"));
});

Deno.test("multiples: the shared scale is printed once", () => {
  const svg = admits(multiples());
  const hits = svg.match(
    /Same scale in every panel: 10 to 46, 2025-01 to 2025-06/g,
  );
  assert.equal(hits?.length, 1);
});

// dot ----------------------------------------------------------------------

Deno.test("dot: the largest value is at the top and each value is printed", () => {
  const svg = admits(dot());
  const at = order(svg, "central", "north", "east", "west", "south");
  assert.ok(at.every((i) => i >= 0), "every category is a row label");
  assert.deepEqual([...at].sort((a, b) => a - b), at);
  assert.equal(circles(svg).length, 5);
  for (const v of ["50", "42", "35", "28", "17"]) {
    assert.ok(svg.includes(`>${v}</text>`), `prints ${v}`);
  }
});

Deno.test("dot: sort none keeps the order of first appearance", () => {
  const svg = admits(dot({ sort: "none" }));
  const at = order(svg, ...REGIONS);
  assert.deepEqual([...at].sort((a, b) => a - b), at);
});

Deno.test("dot: row order does not change the drawing", () => {
  const rows = dotRows();
  assert.equal(
    admits(dot({ rows })),
    admits(dot({ rows: [...rows].reverse() })),
  );
});

Deno.test("dot: a reference line is labelled once and the scale includes it", () => {
  const svg = admits(
    dot({
      reference: { value: 100, label: "Target" },
      yFormat: { prefix: "$" },
    }),
  );
  assert.equal(svg.match(/>Target<\/text>/g)?.length, 1);
  assert.ok(svg.includes(">$100</text>"), "the frame reaches the target");
});

Deno.test("dot: the frame labels the scale's two ends", () => {
  const svg = admits(dot({ yRange: [0, 60] }));
  assert.ok(svg.includes(">0</text>") && svg.includes(">60</text>"));
});

Deno.test("dot: an annotation is plain text beside its dot", () => {
  const svg = admits(
    dot({ annotations: [{ at: { x: "central" }, text: "Highest by 8." }] }),
  );
  assert.ok(svg.includes(">Highest by 8.</text>"));
  assert.ok(!svg.includes("<rect"));
});

Deno.test("dot: grows taller with the categories", () => {
  const h = (svg: string) =>
    Number(svg.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)![1]);
  const many = Array.from({ length: 30 }, (_, i) => ({ c: `c${i}`, v: i }));
  assert.ok(h(admits(dot({ rows: many, x: "c", y: "v" }))) > h(admits(dot())));
});

Deno.test("dumbbell: sorts by signed difference, rises first", () => {
  const svg = admits(dumbbell());
  // Differences: south +14, central +15, north +2, west 0, east -10.
  const at = order(svg, "central", "south", "north", "west", "east");
  assert.ok(at.every((i) => i >= 0));
  assert.deepEqual([...at].sort((a, b) => a - b), at);
  assert.equal(circles(svg).length, 10);
});

Deno.test("dumbbell: names each measure once, at its dot", () => {
  const svg = admits(dumbbell());
  assert.equal(svg.match(/>2025<\/text>/g)?.length, 1);
  assert.equal(svg.match(/>2026<\/text>/g)?.length, 1);
  assert.ok(svg.includes("var(--series-1"));
  assert.ok(svg.includes("var(--series-2"));
});

Deno.test("dumbbell: sort value and none are accepted", () => {
  const byValue = admits(dumbbell({ sort: "value" }));
  const at = order(byValue, "central", "west", "east", "south", "north");
  assert.deepEqual([...at].sort((a, b) => a - b), at);
  admits(dumbbell({ sort: "none" }));
});

Deno.test("dumbbell: equal measures draw both dots without a gap line", () => {
  const rows = REGIONS.flatMap((region) => [
    { region, year: "2025", value: 10 },
    { region, year: "2026", value: 10 },
  ]);
  assert.equal(circles(admits(dumbbell({ rows }))).length, 10);
});

Deno.test("dumbbell: an annotation names its measure", () => {
  const svg = admits(
    dumbbell({
      annotations: [{ at: { x: "central", series: "2026" }, text: "Up 15." }],
    }),
  );
  assert.ok(svg.includes(">Up 15.</text>"));
});

Deno.test("dot: escapes categories, the reference label and annotations", () => {
  const evil = `<u>&"`;
  const out = "&lt;u&gt;&amp;&quot;";
  const rows = dotRows().map((r, i) => i === 0 ? { ...r, region: evil } : r);
  const svg = admits(
    dot({
      rows,
      reference: { value: 30, label: evil },
      annotations: [{ at: { x: evil }, text: evil }],
      finding: evil,
    }),
  );
  assert.ok(!svg.includes("<u>"));
  assert.ok(svg.includes(`>${out}</text>`));
  const db = admits(
    dumbbell({
      rows: dumbbellRows().map((r) => ({ ...r, year: `${r.year}${evil}` })),
    }),
  );
  assert.ok(!db.includes("<u>"));
  assert.ok(db.includes(`2025${out}`));
});

// bump ---------------------------------------------------------------------

Deno.test("bump: ranks each position by the direction in first", () => {
  const high = admits(bump());
  // Highest score first: A leads Q1 (rank 1), D has the lowest score (rank 4).
  assert.ok(high.includes(">A 1</text>"));
  assert.ok(high.includes(">D 4</text>"));
  assert.ok(high.includes(">1 D</text>"), "D leads the last quarter");
  const low = admits(bump({ first: "lowest" }));
  assert.ok(low.includes(">D 1</text>"));
  assert.ok(low.includes(">A 4</text>"));
});

Deno.test("bump: names every series at both ends and every position", () => {
  const svg = admits(bump());
  for (const t of TEAMS) {
    assert.equal(svg.match(new RegExp(`>${t} \\d</text>`, "g"))?.length, 1);
    assert.equal(svg.match(new RegExp(`>\\d ${t}</text>`, "g"))?.length, 1);
  }
  for (const q of QUARTERS) assert.ok(svg.includes(`>${q}</text>`));
});

Deno.test("bump: numbers and ISO dates are put in order, labels keep their order", () => {
  const dated = bumpRows().map((r) => ({
    ...r,
    quarter: `2025-0${QUARTERS.indexOf(String(r.quarter)) + 1}`,
  }));
  const svg = admits(bump({ rows: [...dated].reverse() }));
  const at = order(svg, "2025-01", "2025-02", "2025-03", "2025-04");
  assert.ok(at.every((i) => i >= 0));
  assert.deepEqual([...at].sort((a, b) => a - b), at);
  const lab = order(admits(bump()), ...QUARTERS);
  assert.deepEqual([...lab].sort((a, b) => a - b), lab);
  const nums: Row[] = bumpRows().map((r) => ({
    ...r,
    quarter: QUARTERS.indexOf(String(r.quarter)) + 10,
  }));
  // Reverse the positions inside each series, which keeps the series order.
  const backwards = TEAMS.flatMap((t) =>
    nums.filter((r) => r.team === t).reverse()
  );
  assert.equal(admits(bump({ rows: nums })), admits(bump({ rows: backwards })));
});

Deno.test("bump: highlighted series take colours and the rest are faint", () => {
  const svg = admits(bump({ highlight: ["D", "A"] }));
  assert.ok(svg.includes("var(--series-1"));
  assert.ok(svg.includes("var(--series-2"));
  assert.ok(!svg.includes("var(--series-3"));
  assert.ok(svg.includes(`stroke="currentColor"`));
  const plain = admits(bump());
  assert.ok(plain.includes("var(--series-4"));
});

Deno.test("bump: ten series are drawn when a highlight is given", () => {
  const names = Array.from({ length: 10 }, (_, i) => `T${i}`);
  const rows = names.flatMap((team, k) =>
    QUARTERS.map((quarter, i) => ({
      quarter,
      team,
      score: ((k * (i + 1) + i) % 11) * 10,
    }))
  );
  const svg = admits(bump({ rows, highlight: ["T0", "T9"] }));
  assert.equal(svg.match(/>T\d \d+<\/text>/g)?.length, 10);
});

Deno.test("bump: an annotation sits beside a point of its series", () => {
  const svg = admits(
    bump({
      annotations: [{
        at: { x: "2025 Q3", series: "D" },
        text: "D takes the lead.",
      }],
    }),
  );
  assert.ok(svg.includes(">D takes the lead.</text>"));
});

Deno.test("bump: escapes series, positions and annotations", () => {
  const evil = `<u>&"`;
  const out = "&lt;u&gt;&amp;&quot;";
  const rows = bumpRows().map((r) => ({
    ...r,
    team: `${r.team}${evil}`,
    quarter: r.quarter === "2025 Q1" ? evil : r.quarter,
  }));
  const svg = admits(bump({
    rows,
    annotations: [{ at: { x: "2025 Q3", series: `D${evil}` }, text: evil }],
  }));
  assert.ok(!svg.includes("<u>"));
  assert.ok(svg.includes(`>A${out} 1</text>`));
  assert.ok(svg.includes(`>${out}</text>`));
});

// strip --------------------------------------------------------------------

Deno.test("strip: no two dots overlap", () => {
  const rows = stripRows(120);
  const c = circles(admits(strip({ rows })));
  assert.equal(c.length, rows.length);
  for (let i = 0; i < c.length; i++) {
    for (let j = i + 1; j < c.length; j++) {
      const d = Math.hypot(c[i][0] - c[j][0], c[i][1] - c[j][1]);
      assert.ok(d >= c[i][2] + c[j][2] - 0.02, `dots ${i} and ${j} overlap`);
    }
  }
});

Deno.test("strip: a group with no overlap stays on one line", () => {
  const rows = [10, 30, 50, 70, 90].map((ms) => ({ service: "api", ms }));
  const ys = new Set(circles(admits(strip({ rows }))).map((c) => c[1]));
  assert.equal(ys.size, 1);
});

Deno.test("strip: orders groups by median, largest first, and prints it", () => {
  const svg = admits(strip());
  const at = order(svg, "web", "db", "api");
  assert.ok(at.every((i) => i >= 0));
  assert.deepEqual([...at].sort((a, b) => a - b), at);
  assert.equal(svg.match(/median /g)?.length, 3);
  const none = admits(strip({ sort: "none", median: false }));
  assert.ok(!none.includes("median"));
  const first = order(none, "api", "db", "web");
  assert.deepEqual([...first].sort((a, b) => a - b), first);
});

Deno.test("strip: an annotation takes the first of equal observations", () => {
  const rows = [10, 10, 20, 90].map((ms) => ({ service: "api", ms }));
  const svg = admits(
    strip({
      rows,
      annotations: [{ at: { x: "api", y: 90 }, text: "Slowest." }],
    }),
  );
  assert.ok(svg.includes(">Slowest.</text>"));
  admits(
    strip({ rows, annotations: [{ at: { x: "api", y: 10 }, text: "Two." }] }),
  );
});

Deno.test("strip: escapes group names and annotations", () => {
  const evil = `<u>&"`;
  const rows = stripRows(5).map((r) => ({
    ...r,
    service: `${r.service}${evil}`,
  }));
  const svg = admits(
    strip({
      rows,
      annotations: [{
        at: { x: `api${evil}`, y: Number(stripRows(5)[0].ms) },
        text: evil,
      }],
    }),
  );
  assert.ok(!svg.includes("<u>"));
  assert.ok(svg.includes("api&lt;u&gt;&amp;&quot;"));
});

// Refusals of the three new forms, each with an admitted twin -------------------

Deno.test("invalid_spec: dot, bump and strip fields", () => {
  refuses(dot({ sort: "difference" }), "invalid_spec");
  refuses(dumbbell({ sort: "median" }), "invalid_spec");
  refuses(dot({ first: "lowest" }), "invalid_spec");
  refuses(dot({ reference: { value: 3 } }), "invalid_spec");
  refuses(dot({ reference: { value: "3", label: "t" } }), "invalid_spec");
  refuses(
    dot({ reference: { value: 3, label: "t", colour: "red" } }),
    "invalid_spec",
  );
  refuses(dot({ series: "" }), "invalid_spec");
  admits(dot({ sort: "none", reference: { value: 3, label: "t" } }));
  refuses({ ...bump(), first: undefined }, "invalid_spec");
  refuses(bump({ first: "best" }), "invalid_spec");
  refuses({ ...bump(), series: undefined }, "invalid_spec");
  refuses(bump({ yRange: [0, 1] }), "invalid_spec");
  refuses(bump({ yFormat: { decimals: 1 } }), "invalid_spec");
  refuses(bump({ highlight: [] }), "invalid_spec");
  refuses(bump({ highlight: ["A", "A"] }), "invalid_spec");
  refuses(bump({ highlight: ["Z"] }), "invalid_spec");
  refuses(bump({ highlight: "A" }), "invalid_spec");
  refuses(
    bump({
      highlight: Array.from({ length: MAX_LINE_SERIES + 1 }, (_, i) => `h${i}`),
    }),
    "invalid_spec",
  );
  admits(bump({ highlight: ["A"] }));
  refuses(strip({ sort: "value" }), "invalid_spec");
  refuses(strip({ median: "yes" }), "invalid_spec");
  refuses(strip({ series: "service" }), "invalid_spec");
  admits(strip({ sort: "none", median: false }));
  refuses(dot({ width: 20 }), "invalid_spec");
  refuses(dot({ finding: " " }), "invalid_spec");
  refuses(strip({ width: 40 }), "invalid_spec");
  admits(dot({ width: 300 }));
});

Deno.test("too_few_rows: dot, bump and strip", () => {
  refuses(dot({ rows: [] }), "too_few_rows");
  refuses(dot({ rows: dotRows().slice(0, 1) }), "too_few_rows");
  admits(dot({ rows: dotRows().slice(0, 2) }));
  refuses(bump({ rows: bumpRows(["A"]) }), "too_few_rows");
  refuses(
    bump({ rows: bumpRows().filter((r) => r.quarter === "2025 Q1") }),
    "too_few_rows",
  );
  admits(bump({ rows: bumpRows(["A", "B"]) }));
  refuses(strip({ rows: [] }), "too_few_rows");
  admits(strip({ rows: stripRows(1, ["only"]) }));
});

Deno.test("missing_column and invalid_value: the new forms", () => {
  const noValue = dotRows().map((r, i) => i === 2 ? { region: r.region } : r);
  refuses(dot({ rows: noValue }), "missing_column");
  refuses(
    dot({ rows: dotRows().map((r, i) => i === 1 ? { ...r, value: "17" } : r) }),
    "invalid_value",
  );
  refuses(
    dot({
      rows: dotRows().map((r, i) => i === 1 ? { ...r, region: null } : r),
    }),
    "invalid_value",
  );
  refuses(
    dumbbell({
      rows: dumbbellRows().map((r, i) => i === 0 ? { ...r, year: 2025 } : r),
    }),
    "invalid_value",
  );
  refuses(
    bump({ rows: bumpRows().map((r, i) => i === 3 ? { ...r, team: 4 } : r) }),
    "invalid_value",
  );
  refuses(
    bump({
      rows: bumpRows().map((r, i) => i === 3 ? { ...r, score: NaN } : r),
    }),
    "invalid_value",
  );
  refuses(
    bump({
      rows: bumpRows().map((r, i) => i === 3 ? { ...r, quarter: null } : r),
    }),
    "invalid_value",
  );
  refuses(
    strip({
      rows: stripRows().map((r, i) => i === 4 ? { ...r, ms: null } : r),
    }),
    "invalid_value",
  );
  refuses(
    strip({
      rows: stripRows().map((r, i) => i === 4 ? { ...r, service: {} } : r),
    }),
    "invalid_value",
  );
  refuses(
    strip({ rows: stripRows().map((r) => ({ service: r.service })) }),
    "missing_column",
  );
  admits(
    dot({ rows: dotRows().map((r, i) => ({ ...r, region: i })) }),
  );
});

Deno.test("duplicate_point: a dot category or a bump series repeated", () => {
  refuses(
    dot({ rows: [...dotRows(), { region: "north", value: 1 }] }),
    "duplicate_point",
  );
  refuses(
    dumbbell({
      rows: [...dumbbellRows(), { region: "north", year: "2025", value: 9 }],
    }),
    "duplicate_point",
  );
  refuses(
    bump({
      rows: [...bumpRows(), { quarter: "2025 Q1", team: "A", score: 1 }],
    }),
    "duplicate_point",
  );
  // Strip rows are observations and may repeat.
  admits(strip({ rows: [...stripRows(), ...stripRows(1)] }));
});

Deno.test("dumbbell_needs_two_measures: three measures, or a category lacking one", () => {
  refuses(
    dumbbell({
      rows: [...dumbbellRows(), { region: "north", year: "2027", value: 5 }],
    }),
    "dumbbell_needs_two_measures",
  );
  refuses(
    dumbbell({ rows: dumbbellRows().filter((r) => r.year === "2025") }),
    "dumbbell_needs_two_measures",
  );
  refuses(
    dumbbell({ rows: dumbbellRows().slice(1) }),
    "dumbbell_needs_two_measures",
  );
  admits(dumbbell());
});

Deno.test("series_incomplete, tied_rank and highlight_needed", () => {
  refuses(bump({ rows: bumpRows().slice(1) }), "series_incomplete");
  admits(bump());
  const tied = bumpRows().map((r) =>
    r.team === "B" && r.quarter === "2025 Q1" ? { ...r, score: 90 } : r
  );
  refuses(bump({ rows: tied }), "tied_rank");
  admits(
    bump({
      rows: tied.map((r) =>
        r.team === "B" && r.quarter === "2025 Q1" ? { ...r, score: 91 } : r
      ),
    }),
  );
  const names = Array.from({ length: MAX_LINE_SERIES + 1 }, (_, i) => `T${i}`);
  const rows = names.flatMap((team, k) =>
    QUARTERS.map((quarter, i) => ({ quarter, team, score: k * 10 + i }))
  );
  refuses(bump({ rows }), "highlight_needed");
  admits(bump({ rows, highlight: ["T0"] }));
  admits(bump({ rows: rows.filter((r) => r.team !== "T8") }));
});

Deno.test("too_many_categories: 61 dot categories, 13 strip groups", () => {
  const cats = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ c: `c${i}`, v: i * 3 + 1 }));
  refuses(
    dot({ rows: cats(MAX_DOT_CATEGORIES + 1), x: "c", y: "v" }),
    "too_many_categories",
  );
  admits(dot({ rows: cats(MAX_DOT_CATEGORIES), x: "c", y: "v" }));
  const groups = (n: number) =>
    stripRows(2, Array.from({ length: n }, (_, i) => `g${i}`));
  refuses(strip({ rows: groups(MAX_STRIP_GROUPS + 1) }), "too_many_categories");
  admits(strip({ rows: groups(MAX_STRIP_GROUPS) }));
});

Deno.test("too_many_rows: 5001 strip observations", () => {
  const rows = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ service: `g${i % 4}`, ms: i }));
  refuses(
    strip({ rows: rows(MAX_STRIP_POINTS + 1), width: 20000 }),
    "too_many_rows",
  );
  admits(strip({ rows: rows(MAX_STRIP_POINTS), width: 20000 }));
});

Deno.test("points_collide: a strip too crowded for its width", () => {
  const rows = Array.from(
    { length: 1000 },
    (_, i) => ({ service: "api", ms: i / 1000 }),
  );
  refuses(strip({ rows, width: 200 }), "points_collide");
  admits(strip({ rows, width: 4000 }));
  const same = Array.from({ length: 100 }, () => ({ service: "api", ms: 5 }));
  refuses(strip({ rows: same }), "points_collide");
  admits(strip({ rows: same.slice(0, 10) }));
});

Deno.test("annotations of the new forms: shape, matching and length", () => {
  refuses(
    dot({ annotations: [{ at: { x: "nowhere" }, text: "t" }] }),
    "annotation_matches_no_row",
  );
  refuses(
    dot({ annotations: [{ at: { x: "north", series: "2025" }, text: "t" }] }),
    "invalid_spec",
  );
  refuses(
    dumbbell({ annotations: [{ at: { x: "north" }, text: "t" }] }),
    "invalid_spec",
  );
  refuses(
    dumbbell({
      annotations: [{ at: { x: "north", series: "1999" }, text: "t" }],
    }),
    "annotation_matches_no_row",
  );
  refuses(
    bump({ annotations: [{ at: { x: "2025 Q1", series: "Z" }, text: "t" }] }),
    "annotation_matches_no_row",
  );
  refuses(
    bump({ annotations: [{ at: { x: "2025 Q1" }, text: "t" }] }),
    "invalid_spec",
  );
  refuses(
    strip({ annotations: [{ at: { x: "api", y: -1 }, text: "t" }] }),
    "annotation_matches_no_row",
  );
  refuses(
    strip({ annotations: [{ at: { x: "api" }, text: "t" }] }),
    "invalid_spec",
  );
  const long = "x".repeat(MAX_ANNOTATION_CHARS + 1);
  refuses(
    dot({ annotations: [{ at: { x: "north" }, text: long }] }),
    "annotation_too_long",
  );
  admits(
    dot({
      annotations: [{
        // The smallest value has free room to the right of its dot.
        at: { x: "south" },
        text: "x".repeat(MAX_ANNOTATION_CHARS),
      }],
    }),
  );
});

Deno.test("annotation_does_not_fit and the width check for the new forms", () => {
  refuses(dot({ width: 60 }), "invalid_spec");
  refuses(bump({ width: 80 }), "invalid_spec");
  refuses(strip({ width: 70 }), "invalid_spec");
  admits(bump({ width: 400 }));
  refuses(
    dot({
      width: 200,
      annotations: [{ at: { x: "central" }, text: "x".repeat(70) }],
    }),
    "annotation_does_not_fit",
  );
});

Deno.test("an unknown form message lists all seven forms", () => {
  const e = refuses({ ...oneLine(), form: "pie" }, "invalid_spec");
  for (
    const f of [
      "sparkline",
      "line",
      "multiples",
      "slope",
      "dot",
      "bump",
      "strip",
    ]
  ) {
    assert.ok(e.message.includes(f), f);
  }
});

Deno.test("cli: a dot spec prints the svg", async () => {
  const r = await cli(JSON.stringify(dot()));
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.stdout, admits(dot()) + "\n");
  const bad = await cli(JSON.stringify(dot({ rows: [] })));
  assert.equal(bad.code, 2);
  assert.match(bad.stderr, /^too_few_rows: /);
});

// Nothing is cropped ---------------------------------------------------------

/**
 * Everything the svg draws that lies outside its viewBox: circles with their
 * radius, text with an estimated width from its anchor, rects, lines and the
 * coordinate pairs of paths.
 */
function outside(svg: string): string[] {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!;
  const W = Number(vb[1]);
  const H = Number(vb[2]);
  const eps = 0.5;
  const bad: string[] = [];
  const check = (
    what: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) => {
    if (x0 < -eps || y0 < -eps || x1 > W + eps || y1 > H + eps) {
      bad.push(`${what} [${x0}, ${y0}, ${x1}, ${y1}] outside 0 0 ${W} ${H}`);
    }
  };
  const num = (tag: string, name: string) => {
    const m = tag.match(new RegExp(`\\s${name}="([-\\d.]+)"`));
    return m ? Number(m[1]) : undefined;
  };
  for (
    const m of svg.matchAll(
      /<(circle|text|rect|line|path)\b[^>]*>(?:([^<]*)<\/text>)?/g,
    )
  ) {
    const tag = m[0];
    if (m[1] === "circle") {
      const [cx, cy, r] = [num(tag, "cx")!, num(tag, "cy")!, num(tag, "r")!];
      check(tag, cx - r, cy - r, cx + r, cy + r);
    } else if (m[1] === "text") {
      const text = (m[2] ?? "").replace(/&(amp|lt|gt|quot|#39);/g, "x");
      const w = [...text].length * 11 * 0.57;
      const x = num(tag, "x")!;
      const y = num(tag, "y")!;
      const anchor = tag.match(/text-anchor="(\w+)"/)?.[1] ?? "start";
      const left = anchor === "start"
        ? x
        : anchor === "end"
        ? x - w
        : x - w / 2;
      check(`text ${text}`, left, y - 9, left + w, y + 2);
    } else if (m[1] === "rect") {
      const [x, y, w, h] = [
        num(tag, "x") ?? 0,
        num(tag, "y") ?? 0,
        num(tag, "width"),
        num(tag, "height"),
      ];
      if (w !== undefined && h !== undefined) check(tag, x, y, x + w, y + h);
    } else if (m[1] === "line") {
      check(
        tag,
        Math.min(num(tag, "x1")!, num(tag, "x2")!),
        Math.min(num(tag, "y1")!, num(tag, "y2")!),
        Math.max(num(tag, "x1")!, num(tag, "x2")!),
        Math.max(num(tag, "y1")!, num(tag, "y2")!),
      );
    } else {
      const d = tag.match(/ d="([^"]+)"/)?.[1] ?? "";
      const ns = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((v) => Number(v[0]));
      for (let i = 0; i + 1 < ns.length; i += 2) {
        check("path point", ns[i], ns[i + 1], ns[i], ns[i + 1]);
      }
    }
  }
  return bad;
}

function bumpOf(series: number, over: Record<string, unknown> = {}): ChartSpec {
  const names = Array.from({ length: series }, (_, i) => `team${i + 1}`);
  const rows = names.flatMap((team, k) =>
    QUARTERS.map((quarter, i) => ({
      quarter,
      team,
      rank: ((k + i * 3) % series) + 1,
    }))
  );
  return bump({
    rows,
    y: "rank",
    first: "lowest",
    highlight: names.slice(0, 3),
    ...over,
  });
}

Deno.test("bump: every rank of a 12-series and a 20-series chart is inside the viewBox", () => {
  for (const series of [10, 12, 20]) {
    const svg = admits(bumpOf(series));
    const H = Number(svg.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)![1]);
    const ys = circles(svg).map((c) => c[1]);
    assert.equal(ys.length, series * QUARTERS.length);
    assert.ok(
      Math.max(...ys) + 3 <= H,
      `${series} series: lowest dot is clipped`,
    );
    assert.ok(Math.min(...ys) - 3 >= 0);
    assert.deepEqual(outside(svg), []);
  }
});

const cropSpecs: Record<string, ChartSpec> = {
  ...specs,
  lineAnnotated: line({
    annotations: [{
      at: { x: "2025-06", series: "south" },
      text: "South ends higher than north.",
    }],
  }),
  lineNarrow: line({ width: 320 }),
  lineEarlyEnd: line({
    rows: seriesRows(["north", "south"]).filter((r) =>
      !(r.who === "south" && r.month === "2025-06")
    ),
  }),
  multiplesMany: multiples({
    rows: seriesRows(Array.from({ length: 12 }, (_, i) => `service ${i + 1}`)),
  }),
  slopeMany: slope({
    rows: slopeRows(Array.from({ length: 12 }, (_, i) => `category ${i + 1}`)),
  }),
  dotMany: dot({
    rows: Array.from(
      { length: 40 },
      (_, i) => ({ region: `region ${i}`, value: i * 3 }),
    ),
  }),
  dotReference: dot({ reference: { value: 30, label: "Target 30" } }),
  dumbbellDisparate: dumbbell({
    rows: [38000, 21000, 9500, 4200, 2600, 1500, 900, 520, 310, 160, 90, 45]
      .flatMap((v, i) => [
        { region: `region ${i}`, year: "2025", value: v },
        {
          region: `region ${i}`,
          year: "2026",
          value: Math.round(v * (1 + ((i % 5) - 2) * 0.15)),
        },
      ]),
  }),
  dotNegative: dot({ rows: dotRows([-12, 17, -35, 28, 50]) }),
  bump12: bumpOf(12),
  bump20: bumpOf(20),
  bumpAnnotated: bump({
    annotations: [{
      at: { x: "2025 Q3", series: "D" },
      text: "D takes the lead.",
    }],
  }),
  strip12: strip({
    rows: stripRows(
      40,
      Array.from({ length: 12 }, (_, i) => `service ${i + 1}`),
    ),
  }),
  stripAnnotated: strip({
    annotations: [{ at: { x: "db", y: 100 }, text: "Slow tail." }],
  }),
};

for (const [name, spec] of Object.entries(cropSpecs)) {
  Deno.test(`nothing is cropped: ${name} draws every mark and label inside its viewBox`, () => {
    let svg: string;
    try {
      svg = admits(spec);
    } catch (e) {
      if (e instanceof ChartError) return; // A refusal draws nothing to crop.
      throw e;
    }
    assert.deepEqual(outside(svg), []);
  });
}
