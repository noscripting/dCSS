# dcss.css: SPEC

dcss.css computes with CSS layout: indexed reads, sums, ranks, sorts, keyed maps, packing and formulas over numbers written in custom properties, with no script at run time.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

Measured 2026-11-02, headless: Chrome 155.0.8059.86, WebKit 26.4, Firefox 159.0.
Conformance: Chrome 141/141, WebKit 140/141, Firefox 120/141.
Rows dated earlier were measured from 2026-10-26, Firefox's in Firefox 158.0.
The checks, probes and scripts this document names are in the noscript.ing repository ([github.com/noscripting/noscript.ing](https://github.com/noscripting/noscript.ing)), under `libraries/dcss/`; this package carries the sheets and their documents.

Stylesheet packaging: `dcss.css` is the shared core. DCSS calls require their
family files from `families.json`, in manifest order. `runtime.mjs` computes the
same selection for plain HTML links and composition compilation. `dcss-all.css`
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
| store.css | store 4f37d4eb | the stored cells and readers the loops and sheets run on |

## 2. Requirements

### Every call

- **A251** Every call MUST give its answer wherever d3 has one, at the engine's own `calc()` precision (doubles in
  Chrome and WebKit, 32-bit floats in Firefox, QUIRKS.md Q16), and an answer off d3's double only by that precision (in
  Firefox d3's answer rounded to a float, or within the float steps its requirement states) MUST NOT give `--dcss-err` 1.
  `--dcss-err` 2 MUST mean only that d3 gives no number (undefined or NaN), and `--dcss-err` 1 only an input past the bound
  the call's requirement states; "to the bit" below is a double's bits in Chrome and WebKit and this float in Firefox.
  A number that isn't the answer MUST NOT be given with `--dcss-err` 0; where a call's own requirement names an answer
  more exact than d3's double (A130, the variance rounded once; A249, the exact decimal sum: 0.3 for 0.1 + 0.2, where d3
  gives 0.30000000000000004), that is the answer.

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

- **A15** In `.dcss-bins`, a child with whole `--dcss-bin` of 1 or more MUST give what is inside it `--dcss-rank`, 1 for
  the first child in its bin in markup order, exact to 32, with a bin changing every frame. A rank past 32, every rank
  in a grid of more than 1,024 children, and a child whose bin is below 1 or not an `<integer>` (a `calc()` is rounded,
  as CSS rounds an `<integer>`) MUST give `--dcss-err: 1` and `--dcss-rank` 0; such a child MUST be in no other child's
  answer.
- **A16** A `.dcss-track-count` in `.dcss-bins` MUST give `--dcss-track-count`, the number of bins in use from 1 to the
  box's width in px; a child with a bin past the width or refused (A15) MUST count in it no more than a value d3.bin
  ignores outside its domain.
- **A17** A `<b class="dcss-below">` in a child of `.dcss-bins` MUST give `--dcss-below`, how many distinct bins from 1
  to the box's width in use lie below its bin, with or without an author's padding and border on the grid; in a child
  whose bin is refused (A15) it MUST give `--dcss-err: 1` and 0.
- **A18** `.dcss-bins.dcss-bin-max` MUST give a reader with `--dcss-i` the largest `--dcss-n` in bin i, and a range the
  sum of those maxima, with entries at any depth under `.dcss-nest` wrappers, for whole `--dcss-n` from 0 and answers
  under 1,000,000. A reader over a bin holding a number below 0, not whole or past 999,999, a reader whose answer
  would pass 999,999, and a reader inside a `.dcss-nest` MUST give `--dcss-err: 1` and `--dcss-value` 0; a child
  whose bin is outside 1 to 32 or refused (A15) MUST be in no answer.

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
  `--dcss-ok` 0, and in Firefox so MUST a leaf off its 1/60 px layout grid (QUIRKS.md Q16).
- **A39** `.dcss-cap` MUST give min(E, c) of its formula E with c moving, of a sum or of a leaf; a negative leaf in it
  MUST read 0 with `--dcss-ok` 0.
- **A40** `.dcss-times` MUST give f × E as a height, f written and moving, counted in an `.dcss-shape-stack` and read
  inside it.
- **A41** `.dcss-calc` boxes MUST give a product, a min and their sum of two named formulas through `anchor-size()`,
  in the same frame.
- **A42** `<b class="dcss-hop">` MUST give a row the sum of the columns it spans (two hops in one row the larger), and
  `<b class="dcss-hop-y">` a column the sum of the rows it spans, read by `.dcss-at-y` and `.dcss-at-x`.
- **A43** `.dcss-text` MUST give the sum and the largest line of counters in `dcss-tally`, f(k) of the shared tables
  (k, round(k^2 / 1000), round(sqrt(1000 k)) for k 0 to 999), a scan and a table's running totals, exact, or
  `--dcss-err` 1 where an engine prints the counter style's fallback (QUIRKS.md Q17), never another number.
- **A238** `<b class="dcss-int" style="--dcss-counter: name"><u><u></u></u></b>` MUST give on its inner `<u>`, as
  `--dcss-int`, the value of the page's counter `name` where the reader stands, any signed 32-bit integer, exact, the next
  frame after it changes, and 0 for a counter the page never set; the reader MUST take no room in the page's flow, and
  where its text isn't in its font at 128px MUST give `--dcss-err` 1. Inside a page's size container or `contain: style` box, where an engine
  reads a counter set outside it as 0 (QUIRKS.md Q15), it MUST give the counter's value or `--dcss-err` 1, never another
  number. Where `calc()` keeps 32-bit floats (Firefox), it MUST give `--dcss-err` 1 for a counter of 2^24 or more in
  magnitude (QUIRKS.md Q16).
- **A239** A `.dcss-sum`, `.dcss-count`, `.dcss-length` or `.dcss-mean` MUST count an item whose box is made after load
  (put in or taken out by script anywhere in the list, or its `hidden` attribute removed) and a changed value within
  300 ms, in every engine where it gives an answer; a `.dcss-bin` and a `.dcss-int` MUST do so too, and in WebKit
  miss an item put in where one was taken out in the same task, and a bin 64 put in at once (QUIRKS.md Q18). An item with the `hidden` attribute MUST be left out, and any other item counted,
  whatever `display` the page gives it (QUIRKS.md Q18).
- **A240** Printed (`@media print`, a PDF), a call MUST print its answer or nothing, never another number; a call that
  reads a scroll range MUST give `--dcss-err` 1 there (QUIRKS.md Q19).
- **A250** Under a page's or a layer's override of animations or of text (the reduced-motion reset, `animation: none`,
  WCAG 1.4.12's text spacing, a forced font) or on a right-to-left page (`dir=rtl`, `direction: rtl`), a call that reads its list MUST give its answer or `--dcss-err` 1, never
  another number; it MUST do the same where the page leaves its figure unrendered (`content-visibility: auto` off
  screen, a closed `<details>`, `hidden=until-found`); a list changed while unrendered MUST give, until it is rendered
  again, its new answer, `--dcss-err` 1 or the answer it last drew, and from the second frame after, its new answer.
- **A241** An element after the list sized by a call's answer (a bar as wide as the sum) MUST NOT change the answer, and
  a sum whose items' registered `--value` transitions MUST read right or give `--dcss-err` 1 in every frame, and right
  once the transition ends. A value with a fraction in a list whose style attributes write whole numbers MUST give
  `--dcss-err` 1, not the value rounded.
- **A242** A `.dcss-median`, `.dcss-quantile` or `.dcss-median-index` MUST give its answer or `--dcss-err` 1 when the page
  registers `--value` itself, inherited or not.
- **A246** A `.dcss-median`, `-quantile`, `-quantile-sorted`, `-median-index`, `-quantile-index` or `-scale-quantile`
  whose figure writes `--domain-0` MUST give d3's answer for lists within A116's and A128's bounds above it, and error 1
  for a list with an item below it.
- **A247** A `.dcss-median`, `-quantile`, `-quantile-sorted`, `-median-index`, `-quantile-index` or `-scale-quantile`
  whose figure writes `--decimals` d, a whole number from 0 to 6, MUST take each item's `--value` v as the whole number
  k = round(v x 10^d), where k / 10^d is v itself, and its `--domain-0` (on the same grid; by default k = -131,072) as
  lo's k, |lo's k| at most 67,108,864; for k from lo's k to lo's k + 8,388,607 (the index calls to + 262,143, the
  quantile scale to + 524,287, QUIRKS.md Q20) and 0 to 1,024 items it MUST give d3's answer on the doubles,
  to the bit: an interpolated quantile is v0 + (v1 - v0) x f with v0 = k0 / 10^d and v1 = k1 / 10^d, as d3 computes it.
  A value with more decimals than d, an item below lo or past its range, a `--domain-0` off the grid or past the bound,
  or a d that isn't a whole number from 0 to 6 MUST give error 1. In Firefox any d but 0 MUST give error 1.
- **A249** A `.dcss-sum`, `.dcss-mean`, `.dcss-min`, `.dcss-max` or `.dcss-extent` with the class `dcss-decimals` whose figure writes `--decimals` d, a whole
  number from 0 to 6, MUST take each item's `--value` v as the whole number k = round(v x 10^d), where k / 10^d is v
  itself, an item with no number skipped, and give the sum of the k divided once by 10^d (0.1 + 0.2 is 0.3), and the
  mean as that sum divided once by n x 10^d, to the bit, and the min, max and extent as the least and greatest k divided
  once by 10^d (the input itself), each printed by its `<output>` to 6 decimals. A sum's positive and
  negative k's each total under 2^24 - 1; a mean's k's total from -min(131,072 x 10^d, 2^23) to under
  2^24 - 1 - min(131,072 x 10^d, 2^23), with A60's other bounds; a min's, max's and extent's k from -131,072 to 8,257,535. A value with more decimals than d, a d that isn't a whole number from 0 to 6, a value past the
  bounds, and in Firefox any d but 0 on a sum, min, max or extent holding a number and any mean MUST give error 1.
- **A243** A `.dcss-sum`, `-count`, `-mean`, `-max`, `-extent` or `-length` whose items' style attributes a
  Content-Security-Policy dropped (`style-src 'self'`) MUST give `--dcss-err` 1; an item whose style attribute writes
  `--value` and that has none counts as dropped, and in Firefox, which empties a dropped style attribute, one whose
  style attribute is empty The same MUST hold on a page that registers `--value` itself.
- **A44** The text operators MUST give, from pair texts and counter styles, min, max, a sum of products, |a - b|, a > b,
  a × b by `letter-spacing`, floor(a / b) by a tab, sign and relu, exact.
- **A45** A `.dcss-collapse` of signed margins, `.dcss-zoom` factors in a sum, an `.dcss-baseline` row,
  `.dcss-columns` with `--dcss-parts` and `.dcss-flex` shares MUST give their laid-out results within 1/64 px.
- **A46** Collapses MUST nest: two laid-out widths in one collapse (W1 / 2 - W2), three levels of `.dcss-scope`, the
  results counted in an `.dcss-shape-stack` and an `.dcss-tallest` with no reader between.
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
  lower bin; an item's `<b>` on its group's bar after the items before it; label k at bar k's top. G is the number of
  `.dcss-group`s, the figure's first children, with as many `<b>`s in `.dcss-bars`, and MUST equal `--dcss-bins`; an item
  whose `--dcss-bin` is outside 1 to G (or not an `<integer>`) is in no group; `--dcss-key` an integer, 0 to
  `--dcss-span` - 1. Past these bounds the answers they reach MUST give `--dcss-err: 1`: every bar, label and segment
  of a figure whose G is past 16 (32 with `dcss-wide`, 16 with `dcss-copy`) or doesn't match its bars or `--dcss-bins`;
  a label past G; the segment of an item outside 1 to G, with a key outside its range (the item still counts in its
  group), or whose own `--dcss-n` is negative or not a whole number; the author keeps the bounds no selector reads: every `--dcss-n` a whole number, 0 or more (whole px: Firefox lays
  out in 1/60 px, so a 1/64 fraction moves the bars), and every group's total at most the figure's width (a wider group wraps onto a second line).
- **A56** `.dcss-piles` MUST place each item at the sum of the heights before it in its group; `.dcss-starts`
  MUST place group k's marker at the sum of `--dcss-n` over earlier groups; with dcss-extras.css, a `.list`'s `.dcss-size`
  MUST read its width and height.
- **A57** `.dcss-ranked.dcss-copy` with `--dcss-copy-width` and `.dcss-ranks > b > .dcss-segments` holding G
  `.dcss-group` and the items again MUST place each segment as A55 does, for up to 16 groups, within A55's bounds and
  refused past them as A55's are.
- **A58** Retired 2026-11-02: an axis's part (d3-array's ticks, tickIncrement, tickStep and nice), not a page that computes; `.dcss-bin`'s `--count` keeps the tick arithmetic (A129); git keeps it.
- **A59** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A60** `.dcss-sum`, `-count`, `-mean`, `-min`, `-max` and `-extent` over `<li>`s with `--value` MUST give each
  element after the list (a `<figcaption>` excepted), every element inside one and their `::before` and `::after` `--dcss-<name>` (extent: `--dcss-min`, `--dcss-max`) equal to d3-array 3.2.4's for signed
  whole-number values, one unit one px (a mean's summing from -131,072 to 16,646,141, min, max and extent's from -131,072 to 8,257,535), skipping
  what isn't a number with `--dcss-err` 0, as d3 skips it, except that a mean's list with 64 or more items with no number, or
  262,144 or more values, MUST leave the mean no answer with error 1 (a count and a length count up to 16,777,214 of
  them); a value with a fraction (fractions take `dcss-decimals`, A249) or out of range MUST leave no answer with error 1,
  and d3's undefined error 2; a sum's or mean's list reaching 16,777,215 px (2^24 − 1; the list is 1 px more than its
  values) MUST
  leave no answer with error 1; an empty `<output>` MUST print the answer as format(",") does, to 6 decimals.
- **A61** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A62** `.dcss-scale-linear`, `.dcss-scale-pow` (`--exponent`), `.dcss-scale-sqrt` and `.dcss-scale-log` with `--domain-k`, `--range-k`
  (k 0 and 1; with `.dcss-piecewise`, k 0 to 7, `--stops` of them), `--clamp`, `--round` and `--value` MUST give `--dcss-scale-<name>` and
  `--dcss-scale-<name>-invert` equal to d3-scale 4.0.2's scale(value) and invert(value) (a log scale within 256 × 2^-52 of it); for finite numbers. A log scale's input (clamped first where `--clamp` is 1) of the other sign than `--domain-0`, or 0, MUST give no number (NaN, printing nothing), as d3's NaN. Where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16), a pow, sqrt or log scale MUST give no number.
- **A210** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A211** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A212** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A213** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A214** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A63** Retired 2026-10-31: easing is CSS's own (`linear()`, `cubic-bezier()`, `steps()`); git keeps d3-ease's port.
- **A64** `.dcss-format-fixed` and `.dcss-format-percent` with `--value`, `--precision`, `--comma`, `--sign`,
  `--symbol` and `--trim` MUST print in their `::after` the text d3-format 3.1.2's format prints for that specifier (type f or %,
  sign - or +, symbol none or $, `~` for `--trim: 1`), where |value| x 10^precision is under 2^53; past it `--dcss-err` MUST be 1.
  In Firefox, whose `calc()` keeps 32-bit floats (QUIRKS.md Q16), every format type MUST give `--dcss-err` 1 where its floats might round
  otherwise than d3, and for an |value| of 10^31 or more, or not 0 and under 2^-100. Bound: there an |value| under 2^-150
  (about 7e-46) is read as 0 (or -0) before any rule sees it, so it prints what d3 prints for 0, with `--dcss-err` 0:
  right for types f and %, and for s and general where d3 prints the value as error 1 (outside A67's range, or
  exponential) it prints 0. format-check.mjs's 18 values past a float's range hold 3 such calls, expected so; a format
  given a precision that is no number (a refused precision helper's) MUST print nothing there, after a change too.
- **A65** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.

- **A67** `.dcss-format-si` MUST print d3-format's type s (sign -/+, optional $, comma, trim) for 1–15
  significant digits, zero or 1e-30 <= |value| < 1e31. Below 1e-24, precision + floor(log10(|value|)) + 24 MUST
  be positive. Outside these bounds `--dcss-err` MUST be 1 and nothing print.

- **A68** `.dcss-bisect-left/right` (`.dcss-bisect` aliases right) MUST match d3-array's insertion index for up to
  1,024 sorted whole-number keys within ±2^24, finite query `--value`, and whole bounds 0 <= lo <= hi <= length.
  The result MUST reach reader descendants in the same frame. Invalid searched keys or missing query MUST flag an error
  and suppress the empty output; where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16), a key or a query of
  2^24 or more in magnitude MUST give `--dcss-err` 1, since 2^24 + 1 reads there as 2^24.
- **A132** Every call over a list MUST give the same answer, error and printed digits when its `<li>`s hold text and
  under a page's own rules on lists, items and their `::before` and `::after` (margin, padding, border, position, float,
  display, box-sizing, line height) loaded after dcss.

### Compiled HTML composition

- **A69** `compileComposition(html, options)` MUST reject unavailable numeric bindings and preserve downward sum/scale/format connections. Its sum accepts 1–63 nonnegative items on declared steps that are multiples of 1/64, with maximum total below 2^18; scalar settings are literal except A78's bounded precision bindings. Its contract MUST distinguish numeric and text results and name their locations.
- **A70** Contracts MUST name calc/layout/font ROM, count readers/shared fonts and keep unknown cost null. Selection MUST use matching complete-fragment measurements including the default, improving at least one metric without worsening either engine's median or supplied p95. Experimental fonts MUST require opt-in and permission to wrap leaf outputs.
- **A71** Compiled scalar and text results MUST propagate upstream readiness and errors through `--dcss-ready` and `--dcss-err`, hiding generated text until ready and error-free. Native form reset MUST preserve computation elements. Delayed or failed fonts MUST leave dependent output unready while independent arithmetic outputs remain ready.

- **A72** Compiled `.dcss-scale-threshold` MUST select d3's numeric/text range from 0–1,024 sorted numeric thresholds within ±2^24, agreeing under literal calc/layout lowerings. Missing queries MUST return unknown or error 2; invalid active layout keys MUST flag error 1. Result styles MUST NOT alter computation, while descendant numeric reuse, native changes and reset MUST remain correct.

- **A73** Compiled `.dcss-scale-quantize` MUST match d3’s range value for ascending literal endpoints within ±2^24, zero or magnitudes at least 2^-1006, and 1–1,025 supported numeric/text ranges. Calc and layout MUST preserve d3’s boundary operation order and missing-query behavior. Numeric results MUST preserve descendant reuse, authored result widths, native changes and reset.

- **A74** Compiled quantile/median MUST match d3 within declared 1/64-grid bounds and static probability, skipping an item with no number as d3 does (quantileSorted keeping its place and refusing a read of it with error 2). Scalar ranks MUST support 64 values, layout 1,024; indexed reads require cumulative width below 2^18. Lowerings MUST preserve author nodes, output position, exact reuse, formatting and reset, flagging invalid data as error 1 and empty inputs or missing probability as error 2, and in Firefox (QUIRKS.md Q16) a layout read with a fraction or an interpolation not exact in 32-bit floats as error 1 with NaN, no number.

- **A75** Compiled `.dcss-quantile-sorted` MUST match d3's source-position R-7 interpolation within A74's bounds, supporting 1,024 values with direct scalar reads. Indexed layout MUST preserve source order within its cumulative-width bound. Both MUST preserve descendant numeric reuse, native changes, formatting, error meanings and reset.

- **A76** Compiled `.dcss-scale-quantile` MUST match d3 on declared 1/64-grid data with 0–17 supported ranges. Layout MUST share each captured order statistic within its cumulative-width bound; scalar ranks MUST support 64 values. Both MUST preserve descendant reuse, authored styles, native changes, formatting, unknown queries and reset, flagging invalid data as error 1 and empty ranges as error 2.

- **A77** Quantile-scale queries bound on the result div instead of the figure MUST preserve d3 results, readiness, errors, formatting and reset while publishing their actual input scope. Scoped query updates MUST leave the data computation upstream; complete costs MUST be measured in both engines.

- **A78** Compiled precisionFixed/Prefix/Round MUST match d3 within declared bounds, nonzero step magnitudes 1e-30 to below 1e31, and target magnitudes below 1e31. Integer results MUST support downward reuse and bounded formatter precision. Native controls, reset and errors MUST preserve author elements; undefined answers MUST publish CSS NaN with error 2 and suppress dependent text; and where calc() keeps 32-bit floats (Firefox), a step, target or difference within 2^-20 of a power of ten MUST give no answer with error 1 where the answer with its exponent on the power's other side differs (precisionRound with |max| under |step| is 1 on either side), unless the build marks it exact: `--dcss-prec-step-f32`, `--dcss-prec-target-f32` and `--dcss-prec-diff-f32` are 1 on a literal a 32-bit float holds exactly, and `--dcss-prec-s-lit` and `--dcss-prec-t-lit` give a literal's own exponent (its difference's, for precisionRound's two literals).

- **A79** Quantile, median, source-position quantile and quantile-scale results MUST retain their author's available width and natural flow height without requiring an explicit figure height. Literal and dynamic data, captions and following content MUST remain correctly placed in both engines. Contracts MUST count the width and validation reads needed to preserve that behavior.

- **A131** Retired 2026-10-31: moved to BASICSS, its MathML format's M131.
- **A133** Retired 2026-10-31: moved to BASICSS, its MathML format's M133.
- **A134** Retired 2026-10-31: moved to BASICSS, its MathML format's M134.
- **A136** Retired 2026-10-31: moved to BASICSS, its MathML format's M136.
- **A209** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A208** `.dcss-scale-ordinal` with `--value`, up to 16 domain values in `--domain-0` to `--domain-15` (`--domains` of them) and up to 16 range items in `--range-0` to `--range-15` (`--ranges` of them) MUST give everything inside it `--dcss-scale-ordinal`: the range item at the value's place in the domain modulo `--ranges`, as d3's `ordinal(value)`, a place matched as CSS tokens (strings quoted, a Date as its epoch milliseconds) or, for a number, by its value (`calc(80 + 2)`, `82.0` and another call's answer written straight inside match 82; the text `'82'` does not), and a NaN, a refused call's answer, MUST give no answer and `--dcss-err` 1, as MUST, in Firefox, a number in no slot (its style queries see a value before its animations: a sum's answer, or one through a page's registered property). A value in no slot MUST take `--unknown` where it is set; else, as d3's implicit unknown, the range item at `--domains` modulo `--ranges`; with `--implicit: 0`, or no range, no answer and `--dcss-err` 2 (d3's undefined), else `--dcss-err` 0. A domain whose first `--domains` slots repeat a value MUST give no answer and `--dcss-err` 1 (d3 numbers a value by its place among the unique values), and a nested call MUST NOT match a slot of the call around it.
- **A207** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A206** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A205** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A192** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A191** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A190** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A204** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A203** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A202** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A201** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A200** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A181** A format class (`.dcss-format-fixed`, `-percent`, `-si`, `-general`, `-locale`) on an element holding `<output>`s MUST format each `<output>` inside it that has no format class of its own, as that class on the output would, and MUST NOT print on the element itself; `--precision` and the other settings, set once on that element, MUST reach each of those outputs.
- **A180** `.dcss-summarize` with up to 1,024 items, each a whole number from -1024 to 65535 (one unit one px) or none, MUST give each element after the list (a `<figcaption>` excepted), and every element inside one, `--dcss-sum`, `--dcss-count`, `--dcss-length`, `--dcss-mean`, `--dcss-min`, `--dcss-max`, `--dcss-median`, `--dcss-variance` and `--dcss-deviation`: the doubles d3-array's `sum`, `count`, `mean`, `min`, `max` and `median` give for the list (an item with none skipped), its number of items, and the true variance rounded once and its square root (A130's), from the one list. With no number, the mean, min, max and median MUST be no number, error 2; with fewer than two numbers or more than 64 items, the variance and deviation MUST be no number. More than 1,024 items, a value outside the range or with a fraction (fractions take `.dcss-decimals`, A236) MUST leave no answer, error 1; a page's padding or border on the figure MUST change neither an answer nor its text.
- **A179** Retired 2026-10-31: moved to BASICSS, its MathML format's M179.
- **A178** Retired 2026-10-31: moved to BASICSS, its MathML format's M178.
- **A177** Retired 2026-10-31: moved to BASICSS, its MathML format's M177.
- **A176** Retired 2026-10-31: moved to BASICSS, its MathML format's M176.
- **A175** Retired 2026-10-31: moved to BASICSS, its MathML format's M175.
- **A174** Retired 2026-10-31: moved to BASICSS, its MathML format's M174.
- **A173** Retired 2026-10-31: moved to BASICSS, its MathML format's M173.
- **A172** Retired 2026-10-31: moved to BASICSS, its MathML format's M172.
- **A171** Retired 2026-10-31: moved to BASICSS, its MathML format's M171.
- **A170** Retired 2026-10-31: moved to BASICSS, its MathML format's M170.
- **A169** Retired 2026-10-31: moved to BASICSS, its MathML format's M169.
- **A168** Retired 2026-10-31: moved to BASICSS, its MathML format's M168.
- **A167** Retired 2026-10-31: moved to BASICSS, its MathML format's M167.
- **A166** Retired 2026-10-31: moved to BASICSS, its MathML format's M166.
- **A165** Retired 2026-10-31: moved to BASICSS, its MathML format's M165.
- **A164** Retired 2026-10-31: moved to BASICSS, its MathML format's M164.
- **A163** Retired 2026-10-31: moved to BASICSS, its MathML format's M163.
- **A162** Retired 2026-10-31: moved to BASICSS, its MathML format's M162.
- **A161** Retired 2026-10-31: moved to BASICSS, its MathML format's M161.
- **A160** Retired 2026-10-31: moved to BASICSS, its MathML format's M160.
- **A159** Retired 2026-10-31: moved to BASICSS, its MathML format's M159.
- **A158** Retired 2026-10-31: moved to BASICSS, its MathML format's M158.
- **A157** Retired 2026-10-31: moved to BASICSS, its MathML format's M157.
- **A156** Retired 2026-10-31: moved to BASICSS, its MathML format's M156.
- **A155** Retired 2026-10-31: moved to BASICSS, its MathML format's M155.
- **A154** Retired 2026-10-31: moved to BASICSS, its MathML format's M154.
- **A153** Retired 2026-10-31: moved to BASICSS, its MathML format's M153.
- **A152** Retired 2026-10-31: moved to BASICSS, its MathML format's M152.
- **A151** Retired 2026-10-31: moved to BASICSS, its MathML format's M151.
- **A150** Retired 2026-10-31: moved to BASICSS, its MathML format's M150.
- **A149** Retired 2026-10-31: moved to BASICSS, its MathML format's M149.
- **A148** Retired 2026-10-31: moved to BASICSS, its MathML format's M148.
- **A147** Retired 2026-10-31: moved to BASICSS, its MathML format's M147.
- **A146** Retired 2026-10-31: moved to BASICSS, its MathML format's M146.
- **A145** Retired 2026-10-31: moved to BASICSS, its MathML format's M145.
- **A144** Retired 2026-10-31: moved to BASICSS, its MathML format's M144.
- **A143** Retired 2026-10-31: moved to BASICSS, its MathML format's M143.
- **A142** Retired 2026-10-31: moved to BASICSS, its MathML format's M142.
- **A141** Retired 2026-10-31: moved to BASICSS, its MathML format's M141.
- **A140** Retired 2026-10-31: moved to BASICSS, its MathML format's M140.
- **A139** Retired 2026-10-31: moved to BASICSS, its MathML format's M139.
- **A138** Retired 2026-10-31: moved to BASICSS, its MathML format's M138.
- **A137** Retired 2026-10-31: moved to BASICSS, its MathML format's M137.
- **A135** Retired 2026-10-31: moved to BASICSS, its MathML format's M135.

### Per-item and drop-in composition

- **A80** Compiled cumsum MUST publish 0–128 scoped per-item endpoints with bounds and status in version-two contracts. Within declared 1/64-grid prefix bounds below 2^18, both qualified lowerings MUST match d3, preserve scalar reuse and native reset, and skip missing/NaN values. Invalid inputs MUST invalidate their prefix and later results while preserving earlier results; in Firefox, which lays out in 1/60 px (QUIRKS.md Q16), the layout lowering MUST give `--dcss-err` 1 and no number for the prefix from the first value that isn't whole px.

- **A81** The sheet MUST expose bounded discrete scales, quantiles, cumsum and precision helpers without compilation, with plain elements after a list or none and 17 property-based range values. Quantize MUST derive its thresholds from its domain in d3's operation order. A hand-written median → precisionFixed → format-fixed chain MUST match d3 across eight native/reset/viewport states, preserve flow and errors, and remain valid through optional compilation.

- **A82** A cumsum's results list MUST support arithmetic and shared-grid layout without adding or reparenting author elements, preserving exact per-item results, errors, text and reset. Complete-workload measurements MUST bind source, styling, bounds and emitted artifacts. Selection MUST retain the existing choice unless neither engine's median nor p95 regresses; stale measurements MUST be rejected, and unknown costs MUST remain null.

- **A83** An experimental four-input fold adapter MUST preserve d3 min, downstream math/text, status, native reset and authored structure. Layout-derived or chained inputs MUST be refused; pending or failed fonts MUST leave consumers with no number (unready or in error, printing nothing) without blocking independent arithmetic. Complete comparisons MUST include live encoding and generated helpers, retaining existing defaults unless both engines qualify an improvement.

- **A84** `.dcss-share` MUST publish totals exactly and per-item fractions within 1e-9 of d3 sum/division on descendant result holders for 1–64 whole values from 0 to 4,095, one unit one px (a fraction is error 1). Invalid data MUST set error 1, zero totals error 2. Formatting, native changes/reset, nested calls, intervening containers and natural row flow MUST preserve results and errors.

- **A85** `.dcss-ascending` and `.dcss-descending` MUST publish d3's -1/0/1 result for their own finite numeric `--a`/`--b` within ±2^24. Missing/NaN arguments MUST publish CSS NaN with error 2; out-of-bound finite arguments MUST give error 1; where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16), an argument of 2^24 or more in magnitude, and two equal arguments that are not whole (0.1 and 0.100000001 read equal there), MUST give error 1. Native changes/reset and nested argument isolation MUST preserve results.

- **A86** Finite numeric identity map/invert calls admitted by `scale-extra/check.mjs` MUST match their original d3 returns exactly, independently of domain/range configuration. Proof MUST distinguish NaN from numeric answers and preserve native reset and descendant reuse. Getters, ticks and coercions remain unsupported.

- **A87** Over 0–64 whole observations within ±4,095 (one unit one px, each laid out as 64 px with its place in the last 64, under 2^19 px), numeric minIndex/maxIndex and default leastIndex/greatestIndex MUST return d3's first winning source position; least/greatest MUST return its value. Nullish/NaN MUST be skipped; empty lists MUST return index -1 or CSS NaN/error 2. Invalid grid/bounds/count MUST give error 1; native reset and nested reuse MUST preserve results.

- **A88** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A89** Numeric boxed-value bisector left/right over 0–64 integer keys within ±2^24 MUST match d3 on ascending search slices. Optional integer bounds MUST satisfy 0 ≤ lo ≤ hi ≤ length; invalid searched keys/bounds MUST hide results with error 1, missing queries with error 2. Raw callback ownership, reset and nested/container reuse MUST be checked.

- **A90** General formatting with 1–15 significant digits MUST print d3's text when the rounded decimal exponent lies from -6 through precision minus 1. Exponential results and missing/NaN inputs MUST suppress text with error 1. Trimming, native reset, nesting and the retained fixed/percent/SI printer MUST preserve results.


- **A91** Each newly added call MUST qualify through direct runtime and compiled output against the same original d3 questions. Compilation MUST preserve authored nodes, reachable field/item result addresses, bounds, readiness, errors and native reset. Serializable contracts MUST name emitted DOM locations; both-branch qualification MUST remain source-bound and MUST NOT add a second coverage count.

- **A92** Numeric ranges MUST compute active item values on the 1/64 grid within ±1024 using authored output slots. Runtime and compiler MUST preserve per-item result addresses and exact values. Zero steps, off-grid or wider inputs, more than 64 results and insufficient slots MUST set an error; unused slots MUST have readiness 0.

- **A93** Fixed UTC day, hour, minute and second calls MUST compute floor, ceil, round, offset and count within ±8×10¹² epoch milliseconds, truncating fractional milliseconds toward zero, with offset steps rounded down and round ties choosing the upper interval, from a time written whole (`--value`; a count's `--start` and `--stop`) or in parts (`--value-hi` and `--value-lo`; a count's `--start-hi`, `--start-lo`, `--stop-hi` and `--stop-lo`), the time being hi × 10^6 + lo ms, hi a whole number within ±16,777,215 and |lo| under 10^6. Invalid inputs, parts past that range, a step past ±16,777,215 with parts, and wider timestamp results MUST hide the number and set error 1, as MUST, where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16) and parses an authored number to one (1609459260001 less 1609459260000 reads 0 there: `probes/dcss/dates-parse.mjs`), a time or an answer of 2^24 ms or more written whole. A call given parts MUST give the same answer in every engine, a time answer also in parts, `--dcss-utc-<unit>-hi` (floor(t / 10^6)) and `--dcss-utc-<unit>-lo` (0 to 999,999), its whole number being no number in Firefox where |hi| is 16 or more.

- **A94** UTC weekday intervals MUST compute floor, ceil, round, offset and count within ±8×10¹⁵ epoch milliseconds, or from a time in parts within their range as A93 says, aligned to Sunday through Saturday. Negative epochs, midpoint ties, truncation and native reset MUST preserve results in both branches. Invalid inputs or wider timestamp results MUST hide the number and set error 1; where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16), a time or an answer of 2^24 ms or more in magnitude written whole MUST give error 1, the weekday found without its offset of 140,000,000 days, past a 32-bit float's whole numbers (floor(0) read 0 with error 0 for six weekdays before).

- **A95** Gregorian UTC month/year calls MUST compute floor, ceil, round, offset and count within ±8×10¹³ epoch milliseconds, or from a time in parts within their range as A93 says, each date as whole days, seconds and ms. Leap/century rules, first-century dates and Date setter overflow MUST match d3; round ties MUST choose the upper interval. Year periods 1–10,000 MUST support floor/ceil/round/offset; count requires period 1, and unsupported or wider results MUST error; where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16), every call with its time written whole MUST give error 1: each goes through epochs past 2^24 ms.

- **A96** Retired 2026-10-28: five circles only, 1.9 MB of hierarchy.css; d3.packSiblings isn't ported.

- **A97** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A98** Retired 2026-10-28: one fixed zone, America/Los_Angeles, served d3's tests only; time is UTC.

- **A99** Retired 2026-10-28: the text came as character codes, and the program that writes the codes holds the date as a number.

- **A100** Qualified Arabic `$,.2f` locale formatting MUST compute changing values in CSS and preserve static currency affixes. Both branches MUST match rendered native text and report unsupported inputs/magnitudes. Repeated factory contexts MUST NOT inflate the recorder's frozen raw-call identities.

- **A101** Retired 2026-10-28: the text came as character codes, and the program that writes the codes holds the date as a number.

- **A102** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A103** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.

- **A104** Retired 2026-10-28: seeded draws over a list; store.css's random part gives a page random numbers.

- **A105** Retired 2026-10-28: one fixed zone, America/Los_Angeles, served d3's tests only; time is UTC.

- **A106** Retired 2026-10-28: one fixed zone, America/Los_Angeles, served d3's tests only; time is UTC.

- **A107** Qualified English date formatting MUST compute text from live integer epochs within years −9999 through 19999, written whole or in parts within their range as A93 says (hi and lo whole numbers), the same text in every engine. Every frozen call MUST pass every source-owned configuration, including ISO weeks/years, epoch text, padding and names, in UTC. Numeric fields MUST remain independently addressed and reusable through compilation; invalid inputs MUST hide text and publish an error; where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16), an epoch of 2^24 ms or more in magnitude written whole MUST hide its text and publish error 1.

- **A108** Retired 2026-10-31: map projections, not a page that computes; git keeps them.

- **A109** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A110** Retired 2026-10-28: the text came as character codes, and the program that writes the codes holds the date as a number.

- **A111** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.

- **A112** Retired 2026-10-28: colors are gamutant.css's, and CSS's own `color-mix()` and relative colors convert them.

- **A113** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.

- **A114** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.

- **A115** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.
- **A116** Median, quantile, quantileSorted and the quantile scale MUST take whole numbers, one unit one px, from a lower bound lo to lo + 8,388,607, matching d3, where lo is the figure's `--domain-0` when it is written (a whole number within ±67,108,864) and otherwise −131,072 (whole numbers from −131,072 to 8,257,535); the quantile scale takes them to lo + 524,287 (by default −131,072 to 393,215), its layout under 2^19 px in every engine (QUIRKS.md Q20). An item with a fraction MUST give error 1, as MUST an item below lo, a value past those bounds, and a `--domain-0` off the list's grid or past ±67,108,864; a figure that writes `--decimals` takes its list in decimals instead (A247). In Firefox a value past 2^19 px from lo MUST give error 1; a quantile between two values MUST be d3's answer rounded once to a 32-bit float, worked out as one division of whole numbers each under 2^24, and MUST give error 1 for a `--p` past 6 decimals, a numerator or denominator of 2^24 or more, and an answer of 0 at a whole position from a `--p` that is not a multiple of 1/64.
- **A117** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.
- **A118** Each public class's part (`parts.mjs`) MUST answer as its family does, with or without `dcss.css`: every DCSS check MUST pass with parts linked in place of families. Parts MUST combine in any order.
- **A119** Where the browser parses `@function`, the two-stop linear scale and the UTC day, hour, minute, second and weekday intervals MUST also be functions (`--dcss-scale-linear(x, d0, d1, r0, r1, clamp, round)`, `--dcss-utc-day-floor(t)`, `--dcss-utc-day-count(start, stop)`) equal to their classes within 1e-12, and the intervals to d3-time to the millisecond. Elsewhere `@supports (width: calc(--dcss-scale-linear(1, 0, 2, 0, 4) * 1px))` MUST be false, so a plain value outside it stands, and a declaration calling one with literal arguments MUST fall back to its earlier plain value (one holding `var()` is invalid at computed-value time and does not).
- **A121** Retired 2026-10-28: values given as properties on one element have no boxes to lay out, so these were arithmetic machines (5.6 MB); lists on the grid are the one data model.
- **A122** `.dcss-median`, `.dcss-quantile` and `.dcss-quantile-sorted` with the list written once MUST give d3's answer to each element after the list (a `<figcaption>` excepted) and every element inside one, within A116's bounds and for up to 1,024 values. The median, and the quantile at p 0, 0.5 and 1, MUST skip an item with no number as d3 does, and quantileSorted MUST pass over one it doesn't read. They MUST refuse an item off the grid or out of range, an item with no number that a quantile at another p or quantileSorted reads, and 65 items with error 1, and an empty list, a median of no numbers or a missing p with error 2.
- **A123** `.dcss-scale-quantile` with the list written once MUST give d3's answer to each element after the list (a `<figcaption>` excepted) and every element inside one, within A116's bounds, for up to 1,024 values and 1 to 17 ranges, numbers or text, a query on a threshold or one double either side of it included. It MUST refuse with error 1 an item off the grid, out of range or missing, 65 values and 0, 1.5 or 18 ranges, answer `--unknown` for a missing query, give error 2 for a missing one with no `--unknown`, and refuse with error 1 a NaN query (what a refused call publishes), `--unknown` or not. In Firefox (32-bit `calc()`, QUIRKS.md Q16) it MUST decide the query against the threshold that straddles it exactly, in whole numbers each under 2^24, and refuse with error 1 only a query that parses to the threshold itself where d3's double for it is not known to the ulp (the ranges not dividing 16, a fraction part not 0).
- **A124** `.dcss-scale-threshold` with its thresholds in `--domain-0` to `--domain-15`, and `.dcss-scale-quantize`, with no list and no wrappers, MUST give d3's answer to everything inside the call, for 1 to 17 ranges, numbers or text, a query on a threshold or one double either side included. They MUST answer `--unknown` for a missing query (error 2 with none), MUST refuse with error 1 a NaN query (what a refused call publishes, a sum of 12.5 fed in as `--value`), `--unknown` or not, as the linear scales do, MUST give no answer with error 1 where the range a style query picked is not the one their index names (Firefox 159, whose `style()` doesn't see a query an animation sets, as another call's answer), and MUST refuse with error 1 0, 1.5 or 18 ranges, a threshold that isn't a number, thresholds out of order or with a gap, a reversed quantize domain, and in Firefox (32-bit `calc()`, QUIRKS.md Q16) a query within 2^-20 of a threshold (of 17 times the larger quantize end), which its floats don't tell from it; there, where the range is picked by `calc()`, a refused or unpicked call (as the quantile scale's, A123) MUST give NaN, no number. Compiled, the same markup MUST give the same answers.
- **A125** `.dcss-cumsum` with a second, unclassed list after its values MUST give d3's running total to everything inside the matching item of that list, for 0 to 1,024 whole-number values within ±1024, one unit one px (a total whose item's running width, the total + 1024 px an item, passes 262,143 px has no answer, error 1), missing and NaN values adding 0. It MUST refuse a total from a value with a fraction or past ±1024 on with error 1, leave a formatter there its own status, and give the same totals compiled.
- **A126** A call MUST take another call's answer written straight inside it, with nothing between them. A call with no answer (d3's undefined) MUST publish no number, so that a call or formatter given it fails too and prints nothing, while a call answering MUST be read and printed as d3's. A call given the answer of a call of its own kind MUST take it through a plain element between them.
- **A127** `.dcss-scan` of `<i>` entries with `--dcss-n` MUST give a reader `.dcss-at` with whole `--dcss-i` k, after the entries, `--dcss-value`, the sum of entries 1 to k, and `--dcss-before`, the sum of entries 1 to k - 1, in the frame its numbers change; a reader placed by its own `grid-area: 1 / 1 / span k / span k` MUST read the same (A14).
- **A128** `.dcss-median-index` and `.dcss-quantile-index` (`--p`) with the list written once MUST give each element after the list (a `<figcaption>` excepted), and every element inside one, d3's index of the value at floor((n - 1) p), for 0 to 1,024 values from a lower bound lo, whole numbers, one unit one px, to lo + 262,143, lo the figure's `--domain-0` when it is written (a whole number within ±67,108,864) and otherwise −131,072, with -1 for no values; an item with a fraction, below lo or past its range, or a `--domain-0` off the grid, MUST give error 1 (in Firefox, whose 32-bit order keys keep no tie-break near 2^29, the order is the value alone within 2^23, ties left to source order and a list past p 0 laid out descending and read from its end; a lower bound past ±2^19 or a list in decimals there MUST give error 1) (in decimals, `--decimals` on the figure, whole numbers of its grid to lo + 262,143, A247); with ties at that value, the place of the one sorted last when values ascend and equal ones go last place first (first place first at p 0 or less). An item with no `--value` in its style attribute MUST count in n and never be the answer: the index of rank min(k, D - 1) among the D numbers, -1 for none. Another value, a number such an item takes from elsewhere, or a `--p` that isn't a number MUST leave no answer.
- **A129** `.dcss-bin` with `--domain-0`, `--domain-1`, up to 32 ascending thresholds `--threshold-N` or a `--count`, and up to 1,024 values MUST give everything inside the second list's `<li>` for bin b d3's `bin().domain().thresholds()` bin b: `--dcss-bin-length`, `--dcss-bin-x0` and `--dcss-bin-x1`, thresholds outside the domain dropped as d3 drops them, a count's ticks as d3's `ticks()` gives them. No domain, a domain backwards, more than 1,024 values or a count giving more than 32 ticks MUST leave no answer, and so MUST a bin while an item put in is not yet counted (WebKit, until the next frame); an item replaced in one task leaves the old count less that item for two frames in WebKit, error 0, a bound for the author.
- **A244** `.dcss-rollup-sum` and `.dcss-rollup-count` with keys `--key-0` to `--key-31` (numbers) on the figure and items with `--key` and `--value` (whole numbers, one unit one px, or none) MUST give each element after the values' list that writes `--key` k (a `<figcaption>` or list excepted), and everything inside it, d3's `rollup(items, reduce, d => d.key).get(k)`: `--dcss-sum` for `sum(group, d => d.value)`; `--dcss-count` for `count(group, d => d.value)` and `--dcss-length` for the group's length; a key no item has MUST give `--dcss-err` 2. A key whose positives or negatives, each with one for each of its items, pass 16,515,007 (262,143 in Firefox, whose layout is exact under 2^19 px), a value with a fraction, or an answer whose key is not declared or written MUST leave no answer (`--dcss-err` 1), and so MUST an answer its author keeps inline (one inline by default, `<output>`, `<span>` and HTML's other inline phrasing elements, MUST be made `inline-block` at no specificity); a key declared twice MUST read as once. A key's answer MUST follow an item's key or value changed, or an item put in, taken out or hidden, by the next frame but one, refused (`--dcss-err` 1) until then.
- **A130** `.dcss-variance` and `.dcss-deviation` with up to 64 whole values from -1024 to 65535 MUST give each element after the list (a `<figcaption>` excepted), and every element inside one, `--dcss-variance`, the true variance of the numbers rounded once (an item with none skipped), and `--dcss-deviation`, its square root; fewer than two numbers, more than 64 items or a value outside the range MUST leave no answer.
- **A120** A call MUST copy its `--value` into each of its answers at most once, and each answer MUST stay under 65,535 tokens with plain inputs, so that another call's answer given as `--value` reads in WebKit, which drops what one `var()` brings past 65,535 tokens (`facts/var/var-token-limit.mjs`).

### Shape

- **A199** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A198** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A197** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A196** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.
- **A195** Retired 2026-10-31: a chart's part, not a page that computes; git keeps it.

### Math

- **A215** `.dcss-solve` with `--from` and `--to`, n nested `<i>` elements in it (3 to 54) and the
  page's rule setting `--dcss-formula` from `--dcss-input` on every one, f (here and in A216 to A220 the page's `--dcss-formula`
  less `--target`, 0 without one) continuous between from and to, MUST give every element inside the deepest `<i>`
  that is not an `<i>` a `--dcss-solve` within |to − from| / 2^(n − 1) and 4 ulps of a root of f between from and to,
  and `--dcss-solve-width` |to − from| / 2^(n − 2), with `--dcss-ready` 1 and `--dcss-err` 0. The `<i>`s MUST
  generate no boxes and leave the font as they found it. Where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16),
  f and x are 32-bit floats: `--dcss-solve-width` MUST be max(|from|, |to|) / 2^21 more (4 float steps at the
  bracket's larger end) and `--dcss-solve` within it of where f, as the engine works it out, changes sign (the checks
  compare it with the root in doubles rounded to a 32-bit float, within the width and f's own 32-bit rounding over
  its slope; d3 and the others work in doubles).
- **A216** `.dcss-solve` MUST give `--dcss-ready` 0, `--dcss-err` 1 and `--dcss-solve` NaN when f has the same sign, not 0,
  at both ends, when f is not a number or is not set at an `<i>`, or when `--from` or `--to` is not
  set on the solve itself (they are reset inside it, so a solve inside another's answer refuses without its own); a 0
  of f at an end is a root,
  and from above to is a bracket.
- **A217** A `.dcss-solve` inside another's answer MUST give its own root of an equation that reads the outer
  `--dcss-solve`, as A215: the outer answer read on the inner solve itself or on an element between them, the page's
  rules in `@scope (.X) to (.dcss-solve)` in either order, or unscoped with the inner's after the outer's.
- **A218** Retired 2026-10-31: map projections, not a page that computes; git keeps them.
- **A219** Retired 2026-10-31: map projections, not a page that computes; git keeps them.
- **A220** `.dcss-solve.dcss-solve-newton`, with the page's rule setting f's derivative `--dcss-slope` beside
  `--dcss-formula` on every `<i>`, `--guess` optional, and n nested `<i>` elements (3 to 14), MUST give inside
  the deepest the result of n − 2 of Newton's steps from the guess (the bracket's middle without one), each step taken
  when it lands in what is left of the bracket and moves x under half its width, the middle of what is left otherwise;
  `--dcss-solve-width` the width left (in 32-bit floats, Firefox, with A215's float steps added, the answer within it
  as A215's); a 0 of f at an end as A216; and refuse as A216, and when f′ is not set or not a number at an `<i>`.
- **A221** `.dcss-solve-rows` with a height, `--from`, `--to`, `--top` and
  `--bottom`, its first child holding n pairs of nested `<i>` elements, and the page's rule setting
  `--dcss-formula` from `--dcss-input` on every `<i>`, for an f that rises from top to bottom, MUST start each line box
  in it within 1 px of the x (from at the box's left edge, to at its right) where f reaches the value at the line's
  bottom edge (`--top` at the box's top, `--bottom` at its bottom), or at a value within its band, when the straight pieces
  between f's n + 1 values at x = from + k (to − from) / n are within 1 px of f's inverse; and again after an input of f
  changes.
- **A222** `.dcss-motion` on a store.css frame cell (`data-store`), with the page's rule setting `--dcss-motion-acceleration` from
  `--dcss-motion-position` and `--dcss-motion-speed`, MUST step once a frame from `--dcss-motion-start-position` and `--dcss-motion-start-speed` by v + h a, then
  x + h v (h `--dcss-motion-time-step`, 1/60 without one), x kept to `--dcss-motion-position-range` / 500,000 and v to `--dcss-motion-speed-range` /
  500,000, and give the cell's element and everything inside it `--dcss-motion-position` and `--dcss-motion-speed` within 0.5 px of what
  the same step in doubles keeps (a spring's amplitude, a pendulum's swing), on a scrolled page and in a cell inside
  another; `--dcss-err` 1 while x or v is past its range, 0 otherwise; no `--dcss-motion-acceleration` moves x on at v.
- **A223** `steps.mjs` MUST write, for `data-dcss-steps="n"` on a `.dcss-solve` (n 3 to 54; 3 to 14 with
  `.dcss-solve-newton`), n nested `<i>` elements around the element's content, and on a
  `.dcss-solve-rows` (n 1 to 1,000) a first child `<span>` of n pairs `<i><i></i></i>`, adding no line; leave an element that
  holds that many already as it is; and refuse, with the line, the attribute on any other element, a count out of
  range, or one beside a different number of `<i>`s. A `.dcss-solve` or `.dcss-solve-rows` with no `<i>`s MUST give
  `--dcss-err` 1.
- **A224** `.dcss-sample` on a list call's figure, with `--from` and `--to` on it and the page's rule setting `--dcss-formula`
  from `--dcss-input` on its items, MUST give item k of n the `--value` `--dcss-formula` at from + (k − 1/2)(to − from) / n,
  rounded to a whole number, so the call answers as for those values; and `--dcss-err` 1 when the items have no `--dcss-formula` or
  the figure no `--from` and `--to`. `--from` and `--to` MUST NOT reach inside it.
- **A225** On a page with an element of class `dcss-solve-newton`, `steps.mjs` MUST write beside each `--dcss-formula`
  declaration in its `<style>` elements whose rule has no `--dcss-slope` a `--dcss-slope` declaration, on the same
  line: the derivative of the formula in `--dcss-input`, as calc() computes it, other `var()`s constant; write it again
  where the rule's `--dcss-slope` is one it wrote and the formula changed; leave one the page wrote; and write none for a
  formula with a percentage, a function it has no derivative for, mixed types, or a `var()` of a property the page's
  styles work out from `--dcss-input` directly or through another, naming each with its line while the rest of the page
  builds.
- **A226** `steps.mjs` MUST write, for `data-dcss-within="t"` on a `.dcss-solve` that halves, whose `--from` and `--to`
  are numbers on its style or in a `<style>` rule on one of its classes, the least n of 3 to 54 nested `<i>` elements
  for which |to − from| / 2^(n − 1) ≤ t, as for `data-dcss-steps="n"`; and refuse, with the line, the attribute on a
  Newton solve or an invert, beside `data-dcss-steps`, with t not above 0, a range that is not two numbers it reads there, or n past 54.
- **A227** `.dcss-solve-turning-point` with `.dcss-solve` MUST answer, as A215 does, where the page's `--dcss-slope` reaches
  0 instead of where `--dcss-formula` reaches `--target`, so with one peak or dip between `--from` and `--to` its answer is
  that point; and `steps.mjs` MUST write the slope on a page with it (as A225) and refuse it beside
  `.dcss-solve-newton`.
- **A228** `.dcss-solve`, `.dcss-sample` and `.dcss-solve-rows` MUST read `--from` and `--to` (and the solve's
  `--target` and `--guess`, the solve-rows' `--top` and `--bottom`) only as set on the call element itself, by its style or
  a rule on it, never as inherited from an element around it, and so refuse as when unset (`--dcss-err` 1) where only an
  outer element sets them; `.dcss-solve-rows` MUST give `--dcss-err` 1 when one of its four is not set on it or not a
  number.
- **A229** `.dcss-evaluate` MUST give every element inside it `--dcss-evaluate`, the page's `--dcss-formula` at
  `--dcss-input` equal to its `--at` (set on the call itself, as A228), and `--dcss-slope` where the page has one;
  `steps.mjs` MUST wrap what the call holds in one `<i>` and write the slope (as A225); the call MUST give
  `--dcss-ready` 0 and `--dcss-err` 1 when the value or `--at` is not a number, `--at` is set only on an outer element,
  or the `<i>` was never built.
- **A230** `steps.mjs` MUST cut a `.dcss-solve-every`'s range into `data-dcss-pieces` pieces, or the least whole number
  of pieces no wider than `data-dcss-apart`, each a `.dcss-solve` with the call's other classes, its tries
  (`data-dcss-steps` or `data-dcss-within` per piece, as A226) and a copy of what the call holds, and refuse, with the
  line, a Newton solve, a count outside 2 to 200, and copied content with an `id`, `for` or ARIA reference; each piece
  MUST answer as `.dcss-solve` on its part, adjacent pieces sharing their end bit for bit, an exact answer on a shared
  end found by the right piece only; a piece with no answer MUST give `--dcss-ready` 0 and hide its copy with
  `visibility: hidden`.
- **A231** `.dcss-sample` with `--columns` c MUST lay its n items in rows of c: item k's `--dcss-input` the middle of
  column (k − 1) mod c between `--from` and `--to`, its `--dcss-input-y` the middle of row ⌊(k − 1) / c⌋ of n / c
  between `--from-y` and `--to-y`, each set on the call itself; each item MUST give `--dcss-ready` 0 and
  `--dcss-err` 1 when c is not a positive whole number dividing n, or its value is not a number; without `--columns`
  the items MUST be one row, as A224.
- **A232** `.dcss-lookup` with `--find` and a list whose items set `--key` and `--value` MUST give everything inside the
  element right after the list (its reader: its children and their insides, its `::before` and `::after`) `--dcss-lookup`: the `--value` of the one item whose `--key` equals `--find`, as d3's
  `index(items, (d) => d.key).get(find).value`, with `--dcss-ready` 1 and `--dcss-err` 0; with no such item, no answer and
  `--dcss-err` 2; with two or more, or with that item's value missing, with a fraction or not within ±131,071 (one unit one px, under
  2^19 px), no answer and `--dcss-err` 1; a repeat of a key other than `--find` MUST NOT change the answer, and the number of items MUST
  NOT be limited. Where `calc()` keeps 32-bit floats (Firefox, QUIRKS.md Q16), a key and `--find` of 2^24 or more in
  magnitude that are the same 32-bit float MUST match when written alike, and MUST NOT match when they are different whole
  numbers under 2^31 in magnitude (an 8-digit SKU and the one after it); otherwise (a key past 2^31, as an EAN-13, one
  float with a different `--find`, or one number written two ways: a +, a leading 0, an exponent) no answer and
  `--dcss-err` 1.
- **A233** A format (`.dcss-format-fixed`, `-percent`, `-si`, `-general`) in an element whose language (HTML's `lang`,
  matched as `:lang()`, and a tag with a script subtag or an underscore, `zh-Hans-CN` or `de_DE`, as its language and region) is one of d3-format 3.1.2's locales but `en-IN` MUST print as that locale's
  `formatLocale(locale).format(spec)`: its decimal and thousands marks, its currency before and after with `--symbol: 1`,
  its percent sign and its digits; in an element whose nearest `lang` names no such locale, as d3's default `format`.
- **A234** `.dcss-sum`, `.dcss-count`, `.dcss-length`, `.dcss-mean`, `.dcss-min`, `.dcss-max` and `.dcss-extent` with
  `--find` set on the figure MUST answer as the same call on a list of only the items whose `--key` equals `--find`
  (d3's `rollup(items, reduce, (d) => d.key).get(find)`), error included; an item with no `--key` MUST NOT be taken.
  A call inside another's answer MUST NOT take that one's `--find`. Where `calc()` keeps 32-bit floats (Firefox,
  QUIRKS.md Q16), an item whose `--key` is the same 32-bit float as a `--find` of 2^24 or more in magnitude MUST give
  no answer and `--dcss-err` 1.
- **A236** `.dcss-summarize` (and `.dcss-variance`, `.dcss-deviation`) with `.dcss-decimals` and `--decimals` d, a whole number from 0 to 6, on the figure MUST take each item's `--value` v as the whole number k = round(v x 10^d), where k / 10^d is v itself and k is from -1024 to 65535, and MUST give the answers A180 names for those k, each divided by 10^d once: the written decimals' exact answer rounded once (the sum of 0.1 and 0.2 is 0.3), not d3's sum in doubles; min, max and extent pick an input, as d3's. A value with more decimals than d, a k outside the range, a d that isn't a whole number from 0 to 6, or more than 1,024 items MUST leave no answer, error 1.
- **A235** A date-format specifier of one letter, with its pad flag, MUST also be a class of its own that prints as its numbered class does (A107), `.dcss-date-format-Y` as `%Y`, in a document in no-quirks mode.
- **A237** The answers of a `.dcss-sum`, `.dcss-count`, `.dcss-length` and `.dcss-mean`, and a `.dcss-text`'s width,
  MUST be A60's and A43's whatever size the reader's browser sets text at (a minimum font size to 128px, a default font
  size, a phone's text autosizing, browser zoom) and whatever text styles the page sets on its elements, `!important`
  included (spacing, kerning, OpenType features, a font family or size on every element); where the printed text isn't
  in its font at 128px (a minimum font size past 128px, the font blocked or missing) they MUST be error 1 (`--dcss-err`
  on each element after the list, on a text's inner `<u>`), never another number. Under an ancestor's CSS zoom other than 1 (QUIRKS.md Q14), the answers of a
  `.dcss-sum`, `.dcss-count`, `.dcss-length`, `.dcss-mean`, `.dcss-min`, `.dcss-max` and `.dcss-extent` MUST be error 1 or 2 in
  every engine, and every other call's in WebKit below 1.25.

### On the board

- **A51** A loop (`.loop`, `.loop-flow`, `.loop-in`, `.loop-cell`, `.loop-core`) MUST have store.css and dcss-extras.css on the page;
  its cells, read through `[data-store-read]` and `[data-store-read-3]` naming them by `--store-of`, MUST settle on the
  iteration's fixed point: a 12-cell power iteration's vector and eigenvalue equal NumPy's, as a flow and as a table row.
- **A52** A `<table class="sheet">` on store.css's board, with dcss-extras.css, MUST show every cell and fold equal to the sheet's own
  model as written and after each change to its inputs.




## 3. Implementation report

| Requirement | Test | Chrome | WebKit | Firefox |
|---|---|---|---|---|
| A251 | every check in probes/dcss and d3-check.mjs, each in Chrome, WebKit and Firefox: no number with error 0 that isn't the answer; refusals counted against this requirement | PASS: the checks run 2026-11-02 (reduce, decimals, burst, bin, bins-edges, index-order, rollup, unrendered, print, override, font-size, d3-check), not every check; before it a mean with an item past 2^31 read a number and an infinite item was skipped, error 0 (a review, 2026-11-02) | PASS: the same | FAIL: Firefox 159 refuses where a float answers: reduce-check 124 of 1,008 (27 sums and 25 means past their text's 150 code points, about 2.4M px; 24 each min, max, extent from 999,999 px: QUIRKS.md Q25 and Q17), counters/decimals-check 244 of 291 (the same lines; a decimals mean's own offset passes them from d 2), the summary outright; 0 wrong; decimals answer at the float's 7 digits (2026-11-02) |
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
| A15 | check.mjs: 4; probes/dcss/bins-edges-check.mjs | PASS | PASS | PASS |
| A16 | check.mjs: 5 bins in use; probes/dcss/bins-edges-check.mjs | PASS | PASS | PASS |
| A17 | check.mjs: 9; check.mjs: 21; probes/dcss/bins-edges-check.mjs | PASS | PASS | PASS |
| A18 | check.mjs: 7; check.mjs: 27; check.mjs: 59; probes/dcss/bins-edges-check.mjs | PASS | PASS | PASS |
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
| A29 | check.mjs: 17; check.mjs: 67 | PASS | PASS | PASS: check 67; check 17 switches maps by `style()` over an animated value, which Firefox never applies (facts/style/firefox-style-animated.mjs) |
| A30 | check.mjs: 18; check.mjs: 29; check.mjs: 68 | PASS | PASS | PASS: checks 29 and 68; check 18 switches maps by `style()` over an animated value, which Firefox never applies (facts/style/firefox-style-animated.mjs) |
| A31 | check.mjs: 22 | PASS | PASS | PASS |
| A54 | check.mjs: 70 | PASS | PASS | PASS |
| A32 | check.mjs: 23 | PASS | PASS | PASS |
| A33 | check.mjs: 53 | PASS | PASS | PASS |
| A34 | check.mjs: 54 | PASS | PASS | PASS |
| A35 | check.mjs: 14 | PASS | PASS | PASS |
| A36 | check.mjs: 58 | PASS | PASS | PASS |
| A37 | probes/algos/range.mjs: queries, bodies | PASS: 6,720 and 20,160 reads | PASS: 6,720 and 20,160 reads | PASS: 6,720 and 20,160 reads |
| A38 | check.mjs: 46 | PASS | PASS | FAIL: 21 of 25 readers refused (`--dcss-ok` 0, 2026-11-01): Firefox lays out in 1/60 px, so a tree with a leaf in eighths gives no answer there (Q16); none read wrong |
| A39 | check.mjs: 55 | PASS | PASS | PASS |
| A40 | check.mjs: 56 | PASS | PASS | PASS |
| A41 | check.mjs: 57; check.mjs: 69 | PASS | PASS | PRECONDITION_FAILED: Firefox keeps `anchor-size()` at the anchors' first sizes (QUIRKS Q3), so `.dcss-calc` is refused there, error 1 (checks 57 and 69, 2026-11-01) |
| A42 | check.mjs: 60 | PASS | PASS | PASS |
| A43 | check.mjs: 61 | PASS | PASS | PASS |
| A238 | probes/dcss/counters/int-check.mjs: 65 counters set by counter-reset (both ends, 11 around 2^24, 37 seeded), a table of 200 rows summed by counter-increment read in its footer, a counter never set, a change read the next frame, the reader's room in the flow, four inside a container card or a `contain: style` box, the font missing; in Firefox each right or refused | PASS: 68 of 68, the card's 4 of 4, every one error 1 with the font missing (2026-11-01) | PASS: 68 of 68, the card's 1 right and 3 refused (Q15), every one error 1 with the font missing (2026-11-01) | FAIL: 20 of 68 right (every one under 2^24 in magnitude), 48 refused (error 1) at or past 2^24, where its 32-bit calc() can't hold them; none wrong (Firefox 159, 2026-11-01); the card's 4 of 4; error 1 with the font missing |
| A239 | probes/dcss/counters/late-check.mjs: a sum, count, bin and int each given an item before their last, a hidden item shown, a value changed, the first item taken out and the first replaced in one task, each read 300 ms later, and a sum whose last item is display: none | PASS: 30 of 30 | PASS: 28 of 30, the bin and int miss the replaced item (Q18) | PASS: 30 of 30 (2026-11-02) |
| A240 | probes/dcss/counters/print-check.mjs: a sum, mean, max, median and summary printed to PDF | PASS | NOTRUN: Playwright prints only Chrome | NOTRUN: Playwright prints only Chrome |
| A250 | probes/dcss/counters/override-check.mjs: a sum, count, mean, median, bins, an int and a text under the reduced-motion reset, `animation: none`, text spacing on pseudo-elements and on everything, Georgia forced, the reset and `animation: none` in `@layer`, and right-to-left pages (`direction: rtl`, `<html dir=rtl lang=ar>`, vertical-rl), at load and after a change; probes/dcss/counters/unrendered-check.mjs: sums and counts of an empty list and of one in unrendered content, then shown, hidden again and changed, and shown again | PASS | PASS | PASS: every setting right (14 of 14 under each direction and writing mode), 0 wrong (Firefox 159, 2026-11-02) |
| A241 | probes/dcss/counters/transition-check.mjs: sums read by a bar as wide as the sum, their values in a steps(64), steps(8) and linear transition, every 100 ms for 2.8 s; a fraction a stylesheet sets in a list of whole numbers | PASS | PASS | PASS: 112 of 112 reads right or refused (Firefox 159, 2026-11-02) |
| A242 | probes/dcss/static/registered-check.mjs: a median, quantile and median index of values a stylesheet sets off the 64ths and of style attributes, under `--value` unregistered and registered as a `<number>` inherited and not | PASS | PASS | PASS: 18 of 18 right or refused (Firefox 159, 2026-11-02) |
| A246 | probes/dcss/one-list/domain-check.mjs: 413 seeded calls of median, quantile, quantileSorted, medianIndex and quantileIndex from a written `--domain-0` (whole numbers near 100,000, 2^25 and 68 million, negative bounds, missing items, 1,024 items, index lists past 64 items with ties), 46 to refuse (an item below the bound, past its range, with a fraction, a bound off the grid or past 2^26); 406 quantile-scale queries | PASS: 367 right, 46 refused; scale 200 right, 206 refused (2026-11-02) | PASS: the same (2026-11-02) | PASS: 7 right, 406 refused, none wrong; the scale page not loaded in 30 s, not run (2026-11-02) |
| A247 | probes/dcss/one-list/decimals-check.mjs: 480 seeded calls of median, quantile, quantileSorted, medianIndex and quantileIndex in 0 to 6 decimals (bounds from -2^26 to 2^26 in k, written or the default, missing items, 1,024 items, the ends of each range, 12.3 and 12.4 at 0.5), 43 to refuse (more decimals than d, below the bound, past its range, a bound off the grid or past 2^26 in k, d 7, 2.5, -1, 9 or not a number); 724 quantile-scale queries (on a value, a step either side, between two, below the bound) | PASS: 437 right, all d3's double to the bit, 43 refused; scale 720 right, 4 refused (2026-11-01) | PASS: 437 right, all to the bit, 43 refused; scale 366 right, 358 refused within the halved bounds (Q20) (2026-11-01) | PASS: 1 right (d 0), 479 refused, none wrong; the scale not run (2026-11-01) |
| A249 | probes/dcss/counters/decimals-check.mjs: 60 seeded sums of 1 to 400 values in 0 to 6 decimals and 60 seeded means, items skipped, a few negatives, against the exact decimal answer (a mean to the bit); 0.1 + 0.2, more decimals than d, d 7, 1.5 and -1, totals at 2^24 units and past, -1,024 and below, 63 and 64 skipped, no number; 60 seeded mins, maxes and extents (k to -131,072 and 8,257,535, a fifth past them) and the same hand lists, against the input d3 picks | PASS: 291 of 291, 70 refused (2026-11-02) | PASS: the same (2026-11-02) | PASS: 47 right, 244 refused, none wrong (2026-11-02) |
| A243 | probes/dcss/counters/csp-check.mjs: six reductions over a page served with `style-src 'self'`, and the same page with no policy, one item `--value: abc`; both again with the page's own `@property --value` | PASS | PASS | PASS |
| A44 | check.mjs: 62 | PASS | PASS | PASS |
| A45 | check.mjs: 63 | PASS | PASS | PASS |
| A46 | check.mjs: 64 | PASS | PASS | PASS |
| A47 | check.mjs: 65 | PASS | PASS | PASS: a row reader in a port with a collapse in a hop is refused, error 1, its row having read 1 or 2 px over with error 0 (QUIRKS Q5, Firefox 159); the collapse's own reader and the column are right (check 65, 2026-11-01) |
| A48 | probes/algos/minus.mjs: 8 cases | PASS: 3,840 of 3,840 reads | PASS: 3,840 of 3,840 reads | PASS: 3,840 of 3,840 reads |
| A49 | probes/novel/live-turn/tick-traps.mjs: 6 cases | PASS: 2,880 of 2,880 reads | PASS: 2,880 of 2,880 reads | PASS: 2,880 of 2,880 reads |
| A50 | probes/rom-api-check.mjs: entries, moving; probes/rom2-api-check.mjs: entries, moving | PASS: 2,000, 3,000, 5,120 and 4,500 reads | PASS: 2,000, 3,000, 5,120 and 4,500 reads | PASS: 2,000, 3,000, 5,120 and 4,500 reads |
| A66 | pipeline/formula-check.mjs: both entry paths, mean, extent, filters, state, per-item edits, empty inputs and compatibility paths; inline, shared, sheet, calc and auto where supported | PASS: 94 pages, 598 answers | PASS: 94 pages, 598 answers | PASS: 94 pages, 598 answers |
| A53 | probes/anchor-sort-check.mjs: 4, 16 and 32 totals | PASS: 120 of 120 frames, 70 reorders | PASS: 120 of 120 frames, 73 reorders | PASS: 120 of 120 frames, 70 reorders |
| A55 | pipeline/check.mjs FORMS=sheet: the 8 sorted group programs and the 3 ranked albums (24 rows) of examples.mjs; probes/dcss/ranked-edges-check.mjs, seeded figures in and past the bounds (Chrome, WebKit) | PASS | PASS | PASS |
| A56 | pipeline/check.mjs FORMS=sheet: ex-board-heights, ex-starts, ex-gallery-size | PASS | PASS | PASS |
| A57 | pipeline/check.mjs pipeline/at-size.mjs F=sheet: 3 stacked bar programs at 1,300 items | PASS | PASS | PASS |
| A60 | d3-check.mjs: every call d3-array's tests record on arrays of numbers, numeric text and what d3 skips (sum 38, count 4, mean 32, min 30, max 30, extent 26); probes/dcss/reduce-check.mjs: 60 seeded lists of whole numbers, a third signed to ±10,000 and a third to ±100, 8 lists holding a fraction, 58 lists of whole numbers to 20,000,000 (40 seeded, 18 at the bounds), 966 reads, 6 lists at a mean's bounds, and 60 signed changes | PASS: 160 of 160; reduce-check 1,008 of 1,008 at rest (45 with a fraction, 15 past 2^31 or infinite: error 1), the mean to the bit, 0 wrong moving (2026-11-02) | PASS: the same (2026-11-02) | FAIL: d3-check's 160 of 160 d3 calls right, the mean's 32 by long division on whole numbers (was 24, 8 refused; 2026-11-02); reduce-check 884 of 1,008 right at rest, 124 refused (Q17, Q25), 0 wrong, 0 wrong moving (2026-11-02) |
| A62 | probes/dcss/scale/scale-check.mjs: every question d3-scale's linear, pow, sqrt and log tests ask a scale's map or invert, with its state, the ones CSS can take compared exactly (ticks, nice and tickFormat not taken: an axis's, left dcss 2026-10-31 for log, 2026-11-02 for the rest); 3,000 seeded linear, 1,500 pow and 1,485 log scales | PASS: linear 47 of 214, pow 52 of 187, sqrt 2 of 2, log 46 of 709 (the rest ticks, nice and labels, or not numbers; log within 256 x 2^-52); 3,000 of 3,000; 1,500 of 1,500; log 1,382 of 1,485 exact, every one within 256 x 2^-52 (the engine's log() and exp() a last bit off V8's); a log input of the other sign or 0 prints nothing, 7 of 7 by hand (2026-11-02) | PASS: the same as Chrome (pow and sqrt kept under WebKit's 65,535-token var() limit, facts/var/var-token-limit.mjs) (2026-11-02) | PRECONDITION_FAILED: Firefox computes calc() in single precision; held to the pixel (DCSS.md rule 6): linear 47 of 214 as Chrome, seeded two-stop 2,000 and polylinear 1,000 within half a pixel; pow, sqrt and log within a pixel or refused (seeded pow 1,500 of 1,500, log 1,485 of 1,485); 3 of 7 log inputs of the other sign or 0 by hand give no number, the 4 clamped ones also none where d3 clamps to a number (2026-11-02) |
| A64 | probes/dcss/format/format-check.mjs: the 30 calls in scope d3-format's tests make, 2,948 seeded (about 30% with `--trim`), 600 ties and 18 values past a 32-bit float's range (each type), the printed text compared (Chrome: its accessibility tree; WebKit and Firefox: pixels) | PASS: 30 of 30, 2,948 of 2,948, 600 of 600 (2026-10-29); 18 of 18 past a float's range (2026-11-01) | PASS: 30 of 30, 2,948 of 2,948, 600 of 600 (2026-10-29); 18 of 18 past a float's range (2026-11-01) | FAIL: refused where its 32-bit calc() can round otherwise than d3 (Q16), each refusal split by its float's span (probes/dcss/float32.mjs: input not a float32 / a float32 sharing its span with another answer / answerable): of 2,948 seeded 1,522 refused (952 / 420 / 150; 1,521 written as decimals) and the rest right, of 600 ties 445 (324 / 98 / 23), of d3-format's 139 tests 50 (30 / 7 / 13), general 775 of 1,500 (709 / 49 / 17; 774 as decimals); of 18 values past a float's range 5 refused, 10 right and 3 under 2^-150 read as 0 (the bound above); `SPAN=1`'s 15,325 calls at the ends of their floats' spans none wrong; none printed wrong or with error 1, written as decimals or exactly (2026-11-02) |
| A67 | probes/dcss/format/format-check.mjs and probes/si-carry-check.mjs: one exact coefficient rounding, no tables; 5,364 decimal-midpoint carry cases; SI printed text, 139 recorded calls (f, % and s), 1,560 seeded, 944 prefix boundaries, 1,175 decimal ties, 527 near ties past 10^22 (si-near.mjs); 5 rejected inputs | PASS: all, also 2,948 seeded f/% and 600 ties; all 5,364 carry cases (2026-10-29) | PASS: all, including 5,364 carry cases (2026-10-29) | FAIL: refused where its 32-bit calc() can round otherwise than d3 (Q16, A64; split as A64's): 1,560 seeded 576 right and 984 refused (810 / 21 / 153; 578 right written as decimals), 944 boundaries 394 right (402 as decimals), the rest refused, 1,175 ties (1,050 / 58 / 67) and 527 near ties (526 / 0 / 1) all refused, 5 rejected inputs error 1; the 5,364 carry cases all refused (5,290 / 66 / 8: each within a double of a decimal tie); none printed wrong or with error 1 (2026-11-02) |
| A68 | probes/dcss/bisect-check.mjs; probes/dcss/discrete/inherited-check.mjs: recorded calls, 515 seeded cases per side, native changes, printing, nested readers and invalid inputs | PASS: 25/42 left and 25/37 right; 1,030 seeded; 28 live/reader checks plus four nested missing-query states | PASS: the same | FAIL: 25 of 25 taken recorded calls each side; seeded 507 of 515 each side, the rest refused (error 1, or 2 for -1e300, which Firefox holds as infinity): keys and queries of 2^24 or more are refused there, none of the printed misses read wrong with error 0; live/reader checks pass (Firefox 159, 2026-11-01) |
| A132 | readme-check.mjs: README's 8 examples and its own 20 (CALLS) as written, with a word of text in each empty `<li>` (17), and under a site's rules on lists, items, figures and outputs (probes/dcss/site-rules.mjs), each output's counters and error against the written run's; probes/dcss/pages-check.mjs: the 15 list calls readme-check has no example of, labelled, styled and both, every published value against the written run's | PASS: 83 outputs (2026-10-30); 15 of 15 calls three ways (2026-10-29) | PASS: 83 outputs (2026-10-30); 15 of 15 calls three ways (2026-10-29) | PASS: 116 outputs, 36 of them refused as written and labelled or styled (error 1 or 2, no text), none wrong with error 0; 15 of 15 calls three ways, 4 refused (median-index, quantile-index, quantile-sorted, deviation) (2026-11-02) |
| A69 | pipeline/contract-check.mjs; probes/dcss/compiled-check.mjs: native values, exact sum/scale, four d3 texts, invalid bindings | PASS: 135 build checks; 10/10 states (2026-10-29) | PASS: same build checks; 10/10 states (2026-10-29) | PASS: 10/10 states, the arithmetic implementation, 4 SI outputs refused (error 1 or 2, no text, Q16), none wrong (compiled-check.mjs) (2026-11-02) |
| A70 | pipeline/contract-check.mjs; probes/dcss/composition-cost.mjs and composition-cost-summary.mjs: reader counts, matching complete workloads, per-engine selection and authored semantic structure; pipeline/bytes.mjs | PASS: 135 build checks (2026-10-29); 2026-10-25: six paired workloads retained arithmetic over the font tables (retired 2026-10-29), twelve semantic projections, 320 prior pages/models unchanged | PASS: same build checks; same workload choices | NOTRUN: the selection compares Chrome's and WebKit's medians |
| A71 | probes/dcss/compiled-check.mjs: invalid values, native reset (the font encodings retired 2026-10-29 with the SI tables) | PASS: 10/10 states (2026-10-29) | PASS: 10/10 states (2026-10-29) | PASS: 10/10 states, arithmetic (2026-10-29) |
| A72 | probes/dcss/discrete/check.mjs, inherited-check.mjs and presentation-check.mjs: recorded range values, both lowerings, native controls, result widths and fixed formatting | PASS: 11/24 recorded questions; 67/67 added per lowering; 8/8 native states; 8/8 nested query states; 18/18 width/query/reset states | PASS: the same | PASS: threshold 10/11 and 54/67 right, the rest within a float of a cut refused (14), 8/8 native; 0 wrong (2026-11-02) |
| A73 | probes/dcss/discrete/check.mjs, expression-check.mjs, inherited-check.mjs and presentation-check.mjs: full quantize values, adjacent doubles, large expressions, result widths and native controls | PASS: 33/65 recorded questions; 103/103 added per lowering; 8/8 native and 8/8 nested query states; 18/18 width/query/reset states; seven partial counts parse | PASS: the same | PASS: threshold as A72; quantize 22/33 and 63/103 right, 11 and 40 within a float of a cut refused, 8/8 native; 0 wrong (2026-11-02) |
| A74 | probes/dcss/quantile/check.mjs and cost.mjs: recorded calls, exact grid readback, scalar ranks, indexed reads, native controls, rendered text and complete composition costs | PASS: quantile 34/43, median 25/47 (d3's unboxed calls taken, its missing values skipped, 2026-10-29); 144 seeded layout, 136 scalar and 84 indexed each, 24 with missing values; 8/8 native states per lowering/operation; 64-value normal-flow layout composition 4.9 ms median | PASS: the same, normal-flow layout composition 6 ms median | PASS: quantile 34/43 and median 25/47 read, seeded 144/144 and 136/144; refused: a read with a fraction (layout snaps to 1/60 px) or an interpolation past 24 bits, and 7 digits by the fixed format; 0 wrong (2026-11-02) |
| A75 | probes/dcss/quantile/check.mjs: recorded source-position calls, seeded data, scalar/indexed reads, native controls and rendered text | PASS: 4/4 recorded, 120 scalar and 70 indexed seeded; 8/8 native states per lowering | PASS: the same | PASS: 4/4 recorded, 144/144 seeded (66 refused, as A74), 8/8 native; 0 wrong (2026-11-02) |
| A76 | probes/dcss/quantile-scale/check.mjs and cost.mjs: recorded maps, adjacent boundary doubles, shared ranks, native controls, rendered text and full composition | PASS: 39/74 recorded, 365 layout and 359 scalar added; 9/9 native states per lowering | PASS: the same | PASS: 39/74 recorded, 365/365 seeded (222 within a float of a cut refused), 9/9 native; 0 wrong (2026-11-02) |
| A77 | probes/dcss/quantile-scale/check.mjs and cost.mjs with QUERY_SCOPE=result: result-container binding, exact maps, native changes/reset, text and full costs | PASS: the same recorded/added cases and 9/9 native states; 64-value, four-range scalar query median 0.4 ms | PASS: the same, 1 ms scalar query median | PASS: 39/74 recorded and 359/365 seeded read, the rest refused or unsupported, 0 wrong; 9/9 native states (QUERY_SCOPE=result) (2026-11-02) |
| A78 | probes/dcss/precision/check.mjs, exponent-check.mjs, composition-check.mjs and cost.mjs: recorded helpers, adjacent doubles, typed precision, native controls/reset, numeric reuse, errors, layout composition and complete costs | PASS: fixed 10/10, prefix 129/129, round 8/8; 695 added and 9/9 native states each; 364 exponent cases, 7/7 nested outputs; 30-value median 9.8–9.9 ms | PASS: the same; 30-value median 14 ms | PASS: 0 wrong; refused (error 1) where the answer differs on the two sides of a power of ten an input is within a float of, and a 0 that may be a number past its range: precisionFixed d3 9/10 and seeded 330/695 right, prefix 3/129 and 442/695, round 3/8 and 330/695, the seeded set near powers of ten on purpose; of the refusals all but 1 or 2 in each set are the input's (A64's split); a literal step Firefox holds exactly, and a literal's exponent from the build, are answered; 6/7 nested outputs (the seventh 1.25 at 1 place, a float32 on a tie); 9/9 native (2026-11-02) |
| A79 | probes/dcss/quantile/flow-check.mjs: four operations, all qualified lowerings, literal/dynamic data, captions and following content, 240/640 px widths, no fixed figure height | PASS: 40/40 natural-flow cases, exact width and height | PASS: 40/40 natural-flow cases, exact width and height | PASS: the natural-flow cases, width and height (flow-check.mjs) (2026-10-29) |
| A208 | probes/dcss/ordinal/check.mjs: d3's scaleOrdinal tests replayed, each value call computed from the inputs set; 4 by hand (slot 15 mod 4, implicit place 3 mod 2, no value, nested) | PASS: 57 of 171 calls (68 return the scale, 41 a setting, 5 an object value); 4 of 4 (2026-10-31); a repeated domain value refused with error 1, --dcss-err set on every answer, 8 of 8 by hand (2026-11-01) | PASS: the same (2026-10-31); a repeated domain value refused with error 1, --dcss-err set on every answer, 8 of 8 by hand (2026-11-01) | PASS: 41 of d3's taken calls right, 16 refused (a number in no slot), 0 wrong; 15 of 15 by hand (Firefox 159, 2026-11-02) |
| A181 | readme-check.mjs: README's two summary examples, five outputs under one `.dcss-format-fixed` each | PASS: 5 of 5 (2026-10-31) | PASS: 5 of 5 (2026-10-31) | PASS: 5 of 5 refused (error 1 or 2, no text, Q16), as written and labelled or styled, none wrong (2026-11-02) |
| A180 | probes/dcss/summarize/check.mjs: 300 seeded lists of 0 to 64 items (whole from -1024 to 65535, one in six with eighths, items with none) and edge lists of 64, 33 and 32 (all -1, all -1024, all 65535, ±1024, either side of the min's split), 4 with no answer (1,025 items, 70000, 0.001, 65535.5), a live move; the engine's own value and the published text, against d3-array, the median included (the variance against the true value); pages-check.mjs: under a site's padding on the figure | PASS: 2,435 of 2,435 answers to the bit, the variance past ±1024 too, 56 lists refused (2026-11-02) | PASS: the same (2026-11-02) | PRECONDITION_FAILED: refused outright, error 1 (32-bit calc() holds no mean or variance of doubles) |
| A80 | pipeline/scan-contract-check.mjs; probes/dcss/cumsum/check.mjs: per-item endpoint legality, exact prefixes, reuse, missing values, error isolation, native controls/reset | PASS: 38 contract checks; 22/42 recorded calls (unboxed ones taken, 2026-10-28), fcumsum's 22/44 (2026-10-29); 60 scalar and 59 layout added cases; 13/13 states per lowering | PASS: the same | PASS: calc 22/42 recorded, 22/44 fcumsum, 24/60 seeded and 36 refused by their formatter (Q16), 13/13 states; layout 22/42, 22/44, 13/60 seeded, 46 refused (a value off whole px) and the width bound, 12/13 states and 1 refused; none wrong with error 0 (2026-11-02) |
| A81 | probes/dcss/static/check.mjs and optimizer-check.mjs: shared sheet, bounded calls, d3 precision questions, hand-written three-call native/viewport/reset proof, errors, in the markup README teaches | PASS: 390/390 direct-sheet cases (3 a median skipping a missing value), 150 boundary queries; 147/147 precision questions included; 8/8 authored states; 4/4 optionally compiled states | PASS: the same | PASS: each right or refused (error 1 or 2, nothing printed), none wrong: 237 of 390 direct-sheet cases equal d3, 153 refused (126 of them precisionPrefix); 6 of 150 boundary queries, 144 refused; the 8 authored states refused (a list in decimals); 4 compiled states, 1 equal d3 and 3 refused (2026-11-02) |
| A82 | pipeline/measured-check.mjs; probes/dcss/cumsum/authored-check.mjs and authored-cost.mjs: identical markup, native data/errors/reset, exact transport, source/artifact binding and complete update workloads | PASS: 24 selection checks; 72 native cases and 24 full-range prefix checks; 24 fresh-page records; arithmetic qualifies for six complete workloads; author DOM retained | PASS: the same | PASS: 72 native cases and 24 full-range prefix checks, 74 calc outputs refused by their formatter (error 1 or 2, no text, Q16), none wrong with error 0; author DOM retained (2026-11-02) |
| A83 | probes/fold-rom/live-check.mjs and live-cost.mjs with MATHFONT_FOLD: live integer sources, d3 minimum/scale/precision/text, reset/flow/projection, pending/failed fonts and complete comparison | PASS: 20 native states per backend, 4,096 live minimum pairs, 3 font guards; 8 saved timing records and 400 timed outputs checked; arithmetic retained | PASS: the same | PASS: 20 live states per backend, 18 equal d3 and 2 refused (precisionFixed of a step under 2, nothing printed), 4,096 live minimum pairs, failed/held/delivered font guards (live-cost.mjs not run) (2026-11-02) |
| A84 | probes/dcss/share/check.mjs; full-sheet-check.mjs: d3 sum/fractions, native/reset, labels, nested scope, bounded errors (a fraction among them), formatter propagation and mutation detection | PASS: 21 focused cases; 64-item near-bound totals; wrong-share/error mutations detected (2026-11-02); full-sheet-check not rerun | PASS: the same | PASS: 21 focused cases; wrong-share/error mutations detected (2026-11-02) |
| A85 | probes/dcss/compare/check.mjs: original identities, numeric/missing/NaN, native/reset and wrong-answer detection | PASS: 9/14 ascending and 9/14 descending; native/reset/nested/mutation guards | PASS: the same | PASS: 9 of 14 recorded each side; the 8 bound cases, ±2^24 refused there; 10 near pairs, 6 right and 4 refused (0.1 and 0.100000001, equal fractions), none wrong; native/reset/nested/mutation guards (Firefox 159, 2026-11-01) |
| A86 | probes/dcss/scale-extra/check.mjs: original numeric map/invert calls, configuration independence, native changes/reset, finite presence and reuse | PASS: identity 11/86 exact; native/reset/status/reuse guards | PASS: the same | PASS: identity 11/86 original calls; native/reset, reuse, invalid values, mutation (2026-10-28) |
| A87 | probes/dcss/index-extrema/check.mjs: original calls, endpoint/ties, native/reset, NaN/errors, a fraction and a value past ±4,095, source-index mutation and nested reuse | PASS: minIndex 26/46, maxIndex 26/46, scan 6/23 through leastIndex, leastIndex 9/26, greatestIndex 9/26, least 8/26, greatest 8/26; 55 additional states (2026-11-02) | PASS: the same (2026-11-02) | PASS: the same (2026-11-02) |
| A89 | probes/dcss/bisector/check.mjs: source-owned raw calls and hashes, sorted slice, valid/invalid bounds, missing query, native/reset, nested and container reuse | PASS: 98/153 original calls; numeric presence, bound errors, 64-item boundary and overflow guards | PASS: the same | PASS: 98/153 original calls; native/reset, nested reuse, invalid query/bounds, mutation (2026-10-28) |
| A90 | probes/dcss/format/format-check.mjs: 1,500 seeded general cases (d3's none and g types, 1 to 15 digits, decade boundaries, ties) | PASS: 1,500 of 1,500 general (2026-10-29) | PASS: 1,500 of 1,500 general (2026-10-29) | FAIL: refused where its 32-bit `calc()` can round otherwise than d3 (Q16, A64): 725 of 1,500 print d3's text, 775 refused, 0 wrong (Firefox 159, 2026-11-02) |
| A91 | probes/dcss/paired-check.mjs; compiler-paired/check.mjs; compiler contract checks: both branches use the same original oracle fixtures, shared CSS math and source manifests | PASS: 630/630 original questions across 19 exports in both branches (2026-10-31; 887 across 27 on 2026-10-29, 2,672 across 65 before the first cut); 25 share/field/flow/input-node states per branch; 135 contract and 38 per-item checks | PASS: the same | NOTRUN: new compiler branch qualification |
| A92 | probes/dcss/range-wave/check.mjs; selection.mjs: exact original identities, grid boundaries, native reset, nested scopes, capacity and mutation guard | PASS: 41/76 original calls in both branches | PASS: the same | PASS: 41/76 original calls; native/reset, NaN, capacity, nested scope, reuse, mutation (2026-10-28) |
| A93 | probes/dcss/utc-wave/check.mjs; cases.mjs; edges.mjs: source answers match recorded identities; exact timestamp differences, truncation, bounds, native reset, nesting and reusable results | PASS: utcDay 59/62, unixDay 59/62, utcHour 40/41, utcMinute 18/19 and timeSecond 19/20 in both branches; the same with the times in parts (`PARTS=1`), with the live, nested and invalid pages and the 148 supplemental states (2026-11-02) | PASS: the same | PASS: times in parts, every original right: utcDay and unixDay 59, utcHour 40, utcMinute 18, timeSecond 19; the live, nested and invalid pages; 144 of the 148 supplemental states right, 4 counts of 2^24 or more refused (error 1), none wrong (Firefox 159, 2026-11-02) |
| A94 | probes/dcss/week-wave/check.mjs and edges.mjs: original identities, weekday alignment, negative modulo, exact counts, bounds, ties, native reset, nesting and reuse | PASS: 155/155 original calls across seven exports in both branches; with the times in parts (`PARTS=1`) 154, utcSunday's first-century floor past the parts' range refused, and the states page (2026-11-02) | PASS: the same | PASS: times in parts: utcSunday 40 right and its first-century floor refused (past the parts' range), the other weekdays 19 each right; the states page; edges-check.mjs: 181 supplemental cases and nested states right, 58 invalid or past the parts' range refused as asked, none wrong (Firefox 159, 2026-11-02) |
| A95 | probes/dcss/calendar-wave/check.mjs and cases.mjs: source-owned year periods, exact calendar results, leap/century rules, first-century dates, overflow, bounds, native reset and reuse | PASS: month 51/52, year 25/27 original calls in both branches; with the times in parts (`PARTS=1`) 50 and 24, one first-century call each past the parts' range refused, and the native page (2026-11-02) | PASS: the same | PASS: times in parts: utcMonth 50 right and 1 refused, utcYear 24 and 1 (each a first-century date, past the parts' range); edges: 133 right or refused as asked, 42 past the parts' range refused (years 0, 9, 1600 and ±8e13), none wrong; the native, nested and live page (Firefox 159, 2026-11-02) |
| A100 | probes/dcss/locale-format/check.mjs: source-owned Arabic factories, native rendered text, changing input/reset, invalid/missing/magnitude errors and wrong-output guard | PASS: 2/99 raw identities; 22 locale contexts in both branches | PASS: the same | PASS: 2/99 raw identities; 22 locale contexts (runtime branch) (2026-10-28) |
| A107 | probes/dcss/date-format-wave/check.mjs and ownership.mjs: every exact source-owned configuration, native text pixels, numeric-field reuse, native/reset, bounds/missing/nested and wrong-text guards | PASS: 52/52 UTC originals in all 138 source-owned contexts through both branches (2026-10-28); with the epochs in parts (`PARTS=1`) 134 contexts right and 4 past the parts' range refused (2026-11-02) | PASS: the same | PASS: epochs in parts: utcFormat 134 contexts right (49 of 52 keys), 4 refused, each past the parts' range (the years −2, twice, 123 and 10002), none wrong; the live, bounds, missing and nested pages (Firefox 159, 2026-11-02) |
| A116 | probes/dcss/static/range-check.mjs: prices in cents, 64 values near the top, interpolated quantiles and quantileSorted, quantile-scale thresholds, out-of-range values and fractions | PASS: 20 of 20 calls and 17 of 17 scale queries equal d3, the edges of both ranges included; out-of-range values and fractions refused (2026-11-02) | PASS: the same (2026-11-02) | PASS: 12 of 20 calls and 17 of 17 scale queries equal d3, the rest refused, none wrong with error 0 (2026-11-02; 12 of 17 before numeric ranges were picked by calc()) |
| A118 | parts.mjs and runtime.mjs with DCSS_PARTS: every DCSS check (82) run with parts linked in place of families; probes/dcss/parts-text-check.mjs: 15 text-printing calls, part alone against core and family, pixel for pixel | PASS: 82/82; with DCSS_NOCORE=1 (no dcss.css) 89/90, the other a compiled-size comparison | PASS: the same | FAIL: the parts answer as the families do (25 of 25 checks that load through runtime.mjs give the same result), but 15 of those fail with either (2026-10-29) |
| A119 | probes/dcss/scale/function-check.mjs and utc-wave/function-check.mjs: 400 seeded linear scales and 660 seeded interval calls over 11 intervals, against their classes and d3 | PASS: 400 scale calls within 1e-12 of their classes; 660 interval calls equal d3-time (2026-10-31) | PASS: no @function; plain fallbacks kept, classes equal d3 (2026-10-31) | PASS: no @function; plain fallbacks kept; all 800 scale classes refused (A62), none wrong with error 0 (2026-11-01) |
| A122 | probes/dcss/one-list/check.mjs: 268 seeded calls of 1 to 64 whole values (within ±65,535 and to 393,215, ties), 36 of them with missing values, 15 written out and 25 of d3's 47 median tests (14 with missing values), each against d3, invalid ones included (fractions among them); a figure alone on its page; COMPILED=1 the ones within ±1024; cleanroom-check: the README's median, then a change | PASS: 297 of 297 equal d3 (45 skipping missing values), 23 of 23 refused with their error (2026-11-02); COMPILED=1 not rerun | PASS: the same (2026-11-02) | PASS: 195 equal d3, 102 refused (a value past 2^19 px, or between two values but the median's), none wrong with error 0 (2026-11-02) |
| A123 | probes/dcss/one-list/scale-check.mjs: 2,373 seeded calls, domains of 1 to 64 whole values (within ±131,071 and to 393,215, ties, near the bounds' edges and past them), 1 to 17 ranges, numbers and text, queries on each threshold and one double either side, each against d3, invalid ones included (fractions among them); a figure alone on its page; one with a caption; COMPILED=1 the domains within ±1024; cleanroom-check: the README's scale | PASS: 1,891 of 1,891 equal d3, 482 refused with their error (2026-11-02); COMPILED=1 not rerun | PASS: the same (2026-11-02) | NOTRUN: the 2,373 scales don't load in 180 s; range-check's 17 of 17 equal d3 (2026-11-02) |
| A124 | probes/dcss/static/scales-check.mjs: d3-scale's own 42 threshold and quantize map calls that fit (19 skipped: 14 object ranges, 3 query coercions, 2 past 16 thresholds), seeded calls with 1 to 16 thresholds, numbers and text, queries on each threshold and one double either side, each against d3; invalid ones; a bare output; COMPILED=1 the 1,121 with a finite query; static/ranges-check.mjs: a quantile scale and a threshold with text and number ranges at 10 queries each | PASS: 1,132 of 1,132 equal d3, 17 of 17 refused, 1,121 of 1,121 compiled; ranges-check 40 of 40 (2026-11-02) | PASS: the same; ranges-check 40 of 40 (2026-11-02) | PASS: 109 of 1,132 equal d3, 1,023 refused near a threshold, 0 wrong with error 0 (was 349 wrong, 2026-11-01); ranges-check: numbers 19 of 20, 1 on a threshold refused, text 12 of 20, the rest refused, none wrong (2026-11-02) |
| A125 | probes/dcss/static/cumsum-check.mjs: 83 seeded lists of 0 to 64 values, missing and NaN values among them, every running total against d3; a value off the grid, one past ±1024 and an infinite one; the bounds: 256 values whose last total + 1024 an item is 262,143 and one with a fraction there, 1,024 values and 1,025; a formatter in each item; COMPILED=1 the 59 lists without invalid values | PASS: 3,804 of 3,804 whole-number totals equal d3, 1,037 of 1,037 refused after a bad value or past a bound (2026-11-02); 1,428 of 1,428 compiled (2026-11-01) | PASS: the same (2026-11-02) | PASS: 3,804 totals equal d3, 1,037 refused, as Chrome; each formatter prints (2026-11-02) |
| A126 | probes/dcss/static/chain-check.mjs: the README's median -> precisionFixed -> formatFixed chain, and a formatter straight inside a median (and one of nothing), a quantile scale, a threshold scale, cumsum, ascending, the identity scale, a mean (and a sum figure's mean) of nothing, extent and a linear scale, each answering and failing; a precision helper on another's result through a plain element | PASS: 12 of 12 chains, 24 of 24 states, and the repeated helper | PASS: the same | PASS: 12 chains, 11 answering and 1 refused (the README's median of fractions), each failing with nothing printed; the repeated helper refused (a step under 2) (2026-11-02) |
| A127 | check.mjs: 61, 66 | PASS | PASS | PASS |
| A128 | probes/dcss/index-order/check.mjs: d3's 26 test calls on numbers and nulls, 600 seeded lists of whole numbers (half from {1, 2, 3}), 200 with missing items (some all missing), 6 with no answer (fractions among them), a live change | PASS: 833 of 833; 0 of 426 differ from d3 where its answer is the value's only copy (2026-11-02) | PASS: the same (2026-11-02) | PRECONDITION_FAILED: every call refused, error 1, none wrong (its order keys go through 32-bit floats, 2026-11-02) |
| A129 | probes/dcss/bin/check.mjs: 300 seeded figures (0 to 64 values, 12 of 900 to 1,024, whole and 64ths, outside the domain, empty items; 0 to 32 thresholds, some outside the domain or on its ends), 150 with `--count` (1 to 12.5; domains and values whole, in tenths or in 64ths; some empty), 4 with no answer, a live move | PASS: 4,609 of 4,609 bins (2026-11-02) | PASS: the same (2026-11-02) | PASS: 4,609 of 4,609 bins, each count read 2^18 px past its item, under 2^19 (2026-11-02) |
| A244 | probes/dcss/rollup/check.mjs: each key read by a bare `<output>` naming it, nothing inside, in the keys' reverse order, the first twice, on pages of 1,500 items at most; 208 seeded lists (0 to 64 items, 8 of 900 to 1,200; whole numbers, fractions and negatives; items with no number, no key or a key not declared; 1 to 32 keys, some no item has), each as a sum and a count figure, against d3-array's rollup; 9 with no answer (a 33rd key, a key not declared, an answer its author keeps inline, an answer with no key, positives and negatives past the bound, a value with a fraction, a fraction a stylesheet sets, a key past it by its items alone); a key and value changed, an item put in at the start and at the end, one taken out and one hidden, each read the next frame but one | PASS: 2,576 of 2,576 keys in 416 figures (1,596 answers, 516 undefined, 464 refused: a fraction or past the bound), 9 of 9, 5 live (2026-11-02) | PASS: the same (2026-11-02) | PASS: 2,576 of 2,576 keys (1,525 answers, 516 undefined, 535 refused: a sum past 2^18 too), 9 of 9, 5 live (2026-11-02) |
| A130 | probes/dcss/variance/check.mjs: d3's test calls on whole numbers, plain or unboxed, 300 seeded lists of 0 to 64 values and 65 to 65,535 (whole, one in six with eighths, spans 1 to 1024, items with none), 4 with no answer, a live move; the engine's own value and the published text | PASS: 662 of 662 answers the true value to the bit (2026-11-02) | PASS: the same (2026-11-02) | PRECONDITION_FAILED: refused outright, error 1, as A180 |
| A120 | probes/dcss/token-check.mjs: every call in families.json with a 20,000-token `--value`; three chains (a linear scale into an easing and into a pow scale, a pow scale into a UTC Monday) read through a registered number | PASS: 478 of 478 calls copy it at most once; the largest answer 12,221 tokens; 3 of 3 chains | PASS: the same | PASS: 202 calls (the rest refused there), each copies it at most once; the 4 chains refused (error 1), none read a wrong number (2026-11-02) |
| A215 | probes/dcss/root/check.mjs: Kepler's equation, 40 orbits, 54 and 26 nested `<i>`s, against Newton's method | PASS: 40 and 40 of 40, worst 8.9e-16 (2026-10-31) | PASS: 40 and 40 of 40, worst 8.9e-16 (2026-10-31) | PASS: 40 and 40 of 40 within the width and f's 32-bit rounding over its slope, against the root in doubles as a 32-bit float, worst 5.8 float steps (2026-11-02) |
| A216 | probes/dcss/root/check.mjs: the same sign at both ends, f NaN, no f, no bracket; a 0 at either end; from above to; no f, no bracket on a nested solve; probes/dcss/root/nan-check.mjs: f NaN only at a middle try, halving and Newton | PASS: 9 of 9, 6 of 6 (2026-10-31) | PASS: 9 of 9, 6 of 6 (2026-10-31) | PASS: 9 of 9, 6 of 6 (2026-11-02) |
| A217 | probes/dcss/root/check.mjs: x³ equal to Kepler's E, solved inside the outer solve's answer; again in `@scope`, the inner's rule first, E read on the inner solve | PASS: off 0 and 0 (2026-10-31) | PASS: off 0 and 0 (2026-10-31) | PASS: off 1.2e-7 and 1.2e-7 (2026-11-02) |
| A220 | probes/dcss/root/check.mjs: Kepler's equation, 40 orbits at 10 `<i>`s from the middle and 8 from a guess, within 1e-14; the cubic-bezier(.42, 0, .58, 1) inverse at 41 progresses, 6 `<i>`s; x³ − 2x + 2 and atan(x − 0.3), where plain Newton cycles and diverges, 10 `<i>`s; a 0 at either end; same sign at both ends and no f′ | PASS: 127 of 127, worst 1.8e-15 (2026-10-31) | PASS: 127 of 127, worst 1.8e-15 (2026-10-31) | PASS: 127 of 127 within the width and f's 32-bit rounding, worst 2.9e-6 (2026-11-02) |
| A221 | probes/dcss/invert/check.mjs: Kepler's equation at e 0.6 on 32 and 64 pairs and after e changes to 0.3, x³ on [−1, 1], a falling 1 − x² with top above bottom, 30 pairs in a 999 px box; 1 px rows, each line's start against the inverse in doubles over its band | PASS: 3,900 of 3,900 rows, worst 0.47 px (2026-10-31) | PASS: 3,900 of 3,900 rows, worst 0.47 px (2026-10-31) | PASS: 1,900 of 1,900 rows within 1 px, worst 0.48 px (Firefox 159, 2026-11-02) |
| A222 | probes/dcss/ode/check.mjs: a 100 px spring, a pendulum from 1.2 rad, a spring's x read inside a second cell nested in it, the spring with the page scrolled 300 px, a cell run past its range and one started past it, a cell with no acceleration; sampled every 100 ms for 8 s against the same step in doubles | PASS: 7 of 7, worst 0.016 px outside what the step keeps, 59.2 steps a second (2026-10-31) | PASS: 7 of 7, worst 0.016 px, 59.2 steps a second (2026-10-31) | PASS: 7 of 7, worst 0.017 px, 59.0 steps a second (2026-11-02) |
| A223 | probes/dcss/root/steps-check.mjs: the Kepler page's 3 solves written with `data-dcss-steps="5"` against the hand-written page, a built page rebuilt, a solve in another's answer, an invert of 32, five refusals; the built page's planets in the engines, and the page never built | PASS: 14 of 14, the page byte for byte (2026-10-31) | PASS: 14 of 14, the page byte for byte (2026-10-31) | PASS: 11 of 11, the planets ready (2026-11-02) |
| A224 | probes/dcss/sample/check.mjs: 64 sin on [0, π] summed at 64 and 300 items, 64 x² on [−1, 2] at 30 items its max and mean, exactly against the same samples in doubles; one rule feeding a sample and a solve; no formula, no from and to | PASS: 8 of 8, exact (2026-10-31) | PASS: 8 of 8, exact (2026-10-31) | PASS: 8 of 8, the mean as a 32-bit float, the solve 0.707107 (2026-11-02) |
| A225 | probes/dcss/slope/check.mjs: 26 formulas at 4 points, the written slope against the formula's central difference in doubles; the same text in the engine against doubles; the Kepler page with its slope left out, built: the hand-written slope, no line added, built to itself, its planets where the hand-written page puts them; a slope the page wrote left; the build's own following a changed formula; 5 formulas left without a slope, named with their line, one beside a formula it takes | PASS: 17 of 17, within 3.7e-10 (2026-10-31) | PASS: 17 of 17, within 3.7e-10 (2026-10-31) | PASS: 16 of 16, the planets within 0.0002 px of E in doubles (2026-11-02) |
| A226 | probes/dcss/root/within-check.mjs: 39 solves of x − r over 8 ranges and 5 closenesses, built and run; the fewest tries; a range read from a class's rule; the built page builds to itself; 6 refusals | PASS: 11 of 11, worst 0.77 of what was asked (2026-10-31) | PASS: 11 of 11, worst 0.77 of what was asked (2026-10-31) | PASS: 10 of 10; 39 of 39 within what was asked and 4 float steps of the range's larger end, 26 within what was asked alone (2026-11-02) |
| A227 | probes/dcss/root/extreme-check.mjs: 6 formulas with a known peak or dip, built with `data-dcss-within="1e-6"`; the page never built; beside `.dcss-solve-newton` | PASS: 15 of 15, within 9.5e-7 (2026-10-31) | PASS: 15 of 15, within 9.5e-7 (2026-10-31) | PASS: 9 of 9, within the width and the slope's 32-bit rounding, worst 9.5e-7 (2026-11-02) |
| A228 | probes/dcss/root/inherit-check.mjs: a solve, a sample under `.dcss-sum` and a solve-rows inside an element setting `--from`, `--to`, `--top: 12px`, `--bottom`: with none of their own, with their own by style and by a rule on a class, a solve-rows with `--top` a length and with no pairs | PASS: 9 of 9 (2026-10-31) | PASS: 9 of 9 (2026-10-31) | PASS: 9 of 9 (2026-11-02) |
| A229 | probes/dcss/evaluate/check.mjs: 5 formulas at an input, the value and the written slope against doubles; `--at` only on an outer element, a NaN value, no formula, no `<i>`, a constant formula with no `--at`, `--at` a length; the build writes the `<i>` | PASS: 11 of 11; the build wrote the `<i>` and 5 slopes (2026-10-31) | PASS: 11 of 11, the build's <i> and its idempotence (2026-10-31) | PASS: 13 of 13 (2026-11-02) |
| A230 | probes/dcss/every/check.mjs: sin on [0.5, 10] in 16 pieces, x³ − 3x with 0 on a shared end, x − 0.5 in 2 pieces, x² reaching 4, x² + 1 (none), the turning points of x³ − 3x, x − 0.6 on [−1, 1] in 5 pieces, `data-dcss-apart` with an `@scope` rule, each answer within 1e-4 of the true one; the copies hidden where a piece finds none, ends only on an outer element, a target changed after load, the page never built | PASS: 12 of 12, within 1e-4 (2026-10-31) | PASS: 12 of 12, within 1e-4 (2026-10-31) | PASS: 13 of 13, within 1e-4 (2026-11-02) |
| A231 | probes/dcss/sample/grid-check.mjs: a 3 × 2 grid of x + 10y, each item's value and its list laid out in 3 columns; its sum and mean; a 16 × 16 hill summed exactly against doubles; 7 items in rows of 3, `--columns` 2.5, no `--from-y`, `--from-y` only on an outer element | PASS: 8 of 8, the hill exact (2026-10-31) | PASS: 8 of 8, the hill exact (2026-10-31) | PASS: 8 of 8, the hill exact (2026-11-02) |
| A232 | probes/dcss/lookup/check.mjs: 400 seeded tables of 1 to 200 rows against d3.index's get (a missing key, a key in two rows, a value with a fraction now and then); 14 by hand: the first and last of 1,000 rows, a value missing, with a fraction, past ±131,071, the least and greatest taken, no `--find`, a row with no key, fractional and negative keys, a repeat of another key; 13 past 2^24 (8-digit SKUs and EAN-13s, the miss next to each, a key written with a + or leading 0s, a negative one); `--find` set by a radio button, changed and reset | PASS: 400 of 400, 27 of 27 (2026-11-02) | PASS: the same (2026-11-02) | PASS: 400 of 400, 27 of 27, 3 of them refused as the Firefox clause says (2026-11-02) |
| A233 | probes/dcss/locales/check.mjs: 12 seeded calls in each of 58 locales (types f, % and s; sign, $, comma, ~) against `formatLocale(locale).format`, each in an element with that `lang`; 10 by hand: `lang="en"` inside a German element, `es-AR`, a locale from `<html>`, `zh-Hans-CN`, `zh-cmn-Hans-CN`, `de-Latn-DE`, `pt-Latn-BR`, `fr-Latn-FR`, `de_DE`, `zh-Hans`; the printed text in Chrome, the row against d3's text in WebKit | PASS: 696 of 696, 10 of 10 (2026-11-02) | PASS: 696 of 696, 10 of 10 (2026-11-02) | FAIL: refused where its 32-bit calc() can round otherwise than d3 (Q16): 517 of 696 right, 179 refused (error 1, no text: 63 input not a float32, 64 a float32 sharing its span with another answer, 52 answerable, A64's split), none wrong; 10 of 10 (2026-11-02) |
| A234 | probes/dcss/find/check.mjs: 300 seeded lists of 1 to 120 items, keys from 1 to 6 (some none, some values none), whole numbers and 64ths, each call against the same call on the items found written alone and against d3 where that answers; 12 by hand (a key in no item, no `--find`); 48 with keys past 2^24 (8-digit SKUs, an EAN-13, the miss next to each); a sum inside a lookup's answer; `--find` set by a radio button, changed and reset | PASS: 360 of 360 (284 as d3, 76 error 1 both ways) (2026-11-02) | PASS: the same (2026-11-02) | PASS: 360 of 360 (206 as d3, 78 error 1 both ways, 76 refused, 36 of them the keys past 2^24 one float with `--find`; none wrong) (2026-11-02) |
| A236 | probes/dcss/summarize/decimals-check.mjs: 240 seeded lists of 1 to 64 items in 1 to 4 decimals, 12 edge lists (k at -1024 and 65535, 1,024 items, 0.1 + 0.2, 1.005, none), 6 with no answer, a live move; the engine's own value and the published text, against the decimals' exact answer worked out in BigInt | PASS: 2,008 of 2,008 answers to the bit (2026-10-31) | PASS: the same (2026-10-31) | FAIL: 252 of 252 lists refused (error 1), 0 wrong: view timelines are in Firefox 159, and the summary's 32-bit `calc()` refuses (A180) (Firefox 159, 2026-11-02) |
| A235 | probes/dcss/date-format-wave/check.mjs: every other call of d3-time-format's tests written with its letter class | PASS: 52 of 52 with A107's (2026-10-31) | PASS: 52 of 52 with A107's (2026-10-31) | PASS: 134 right, 4 refused, 0 wrong of 138; runtime 49 of 52, past the parts' range refused (Firefox 159, 2026-11-02) |
| A237 | probes/dcss/counters/font-size-check.mjs: 24 lists of 64 seeded values in 64ths (6 each of sum, mean, count, length) and 8 texts to 299,999 under each setting: Chrome's minimum font size 24, 72 and 200, its default font size 32, a phone with no viewport meta at font scale 2, device scale 0.9, 1.5 and 3, a root font size and text-size-adjust of 200%, the page's text styles (kerning, ligatures and features off, spacing, synthesized bold italic, uppercase), WCAG 1.4.12 text spacing, `font-family: serif` and `font-size: 20px` on every element, `!important`, the fonts missing | PASS: 24 of 24 and 8 of 8 right under each; all refused at minimum 200 and with the fonts missing (2026-11-01) | PASS: the same under the WebKit takes (device scales, root font size, text-size-adjust, the page's styles, the fonts missing); CSS zoom 0.5, 0.75, 0.8, 0.9 and 1.1 all refused, 1.25 to 3 right (2026-11-01) | FAIL: 14 right, 10 refused, 0 wrong of 24, as shipped and at minimum font size 72; texts 8 of 8 right (Firefox 159, 2026-11-02) |
| A51 | coverage/board.mjs: bd-power-12-loop-classes, bd-power-12-loop-table | PASS: 13 of 13 each, against NumPy | PASS: 13 of 13 each, against NumPy | PASS: 13 of 13 each, against NumPy (Firefox 159, 2026-11-02) |
| A52 | sheets/check.mjs: loan | PASS: 50 of 50 cells as written and after 2 changes | PASS: 50 of 50 cells as written and after 2 changes | PASS: 50 of 50 cells as written and after 2 changes, once PMT's 1 - (1 + r)^-n is written by its series (the float lost a cent: 41,643 for 41,644) (Firefox 159, 2026-11-02) |


### Architecture qualification (26 October 2026)

The shared registry and measured policy are covered by `pipeline/architecture-check.mjs`, `contract-check.mjs`, `measured-check.mjs`, `scan-contract-check.mjs` and `evidence-check.mjs`. Synthetic costs in these checks are policy tests, never browser performance results. Whole-plan records bind source, artifact, input bounds and actual output addresses. Qualification covers both required mutation patterns and both engines; stateful latency cannot silently replace same-update behavior.

The typed pilot's 48-row baseline went with the typed calls (2026-10-28). `implementation.json` records every sheet's before/after bytes; `default-migration.json` accounts for the 35 old literal backend declarations; no update-speed claim follows.

The new count/mean compiler subset matches 5 of the 45 original recorded calls in both branches and both engines, with mutation, missing-input refusal, restoration and downstream numeric/width reuse (`count-mean-original-check.mjs`). The remaining 40 source calls are explicitly outside this subset. This adds no headline coverage count. The A91 paired proof was rerun on the current sources on 2026-10-29: 887/887 original questions across 27 exports in both branches, the cut families' groups gone (`coverage/d3-branches.json`).

## 4. Not covered

- Colors: d3-color's constructors, conversions and parsing (gamutant.css reads a CSS color's channels as numbers; `color-mix()` interpolates).
- Parsing dates from text (d3-time-format's parse), and local time: dates are UTC epochs in milliseconds.
- d3.packSiblings, a projection's fitExtent and fitSize, and d3-random.
- Charts, maps and easing (2026-10-31: dcss is for pages that compute): d3-axis, d3-shape, d3-hierarchy, d3-geo and d3-ease; the band, point, radial, symlog, sequential and diverging scales; a log scale's ticks, nice and labels, and the identity scale's ticks. git keeps their ports.
- Values that aren't numbers on the grid (d3's null, undefined and NaN as values, strings, objects, accessors, comparators), doubles past the grid's range, and d3.fsum, fcumsum, mode, scan, variance and deviation; d3's choice among equal values in medianIndex and quantileIndex.
- Compiled HTML compositions beyond A69's sum/two-stop-scale/fixed-percent-SI chain, A72–A73/A76's discrete scales, A74–A75's grid quantiles, A78's precision helpers and A91–A112's paired calls; dynamic scalar settings beyond bounded precision, live DOM rewiring, arbitrary font-wrapper layout, or a measured three-way cost model.

- Quantiles outside A74's grid bounds; invalid-observation filtering beyond A122's, coercion, accessors, signed-zero identity, dynamic probability and index-returning quantile variants.
- d3.format's types outside f, %, s and A90's bounded general decimal notation; fill, align, width and zero; SI outside A67's bounds; trim outside SI or bounded general notation; nonfinite inputs. Linear/pow fixed-prefix SI labels remain unported.
- Loops between grids (`.loop-flow`, `.loop-in`, `[data-store-read]`, `--store-of`) without store.css or store.css on the page: their cells are store.css's stored numbers.
- Entries of any tag but `<i>`, and readers of any tag but `<b>`.
- Ranks past 32 in one bin (rank 33 reads 1), and bins in use counted past the box's width in px.
- A count of bins in use in `.dcss-bins.dcss-bin-max`, whose 32 bins are an auto-repeat that takes no `max-content`.
- Numbers past 6 significant digits through the registered `--dcss-value`, and fractions finer than 1/64 px (css-grid-2 §12).
- In Firefox, a number the page writes past 7 significant digits: it is parsed to a 32-bit float before the sheet sees it (6.0000001 is 6), so an answer from it is the float's, error 0 (QUIRKS.md Q16).
- A text-spacing override from the user origin (an extension's style sheet): it beats the sheet's `!important`, and sums and bins read wrong, error 0.
- A rollup in WebKit for the frame after an item is replaced or 143 are put in at once in one place: the old total, error 0 (QUIRKS.md Q18).
- A transform, filter, perspective or containment between a reader and its array: a reader is `position: fixed` against the array's `contain: layout`.
