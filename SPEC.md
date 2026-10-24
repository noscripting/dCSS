# dcss-array.css: SPEC

dcss-array.css computes with CSS layout: indexed reads, sums, ranks, sorts, keyed maps, packing and formulas over numbers written in custom properties, with no script at run time.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

Measured 2026-10-23, headless: Chrome 155.0.8059.86, WebKit 26.4, Firefox 158.0.
Conformance: Chrome 58/58, WebKit 58/58, Firefox 53/58.

## 1. Follows

| Spec | Version | Used for |
|---|---|---|
| CSS Grid Layout Module Level 2 | Candidate Recommendation Draft, 2023-10-30 | placement (§8.5) and track sizing (§12): the arrays, bins, sorts, maps, packing and hops |
| CSS Containment Module Level 3 | Editor's Draft, 2025-12-22 | container query units: a reader takes a track's size as `100cqw` and `100cqh` |
| CSS Values and Units Module Level 4 | Editor's Draft, 2026-08-20 | `calc()`, `round()`, `mod()`, `sign()` and typed division in the readers |
| CSS Anchor Positioning Module Level 1 | Working Draft, 2026-09-06 | `.arrays-calc` and the where readers (`anchor()`, `anchor-size()`) |
| CSS Multi-column Layout Module Level 1 | Editor's Draft, 2026-08-04 | `.arrays-columns`: the least largest part of a contiguous split (§7.1) |
| CSS Box Sizing Module Level 4 | Editor's Draft, 2026-10-10 | `.arrays-turn`: a height carried into a width by `aspect-ratio` (§4.2) |
| CSS Flexible Box Layout Module Level 1 | Editor's Draft, 2026-05-08 | `.arrays-flex`: shares with weights, floors and caps (§9.7) |
| CSS Counter Styles Level 3 | Editor's Draft, 2026-10-08 | `arrays-tally`, `arrays-table` and the text operators |
| CSS Fonts Module Level 4 | Editor's Draft, 2026-10-16 | the lookup fonts and the ROM fonts' variation axes |
| dcss-store.css | store 4f37d4eb | the stored cells and readers the loops and sheets run on |

## 2. Requirements

### Arrays

- **A1** In an `.arrays-array` of `<i>` entries with `--arrays-n`, a reader `.arrays-at` with whole `--arrays-i`, in the
  port `<b class="arrays-out">` or inside an entry, MUST give what is inside it `--arrays-value` equal to entry i, and
  entry i from the end for -i, in the frame the entries change, exact for whole numbers.
- **A2** A reader with `--arrays-i` and `--arrays-j` MUST read the sum of entries i to j in either order, -1 meaning the
  last entry and i = j one entry, in the same frame, exact.
- **A3** `.arrays-array.arrays-packed` with `--arrays-tracks` MUST read track i, track -i counted back from
  `--arrays-length`, and ranges; without `--arrays-length`, -1 MUST be the last track.
- **A4** `--arrays-of: --x` on a reader or its array MUST count `--arrays-i` from the slot named `--x` and `--arrays-j` on
  from there over every slot; an array inside a reader MUST NOT inherit its outer `--arrays-of` unless it names its own.
- **A5** `.arrays-cycle` with `--arrays-tracks` MUST read entry i round the cycle, forwards past the last entry and
  backwards from -1, and a range across the end.
- **A6** `.arrays-array.arrays-xy` of entries with `--arrays-n` and `--arrays-m`, or packed with `--arrays-tracks` and
  `--arrays-tracks-y`, MUST give a reader `--arrays-value` and `--arrays-value-y` of entry i, `--arrays-r` picking another
  row, negative indices and a range of columns included, in the same frame.
- **A7** `.arrays-count` on an array MUST work the number of entries out from its last entry's place, so entries -1 to
  -40, the total and entry 35 of 40 entries read exact with no `--arrays-length`.
- **A8** Index 0, an index past the end or the start, a fractional index at either end of a range, and a range past the
  end MUST read `--arrays-value` 0 and `--arrays-ok` 0, empty counted arrays included; a valid read MUST give
  `--arrays-ok` 1.
- **A9** In an `.arrays-xy` read, an invalid column or row MUST zero `--arrays-value`, `--arrays-value-y` and `--arrays-ok`
  together, for entries, packed slots and empty arrays.
- **A10** An array without `.arrays-count` MUST read negative indices and ranges to -1 from `--arrays-length`; with no
  `--arrays-length` they MUST read 0 with `--arrays-ok` 0 while positive indices read their entries.
- **A11** A `<b class="arrays-window">` with `--arrays-i` and `--arrays-span` in an array's port MUST number the entries
  for the readers inside it from its start: 1 its first, -1 its last, ranges, with the window moving every frame.
- **A12** An array inside a keyed map's reader, an `.arrays-xy` reader or a tile's where MUST read its own entries, keep
  its ranges, fraction checks and xy rows, and leave the outer read unchanged.
- **A13** The push, a read from the end and a place in a sort MUST give the same numbers inside
  `writing-mode: vertical-rl; direction: rtl` as in horizontal text.
- **A14** On an `.arrays-plain` array, a range read, a reader placed by its own `grid-column` and a scan reader placed by
  its own `grid-area` MUST read the same numbers as on an array without `.arrays-plain`.

### Bins

- **A15** In `.arrays-bins`, a child with whole `--arrays-bin` MUST give what is inside it `--arrays-rank`, 1 for the
  first child in its bin in markup order, exact to 32, with a bin changing every frame.
- **A16** A `.arrays-count` in `.arrays-bins` MUST give `--arrays-count`, the number of bins in use, for bins up to the
  box's width in px.
- **A17** A `<b class="arrays-below">` in a child of `.arrays-bins` MUST give `--arrays-below`, how many distinct bins in
  use lie below its bin, with or without an author's padding and border on the grid.
- **A18** `.arrays-bins.arrays-max` MUST give a reader with `--arrays-i` the largest `--arrays-n` in bin i, and a range the
  sum of those maxima, with entries at any depth under `.arrays-nest` wrappers.

### Sorts and keys

- **A19** `.arrays-array.arrays-sort` of entries with whole `--arrays-key` MUST read its entries in key order, equal keys
  in markup order: the i-th smallest, -1 the largest, a range the sum of the smallest, with a key moving past the others
  every frame.
- **A20** A `.arrays-where` in an entry of `.arrays-sort` MUST give `--arrays-place`, 1 for the smallest key, equal keys in
  markup order.
- **A21** In `.arrays-sort`, an `.arrays-lo` probe with a key MUST give `--arrays-lower` (keys below it), an `.arrays-hi`
  probe `--arrays-upper` (keys up to it), and an `.arrays-between` in it `--arrays-frequency` and `--arrays-member`.
- **A22** `.arrays-map` of entries with whole `--arrays-key` and `--arrays-n` MUST give a reader with `--arrays-key` the
  largest number written at that key, for keys -9,000 to 9,999, in boxes of any width; an unused key, or one outside
  `--arrays-min-key` to `--arrays-max-key`, MUST read 0 with `--arrays-ok` 0.
- **A23** `.arrays-map.arrays-packed` MUST read a track list of values from `--arrays-min-key` on as keys, child entries
  beside it, duplicate keys as their largest, empty or invalid lists as no values, with keys and values moving between
  tracks in the same frame.
- **A24** A `.arrays-where` in an entry of a keyed map MUST read the entry's offset in the same frame, and an entry MUST
  NOT keep an anchor name while it holds no where.

### Layout

- **A25** `.arrays-array.arrays-packed` with tracks `minmax(0, c)` MUST give slot k min(c k, L), L the level at which the
  slots fill the box's width, within 1/64 px.
- **A26** `.arrays-shares` MUST give child k max(floor k, weight k × L) from its `--arrays-n` and `--arrays-w`, L the level
  that fills the width, and a `.arrays-where` in a child the sum of the shares before it, within 1/32 px.
- **A27** `.arrays-pack` with `--arrays-columns` MUST give each child of `--arrays-w` columns the `--arrays-column` and
  `--arrays-row` where first fit puts it, rows from the top, in `order`-modified document order (css-grid-2 §8.5).
- **A28** A `.arrays-where` in an entry of an array MUST give `--arrays-x`, the sum of the entries before it, and
  `--arrays-y` 0.
- **A29** `.arrays-tiles` with `--arrays-columns`, `--arrays-rows` and `--arrays-areas` MUST give a child at
  `grid-area: name` its area's `--arrays-x`, `--arrays-y`, `--arrays-width`, `--arrays-height` and `--arrays-fits` 1, and
  `--arrays-fits` 0 to every child when an area is not a rectangle.
- **A30** `.arrays-tiles.arrays-pack` MUST place each child of `--arrays-w` by `--arrays-h` tiles where first fit puts it,
  row by row, around the map's named areas and the children before it; a child past the map's rows or wider than the map
  MUST read `--arrays-fits` 0.
- **A31** `.arrays-push` MUST give each child `--arrays-x`, the larger of its `--arrays-target` and the end of the child
  before; `.arrays-push.arrays-end` with `--arrays-wall` MUST give the smaller of its target and the start of the child
  after less its width.
- **A54** `.arrays-push.arrays-nested`, its children nested in each other (each holding the next), MUST give the
  answers A31 gives, for targets and ends under 65,536 px; `.arrays-push.arrays-end.arrays-nested` likewise.
- **A32** `.arrays-groups` MUST give each child `--arrays-y`, the sum of `--arrays-n` over the earlier children of its
  `--arrays-bin`, and `--arrays-x`, its bin less 1.
- **A33** `.arrays-overlap` of children with `--arrays-i` (a start) and `--arrays-span` MUST give a `.arrays-count`
  the most intervals over one point, and each child's where `--arrays-y`, its lane by first fit from 0.
- **A34** `.arrays-lines` with `--arrays-columns` MUST give a `.arrays-count` the number of next-fit lines its children's
  `--arrays-n` take, and each child's where `--arrays-y`, its line from 0, and `--arrays-x`, the sum before it on its line.
- **A35** `.arrays-slide` with `--arrays-span` MUST give a reader with `--arrays-i` j the largest of the span entries
  ending at entry j.
- **A36** `.arrays-array.arrays-xy.arrays-cells` of entries with `--arrays-i`, `--arrays-r`, `--arrays-n` and `--arrays-m`
  MUST give a reader the widest entry of column i as `--arrays-value` and the tallest of row r as `--arrays-value-y`.
- **A37** `.arrays-range` of entries with `--arrays-key` and `--arrays-bit` (1 to 19) MUST give a query `.arrays-in` with
  `--arrays-from` and `--arrays-to` the bit mask of the entries whose key is in [from, to] less `--arrays-not`, and
  `--arrays-top1` to `--arrays-top6`, its six highest bits.

### Formulas

- **A38** `.arrays-sum` MUST add its children and `.arrays-largest` take the largest, leaves with `--arrays-n` and whole
  arrays as children, at any depth, read at the root or inside; a negative leaf MUST make every node above it read
  `--arrays-ok` 0.
- **A39** `.arrays-cap` MUST give min(E, c) of its formula E with c moving, of a sum or of a leaf; a negative leaf in it
  MUST read 0 with `--arrays-ok` 0.
- **A40** `.arrays-times` MUST give f × E as a height, f written and moving, counted in an `.arrays-stack` and read
  inside it.
- **A41** `.arrays-calc` boxes MUST give a product, a min and their sum of two named formulas through `anchor-size()`,
  in the same frame.
- **A42** `<b class="arrays-hop">` MUST give a row the sum of the columns it spans (two hops in one row the larger), and
  `<b class="arrays-hop-y">` a column the sum of the rows it spans, read by `.arrays-at-y` and `.arrays-at-x`.
- **A43** `.arrays-text` MUST give the sum and the largest line of counters in `arrays-tally`, f(k) of the shared tables
  (k, round(k^2 / 1000), round(sqrt(1000 k)) for k 0 to 999), a scan and a table's running totals, exact.
- **A44** The text operators MUST give, from pair texts and counter styles, min, max, a sum of products, |a - b|, a > b,
  a × b by `letter-spacing`, floor(a / b) by a tab, sign and relu, exact.
- **A45** A `.arrays-collapse` of signed margins, `.arrays-zoom` factors in a sum, an `.arrays-baseline` row,
  `.arrays-columns` with `--arrays-parts` and `.arrays-flex` shares MUST give their laid-out results within 1/64 px.
- **A46** Collapses MUST nest: two laid-out widths in one collapse (W1 / 2 - W2), three levels of `.arrays-scope`, the
  results counted in an `.arrays-stack` and an `.arrays-tallest` with no reader between.
- **A47** A collapse as a row of a grid MUST turn into a column through `.arrays-hop-y`, and a second collapse over that
  column MUST subtract a third width, read by the row, the column and their readers.
- **A48** `<div class="arrays-minus">A<b>B</b></div>` MUST be max(0, A - B) wide for widths A and B under 2^20 px: alone,
  as min and |a - b|, two deep, and inside a collapse, an `.arrays-least` and an `.arrays-scale`.
- **A49** `.arrays-turn` with `--arrays-tick` changed whenever an input under it changes MUST lay a height on as a width:
  under `.arrays-largest`, in an `.arrays-least` slot, as a subtrahend and in a stack, with inputs moving every frame.
- **A50** `.arrays-rom` with `.arrays-sq` or `.arrays-sqrt` and `--arrays-k` from 0 to 999 MUST give its child
  `--arrays-value` round(k^2 / 1000) or round(sqrt(1000 k)), and `.arrays-rom2` the five pair tables for a and b from
  0 to 31, at style time with no layout.

### Across computations

- **A53** Results of separate computations, each an `.arrays-array` as wide as its total and named by `anchor-name`,
  MUST place their marks in sorted order in the same frame when each mark's `top` sums, over the others,
  `clamp(0, (anchor-size(--other width) - anchor-size(--own width)) / 1px * 2 + t, 1)` (t 1 for an earlier result, else 0),
  for 4 to 32 results.
- **A55** `.arrays-ranked` with `--arrays-bins` G up to 16 (32 with `arrays-wide`) MUST place bar k at its group's total of `--arrays-n`
  (`.arrays-max`: its largest), as many `--arrays-band`s down as groups beat it, largest or smallest first, ties to the
  lower bin; an item's `<b>` on its group's bar after the items before it; label k at bar k's top.
- **A56** `.arrays-piles` MUST place each item at the sum of the heights before it in its group; `.arrays-starts`
  MUST place group k's marker at the sum of `--arrays-n` over earlier groups; a `.list`'s `.arrays-size` MUST read its
  width and height.
- **A57** `.arrays-ranked.arrays-copy` with `--arrays-copy-width` and `.arrays-ranks > b > .arrays-segments` holding G
  `.arrays-group` and the items again MUST place each segment as A55 does, for up to 16 groups.
- **A58** `.arrays-ticks` with `--arrays-start`, `--arrays-stop` and `--arrays-count` MUST give `--arrays-tick-increment`
  and `--arrays-tick-step` equal to d3-array 3.2.4's tickIncrement and tickStep, `--arrays-tick-n` its ticks' length, and
  its k-th child `--arrays-tick` the k-th tick (`--arrays-tick-on` 1 for k < n); `.arrays-nice` with the same three MUST
  give `--arrays-nice-start` and `--arrays-nice-stop` equal to nice's; for finite start, stop and count.

### On the board

- **A51** A loop (`.loop`, `.loop-flow`, `.loop-in`, `.loop-cell`, `.loop-core`) MUST have dcss-store.css on the page;
  its cells, read through `[data-store-read]` and `[data-store-read-3]` naming them by `--store-of`, MUST settle on the
  iteration's fixed point: a 12-cell power iteration's vector and eigenvalue equal NumPy's, as a flow and as a table row.
- **A52** A `<table class="sheet">` on dcss-store.css's board MUST show every cell and fold equal to the sheet's own
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
| A53 | probes/anchor-sort-check.mjs: 4, 16 and 32 totals | PASS: 120 of 120 frames, 70 reorders | PASS: 120 of 120 frames, 73 reorders | PASS: 120 of 120 frames, 70 reorders |
| A55 | pipeline/check.mjs FORMS=sheet: the 8 sorted group programs and the 3 ranked albums (24 rows) of examples.mjs | PASS | PASS | PASS |
| A56 | pipeline/check.mjs FORMS=sheet: ex-board-heights, ex-starts, ex-gallery-size | PASS | PASS | PASS |
| A57 | pipeline/check.mjs pipeline/at-size.mjs F=sheet: 3 stacked bar programs at 1,300 items | PASS | PASS | PASS |
| A58 | d3-check.mjs: every call d3-array's tests record with finite numbers (ticks 112, tickIncrement 30, tickStep 92, nice 20) | PASS: 254 of 254 | PASS: 254 of 254 | PASS: 254 of 254 |
| A51 | coverage/board.mjs: bd-power-12-loop-classes, bd-power-12-loop-table | PASS: 13 of 13 each, against NumPy | PASS: 13 of 13 each, against NumPy | PRECONDITION_FAILED: no view timelines, which dcss-store.css's store needs |
| A52 | sheets/check.mjs: loan | PASS: 50 of 50 cells as written and after 2 changes | PASS: 50 of 50 cells as written and after 2 changes | PRECONDITION_FAILED: no view timelines, which dcss-store.css's store needs |

## 4. Not covered

- Loops between grids (`.loop-flow`, `.loop-in`, `[data-store-read]`, `--store-of`) without dcss-store.css or store.css on the page: their cells are the board's stored numbers.
- Entries of any tag but `<i>`, and readers of any tag but `<b>`.
- Ranks past 32 in one bin (rank 33 reads 1), and bins in use counted past the box's width in px.
- A count of bins in use in `.arrays-bins.arrays-max`, whose 32 bins are an auto-repeat that takes no `max-content`.
- Numbers past 6 significant digits through the registered `--arrays-value`, and fractions finer than 1/64 px (css-grid-2 §12).
- A transform, filter, perspective or containment between a reader and its array: a reader is `position: fixed` against the array's `contain: layout`.
