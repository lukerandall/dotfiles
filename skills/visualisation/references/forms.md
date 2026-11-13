# The four forms

Read this when step 2 of `SKILL.md` leaves more than one form possible. Each form below has the finding it suits, a spec for `scripts/chart.ts`, and the rule that rules it out.

## Sparkline

Suits: the shape of one series inside a sentence, a table cell or a row of a list. It shows the last value and, by default, the minimum and maximum.

```json
{"form":"sparkline","x":"week","y":"errors","finding":"Errors fell after the fix.","rows":[{"week":"2026-10-05","errors":40},{"week":"2026-10-12","errors":31},{"week":"2026-10-19","errors":12},{"week":"2026-10-26","errors":9}]}
```

Output for this spec:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" role="img" aria-label="Errors fell after the fix." font-size="11" fill="currentColor"><path d="M4,14L50.57,17.48L97.13,24.84L143.7,26" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><text x="149.7" y="26" dy="0.32em">9</text><circle cx="4" cy="14" r="2" fill="var(--series-1, #2a78d6)" stroke="none"/><text x="6.25" y="9" text-anchor="middle" fill-opacity="0.7">40</text><circle cx="143.7" cy="26" r="2" fill="var(--series-1, #2a78d6)" stroke="none"/></svg>
```

Not suited: a chart the reader must read values from. Use `line`.

## Annotated line

Suits: one to eight series over time, with one event or turning point to point at. Names sit at the line ends, and the axes are range frames. Use `form: "line"`, with `series` for several lines and `annotations` for the finding.

```json
{"form":"line","x":"month","y":"signups","series":"plan","finding":"Pro signups overtook Free in March.","annotations":[{"at":{"x":"2026-03","series":"pro"},"text":"Pro passes Free"}],"rows":[{"month":"2026-01","plan":"free","signups":120},{"month":"2026-02","plan":"free","signups":125},{"month":"2026-03","plan":"free","signups":126},{"month":"2026-01","plan":"pro","signups":80},{"month":"2026-02","plan":"pro","signups":110},{"month":"2026-03","plan":"pro","signups":140}]}
```

Output for this spec:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 192" role="img" aria-label="Pro signups overtook Free in March." font-size="11" fill="currentColor"><path d="M32.8,164V12" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.5"/><text x="28.8" y="12" text-anchor="end" dy="0.32em" fill-opacity="0.7">140</text><text x="28.8" y="164" text-anchor="end" dy="0.32em" fill-opacity="0.7">80</text><path d="M38.8,174H600.9" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.5"/><text x="38.8" y="187" fill-opacity="0.7">2026-01</text><text x="600.9" y="187" text-anchor="end" fill-opacity="0.7">2026-03</text><path d="M38.8,62.67L334.14,50L600.9,47.47" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M38.8,164L334.14,88L600.9,12" fill="none" stroke="var(--series-2, #eb6834)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><text x="607.9" y="47.47" dy="0.32em">free</text><text x="607.9" y="12" dy="0.32em">pro</text><path d="M600.9,12L568.9,12" fill="none" stroke="currentColor" stroke-width="0.75" stroke-opacity="0.5"/><text x="568.9" y="15.5" text-anchor="end">Pro passes Free</text></svg>
```

Not suited: more than eight series (the helper refuses with `too_many_series`) or end labels that collide (`labels_collide`). Use small multiples.

## Small multiples

Suits: many series that each need reading, such as twelve entities with a trend each. Every panel shares the x and y scales, so the reader compares shape and level. Use `form: "multiples"` with `series`, and `columns` to set the grid. When the panels are table rows, a table with a sparkline in each row is the alternative.

```json
{"form":"multiples","x":"day","y":"ms","series":"service","columns":3,"width":420,"yFormat":{"suffix":" ms"},"finding":"Search slowed while auth and billing held steady.","rows":[{"day":"2026-11-02","service":"search","ms":90},{"day":"2026-11-03","service":"search","ms":120},{"day":"2026-11-04","service":"search","ms":170},{"day":"2026-11-02","service":"auth","ms":100},{"day":"2026-11-03","service":"auth","ms":98},{"day":"2026-11-04","service":"auth","ms":101},{"day":"2026-11-02","service":"billing","ms":140},{"day":"2026-11-03","service":"billing","ms":135},{"day":"2026-11-04","service":"billing","ms":138}]}
```

Output for this spec:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 88" role="img" aria-label="Search slowed while auth and billing held steady." font-size="11" fill="currentColor"><text x="0" y="11">search 170 ms</text><path d="M3,63L65.33,48.38L127.67,24" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><text x="144.67" y="11">auth 101 ms</text><path d="M147.67,58.13L210,59.1L272.33,57.64" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><text x="289.33" y="11">billing 138 ms</text><path d="M292.33,38.63L354.67,41.06L417,39.6" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><text x="0" y="82" fill-opacity="0.7">Same scale in every panel: 90 ms to 170 ms, 2026-11-02 to 2026-11-04</text></svg>
```

Not suited: two or three series that cross each other. Use `line`.

## Slopegraph

Suits: a before and after value for each category, where the finding is which rose, which fell and which changed rank. `x` holds exactly two positions, and every series has one row at each. Use `form: "slope"`.

```json
{"form":"slope","x":"year","y":"share","series":"channel","width":420,"yFormat":{"suffix":"%"},"finding":"Email fell and search rose.","rows":[{"year":"2025","channel":"email","share":44},{"year":"2026","channel":"email","share":31},{"year":"2025","channel":"search","share":30},{"year":"2026","channel":"search","share":41},{"year":"2025","channel":"social","share":26},{"year":"2026","channel":"social","share":28}]}
```

Output for this spec:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 198" role="img" aria-label="Email fell and search rose." font-size="11" fill="currentColor"><text x="76.7" y="11" text-anchor="middle" fill-opacity="0.7">2025</text><text x="343.3" y="11" text-anchor="middle" fill-opacity="0.7">2026</text><path d="M76.7,24L343.3,139.56" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><text x="69.7" y="24" text-anchor="end" dy="0.32em">email 44%</text><text x="350.3" y="139.56" dy="0.32em">31% email</text><path d="M76.7,148.44L343.3,50.67" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><text x="69.7" y="148.44" text-anchor="end" dy="0.32em">search 30%</text><text x="350.3" y="50.67" dy="0.32em">41% search</text><path d="M76.7,184L343.3,166.22" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><text x="69.7" y="184" text-anchor="end" dy="0.32em">social 26%</text><text x="350.3" y="166.22" dy="0.32em">28% social</text></svg>
```

Not suited: more than two moments. Use `line`.
