# dcss-array.css: SPEC

dcss-array.css computes with CSS layout: indexed reads, sums, ranks, sorts, keyed maps, packing and formulas over numbers written in custom properties, with no script at run time.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

Measured 2026-10-29, headless: Chrome 155.0.8059.86, WebKit 26.4, Firefox 158.0.
Conformance: Chrome 112/112, WebKit 112/112, Firefox 71/112.
Additional paired cases measured 2026-10-26 in Chrome/WebKit; the Firefox report is unchanged.
The checks, probes and scripts this document names are in the noscript.ing repository ([github.com/noscripting/noscript.ing](https://github.com/noscripting/noscript.ing)), under `libraries/dcss/`; this package carries the sheets and their documents.

Stylesheet packaging: `dcss-array.css` is the shared core. DCSS calls require their
family files from `families.json`, in manifest order. `runtime.mjs` computes the
same selection for plain HTML links and composition compilation. `dcss-array-all.css`
is an explicit entry for loading every family. No browser JavaScript is required
for selection or computation. Packaging does not expand any function's bounds.

## 1. Follows

| Spec | Version | Used for |
|---|---|---|
| CSS Grid Layout Module Level 2 | Candidate Recommendation Draft, 2023-10-30 | placement (§8.5) and track sizing (§12): the arrays, bins, sorts, maps, packing and hops |
| CSS Containment Module Level 3 | Editor's Draft, 2025-12-22 | container query units: a reader takes a track's size as `100cqw` and `100cqh` |
| CSS Values and Units Module Level 4 | Editor's Draft, 2026-08-20 | `calc()`, `round()`, `mod()`, `sign()` and typed division in the readers |
| CSS Anchor Positioning Module Level 1 | Working Draft, 2026-09-06 | `.dcss-calc` and the where readers (`anchor()`, `anchor-size()`) |
| CSS Multi-column Layout Module Level 1 | Editor's Draft, 2026-08-04 | `.dcss-columns`: the least largest part of a contiguous split (§7.1) |
| CSS Box Sizing Module Level 4 | Editor's Draft, 2026-10-10 | `.dcss-turn`: a height carried into a width by `aspect-ratio` (§4.2) |
| CSS Flexible Box Layout Module Level 1 | Editor's Draft, 2026-05-08 | `.dcss-flex`: shares with weights, floors and caps (§9.7) |
| CSS Counter Styles Level 3 | Editor's Draft, 2026-10-08 | `dcss-tally`, `dcss-table` and the text operators |
| CSS Fonts Module Level 4 | Editor's Draft, 2026-10-16 | the lookup fonts and the ROM fonts' variation axes |
| dcss-store.css | store 4f37d4eb | the stored cells and readers the loops and sheets run on |

## 2. Requirements

### Arrays

- **A1** In an `.dcss-array` of `<i>` entries with `--dcss-n`, a reader `.dcss-at` with whole `--dcss-i`, in the
  port `<b class="dcss-out">` or inside an entry, MUST give what is inside it `--dcss-value` equal to entry i, and
  entry i from the end for -i, in the frame the entries change, exact for whole numbers.
- **A2** A reader with `--dcss-i` and `--dcss-j` MUST read the sum of entries i to j in either order, -1 meaning the
  last entry and i = j one entry, in the same frame, exact.
- **A3** `.dcss-array.dcss-packed` with `--dcss-tracks` MUST read track i, track -i counted back from
  `--dcss-array-length`, and ranges; without `--dcss-array-length`, -1 MUST be the last track.
- **A4** `--dcss-of: --x` on a reader or its array MUST count `--dcss-i` from the slot named `--x` and `--dcss-j` on
  from there over every slot; an array inside a reader MUST NOT inherit its outer `--dcss-of` unless it names its own.
- **A5** `.dcss-cycle` with `--dcss-tracks` MUST read entry i round the cycle, forwards past the last entry and
  backwards from -1, and a range across the end.
- **A6** `.dcss-array.dcss-xy` of entries with `--dcss-n` and `--dcss-m`, or packed with `--dcss-tracks` and
  `--dcss-tracks-y`, MUST give a reader `--dcss-value` and `--dcss-value-y` of entry i, `--dcss-r` picking another
  row, negative indices and a range of columns included, in the same frame.
- **A7** `.dcss-track-count` on an array MUST work the number of entries out from its last entry's place, so entries -1 to
  -40, the total and entry 35 of 40 entries read exact with no `--dcss-array-length`.
- **A8** Index 0, an index past the end or the start, a fractional index at either end of a range, and a range past the
  end MUST read `--dcss-value` 0 and `--dcss-ok` 0, empty counted arrays included; a valid read MUST give
  `--dcss-ok` 1.
- **A9** In an `.dcss-xy` read, an invalid column or row MUST zero `--dcss-value`, `--dcss-value-y` and `--dcss-ok`
  together, for entries, packed slots and empty arrays.
- **A10** An array without `.dcss-track-count` MUST read negative indices and ranges to -1 from `--dcss-array-length`; with no
  `--dcss-array-length` they MUST read 0 with `--dcss-ok` 0 while positive indices read their entries.
- **A11** A `<b class="dcss-window">` with `--dcss-i` and `--dcss-span` in an array's port MUST number the entries
  for the readers inside it from its start: 1 its first, -1 its last, ranges, with the window moving every frame.
- **A12** An array inside a keyed map's reader, an `.dcss-xy` reader or a tile's where MUST read its own entries, keep
  its ranges, fraction checks and xy rows, and leave the outer read unchanged.
- **A13** The push, a read from the end and a place in a sort MUST give the same numbers inside
  `writing-mode: vertical-rl; direction: rtl` as in horizontal text.
- **A14** On an `.dcss-plain` array, a range read, a reader placed by its own `grid-column` and a scan reader placed by
  its own `grid-area` MUST read the same numbers as on an array without `.dcss-plain`.

### Bins

- **A15** In `.dcss-bins`, a child with whole `--dcss-bin` MUST give what is inside it `--dcss-rank`, 1 for the
  first child in its bin in markup order, exact to 32, with a bin changing every frame.
- **A16** A `.dcss-track-count` in `.dcss-bins` MUST give `--dcss-track-count`, the number of bins in use, for bins up to the
  box's width in px.
- **A17** A `<b class="dcss-below">` in a child of `.dcss-bins` MUST give `--dcss-below`, how many distinct bins in
  use lie below its bin, with or without an author's padding and border on the grid.
- **A18** `.dcss-bins.dcss-bin-max` MUST give a reader with `--dcss-i` the largest `--dcss-n` in bin i, and a range the
  sum of those maxima, with entries at any depth under `.dcss-nest` wrappers.

### Sorts and keys

- **A19** `.dcss-array.dcss-sort` of entries with whole `--dcss-key` MUST read its entries in key order, equal keys
  in markup order: the i-th smallest, -1 the largest, a range the sum of the smallest, with a key moving past the others
  every frame.
- **A20** A `.dcss-where` in an entry of `.dcss-sort` MUST give `--dcss-place`, 1 for the smallest key, equal keys in
  markup order.
- **A21** In `.dcss-sort`, an `.dcss-lo` probe with a key MUST give `--dcss-lower` (keys below it), an `.dcss-hi`
  probe `--dcss-upper` (keys up to it), and an `.dcss-between` in it `--dcss-frequency` and `--dcss-member`.
- **A22** `.dcss-map` of entries with whole `--dcss-key` and `--dcss-n` MUST give a reader with `--dcss-key` the
  largest number written at that key, for keys -9,000 to 9,999, in boxes of any width; an unused key, or one outside
  `--dcss-min-key` to `--dcss-max-key`, MUST read 0 with `--dcss-ok` 0.
- **A23** `.dcss-map.dcss-packed` MUST read a track list of values from `--dcss-min-key` on as keys, child entries
  beside it, duplicate keys as their largest, empty or invalid lists as no values, with keys and values moving between
  tracks in the same frame.
- **A24** A `.dcss-where` in an entry of a keyed map MUST read the entry's offset in the same frame, and an entry MUST
  NOT keep an anchor name while it holds no where.

### Layout

- **A25** `.dcss-array.dcss-packed` with tracks `minmax(0, c)` MUST give slot k min(c k, L), L the level at which the
  slots fill the box's width, within 1/64 px.
- **A26** `.dcss-shares` MUST give child k max(floor k, weight k × L) from its `--dcss-n` and `--dcss-w`, L the level
  that fills the width, and a `.dcss-where` in a child the sum of the shares before it, within 1/32 px.
- **A27** `.dcss-pack` with `--dcss-columns` MUST give each child of `--dcss-w` columns the `--dcss-column` and
  `--dcss-row` where first fit puts it, rows from the top, in `order`-modified document order (css-grid-2 §8.5).
- **A28** A `.dcss-where` in an entry of an array MUST give `--dcss-x`, the sum of the entries before it, and
  `--dcss-y` 0.
- **A29** `.dcss-tiles` with `--dcss-columns`, `--dcss-rows` and `--dcss-areas` MUST give a child at
  `grid-area: name` its area's `--dcss-x`, `--dcss-y`, `--dcss-width`, `--dcss-height` and `--dcss-fits` 1, and
  `--dcss-fits` 0 to every child when an area is not a rectangle.
- **A30** `.dcss-tiles.dcss-pack` MUST place each child of `--dcss-w` by `--dcss-h` tiles where first fit puts it,
  row by row, around the map's named areas and the children before it; a child past the map's rows or wider than the map
  MUST read `--dcss-fits` 0.
- **A31** `.dcss-push` MUST give each child `--dcss-x`, the larger of its `--dcss-target` and the end of the child
  before; `.dcss-push.dcss-end` with `--dcss-wall` MUST give the smaller of its target and the start of the child
  after less its width.
- **A54** `.dcss-push.dcss-nested`, its children nested in each other (each holding the next), MUST give the
  answers A31 gives, for targets and ends under 65,536 px; `.dcss-push.dcss-end.dcss-nested` likewise.
- **A32** `.dcss-groups` MUST give each child `--dcss-y`, the sum of `--dcss-n` over the earlier children of its
  `--dcss-bin`, and `--dcss-x`, its bin less 1.
- **A33** `.dcss-overlap` of children with `--dcss-i` (a start) and `--dcss-span` MUST give a `.dcss-track-count`
  the most intervals over one point, and each child's where `--dcss-y`, its lane by first fit from 0.
- **A34** `.dcss-lines` with `--dcss-columns` MUST give a `.dcss-track-count` the number of next-fit lines its children's
  `--dcss-n` take, and each child's where `--dcss-y`, its line from 0, and `--dcss-x`, the sum before it on its line.
- **A35** `.dcss-slide` with `--dcss-span` MUST give a reader with `--dcss-i` j the largest of the span entries
  ending at entry j.
- **A36** `.dcss-array.dcss-xy.dcss-cells` of entries with `--dcss-i`, `--dcss-r`, `--dcss-n` and `--dcss-m`
  MUST give a reader the widest entry of column i as `--dcss-value` and the tallest of row r as `--dcss-value-y`.
- **A37** `.dcss-key-range` of entries with `--dcss-key` and `--dcss-bit` (1 to 19) MUST give a query `.dcss-in` with
  `--dcss-from` and `--dcss-to` the bit mask of the entries whose key is in [from, to] less `--dcss-not`, and
  `--dcss-top1` to `--dcss-top6`, its six highest bits.

### Formulas

- **A38** `.dcss-width-sum` MUST add its children and `.dcss-largest` take the largest, leaves with `--dcss-n` and whole
  arrays as children, at any depth, read at the root or inside; a negative leaf MUST make every node above it read
  `--dcss-ok` 0.
- **A39** `.dcss-cap` MUST give min(E, c) of its formula E with c moving, of a sum or of a leaf; a negative leaf in it
  MUST read 0 with `--dcss-ok` 0.
- **A40** `.dcss-times` MUST give f × E as a height, f written and moving, counted in an `.dcss-stack` and read
  inside it.
- **A41** `.dcss-calc` boxes MUST give a product, a min and their sum of two named formulas through `anchor-size()`,
  in the same frame.
- **A42** `<b class="dcss-hop">` MUST give a row the sum of the columns it spans (two hops in one row the larger), and
  `<b class="dcss-hop-y">` a column the sum of the rows it spans, read by `.dcss-at-y` and `.dcss-at-x`.
- **A43** `.dcss-text` MUST give the sum and the largest line of counters in `dcss-tally`, f(k) of the shared tables
  (k, round(k^2 / 1000), round(sqrt(1000 k)) for k 0 to 999), a scan and a table's running totals, exact.
- **A44** The text operators MUST give, from pair texts and counter styles, min, max, a sum of products, |a - b|, a > b,
  a × b by `letter-spacing`, floor(a / b) by a tab, sign and relu, exact.
- **A45** A `.dcss-collapse` of signed margins, `.dcss-zoom` factors in a sum, an `.dcss-baseline` row,
  `.dcss-columns` with `--dcss-parts` and `.dcss-flex` shares MUST give their laid-out results within 1/64 px.
- **A46** Collapses MUST nest: two laid-out widths in one collapse (W1 / 2 - W2), three levels of `.dcss-scope`, the
  results counted in an `.dcss-stack` and an `.dcss-tallest` with no reader between.
- **A47** A collapse as a row of a grid MUST turn into a column through `.dcss-hop-y`, and a second collapse over that
  column MUST subtract a third width, read by the row, the column and their readers.
- **A48** `<div class="dcss-minus">A<b>B</b></div>` MUST be max(0, A - B) wide for widths A and B under 2^20 px: alone,
  as min and |a - b|, two deep, and inside a collapse, an `.dcss-width-min` and an `.dcss-scale`.
- **A49** `.dcss-turn` with `--dcss-turn-tick` changed whenever an input under it changes MUST lay a height on as a width:
  under `.dcss-largest`, in an `.dcss-width-min` slot, as a subtrahend and in a stack, with inputs moving every frame.
- **A50** `.dcss-rom` with `.dcss-sq` or `.dcss-sqrt` and `--dcss-k` from 0 to 999 MUST give its child
  `--dcss-value` round(k^2 / 1000) or round(sqrt(1000 k)), and `.dcss-rom2` the five pair tables for a and b from
  0 to 31, at style time with no layout.

- **A66** Both compiler entries MUST share one formula operation and layout cover, preserving standalone grammar and
  options. Means and extents of 1–300 whole values in 0–1000 MUST match the reference within 0.01. Existing recipes
  outside the cover's supported grammar or bounds MUST retain their previous lowering.

### Across computations

- **A53** Results of separate computations, each an `.dcss-array` as wide as its total and named by `anchor-name`,
  MUST place their marks in sorted order in the same frame when each mark's `top` sums, over the others,
  `clamp(0, (anchor-size(--other width) - anchor-size(--own width)) / 1px * 2 + t, 1)` (t 1 for an earlier result, else 0),
  for 4 to 32 results.
- **A55** `.dcss-ranked` with `--dcss-bins` G up to 16 (32 with `dcss-wide`) MUST place bar k at its group's total of `--dcss-n`
  (`.dcss-bin-max`: its largest), as many `--dcss-band`s down as groups beat it, largest or smallest first, ties to the
  lower bin; an item's `<b>` on its group's bar after the items before it; label k at bar k's top.
- **A56** `.dcss-piles` MUST place each item at the sum of the heights before it in its group; `.dcss-starts`
  MUST place group k's marker at the sum of `--dcss-n` over earlier groups; with dcss-array-extras.css, a `.list`'s `.dcss-size`
  MUST read its width and height.
- **A57** `.dcss-ranked.dcss-copy` with `--dcss-copy-width` and `.dcss-ranks > b > .dcss-segments` holding G
  `.dcss-group` and the items again MUST place each segment as A55 does, for up to 16 groups.
- **A58** `.dcss-ticks` (or `.dcss-axis-*`) with `--start`, `--stop` and `--count` MUST give `--dcss-tick-increment` and
  `--dcss-tick-step` equal to d3-array 3.2.4's tickIncrement and tickStep, as many `<li>`s shown as its ticks (the rest
  `visibility: hidden` and out of flow), and its k-th `<li>` `--dcss-tick` the k-th tick; `.dcss-nice` with the same three MUST give
  `--dcss-nice-start` and `--dcss-nice-stop` equal to nice's; for finite start, stop and count.
- **A59** `.dcss-axis-bottom`, `-top`, `-left` and `-right` MUST place each tick where d3-axis 3 places it for
  scaleLinear([start, stop]) over the list's width (left and right: [height, 0]), and label it as that scale's
  tickFormat(count) does.
- **A60** `.dcss-sum`, `-count`, `-mean`, `-min`, `-max` and `-extent` over `<li>`s with `--value` MUST give the
  element after the list `--dcss-<name>` (extent: `--dcss-min`, `--dcss-max`) equal to d3-array 3.2.4's for signed
  values on the 1/64 grid (a mean's from -1024, min, max and extent's within ±131,072), skipping what isn't a number with
  `--dcss-err` 0, as d3 skips it; a value off the grid or out of range MUST leave no answer with error 1, and d3's
  undefined error 2; a list wider or taller than 2^18 px with an item whose style attribute holds a decimal point, an exponent, `var()` or `calc()`, or no style attribute, MUST
  leave no answer with error 1; an empty `<output>` MUST print the answer as format(",") does, to 6 decimals.
- **A61** `.dcss-treemap-slice`, `-dice` and `.dcss-partition` over nested `<li>`s, leaves with `--value` (totals 64 to
  50,000), and `-slice-dice` with every node's MUST lay each `<li>` within 2/64 px a level of its node's rectangle in
  d3-hierarchy 3's treemap() with that tile, or partition(), over the figure's box.
- **A62** `.dcss-scale-linear`, `.dcss-scale-pow` (`--exponent`), `.dcss-scale-sqrt` and `.dcss-scale-log` with `--domain-k`, `--range-k`
  (k 0 and 1; with `.dcss-piecewise`, k 0 to 7, `--stops` of them), `--clamp`, `--round` and `--value` MUST give `--dcss-scale-<name>` and
  `--dcss-scale-<name>-invert` equal to d3-scale 4.0.2's scale(value) and invert(value) (a log scale within 256 × 2^-52 of it); for the linear, pow and sqrt scales `.dcss-ticks`, `.dcss-nice` and
  `.dcss-format-*` over the domain's ends MUST give its ticks(count), nice(count) and tickFormat(count, specifier)(x)
  for specifiers of type f or %; for finite numbers.
- **A63** `.dcss-ease-<name>`, for each of d3-ease 3.0.1's exports in kebab case, with `--value` t and d3's parameters
  (`--exponent`, `--overshoot`, `--amplitude`, `--period`) MUST give `--dcss-ease-<name>` within 1e-6 of d3's.
- **A64** `.dcss-format-fixed` and `.dcss-format-percent` with `--value`, `--precision`, `--comma`, `--sign`,
  `--symbol` and `--trim` MUST print in their `::after` the text d3-format 3.1.2's format prints for that specifier (type f or %,
  sign - or +, symbol none or $, `~` for `--trim: 1`), where |value| x 10^precision is under 2^53; past it `--dcss-err` MUST be 1.
- **A65** `.dcss-ticks-log` and `.dcss-nice-log` with `--start`, `--stop`, `--count` and `--base` MUST give the ticks
  and the nice domain of d3-scale 4.0.2's scaleLog over that domain, of one sign; a `.dcss-ticks-log-format` inside a
  `.dcss-ticks-log` MUST print what its tickFormat(count, specifier)(value) prints, for specifiers A64 or A67 prints.

- **A67** `.dcss-format-si` MUST print d3-format's type s (sign -/+, optional $, comma, trim) for 1–15
  significant digits, zero or 1e-30 <= |value| < 1e31. Below 1e-24, precision + floor(log10(|value|)) + 24 MUST
  be positive. Outside these bounds `--dcss-err` MUST be 1 and nothing print.

- **A68** `.dcss-bisect-left/right` (`.dcss-bisect` aliases right) MUST match d3-array's insertion index for up to
  1,024 sorted whole-number keys within ±2^24, finite query `--value`, and whole bounds 0 <= lo <= hi <= length.
  The result MUST reach reader descendants in the same frame. Invalid searched keys or missing query MUST flag an error
  and suppress the empty output.

### Compiled HTML composition

- **A69** `compileComposition(html, options)` MUST reject unavailable numeric bindings and preserve downward sum/scale/format connections. Its sum accepts 1–63 nonnegative items on declared steps that are multiples of 1/64, with maximum total below 2^18; scalar settings are literal except A78's bounded precision bindings. Its contract MUST distinguish numeric and text results and name their locations.
- **A70** Contracts MUST name calc/layout/font ROM, count readers/shared fonts and keep unknown cost null. Selection MUST use matching complete-fragment measurements including the default, improving at least one metric without worsening either engine's median or supplied p95. Experimental fonts MUST require opt-in and permission to wrap leaf outputs.
- **A71** Compiled scalar and text results MUST propagate upstream readiness and errors through `--dcss-ready` and `--dcss-err`, hiding generated text until ready and error-free. Native form reset MUST preserve computation elements. Delayed or failed fonts MUST leave dependent output unready while independent arithmetic outputs remain ready.

- **A72** Compiled `.dcss-scale-threshold` MUST select d3's numeric/text range from 0–1,024 sorted numeric thresholds within ±2^24, agreeing under literal calc/layout lowerings. Missing queries MUST return unknown or error 2; invalid active layout keys MUST flag error 1. Result styles MUST NOT alter computation, while descendant numeric reuse, native changes and reset MUST remain correct.

- **A73** Compiled `.dcss-scale-quantize` MUST match d3’s range value for ascending literal endpoints within ±2^24, zero or magnitudes at least 2^-1006, and 1–1,025 supported numeric/text ranges. Calc and layout MUST preserve d3’s boundary operation order and missing-query behavior. Numeric results MUST preserve descendant reuse, authored result widths, native changes and reset.

- **A74** Compiled quantile/median MUST match d3 within declared 1/64-grid bounds and static probability, skipping an item with no number as d3 does (quantileSorted keeping its place and refusing a read of it with error 2). Scalar ranks MUST support 64 values, layout 1,024; indexed reads require cumulative width below 2^18. Lowerings MUST preserve author nodes, output position, exact reuse, formatting and reset, flagging invalid data as error 1 and empty inputs or missing probability as error 2.

- **A75** Compiled `.dcss-quantile-sorted` MUST match d3's source-position R-7 interpolation within A74's bounds, supporting 1,024 values with direct scalar reads. Indexed layout MUST preserve source order within its cumulative-width bound. Both MUST preserve descendant numeric reuse, native changes, formatting, error meanings and reset.

- **A76** Compiled `.dcss-scale-quantile` MUST match d3 on declared 1/64-grid data with 0–17 supported ranges. Layout MUST share each captured order statistic within its cumulative-width bound; scalar ranks MUST support 64 values. Both MUST preserve descendant reuse, authored styles, native changes, formatting, unknown queries and reset, flagging invalid data as error 1 and empty ranges as error 2.

- **A77** Quantile-scale queries bound on the result div instead of the figure MUST preserve d3 results, readiness, errors, formatting and reset while publishing their actual input scope. Scoped query updates MUST leave the data computation upstream; complete costs MUST be measured in both engines.

- **A78** Compiled precisionFixed/Prefix/Round MUST match d3 within declared bounds, nonzero step magnitudes 1e-30 to below 1e31, and target magnitudes below 1e31. Integer results MUST support downward reuse and bounded formatter precision. Native controls, reset and errors MUST preserve author elements; undefined answers MUST publish CSS NaN with error 2 and suppress dependent text.

- **A79** Quantile, median, source-position quantile and quantile-scale results MUST retain their author's available width and natural flow height without requiring an explicit figure height. Literal and dynamic data, captions and following content MUST remain correctly placed in both engines. Contracts MUST count the width and validation reads needed to preserve that behavior.

- **A131** `mathml.mjs` MUST compile each `<math>` whose one element child is an `<apply>` of `<median/>`, `<mean/>`, `<min/>`, `<max/>`, `<plus/>`, `<minus/>`, `<times/>`, `<divide/>`, `<power/>`, `<root/>`, `<abs/>`, `<floor/>` or `<ceiling/>` (or their `s_data1`, `minmax1` over one `set1` set, `arith1` and `rounding1` symbols), with `<cn>`, `<ci>` and `<apply>` arguments, into an `<output>` whose `--value` is d3-array's answer to the bit (d3.median, mean, min, max, sum; JavaScript's operators and Math.pow, sqrt, abs, floor and ceil for the arithmetic; composed as the calls compose; `<cn>` read as JavaScript reads it, `<ci>name</ci>` as `--name` from an ancestor), with the formula kept as Presentation MathML and its Content MathML as the annotation; a name the page doesn't set, or sets to no number, MUST leave no answer with `--dcss-err` 1. An `<eq/>` with a name alone on one side, or LaTeXML's `assign`, MUST print the other side's value and put that side in the name's place in every later formula on the page; an `<lt/>`, `<leq/>`, `<gt/>` or `<geq/>`, a chain of them or an `<and/>` of them, MUST print true or false as JavaScript's operators decide on the two doubles, and nothing with error 1 when a side has no answer. It MUST stop with the file, line and reason on an equation between two formulas, a name defined twice, after a formula that uses it, in terms of itself or set by the page itself, any other Content MathML outside an annotation, a number that is no double, one `<ci>` alone, medians comparing more than 2,048 pairs of values the page sets, and a formula beside text in a `<p>`; it MUST leave the rest of the page byte for byte and change nothing run on its own output.

### Per-item and drop-in composition

- **A80** Compiled cumsum MUST publish 0–128 scoped per-item endpoints with bounds and status in version-two contracts. Within declared 1/64-grid prefix bounds below 2^18, both qualified lowerings MUST match d3, preserve scalar reuse and native reset, and skip missing/NaN values. Invalid inputs MUST invalidate their prefix and later results while preserving earlier results.

- **A81** The sheet MUST expose bounded discrete scales, quantiles, cumsum and precision helpers without compilation, with plain elements after a list or none and 17 property-based range values. Quantize MUST derive its thresholds from its domain in d3's operation order. A hand-written median → precisionFixed → format-fixed chain MUST match d3 across eight native/reset/viewport states, preserve flow and errors, and remain valid through optional compilation.

- **A82** A cumsum's results list MUST support arithmetic and shared-grid layout without adding or reparenting author elements, preserving exact per-item results, errors, text and reset. Complete-workload measurements MUST bind source, styling, bounds and emitted artifacts. Selection MUST retain the existing choice unless neither engine's median nor p95 regresses; stale measurements MUST be rejected, and unknown costs MUST remain null.

- **A83** An experimental four-input fold adapter MUST preserve d3 min, downstream math/text, status, native reset and authored structure. Layout-derived or chained inputs MUST be refused; pending or failed fonts MUST leave consumers with no number (unready or in error, printing nothing) without blocking independent arithmetic. Complete comparisons MUST include live encoding and generated helpers, retaining existing defaults unless both engines qualify an improvement.

- **A84** `.dcss-share` MUST publish totals exactly and per-item fractions within 1e-9 of d3 sum/division on descendant result holders for 1–64 finite nonnegative 1/64-grid values at most 4,095. Invalid data MUST set error 1, zero totals error 2. Formatting, native changes/reset, nested calls, intervening containers and natural row flow MUST preserve results and errors.

- **A85** `.dcss-ascending` and `.dcss-descending` MUST publish d3's -1/0/1 result for their own finite numeric `--a`/`--b` within ±2^24. Missing/NaN arguments MUST publish CSS NaN with error 2; out-of-bound finite arguments MUST give error 1. Native changes/reset and nested argument isolation MUST preserve results.

- **A86** Finite numeric identity map/invert calls admitted by `scale-extra/check.mjs` MUST match their original d3 returns exactly, independently of domain/range configuration. Proof MUST distinguish NaN from numeric answers and preserve native reset and descendant reuse. Getters, ticks and coercions remain unsupported.

- **A87** Over 0–64 signed 1/64-grid observations within ±1024, numeric minIndex/maxIndex and default leastIndex/greatestIndex MUST return d3's first winning source position; least/greatest MUST return its value. Nullish/NaN MUST be skipped; empty lists MUST return index -1 or CSS NaN/error 2. Invalid grid/bounds/count MUST give error 1; native reset and nested reuse MUST preserve results.

- **A88** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A89** Numeric boxed-value bisector left/right over 0–64 integer keys within ±2^24 MUST match d3 on ascending search slices. Optional integer bounds MUST satisfy 0 ≤ lo ≤ hi ≤ length; invalid searched keys/bounds MUST hide results with error 1, missing queries with error 2. Raw callback ownership, reset and nested/container reuse MUST be checked.

- **A90** General formatting with 1–15 significant digits MUST print d3's text when the rounded decimal exponent lies from -6 through precision minus 1. Exponential results and missing/NaN inputs MUST suppress text with error 1. Log filtering, trimming, native reset, nesting and the retained fixed/percent/SI printer MUST preserve results.


- **A91** Each newly added call MUST qualify through direct runtime and compiled output against the same original d3 questions. Compilation MUST preserve authored nodes, reachable field/item result addresses, bounds, readiness, errors and native reset. Serializable contracts MUST name emitted DOM locations; both-branch qualification MUST remain source-bound and MUST NOT add a second coverage count.

- **A92** Numeric ranges MUST compute active item values on the 1/64 grid within ±1024 using authored output slots. Runtime and compiler MUST preserve per-item result addresses and exact values. Zero steps, off-grid or wider inputs, more than 64 results and insufficient slots MUST set an error; unused slots MUST have readiness 0.

- **A93** Fixed UTC day, hour, minute and second calls MUST compute floor, ceil, round, offset and count within ±8×10¹² epoch milliseconds, truncating fractional milliseconds toward zero. Offset steps MUST round down and round ties MUST choose the upper interval. Invalid inputs or wider timestamp results MUST hide the number and set error 1.

- **A94** UTC weekday intervals MUST compute floor, ceil, round, offset and count within ±8×10¹⁵ epoch milliseconds, aligned to Sunday through Saturday. Negative epochs, midpoint ties, truncation and native reset MUST preserve results in both branches. Invalid inputs or wider timestamp results MUST hide the number and set error 1.

- **A95** Gregorian UTC month/year calls MUST compute floor, ceil, round, offset and count within ±8×10¹³ epoch milliseconds. Leap/century rules, first-century dates and Date setter overflow MUST match d3; round ties MUST choose the upper interval. Year periods 1–10,000 MUST support floor/ceil/round/offset; count requires period 1, and unsupported or wider results MUST error.

- **A96** Retired 2026-10-28: five circles only, 1.9 MB of hierarchy.css; d3.packSiblings isn't ported.

- **A97** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A98** Retired 2026-10-28: one fixed zone, America/Los_Angeles, served d3's tests only; time is UTC.

- **A99** Retired 2026-10-28: the text came as character codes, and the program that writes the codes holds the date as a number.

- **A100** Qualified Arabic `$,.2f` locale formatting MUST compute changing values in CSS and preserve static currency affixes. Both branches MUST match rendered native text and report unsupported inputs/magnitudes. Repeated factory contexts MUST NOT inflate the recorder's frozen raw-call identities.

- **A101** Retired 2026-10-28: the text came as character codes, and the program that writes the codes holds the date as a number.

- **A102** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A103** Identity-scale ticks MUST expose the complete array length and every active item within the qualified bounds and authored capacity. Default labels MUST compute precision from live domain/count inputs and match rendered d3 text. Both branches MUST preserve item/status addresses, integer summary fields, changing input/reset and downstream reuse; malformed summary metadata MUST be refused.

- **A104** Retired 2026-10-28: seeded draws over a list; dcss-store.css's random part gives a page random numbers.

- **A105** Retired 2026-10-28: one fixed zone, America/Los_Angeles, served d3's tests only; time is UTC.

- **A106** Retired 2026-10-28: one fixed zone, America/Los_Angeles, served d3's tests only; time is UTC.

- **A107** Qualified English date formatting MUST compute text from live integer epochs within years −9999 through 19999. Every frozen call MUST pass every source-owned configuration, including ISO weeks/years, epoch text, padding and names, in UTC. Numeric fields MUST remain independently addressed and reusable through compilation; invalid inputs MUST hide text and publish an error.

- **A108** Qualified geographic points, inverses, distance and scalar configuration getters MUST preserve every frozen source configuration through both branches. Numeric results MUST have independent presence/status checks and meet the documented bounds and tolerances. Null clipping extents MUST retain absent corners and rectangles MUST expose four corners; native reset, nested missing inputs and downstream reuse MUST preserve results.

- **A109** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A110** Retired 2026-10-28: the text came as character codes, and the program that writes the codes holds the date as a number.

- **A111** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.

- **A112** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A113** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.

- **A114** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.

- **A115** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.
- **A116** Median, quantile and quantileSorted MUST take 1/64 steps from −131,072 to 131,071, the quantile scale 1/64 steps within ±131,072, and all four whole numbers from −131,072 to 8,257,535, matching d3. They MUST refuse values past those bounds with error 1.
- **A117** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.
- **A118** Each public class's part (`parts.mjs`) MUST answer as its family does, with or without `dcss-array.css`: every DCSS check MUST pass with parts linked in place of families. Parts MUST combine in any order.
- **A119** Where the browser parses `@function`, each easing and the two-stop linear scale MUST also be functions (`--dcss-ease-<name>(t, ...)`, `--dcss-scale-linear(x, d0, d1, r0, r1, clamp, round)`) equal to their classes within 1e-12. Elsewhere a declaration calling one MUST fall back to its earlier plain value.
- **A121** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.
- **A122** `.dcss-median`, `.dcss-quantile` and `.dcss-quantile-sorted` with the list written once and three nested elements after it MUST give d3's answer on the innermost element's children, within A116's bounds and for up to 64 values. The median, and the quantile at p 0, 0.5 and 1, MUST skip an item with no number as d3 does, and quantileSorted MUST pass over one it doesn't read. They MUST refuse an item off the grid or out of range, an item with no number that a quantile at another p or quantileSorted reads, and 65 items with error 1, and an empty list, a median of no numbers or a missing p with error 2.
- **A123** `.dcss-scale-quantile` with the list written once and four nested elements after it MUST give d3's answer on the innermost element's children, within A116's bounds, for up to 64 values and 1 to 17 ranges, numbers or text, a query on a threshold or one double either side of it included. It MUST refuse with error 1 an item off the grid, out of range or missing, 65 values and 0, 1.5 or 18 ranges, answer `--unknown` for a missing or NaN query, and give error 2 for a missing one with no `--unknown`.
- **A124** `.dcss-scale-threshold` with its thresholds in `--domain-0` to `--domain-15`, and `.dcss-scale-quantize`, with no list and no wrappers, MUST give d3's answer to everything inside the call, for 1 to 17 ranges, numbers or text, a query on a threshold or one double either side included. They MUST answer `--unknown` for a missing or NaN query (error 2 with none), and MUST refuse with error 1 0, 1.5 or 18 ranges, a threshold that isn't a number, thresholds out of order or with a gap, and a reversed quantize domain. Compiled, the same markup MUST give the same answers.
- **A125** `.dcss-cumsum` with a second, unclassed list after its values MUST give d3's running total to everything inside the matching item of that list, for 0 to 64 values within ±1024 on the 1/64 grid, missing and NaN values adding 0. It MUST refuse a total from a value off the grid or past ±1024 on with error 1, leave a formatter there its own status, and give the same totals compiled.
- **A126** A call MUST take another call's answer written straight inside it, with nothing between them. A call with no answer (d3's undefined) MUST publish no number, so that a call or formatter given it fails too and prints nothing, while a call answering MUST be read and printed as d3's. A call given the answer of a call of its own kind MUST take it through a plain element between them.
- **A127** `.dcss-scan` of `<i>` entries with `--dcss-n` MUST give a reader `.dcss-at` with whole `--dcss-i` k, after the entries, `--dcss-value`, the sum of entries 1 to k, and `--dcss-before`, the sum of entries 1 to k - 1, in the frame its numbers change; a reader placed by its own `grid-area: 1 / 1 / span k / span k` MUST read the same (A14).
- **A128** `.dcss-median-index` and `.dcss-quantile-index` (`--p`) with the list written once and three nested elements after it MUST give the third's children d3's index of the value at floor((n - 1) p), for 0 to 64 values on the 1/64 grid within ±131,072, with -1 for no values; with ties at that value, the place of the one sorted last when values ascend and equal ones go last place first (first place first at p 0 or less). Another value or a `--p` that isn't a number MUST leave no answer.
- **A129** `.dcss-bin` with `--domain-0`, `--domain-1`, up to 32 ascending thresholds `--threshold-N` or a `--count`, and up to 64 values MUST give everything inside the second list's `<li>` for bin b d3's `bin().domain().thresholds()` bin b: `--dcss-bin-length`, `--dcss-bin-x0` and `--dcss-bin-x1`, thresholds outside the domain dropped as d3 drops them, a count's ticks as d3's `ticks()` gives them. No domain, a domain backwards, more than 64 values or a count giving more than 32 ticks MUST leave no answer.
- **A130** `.dcss-variance` and `.dcss-deviation` with up to 64 values in 64ths from -1024 to 1024 MUST give everything inside the third plain element after the list `--dcss-variance`, the true variance of the numbers rounded once (an item with none skipped), and `--dcss-deviation`, its square root; fewer than two numbers, more than 64 items or a value outside the range MUST leave no answer.
- **A120** A call MUST copy its `--value` into each of its answers at most once, and each answer MUST stay under 65,535 tokens with plain inputs, so that another call's answer given as `--value` reads in WebKit, which drops what one `var()` brings past 65,535 tokens (`facts/var-token-limit.mjs`).

### On the board

- **A51** A loop (`.loop`, `.loop-flow`, `.loop-in`, `.loop-cell`, `.loop-core`) MUST have dcss-store.css and dcss-array-extras.css on the page;
  its cells, read through `[data-store-read]` and `[data-store-read-3]` naming them by `--store-of`, MUST settle on the
  iteration's fixed point: a 12-cell power iteration's vector and eigenvalue equal NumPy's, as a flow and as a table row.
- **A52** A `<table class="sheet">` on dcss-store.css's board, with dcss-array-extras.css, MUST show every cell and fold equal to the sheet's own
  model as written and after each change to its inputs.




## 3. Implementation report

| Requirement | Test | Chrome | WebKit | Firefox |
|---|---|---|---|---|
| A1 | check.mjs: 1 child entries | PASS | PASS | PASS |
| A2 | check.mjs: 1 a range | PASS | PASS | PASS |
| A3 | check.mjs: 2 packed | PASS | PASS | PASS |
| A4 | check.mjs: 2 named slots; check.mjs: 34 | PASS | PASS | PASS |
| A5 | check.mjs: 3 | PASS | PASS | PASS |
| A6 | check.mjs: 6 two numbers an entry; check.mjs: 6 written on itself | PASS | PASS | PASS |
| A7 | check.mjs: 20 | PASS | PASS | PASS |
| A8 | check.mjs: 31; check.mjs: 33; check.mjs: 35 | PASS | PASS | PASS |
| A9 | check.mjs: 36 | PASS | PASS | PASS |
| A10 | check.mjs: 32 | PASS | PASS | PASS |
| A11 | check.mjs: 12 | PASS | PASS | PASS |
| A12 | check.mjs: 28; check.mjs: 38 | PASS | PASS | PASS |
| A13 | check.mjs: 30 | PASS | PASS | PASS |
| A14 | check.mjs: 66 | PASS | PASS | PASS |
| A15 | check.mjs: 4 | PASS | PASS | PASS |
| A16 | check.mjs: 5 bins in use | PASS | PASS | PASS |
| A17 | check.mjs: 9; check.mjs: 21 | PASS | PASS | PASS |
| A18 | check.mjs: 7; check.mjs: 27; check.mjs: 59 | PASS | PASS | PASS |
| A19 | check.mjs: 8; check.mjs: 26 | PASS | PASS | PASS |
| A20 | check.mjs: 15 | PASS | PASS | PASS |
| A21 | check.mjs: 24 | PASS | PASS | PASS |
| A22 | check.mjs: 13; check.mjs: 19; check.mjs: 37; check.mjs: 39 | PASS | PASS | PASS |
| A23 | check.mjs: 40; check.mjs: 42; check.mjs: 43; check.mjs: 44 | PASS | PASS | PASS |
| A24 | check.mjs: 41; check.mjs: 45 | PASS | PASS | PASS |
| A25 | check.mjs: 5 water filling | PASS | PASS | PASS |
| A26 | check.mjs: 10; check.mjs: 16 in shares | PASS | PASS | PASS |
| A27 | check.mjs: 11; check.mjs: 25 | PASS | PASS | PASS |
| A28 | check.mjs: 16 in an array | PASS | PASS | PASS |
| A29 | check.mjs: 17; check.mjs: 67 | PASS | PASS | PASS: check 67; check 17 switches maps by `style()` over an animated value, which Firefox 158 never applies |
| A30 | check.mjs: 18; check.mjs: 29; check.mjs: 68 | PASS | PASS | PASS: checks 29 and 68; check 18 switches maps by `style()` over an animated value, which Firefox 158 never applies |
| A31 | check.mjs: 22 | PASS | PASS | PASS |
| A54 | check.mjs: 70 | PASS | PASS | PASS |
| A32 | check.mjs: 23 | PASS | PASS | PASS |
| A33 | check.mjs: 53 | PASS | PASS | PASS |
| A34 | check.mjs: 54 | PASS | PASS | PASS |
| A35 | check.mjs: 14 | PASS | PASS | PASS |
| A36 | check.mjs: 58 | PASS | PASS | PASS |
| A37 | probes/algos/range.mjs: queries, bodies | PASS: 6,720 and 20,160 reads | PASS: 6,720 and 20,160 reads | PASS: 6,720 and 20,160 reads |
| A38 | check.mjs: 46 | PASS | PASS | FAIL: Firefox lays out in 1/60 px, so leaves in eighths read up to 0.03 off (ENGINES.md) |
| A39 | check.mjs: 55 | PASS | PASS | PASS |
| A40 | check.mjs: 56 | PASS | PASS | PASS |
| A41 | check.mjs: 57; check.mjs: 69 | PASS | PASS | FAIL: `anchor-size()` keeps the anchors' first sizes (QUIRKS Q3); in a container as wide as its content, check 69, it passes |
| A42 | check.mjs: 60 | PASS | PASS | PASS |
| A43 | check.mjs: 61 | PASS | PASS | PASS |
| A44 | check.mjs: 62 | PASS | PASS | PASS |
| A45 | check.mjs: 63 | PASS | PASS | PASS |
| A46 | check.mjs: 64 | PASS | PASS | PASS |
| A47 | check.mjs: 65 | PASS | PASS | FAIL: the row the second collapse makes is read a frame late (QUIRKS Q5): 20 for 19; the collapse's own reader is on time |
| A48 | probes/algos/minus.mjs: 8 cases | PASS: 3,840 of 3,840 reads | PASS: 3,840 of 3,840 reads | PASS: 3,840 of 3,840 reads |
| A49 | probes/novel/live-turn/tick-traps.mjs: 6 cases | PASS: 2,880 of 2,880 reads | PASS: 2,880 of 2,880 reads | PASS: 2,880 of 2,880 reads |
| A50 | probes/rom-api-check.mjs: entries, moving; probes/rom2-api-check.mjs: entries, moving | PASS: 2,000, 3,000, 5,120 and 4,500 reads | PASS: 2,000, 3,000, 5,120 and 4,500 reads | PASS: 2,000, 3,000, 5,120 and 4,500 reads |
| A66 | pipeline/formula-check.mjs: both entry paths, mean, extent, filters, state, per-item edits, empty inputs and compatibility paths; inline, shared, sheet, calc and auto where supported | PASS: 94 pages, 598 answers | PASS: 94 pages, 598 answers | PASS: 94 pages, 598 answers |
| A53 | probes/anchor-sort-check.mjs: 4, 16 and 32 totals | PASS: 120 of 120 frames, 70 reorders | PASS: 120 of 120 frames, 73 reorders | PASS: 120 of 120 frames, 70 reorders |
| A55 | pipeline/check.mjs FORMS=sheet: the 8 sorted group programs and the 3 ranked albums (24 rows) of examples.mjs | PASS | PASS | PASS |
| A56 | pipeline/check.mjs FORMS=sheet: ex-board-heights, ex-starts, ex-gallery-size | PASS | PASS | PASS |
| A57 | pipeline/check.mjs pipeline/at-size.mjs F=sheet: 3 stacked bar programs at 1,300 items | PASS | PASS | PASS |
| A58 | d3-check.mjs: every call d3-array's tests record with finite numbers (ticks 112, tickIncrement 30, tickStep 92, nice 20) | PASS: 254 of 254 | PASS: 254 of 254 | PASS: 254 of 254 |
| A59 | probes/axis/check.mjs: 9 axes and 2 zoomed by :has(), places within 1/32 px, labels as printed against d3's text, pixel for pixel | PASS: 11 of 11, the same pixels | PASS: 11 of 11, the same pixels | PASS: 11 of 11, the same pixels |
| A60 | d3-check.mjs: every call d3-array's tests record on arrays of numbers, numeric text and what d3 skips (sum 38, count 4, mean 32, min 30, max 30, extent 26); probes/dcss/reduce-check.mjs: 60 seeded lists to 3,000 items, a third signed to ±10,000 and a third to ±100, 420 reads, and 60 signed changes | PASS: 160 of 160; 420 of 420 (45 past 2^18 px with fractions: error 1), the mean to the bit, 240 of 240 moving (2026-10-29) | PASS: the same (2026-10-29) | FAIL: 160 of 160 d3 calls, but 218 of 420 seeded reads and 120 of 240 moving: layout snaps to 1/60 px, so 64ths and the skipped items' 1/64 px marks are lost (2026-10-28) |
| A61 | probes/dcss/hierarchy-check.mjs: the 6 tile calls d3-hierarchy's tests record, at their 2 decimals; 35 seeded trees with the leaves' values only (slice-dice: every node's), 3 with totals to 50,000 | PASS: 6 of 6, 38 of 38 (worst 0.80/64 px a level) | PASS: 6 of 6, 38 of 38 (worst 1.53/64) | PASS: 6 of 6, 38 of 38 (worst 0.94/64) |
| A62 | probes/dcss/scale/scale-check.mjs: every question d3-scale's linear, pow, sqrt and log tests ask a scale, with its state (map, invert, ticks, nice, tickFormat), the ones CSS can take compared exactly; 3,000 seeded linear, 1,500 pow and 1,485 log scales | PASS: linear 170 of 214, pow 147 of 187, sqrt 2 of 2, log 547 of 709 exactly (the rest not numbers or not printed by format; log within 256 x 2^-52); 3,000 of 3,000; 1,500 of 1,500; log 2,863 of 2,984 exact, every one within 256 x 2^-52 (the engine's log() and exp() a last bit off V8's, up to 128 x 2^-52 through exp) | PASS: the same as Chrome (pow and sqrt kept under WebKit's 65,535-token var() limit, facts/var-token-limit.mjs) | FAIL: pow 145 of 187 and log 544 of 709; calc() in single precision |
| A63 | probes/dcss/ease/ease-check.mjs: the 413 calls d3-ease's tests make and 5,665 on a grid of t, default and seeded parameters | PASS: 413 of 413, 5,665 of 5,665 (all within 1e-12) | PASS: 413 of 413, 5,665 of 5,665 (all within 1e-12) | PASS: 413 of 413, 5,665 of 5,665 |
| A64 | probes/dcss/format/format-check.mjs: the 30 calls in scope d3-format's tests make, 2,948 seeded (about 30% with `--trim`) and 600 ties, the printed text compared (Chrome: its accessibility tree; WebKit and Firefox: pixels) | PASS: 30 of 30, 2,948 of 2,948, 600 of 600 (2026-10-29) | PASS: 30 of 30, 2,948 of 2,948, 600 of 600 (2026-10-29) | FAIL: 2,122 of 2,948, 460 of 600: calc() in single precision (2026-10-29) |
| A65 | probes/dcss/scale/scale-check.mjs: every ticks, nice and tickFormat question d3-scale's log tests ask, each value compared exactly; 599 seeded ticks, 300 nice, 600 labels | PASS: ticks 38 of 38, nice 10 of 10, labels 453 of 453 (the 7 through 0 and 134 labels in types format does not print not taken); seeded 1,481 of 1,499 (12 base-e tick sets and 6 nice a last bit off: exp(-10) is not V8's Math.exp(-10)) | PASS: the same | FAIL: ticks 34 of 38; nice 10 of 10; labels 453 of 453 |
| A67 | probes/dcss/format/format-check.mjs and probes/si-carry-check.mjs: one coefficient round with decimal-tail integer pieces split at build time; 5,364 decimal-midpoint carry cases; SI printed text, 109 supported recorded calls, 1,567 seeded, 944 prefix boundaries, 1,165 decimal ties; 5 rejected inputs | PASS: all; also 30 existing f/% calls, 2,948 seeded and 600 ties; all 5,364 carry cases | PASS: all, including 5,364 carry cases | FAIL: d3-format's tests 121 of 139, seeded 2,011 of 2,939 print d3's text (2026-10-29) |
| A68 | probes/dcss/bisect-check.mjs; probes/dcss/discrete/inherited-check.mjs: recorded calls, 515 seeded cases per side, native changes, printing, nested readers and invalid inputs | PASS: 25/42 left and 25/37 right; 1,030 seeded; 28 live/reader checks plus four nested missing-query states | PASS: the same | FAIL: all 50 supported recorded calls; 1,023 of 1,030 seeded and 27 of 28 live/reader checks (single-precision arithmetic) |
| A69 | pipeline/contract-check.mjs; probes/dcss/compiled-check.mjs: native values, exact sum/scale, four d3 texts, invalid bindings | PASS: 144 build checks with optional mathfont; 10/10 states per implementation | PASS: same build checks; 10/10 states per implementation | PASS: 10/10 states, the arithmetic implementation (compiled-check.mjs) (2026-10-29) |
| A70 | pipeline/contract-check.mjs; probes/dcss/composition-cost.mjs and composition-cost-summary.mjs: reader counts, matching complete workloads, per-engine selection and authored semantic structure; pipeline/bytes.mjs | PASS: 144 build checks; six paired workloads retain arithmetic; twelve semantic projections; 320 prior pages/models unchanged in the earlier refactor | PASS: same build checks; same workload choices | NOTRUN: the selection compares Chrome's and WebKit's medians |
| A71 | probes/dcss/compiled-check.mjs: invalid values, native reset; variable/glyph pending, delivered and failed fonts | PASS: 10/10 states each; 3/3 guards per font encoding | PASS: 10/10 states each; 3/3 guards per font encoding | PASS: 10/10 states in each mode; 3/3 guards per font encoding (FONT_ROM=1) (2026-10-29) |
| A72 | probes/dcss/discrete/check.mjs, inherited-check.mjs and presentation-check.mjs: recorded range values, both lowerings, native controls, result widths and fixed formatting | PASS: 11/24 recorded questions; 67/67 added per lowering; 8/8 native states; 8/8 nested query states; 18/18 width/query/reset states | PASS: the same | FAIL: threshold layout seeded 65 of 67 (2026-10-29) |
| A73 | probes/dcss/discrete/check.mjs, expression-check.mjs, inherited-check.mjs and presentation-check.mjs: full quantize values, adjacent doubles, large expressions, result widths and native controls | PASS: 33/65 recorded questions; 103/103 added per lowering; 8/8 native and 8/8 nested query states; 18/18 width/query/reset states; seven partial counts parse | PASS: the same | FAIL: discrete/check.mjs stops at the threshold scale's seeded values (2026-10-29) |
| A74 | probes/dcss/quantile/check.mjs and cost.mjs: recorded calls, exact grid readback, scalar ranks, indexed reads, native controls, rendered text and complete composition costs | PASS: quantile 34/43, median 25/47 (d3's unboxed calls taken, its missing values skipped, 2026-10-29); 144 seeded layout, 136 scalar and 84 indexed each, 24 with missing values; 8/8 native states per lowering/operation; 64-value normal-flow layout composition 4.9 ms median | PASS: the same, normal-flow layout composition 6 ms median | FAIL: quantile 34/43 and median 25/47 read, their fixed text not d3's (2026-10-29) |
| A75 | probes/dcss/quantile/check.mjs: recorded source-position calls, seeded data, scalar/indexed reads, native controls and rendered text | PASS: 4/4 recorded, 120 scalar and 70 indexed seeded; 8/8 native states per lowering | PASS: the same | FAIL: 4/4 recorded read, the fixed text not d3's (2026-10-29) |
| A76 | probes/dcss/quantile-scale/check.mjs and cost.mjs: recorded maps, adjacent boundary doubles, shared ranks, native controls, rendered text and full composition | PASS: 39/74 recorded, 365 layout and 359 scalar added; 9/9 native states per lowering | PASS: the same | FAIL: 39/74 recorded read, then a wrong answer (2026-10-29) |
| A77 | probes/dcss/quantile-scale/check.mjs and cost.mjs with QUERY_SCOPE=result: result-container binding, exact maps, native changes/reset, text and full costs | PASS: the same recorded/added cases and 9/9 native states; 64-value, four-range scalar query median 0.4 ms | PASS: the same, 1 ms scalar query median | FAIL: 39/74 recorded read, then a wrong answer (QUERY_SCOPE=result) (2026-10-29) |
| A78 | probes/dcss/precision/check.mjs, exponent-check.mjs, composition-check.mjs and cost.mjs: recorded helpers, adjacent doubles, typed precision, native controls/reset, numeric reuse, errors, layout composition and complete costs | PASS: fixed 10/10, prefix 129/129, round 8/8; 695 added and 9/9 native states each; 364 exponent cases, 7/7 nested outputs; 30-value median 9.8–9.9 ms | PASS: the same; 30-value median 14 ms | FAIL: precisionFixed seeded 635 of 695 (2026-10-29) |
| A79 | probes/dcss/quantile/flow-check.mjs: four operations, all qualified lowerings, literal/dynamic data, captions and following content, 240/640 px widths, no fixed figure height | PASS: 40/40 natural-flow cases, exact width and height | PASS: 40/40 natural-flow cases, exact width and height | PASS: the natural-flow cases, width and height (flow-check.mjs) (2026-10-29) |
| A131 | mathml-check.mjs: 53 refusals with their reasons, 13 forms of one operator, the page kept, the build run twice; 706 seeded formulas (decimals, 64ths, magnitudes from 1e-7 to 1e9, ties; `<ci>` names the page sets; 478 nested to three levels, 6 medians of 10 to 45 names, 260 with arithmetic), each answer read back as its double through four registered integers and compared with d3's or JavaScript's; 201 seeded inequalities and chains against JavaScript's operators, a NaN side and an unset name; three definitions carried into later formulas, a `:has()` rule changing their input; a name never set, at the top and deep in a median; a `:has()` rule changing a name; the printed text against d3.format(","); every source formula as the browser's DOMParser reads it; each figure's size | PASS: 706 of 706 to the bit, 706 printed as d3 prints; 201 of 201 inequalities, their words as JavaScript's; the definitions to the bit (2026-10-29) | PASS: the same, the words not read (2026-10-29) | FAIL: single-precision `calc()` (2026-10-29) |
| A80 | pipeline/scan-contract-check.mjs; probes/dcss/cumsum/check.mjs: per-item endpoint legality, exact prefixes, reuse, missing values, error isolation, native controls/reset | PASS: 38 contract checks; 22/42 recorded calls (unboxed ones taken, 2026-10-28), fcumsum's 22/44 (2026-10-29); 60 scalar and 59 layout added cases; 13/13 states per lowering | PASS: the same | FAIL: calc 22/42 recorded, 60/60 seeded, 13/13 states; layout's text not d3's (2026-10-29) |
| A81 | probes/dcss/static/check.mjs and optimizer-check.mjs: shared sheet, bounded calls, d3 precision questions, hand-written three-call native/viewport/reset proof, errors, in the markup README teaches | PASS: 390/390 direct-sheet cases (3 a median skipping a missing value), 150 boundary queries; 147/147 precision questions included; 8/8 authored states; 4/4 optionally compiled states | PASS: the same | FAIL: 8/8 handwritten states, then a threshold boundary (static/check.mjs) (2026-10-29) |
| A82 | pipeline/measured-check.mjs; probes/dcss/cumsum/authored-check.mjs and authored-cost.mjs: identical markup, native data/errors/reset, exact transport, source/artifact binding and complete update workloads | PASS: 24 selection checks; 72 native cases and 24 full-range prefix checks; 24 fresh-page records; arithmetic qualifies for six complete workloads; author DOM retained | PASS: the same | FAIL: an authored prefix reads wrong (authored-check.mjs) (2026-10-29) |
| A83 | probes/fold-rom/live-check.mjs and live-cost.mjs with MATHFONT_FOLD: live integer sources, d3 minimum/scale/precision/text, reset/flow/projection, pending/failed fonts and complete comparison | PASS: 20 native states per backend, 4,096 live minimum pairs, 3 font guards; 8 saved timing records and 400 timed outputs checked; arithmetic retained | PASS: the same | PASS: 20 live states per backend, 4,096 live minimum pairs, failed/held/delivered font guards (live-cost.mjs not run) (2026-10-29) |
| A84 | probes/dcss/share/check.mjs; full-sheet-check.mjs: d3 sum/fractions, native/reset, labels, nested scope, bounded errors, formatter propagation and mutation detection | PASS: 17 focused cases and 36 independent full-sheet states; 64-item near-bound totals; wrong-share/error mutations detected | PASS: the same | PASS: 17 focused cases and 36 full-sheet states; wrong-share/error mutations detected (2026-10-28) |
| A85 | probes/dcss/compare/check.mjs: original identities, numeric/missing/NaN, native/reset and wrong-answer detection | PASS: 9/14 ascending and 9/14 descending; native/reset/nested/mutation guards | PASS: the same | FAIL: ascending 9 of 14 recorded, then a numeric boundary reads wrong (2026-10-28) |
| A86 | probes/dcss/scale-extra/check.mjs: original numeric map/invert calls, configuration independence, native changes/reset, finite presence and reuse | PASS: identity 11/86 exact; native/reset/status/reuse guards | PASS: the same | PASS: identity 11/86 original calls; native/reset, reuse, invalid values, mutation (2026-10-28) |
| A87 | probes/dcss/index-extrema/check.mjs: original calls, endpoint/ties, native/reset, NaN/errors, source-index mutation and nested reuse | PASS: minIndex 26/46, maxIndex 26/46 (unboxed calls taken, 2026-10-28), scan 6/23 through leastIndex (2026-10-29), leastIndex 9/26, greatestIndex 9/26, least 8/26, greatest 8/26; 50 additional states | PASS: the same | PASS: minIndex 26/46, maxIndex 26/46, leastIndex 9/26, greatestIndex 9/26, least 8/26, greatest 8/26; 50 additional states (2026-10-28) |
| A89 | probes/dcss/bisector/check.mjs: source-owned raw calls and hashes, sorted slice, valid/invalid bounds, missing query, native/reset, nested and container reuse | PASS: 98/153 original calls; numeric presence, bound errors, 64-item boundary and overflow guards | PASS: the same | PASS: 98/153 original calls; native/reset, nested reuse, invalid query/bounds, mutation (2026-10-28) |
| A90 | probes/dcss/log-label/check.mjs: disjoint original log labels, retained formatter questions, precision/trim boundaries, native/reset, errors and wrong-text detection | PASS: 106 additional log labels; 139 retained format questions; 210 precision/trim cases; 17 native/error states | PASS: the same | FAIL: a rendered label's counter text differs (2026-10-28) |
| A91 | probes/dcss/paired-check.mjs; compiler-paired/check.mjs; compiler contract checks: both branches use the same original oracle fixtures, shared CSS math and source manifests | PASS: 887/887 original questions across 27 exports in both branches, rerun on the focused families (2026-10-29; 2,672 across 65 before the cut); 25 share/field/flow/input-node states per branch; 135 contract and 38 per-item checks | PASS: the same | NOTRUN: new compiler branch qualification |
| A92 | probes/dcss/range-wave/check.mjs; selection.mjs: exact original identities, grid boundaries, native reset, nested scopes, capacity and mutation guard | PASS: 41/76 original calls in both branches | PASS: the same | PASS: 41/76 original calls; native/reset, NaN, capacity, nested scope, reuse, mutation (2026-10-28) |
| A93 | probes/dcss/utc-wave/check.mjs; cases.mjs; edges.mjs: source answers match recorded identities; exact timestamp differences, truncation, bounds, native reset, nesting and reusable results | PASS: utcDay 59/62, unixDay 59/62, utcHour 40/41, utcMinute 18/19 and timeSecond 19/20 in both branches | PASS: the same | FAIL: utcDay's recorded calls (2026-10-28) |
| A94 | probes/dcss/week-wave/check.mjs and edges.mjs: original identities, weekday alignment, negative modulo, exact counts, bounds, ties, native reset, nesting and reuse | PASS: 155/155 original calls across seven exports in both branches | PASS: the same | FAIL: utcSunday's recorded calls (2026-10-28) |
| A95 | probes/dcss/calendar-wave/check.mjs and cases.mjs: source-owned year periods, exact calendar results, leap/century rules, first-century dates, overflow, bounds, native reset and reuse | PASS: month 51/52, year 25/27 original calls in both branches | PASS: the same | FAIL: utcMonth 51 of 52, then a decade's utcYear floor (2026-10-28) |
| A100 | probes/dcss/locale-format/check.mjs: source-owned Arabic factories, native rendered text, changing input/reset, invalid/missing/magnitude errors and wrong-output guard | PASS: 2/99 raw identities; 22 locale contexts in both branches | PASS: the same | PASS: 2/99 raw identities; 22 locale contexts (runtime branch) (2026-10-28) |
| A103 | probes/dcss/identity-next/check.mjs: source-owned complete arrays, rendered labels, dynamic precision, capacity, item/summary contracts, native changes/reset and reuse | PASS: 11 arrays and 51 labels in both branches; up to 512 authored slots | PASS: the same | FAIL: a rendered label's text differs (2026-10-28) |
| A107 | probes/dcss/date-format-wave/check.mjs and ownership.mjs: every exact source-owned configuration, native text pixels, numeric-field reuse, native/reset, bounds/missing/nested and wrong-text guards | PASS: 52/52 UTC originals in all 138 source-owned contexts through both branches (2026-10-28) | PASS: the same | FAIL: a rendered date's text differs (2026-10-28) |
| A108 | probes/dcss/geo-point/check.mjs and guard.mjs: complete frozen numeric configurations, independent presence/status, nullable rectangle corners, native/reset, nested missing and output reuse | PASS: 89/89 originals in 291 contexts from raw inputs, both branches (2026-10-28); point 1e-6 and distance 1e-12 tolerances | PASS: the same | FAIL: geoIdentity 24 of 24; geoEquirectangular reads 0 px for -30 (2026-10-28) |
| A116 | probes/dcss/static/range-check.mjs: prices in cents, 64 values near the top, 1/64 fractions, interpolated quantiles and quantileSorted, quantile-scale thresholds, out-of-range values | PASS: 16/16 calls and 9/9 scale queries equal d3; 4 out-of-range refused | PASS: the same | FAIL: a 64-value list read 13,799.995 for d3's 13,800 (2026-10-28) |
| A118 | parts.mjs and runtime.mjs with DCSS_PARTS: every DCSS check (82) run with parts linked in place of families; probes/dcss/parts-text-check.mjs: 15 text-printing calls, part alone against core and family, pixel for pixel | PASS: 82/82; with DCSS_NOCORE=1 (no dcss-array.css) 89/90, the other a compiled-size comparison | PASS: the same | FAIL: the parts answer as the families do (25 of 25 checks that load through runtime.mjs give the same result), but 15 of those fail with either (2026-10-29) |
| A119 | probes/dcss/ease/function-check.mjs and scale/function-check.mjs: 37 easing functions at 21 t each and 400 seeded linear scales, against their classes and d3 | PASS: 1029 easing and 400 scale calls within 1e-12 of their classes | PASS: no @function; plain fallbacks kept, classes equal d3 | FAIL: no @function; easings keep their fallback (1,029 class answers d3's), a log scale's class reads wrong (2026-10-29) |
| A122 | probes/dcss/one-list/check.mjs: 276 seeded calls of 1 to 64 values (1/64 steps, whole numbers to 8,257,535, ties), 36 of them with missing values, 15 written out and 25 of d3's 47 median tests (14 with missing values), each against d3, invalid ones included; a figure alone on its page; COMPILED=1 the 78 within ±1024; cleanroom-check: the README's median, then a change | PASS: 295 of 295 equal d3 (45 skipping missing values), 21 of 21 refused with their error, 78 of 78 compiled | PASS: the same | FAIL: 77 of 316 calls differ (2026-10-29) |
| A123 | probes/dcss/one-list/scale-check.mjs: 1,328 seeded calls, domains of 1 to 64 values (1/64 steps, whole numbers to 8,257,535, ties), 1 to 17 ranges, numbers and text, queries on each threshold and one double either side, each against d3, invalid ones included; a figure alone on its page; one with a caption; COMPILED=1 the 299 with domains within ±1024; cleanroom-check: the README's scale | PASS: 1,318 of 1,318 equal d3, 10 of 10 refused with their error, 299 of 299 compiled | PASS: the same | FAIL: 519 of 1,328 calls differ (2026-10-28) |
| A124 | probes/dcss/static/scales-check.mjs: d3-scale's own 42 threshold and quantize map calls that fit (19 skipped: 14 object ranges, 3 query coercions, 2 past 16 thresholds), seeded calls with 1 to 16 thresholds, numbers and text, queries on each threshold and one double either side, each against d3; invalid ones; a bare output; COMPILED=1 the 1,121 with a finite query | PASS: 1,132 of 1,132 equal d3, 17 of 17 refused, 1,121 of 1,121 compiled | PASS: the same | FAIL: 349 of 1,149 calls differ (2026-10-28) |
| A125 | probes/dcss/static/cumsum-check.mjs: 83 seeded lists of 0 to 64 values, missing and NaN values among them, every running total against d3; a value off the grid and one past ±1024; a formatter in each item; COMPILED=1 the 59 lists without invalid values | PASS: 2,267 of 2,267 totals equal d3, 4 of 4 refused after a bad value, 1,428 of 1,428 compiled | PASS: the same | FAIL: a formatter in each item prints another total than d3's (2026-10-28) |
| A126 | probes/dcss/static/chain-check.mjs: the README's median -> precisionFixed -> formatFixed chain, and a formatter straight inside a median (and one of nothing), a quantile scale, a threshold scale, cumsum, ascending, the identity scale, a mean (and a sum figure's mean) of nothing, extent and a linear scale, each answering and failing; a precision helper on another's result through a plain element | PASS: 12 of 12 chains, 24 of 24 states, and the repeated helper | PASS: the same | PASS: 12 chains, each answering and failing (2026-10-28) |
| A127 | check.mjs: 61, 66 | PASS | PASS | PASS |
| A128 | probes/dcss/index-order/check.mjs: d3's 25 numeric test calls, 600 seeded lists (half from {1, 2, 3}), 3 with no answer, a live change | PASS: 629 of 629; 0 of 342 differ from d3 where its answer is the value's only copy (2026-10-28) | PASS: the same (2026-10-28) | PASS: 629 of 629 reads (2026-10-28) |
| A129 | probes/dcss/bin/check.mjs: 300 seeded figures (0 to 64 values, whole and 64ths, outside the domain, empty items; 0 to 32 thresholds, some outside the domain or on its ends), 150 with `--count` (1 to 12.5; domains and values whole, in tenths or in 64ths; some empty), 4 with no answer, a live move | PASS: 4,434 of 4,434 bins (2026-10-28) | PASS: the same (2026-10-28) | PASS: the same (2026-10-28) |
| A130 | probes/dcss/variance/check.mjs: d3's 49 test calls on numbers, plain or unboxed (24 with no answer), 300 seeded lists of 0 to 64 values (whole, eighths and 64ths, spans 1 to 1024, items with none), 4 with no answer, a live move; the engine's own value and the published text | PASS: 632 of 632 answers the true value to the bit (2026-10-28) | PASS: the same (2026-10-28) | FAIL: 34 of 632 (its calc() in 32-bit floats; the reads give 244, layout in 1/60 px) (2026-10-28) |
| A120 | probes/dcss/token-check.mjs: every call in families.json with a 20,000-token `--value`; three chains (a linear scale into an easing and into a pow scale, a pow scale into a UTC Monday) read through a registered number | PASS: 478 of 478 calls copy it at most once; the largest answer 12,221 tokens; 3 of 3 chains | PASS: the same | FAIL: 478 of 478 at most once; the date chain 81,600,000 ms off (32-bit `calc()`) |
| A51 | coverage/board.mjs: bd-power-12-loop-classes, bd-power-12-loop-table | PASS: 13 of 13 each, against NumPy | PASS: 13 of 13 each, against NumPy | PRECONDITION_FAILED: no view timelines, which dcss-store.css's store needs |
| A52 | sheets/check.mjs: loan | PASS: 50 of 50 cells as written and after 2 changes | PASS: 50 of 50 cells as written and after 2 changes | PRECONDITION_FAILED: no view timelines, which dcss-store.css's store needs |


### Architecture qualification (26 October 2026)

The shared registry and measured policy are covered by `pipeline/architecture-check.mjs`, `contract-check.mjs`, `measured-check.mjs`, `scan-contract-check.mjs` and `evidence-check.mjs`. Synthetic costs in these checks are policy tests, never browser performance results. Whole-plan records bind source, artifact, input bounds and actual output addresses. Qualification covers both required mutation patterns and both engines; stateful latency cannot silently replace same-update behavior.

The typed pilot's 48-row baseline went with the typed calls (2026-10-28). `implementation.json` records every sheet's before/after bytes; `default-migration.json` accounts for the 35 old literal backend declarations; no update-speed claim follows.

The new count/mean compiler subset matches 5 of the 45 original recorded calls in both branches and both engines, with mutation, missing-input refusal, restoration and downstream numeric/width reuse (`count-mean-original-check.mjs`). The remaining 40 source calls are explicitly outside this subset. This adds no headline coverage count. The A91 paired proof was rerun on the current sources on 2026-10-29: 887/887 original questions across 27 exports in both branches, the cut families' groups gone (`coverage/d3-branches.json`).

## 4. Not covered

- Colors: d3-color's constructors, conversions and parsing (gamutant.css reads a CSS color's channels as numbers; `color-mix()` interpolates).
- Parsing dates from text (d3-time-format's parse), and local time: dates are UTC epochs in milliseconds.
- d3.packSiblings, a projection's fitExtent and fitSize, and d3-random.
- Values that aren't numbers on the grid (d3's null, undefined and NaN as values, strings, objects, accessors, comparators), doubles past the grid's range, and d3.fsum, fcumsum, mode, scan, variance and deviation; d3's choice among equal values in medianIndex and quantileIndex.
- Compiled HTML compositions beyond A69's sum/two-stop-scale/fixed-percent-SI chain, A72–A73/A76's discrete scales, A74–A75's grid quantiles, A78's precision helpers and A91–A112's paired calls; dynamic scalar settings beyond bounded precision, live DOM rewiring, arbitrary font-wrapper layout, or a measured three-way cost model.

- Quantiles outside A74's grid bounds; invalid-observation filtering beyond A122's, coercion, accessors, signed-zero identity, dynamic probability and index-returning quantile variants.
- d3.format's types outside f, %, s and A90's bounded general decimal notation; fill, align, width and zero; SI outside A67's bounds; trim outside SI, log labels or bounded general notation; nonfinite inputs. Linear/pow fixed-prefix SI labels remain unported.
- Loops between grids (`.loop-flow`, `.loop-in`, `[data-store-read]`, `--store-of`) without dcss-store.css or store.css on the page: their cells are the board's stored numbers.
- Entries of any tag but `<i>`, and readers of any tag but `<b>`.
- Ranks past 32 in one bin (rank 33 reads 1), and bins in use counted past the box's width in px.
- A count of bins in use in `.dcss-bins.dcss-bin-max`, whose 32 bins are an auto-repeat that takes no `max-content`.
- Numbers past 6 significant digits through the registered `--dcss-value`, and fractions finer than 1/64 px (css-grid-2 §12).
- A transform, filter, perspective or containment between a reader and its array: a reader is `position: fixed` against the array's `contain: layout`.
