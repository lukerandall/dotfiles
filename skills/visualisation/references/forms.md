# The helper's seven forms

Read this when step 4 of `SKILL.md` draws a form with the helper, to copy a spec. `choosing.md` says which form answers the question. Each form below has the finding it suits, a spec for `scripts/chart.ts`, and the case that rules it out.

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

## Dot plot

Suits: comparing one value across categories, such as the backlog of each queue. Readers judge position on a common scale more accurately than length or area, so a dot plot is the first choice for "which is most" (`choosing.md`). `x` names the category column and `y` the value. The helper sorts by value, largest at the top, and prints each value beside its dot. `reference` draws a labelled line at a target or an average.

```json
{"form":"dot","x":"queue","y":"open","finding":"Billing has the longest backlog, 41 items.","sort":"value","rows":[{"queue":"billing","open":41},{"queue":"search","open":18},{"queue":"auth","open":9},{"queue":"upload","open":23}],"reference":{"value":20,"label":"Target 20"},"annotations":[{"at":{"x":"billing"},"text":"Twice the target."}]}
```

Output for this spec:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 130" role="img" aria-label="Billing has the longest backlog, 41 items." font-size="11" fill="currentColor"><path d="M253.51,25V98" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.5"/><text x="253.51" y="21" text-anchor="middle" fill-opacity="0.7">Target 20</text><text x="55.9" y="30" text-anchor="end" dy="0.32em">billing</text><circle cx="615.5" cy="30" r="3.5" fill="var(--series-1, #2a78d6)"/><text x="622.5" y="30" dy="0.32em">41</text><text x="55.9" y="50" text-anchor="end" dy="0.32em">upload</text><circle cx="305.23" cy="50" r="3.5" fill="var(--series-1, #2a78d6)"/><text x="312.23" y="50" dy="0.32em">23</text><text x="55.9" y="70" text-anchor="end" dy="0.32em">search</text><circle cx="219.04" cy="70" r="3.5" fill="var(--series-1, #2a78d6)"/><text x="226.04" y="70" dy="0.32em">18</text><text x="55.9" y="90" text-anchor="end" dy="0.32em">auth</text><circle cx="63.9" cy="90" r="3.5" fill="var(--series-1, #2a78d6)"/><text x="70.9" y="90" dy="0.32em">9</text><path d="M63.9,108H615.5" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.5"/><text x="63.9" y="121" fill-opacity="0.7">9</text><text x="615.5" y="121" text-anchor="end" fill-opacity="0.7">41</text><text x="617.5" y="22" text-anchor="end">Twice the target.</text></svg>
```

Not suited: categories that are periods of one series (use `line`), and fewer than two categories. A target the reader must judge against is `reference`, never a second series.

## Dumbbell

Suits: two values per category, where the finding is the size and direction of the move, such as 2025 against 2026 for each region. It is a dot spec with `series` naming the column that holds the two measures. The helper draws one dot per measure joined by a thin line, names each measure once on the top row, and sorts by the second measure minus the first, so rises are at the top and falls at the bottom. Every category needs one row for each measure.

A paired comparison shows both values, because a percent change alone hides whether a rise is 5 items or 5,000. Pass the two values to the dumbbell, and put the percent change in a note (`annotations`) when the reader asks how much. Do not replace the pair with the percent. The axis is linear. When the categories span more than about 20 times from smallest to largest, the small ones sit on top of each other: split them into one dumbbell per size band (call the helper once for each band, so each has its own scale), or draw a log axis by hand. The helper has no log scale, and adding one would change its reviewed interface.

```json
{"form":"dot","x":"region","y":"orders","series":"year","finding":"Delta grew most and Coast fell.","rows":[{"region":"Delta","year":"2025","orders":120},{"region":"Delta","year":"2026","orders":310},{"region":"Hills","year":"2025","orders":900},{"region":"Hills","year":"2026","orders":950},{"region":"Coast","year":"2025","orders":500},{"region":"Coast","year":"2026","orders":380}]}
```

Output for this spec:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 110" role="img" aria-label="Delta grew most and Coast fell." font-size="11" fill="currentColor"><text x="43.4" y="30" text-anchor="end" dy="0.32em">Delta</text><path d="M74.2,30H196.67" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.35"/><circle cx="74.2" cy="30" r="3.5" fill="var(--series-1, #2a78d6)"/><circle cx="196.67" cy="30" r="3.5" fill="var(--series-2, #eb6834)"/><text x="67.2" y="30" text-anchor="end" dy="0.32em">120</text><text x="203.67" y="30" dy="0.32em">310</text><text x="43.4" y="50" text-anchor="end" dy="0.32em">Hills</text><path d="M576.97,50H609.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.35"/><circle cx="576.97" cy="50" r="3.5" fill="var(--series-1, #2a78d6)"/><circle cx="609.2" cy="50" r="3.5" fill="var(--series-2, #eb6834)"/><text x="569.97" y="50" text-anchor="end" dy="0.32em">900</text><text x="616.2" y="50" dy="0.32em">950</text><text x="43.4" y="70" text-anchor="end" dy="0.32em">Coast</text><path d="M241.79,70H319.14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.35"/><circle cx="319.14" cy="70" r="3.5" fill="var(--series-1, #2a78d6)"/><circle cx="241.79" cy="70" r="3.5" fill="var(--series-2, #eb6834)"/><text x="234.79" y="70" text-anchor="end" dy="0.32em">380</text><text x="326.14" y="70" dy="0.32em">500</text><text x="71.2" y="21" text-anchor="end" fill-opacity="0.7">2025</text><text x="199.67" y="21" fill-opacity="0.7">2026</text><path d="M74.2,88H609.2" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.5"/><text x="74.2" y="101" fill-opacity="0.7">120</text><text x="609.2" y="101" text-anchor="end" fill-opacity="0.7">950</text></svg>
```

Not suited: more than two measures (use `line` or `multiples`), and categories of very different size when the finding is relative change. Put the percentage change in `y` in that case, and say so in the finding.

## Bump chart

Suits: how the order of a set of series changes across ordered positions, such as ten teams over eight quarters. The helper ranks the series inside each position. `y` is a rank or a score, and `first` says whether the lowest or the highest `y` is rank 1. Every series needs a row at every position, and two equal `y` values at one position are refused with `tied_rank`. With more than eight series, `highlight` names the series the finding is about and the rest are drawn faint.

```json
{"form":"bump","x":"quarter","y":"rank","series":"team","first":"lowest","finding":"Red took the lead in Q3.","highlight":["Red"],"rows":[{"quarter":"Q1","team":"Red","rank":2},{"quarter":"Q2","team":"Red","rank":2},{"quarter":"Q3","team":"Red","rank":1},{"quarter":"Q1","team":"Blue","rank":1},{"quarter":"Q2","team":"Blue","rank":1},{"quarter":"Q3","team":"Blue","rank":3},{"quarter":"Q1","team":"Green","rank":3},{"quarter":"Q2","team":"Green","rank":3},{"quarter":"Q3","team":"Green","rank":2}],"annotations":[{"at":{"x":"Q3","series":"Red"},"text":"Red takes the lead."}]}
```

Output for this spec:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 102" role="img" aria-label="Red took the lead in Q3." font-size="11" fill="currentColor"><text x="57.9" y="11" text-anchor="middle" fill-opacity="0.7">Q1</text><text x="320" y="11" text-anchor="middle" fill-opacity="0.7">Q2</text><text x="582.1" y="11" text-anchor="middle" fill-opacity="0.7">Q3</text><path d="M57.9,34L320,34L582.1,86" fill="none" stroke="currentColor" stroke-width="1.25" stroke-opacity="0.35"/><circle cx="57.9" cy="34" r="3" fill="currentColor" fill-opacity="0.35"/><circle cx="320" cy="34" r="3" fill="currentColor" fill-opacity="0.35"/><circle cx="582.1" cy="86" r="3" fill="currentColor" fill-opacity="0.35"/><text x="50.9" y="34" text-anchor="end" dy="0.32em" fill-opacity="0.7">Blue 1</text><text x="589.1" y="86" dy="0.32em" fill-opacity="0.7">3 Blue</text><path d="M57.9,86L320,86L582.1,60" fill="none" stroke="currentColor" stroke-width="1.25" stroke-opacity="0.35"/><circle cx="57.9" cy="86" r="3" fill="currentColor" fill-opacity="0.35"/><circle cx="320" cy="86" r="3" fill="currentColor" fill-opacity="0.35"/><circle cx="582.1" cy="60" r="3" fill="currentColor" fill-opacity="0.35"/><text x="50.9" y="86" text-anchor="end" dy="0.32em" fill-opacity="0.7">Green 3</text><text x="589.1" y="60" dy="0.32em" fill-opacity="0.7">2 Green</text><path d="M57.9,60L320,60L582.1,34" fill="none" stroke="var(--series-1, #2a78d6)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="57.9" cy="60" r="3" fill="var(--series-1, #2a78d6)"/><circle cx="320" cy="60" r="3" fill="var(--series-1, #2a78d6)"/><circle cx="582.1" cy="34" r="3" fill="var(--series-1, #2a78d6)"/><text x="50.9" y="60" text-anchor="end" dy="0.32em">Red 2</text><text x="589.1" y="34" dy="0.32em">1 Red</text><text x="584.1" y="26" text-anchor="end">Red takes the lead.</text></svg>
```

Not suited: the values themselves matter more than the order (use `line` or `multiples`), and gaps in a series. A direction is required in `first`, because the wrong one draws the chart upside down.

## Strip plot

Suits: raw observations per group, when the spread, the clusters or the outliers are the finding, such as 200 response times for each of four services. Every row is one observation. Dots that would overlap are moved apart across the strip, so the strip becomes a beeswarm and no dot hides another. A median tick and its value are on by default.

```json
{"form":"strip","x":"service","y":"ms","finding":"Search has a slow second mode near 400 ms.","yFormat":{"suffix":" ms"},"rows":[{"service":"search","ms":90},{"service":"search","ms":95},{"service":"search","ms":100},{"service":"search","ms":102},{"service":"search","ms":410},{"service":"search","ms":420},{"service":"auth","ms":88},{"service":"auth","ms":91},{"service":"auth","ms":93},{"service":"auth","ms":97},{"service":"auth","ms":99}]}
```

Output for this spec:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 82" role="img" aria-label="Search has a slow second mode near 400 ms." font-size="11" fill="currentColor"><text x="49.6" y="20" text-anchor="end" dy="0.32em">search</text><circle cx="60.52" cy="20" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="67.82" cy="20" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="75.13" cy="20" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="78.05" cy="23.42" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="527.89" cy="20" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="542.5" cy="20" r="2" fill="var(--series-1, #2a78d6)"/><path d="M76.59,12V28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.8"/><text x="552.5" y="20" dy="0.32em">median 101 ms</text><text x="49.6" y="44" text-anchor="end" dy="0.32em">auth</text><circle cx="57.6" cy="44" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="61.98" cy="45.03" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="64.9" cy="41.6" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="70.74" cy="44" r="2" fill="var(--series-1, #2a78d6)"/><circle cx="73.67" cy="47.42" r="2" fill="var(--series-1, #2a78d6)"/><path d="M64.9,36V52" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.8"/><text x="552.5" y="44" dy="0.32em">median 93 ms</text><path d="M57.6,60H542.5" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.5"/><text x="57.6" y="73" fill-opacity="0.7">88 ms</text><text x="542.5" y="73" text-anchor="end" fill-opacity="0.7">420 ms</text></svg>
```

Not suited: more than 5000 observations or 12 groups (`too_many_rows`, `too_many_categories`), and a strip too crowded for its width (`points_collide`). Raise `width`, or draw a histogram from `references/drawn/histogram.md`.
