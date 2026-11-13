# Choosing a form

Read this at step 3 of `SKILL.md`. Find the row for the reader's task and the shape of the data, write down the form and the reason, and cite the row by its form name. `dataviz` has `references/choosing-a-form.md`, which covers stat tiles, meters, colour jobs and the part-to-whole bars. This file does not repeat that, and adds the forms `dataviz` leaves out.

## The principle

Cleveland and McGill (1984) ranked the judgments a reader makes when reading a graph, from most to least accurate: position along a common scale; position along non-aligned scales; length, direction and angle; area; volume and curvature; shading and colour saturation. Choose the form whose main encoding is as high in that list as the data allows. Their experiments led to the dot plot (Robbins 2006).

When a sentence or a small table answers the question, draw no chart. Tufte (1983) says tables are preferable to graphics for many small data sets, and (2011, forum) calls a table and a slopegraph "colleagues in explanation not competitors", because the table is poor for showing and comparing gradients while the graphic is poor for exact values.

## How to read the tables

Each row gives the data shape, the form, its strength, when not to use it, where to draw it (`helper` means `scripts/chart.ts`, `drawn/x` means `references/drawn/x.md`) and the source. Source keys are listed at the end. A claim marked "by definition" follows from how the form is built and has no separate source.

## Compare values

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| One value per category | Sorted bar | Length from a zero baseline; order by value when categories have no order of their own. Horizontal when labels are long | A baseline of zero hides the differences when values are close together | `dataviz` | Wilke 6 |
| One value per category, values close together or the axis must not start at zero | Dot plot | Position on a common scale; the eye goes to the dot, not to the middle of a bar. Uses less ink than a bar and takes a second measure without clutter | Fewer than two categories | helper `dot` | Wilke 6.3; Robbins 2006; Cleveland and McGill 1984 |
| Two values per category (before and after, this year and last), paired | Dumbbell | Shows both values on one scale and the move between them, sorted by the move. Print the absolute values beside the dots, and the percent change as a label when the reader asks "how much" | More than two measures. Categories whose values differ by more than about 20 times: the small categories collapse into a point on a linear axis. Use a log axis (drawn by hand, because the helper's scale is linear) or small multiples with one scale per group | helper `dot` with `series` | FT Visual Vocabulary (dot plot: "change or range across categories"); sorting by the move and the labels are convention |
| Two values per category where only the relative change matters | Dot plot of percent change | One position per category on a common scale | The reader needs the size of each value: a percent change alone hides whether 50% is 5 items or 5,000. Use the dumbbell with the percent as a label | helper `dot` | Wilke 6.3 |

## Change over time

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| One series, many moments | Line | Points connected in time order; label lines directly instead of using a legend | Unordered categories | helper `line` | Wilke 14 |
| Many series, each needs its own shape | Small multiples | Same scale and axes in every panel, so the reader compares by eye | Panels that do not share a scale | helper `multiples` | Tufte 1983, second edition p. 168 (the page number comes from Masnick's guideline, https://masnick.org/projects/datatips/guidelines/small-multiples/; the book itself was not opened) |
| One series in a table or a sentence | Sparkline | Word-sized; gives a number its history | When the reader must read values off it | helper `sparkline` | Tufte, sparkline notes |
| Few items at two or three moments | Slopegraph | Identity of each case stays visible; slope shows size and direction of change | Many observations, or a question about the points between the two moments | helper `slope` | Wilke 12; FT |
| Many series in very little height | Horizon chart | In Heer and others' experiment, 2-band charts were more accurate than line charts at heights under 24 pixels | Heights above that: use a line. Four or more bands: they cost time and accuracy. Readers who do not know how to read bands | `drawn/horizon` | Heer and others 2009 |
| Two variables moving together over time | Connected scatter | Shows joint movement and cycles that two lines hide | Needs direction and time cues, such as arrows or labelled years. Two line charts are easier to read | `drawn/connected-scatter` | Wilke 14; FT |

## Ranking change

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| Rank of each item at each of several moments | Bump chart | Shows who rose, who fell and when the order changed; Tufte treats it as a kind of slopegraph | The size of the gaps matters, because rank discards it (by definition). Use a line chart of the values | helper `bump` | Tufte 2011 (forum); FT (slope) |

## Distribution

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| Raw values, tens to a few hundred per group | Strip plot with dots moved apart (beeswarm) | Shows every value, so clusters and outliers are visible | So many points that they overplot | helper `strip` | Wilke 9.1 |
| One distribution, or a few, with enough values | Histogram | Familiar; shows shape | The bin width changes the picture, so try several. Overlaid or stacked histograms of several groups are hard to read; use multiples of one histogram per group | `drawn/histogram` | Wilke 7 |
| Many distributions, or a distribution changing over time | Ridgeline | Scales to very large numbers of distributions; works well for trends in distributions over time | Built from histograms, where bars from different groups align confusingly: use density curves. Density curves mislead with few points | `drawn/ridgeline` | Wilke 7, 9.2 |
| Many groups, a compact summary, and a reader who knows the form | Box plot | Compact, standardised, good side by side | Hides the shape: a bimodal and a unimodal group can look the same | `drawn/box-plot` | Wilke 9.1 |

## Parts of a whole

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| A few parts of one whole, or two parts over time | Segmented bar | Each part's relation to the whole | Middle segments sit on shifting baselines, so avoid long stacks of many segments. Use side-by-side bars to compare parts | `drawn/segmented-bar`; `dataviz` for the ranked bars | Wilke 10 |
| A percentage as whole numbers | Waffle | Counts squares, easy to say aloud | Fractions of a square | `drawn/waffle` | FT (gridplot) |
| Two categorical variables, share within each | Marimekko | Shows how two categorical variables overlap | Rectangles lack a shared baseline, so equal counts are hard to compare. Print the values | `drawn/marimekko` | Wilke 11 |
| A start value, steps up and down, an end value | Waterfall | Shows parts where some components are negative, in sequence | Steps that are not a sequence | `drawn/waterfall` | FT |

## Correlation

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| Two quantitative variables, one point per case | Scatter | Standard for the relationship between two variables | A third variable as size: size is read less accurately than position | `dataviz` | Wilke 12; FT |
| The same, with time | Connected scatter | See the time row above | See the time row above | `drawn/connected-scatter` | Wilke 14 |
| More than two variables | Small multiples of scatters | A scatter plot matrix is easier to read than one crowded plot | Many variables: a correlogram hides the points | `drawn/small-multiples-scatter` | Wilke 12 |

## Deviation

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| Values above and below a baseline | Diverging bar | Handles negative and positive values on one baseline | Values that cannot go below it | `drawn/diverging-bar` | FT |
| Values against a target or average | Dot plot with a reference line | The line is the comparison, position is the encoding | Fewer than two categories | helper `dot` with `reference` | FT; Wilke 6.3 |

## Flow

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| Counts moving between states over two or more periods | Sankey or alluvial | Traces where each group goes; handles three or more stages | Busy with many crossing bands. Order the stages to cut crossings, and put the colouring variable first | `drawn/sankey` | FT; Wilke 11 |
| The same, with few states | Transition table | The exact count for every from-to pair | When the reader needs the shape of the flow rather than the numbers | `drawn/transition-table` | Tufte 2011 (forum) |

## Set overlap

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| Three or more sets, counts per combination | UpSet | Lex and others report it scales to 20 to 30 sets or more; sorts by size, so the largest combinations are first | Two sets | `drawn/upset` | Lex and others 2014 |
| Two sets, a schematic | Venn | Intuitive for communicating what an intersection is | Counts that must be compared, or more than three or four sets, where drawing the intersections is not trivial | `drawn/venn` | Lex and others 2014; FT |

## Geography

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| A density or rate per region | Choropleth, in four to six bins | Right when the data are tied to place and the reader needs the geography | A count in regions of very different area: large regions dominate | `drawn/maps` | Wilke 15 |
| A trend per region | Small multiples arranged by geographic position | Keeps the rough layout and shows trends | Many regions | `drawn/maps` | Wilke 15 |
| Place is only a label | Dot plot or bar | Position on a common scale | Wilke's advice is that maps suit data tied to physical location; this row is the converse | helper `dot` | Wilke 15 |

## Cycles

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| A value per month or weekday over several years | Cycle plot | One panel per month with its years in order and a mean line: shows the trend inside each month and the seasonal shape together | Line per year hides the trend of one month; one long line hides the month effect | `drawn/cycle-plot` | Robbins 2008; Cleveland, Dunn and Terpenning 1978 |
| A daily value, patterns by weekday or month | Calendar heatmap | Reveals daily, weekly and monthly patterns | Exact values: it costs precision | `drawn/calendar-heatmap` | FT |

## Uncertainty

| Data shape | Form | Strength | When not | Draw | Source |
| --- | --- | --- | --- | --- | --- |
| An estimate with an interval per category | Dot with interval | Precise and space-efficient; state what the interval is | Do not mix standard deviation and standard error | `drawn/dot-with-interval` | Wilke 16 |
| An estimate and the plausibility across its range | Gradient interval | Correll and Gleicher found gradient plots better than bars with error bars for inferential tasks | Confidence strips are hard to read, because viewers integrate the shading to find where a level ends | `drawn/gradient-interval` | Correll and Gleicher 2014; Wilke 16 |
| Any estimate | Bars with error bars | Avoid. The bar suggests that values inside it are likelier (within-the-bar bias), and an error bar can mean any of several intervals | | | Correll and Gleicher 2014; Newman and Scholl 2012 |

## Sources

- Cleveland and McGill (1984), Graphical Perception, JASA 79(387). Ranking as listed by the Cornell INFO 3312 slides, https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html
- Cleveland, Dunn and Terpenning (1978), as cited by Robbins 2008.
- Robbins (2006), Dot Plots: A Useful Alternative to Bar Charts, http://www.perceptualedge.com/articles/b-eye/dot_plots.pdf
- Robbins (2008), Introduction to Cycle Plots, http://www.perceptualedge.com/articles/guests/intro_to_cycle_plots.pdf
- Wilke, Fundamentals of Data Visualization, https://clauswilke.com/dataviz/ (chapter numbers above: 6 amounts, 7 distributions, 9 many distributions, 10 proportions, 11 nested proportions, 12 associations, 14 time series, 15 geospatial, 16 uncertainty)
- Financial Times, Visual Vocabulary, https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
- Lex, Gehlenborg, Strobelt, Vuillemot and Pfister (2014), UpSet, IEEE TVCG 20(12).
- Heer, Kong and Agrawala (2009), Sizing the Horizon, CHI 2009, https://idl.uw.edu/papers/horizon
- Correll and Gleicher (2014), Error Bars Considered Harmful, IEEE TVCG 20(12). Newman and Scholl (2012) as cited in the authors' slides.
- Tufte, The Visual Display of Quantitative Information (1983); sparkline notes, https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/; slopegraph forum post, https://www.edwardtufte.com/?p=118
