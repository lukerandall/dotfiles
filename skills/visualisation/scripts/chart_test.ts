import assert from "node:assert/strict";
import {
  ChartError,
  type ChartErrorCode,
  type ChartSpec,
  MAX_ANNOTATION_CHARS,
  MAX_LINE_SERIES,
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
    args: ["run", "-A", new URL("./chart.ts", import.meta.url).pathname],
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
