# styles-array.css

Computation in a stylesheet. Arrays of numbers laid out by CSS Grid: read by index, summed over ranges, ranked in bins, sorted, searched, packed and looked up by key, with every result in the same frame as its inputs and no script. Also formulas over laid-out sizes, lookup tables in fonts, and loops and spreadsheets on styles-store.css. Checked frame by frame against a model. Works in Chrome and Safari.

Visit [noscript.ing](https://noscript.ing) for demos.

## Installation

Download `styles-array.css` and link it. Numbers go in as `--arrays-n` on `<i>` entries; a reader, `<b class="arrays-at">`, picks one by `--arrays-i`, and the `<u>` inside it gets the result as `--arrays-value`:

```html
<link rel="stylesheet" href="styles-array.css">
<style>.arrays-at u::after { counter-reset: v var(--arrays-value); content: counter(v); }</style>

<div class="arrays-array arrays-count">
  <b class="arrays-out"><b class="arrays-at" style="--arrays-i: 2"><u></u></b></b>
  <i style="--arrays-n: 12"></i>
  <i style="--arrays-n: 40"></i>
  <i style="--arrays-n: 30"></i>
</div>
```

The page shows 40, entry 2. With `--arrays-i: 1; --arrays-j: -1` the reader shows the sum, 82; with `--arrays-i: -1`, the last entry, 30. Change any `--arrays-n`, by a rule, a transition or an animation, and the reader follows in the same frame.

Text reads (`.arrays-text`, below) use fonts embedded in the sheet. To have them right from the first frame, copy the `<link rel="preload">` lines of `arrays-preload.html` into the page's `<head>`. Loops and sheets also need [styles-store.css](https://noscript.ing) on the page.

## Reference

The full contract, with each requirement's result in each engine, is [SPEC.md](SPEC.md).

### Markup

- A grid is one computation. Its children are the entries, `<i>`, the inputs. Its readers, `<b class="arrays-at"><u></u></b>`, are the outputs: each reads the nearest grid around it.
- A reader sits in the port, `<b class="arrays-out">`, the grid's first child, or inside an entry. In a grid with no child entries (a packed array, a cycle), it is a child of the grid.
- The results land on the `<u>` inside a reader, by inheritance. That `<u>` is the author's: put content there. Entries, readers and the port are machinery, and content put in them can move what they read.
- A grid inside a reader's `<u>` reads its own entries, so one computation feeds the next in the same frame. Values flow down only: results of several entries reach another grid's entries a frame later, through styles-store.css's store.
- Moving numbers belong on the entries. A number that changes above a grid and is inherited through it restyles every reader, used or not.
- Every name the sheet owns starts with `arrays-`. Internal numbers are `--arrays-p-*`; the anchor names are `--arrays-where`, `--arrays-lo` and `--arrays-hi`.
- Every grid resets its padding, border, `writing-mode` and `direction`.

### Outputs

| Name | Set on | Holds |
|---|---|---|
| `--arrays-value` | a reader's `<u>` | the entry, track, sum, maximum or table value read |
| `--arrays-ok` | a reader's `<u>` | 1 for a valid read, 0 for an index or key out of range, which also reads `--arrays-value` 0 |
| `--arrays-value-y` | a reader's `<u>` in an `.arrays-xy` array | the second number of the entry, or row r |
| `--arrays-rank` | the `<u>` of a bins entry | its place among the children of its bin, from 1 |
| `--arrays-count` | the `<u>` of an `.arrays-count` | bins in use, the most intervals at one point, or lines |
| `--arrays-below` | the `<u>` of an `.arrays-below` | the bins in use below its own |
| `--arrays-x`, `--arrays-y` | the inner `<u>` of an `.arrays-where` | where the child is, in the grid's units |
| `--arrays-place` | the inner `<u>` of an `.arrays-where` in a sort | its place, 1 for the smallest key |
| `--arrays-column`, `--arrays-row` | the inner `<u>` of an `.arrays-where` in a pack | where first fit put it |
| `--arrays-width`, `--arrays-height`, `--arrays-fits` | the inner `<u>` of an `.arrays-where` in tiles | its area's size, and 1 when it fits the map |
| `--arrays-lower`, `--arrays-upper`, `--arrays-frequency`, `--arrays-member` | the inner `<u>` of a search probe | keys below, keys up to, keys equal, and whether any is |
| `--arrays-before` | a scan reader's `<u>` | the sum of the entries before |
| `--arrays-high`, `--arrays-low` | the inner `<u>` of an `.arrays-two` text | the two numbers of one read |
| `--arrays-top1` to `--arrays-top6` | the inner `<u>` of an `.arrays-in` query | the six highest bits of its mask, which is its `--arrays-value` |

### Primitives

One section a primitive: what it computes, its markup, whether it reads in the same frame, how exact it is, and its cost. A cost is a frame's time with 300 readers less the same page without them, divided by 300, the numbers moving every frame, in µs, unless it names its own unit and workload.

<!-- primitives -->

#### Entry i of an array of child entries

`.arrays-array` > children with `--arrays-n`; a reader `.arrays-at` with `--arrays-i`, in the port (`<b class="arrays-out">`, the first child) or a child of an entry; what is inside the reader gets `--arrays-value` and `--arrays-ok`.

Same frame: yes, both. Whole numbers exact; fractions to 1/64 px. Cost: Chrome 6.3-6.5 µs a read, WebKit 9.1-9.6.

#### Counting the entries: negative indices and the end's check without writing `--arrays-length`

`.arrays-count` on the array: the grid works the count out from its last child's place (`:nth-child`), up to 360,359 entries, any number of entries: 40 entries, `-1`, `-40`, the total and entry 35, every frame, both engines.

Same frame: yes. Exact. Cost: Chrome 8.2 µs a read, WebKit 29.3.

#### Entry -i (from the end)

`--arrays-i: -1`.

Same frame: yes. Exact. Cost: as above.

#### The sum of entries i to j, either order; -1 as the end; i = j

`--arrays-i: 2; --arrays-j: 4`; `--arrays-i: 1; --arrays-j: -1` is the total.

Same frame: yes. Exact. Cost: as above.

#### Track i of a packed array, any length

`.arrays-array.arrays-packed` with `--arrays-tracks` (the track list, line names included: `[--arrays-x] 90px 70px`) and `--arrays-length` for the end; without it -1 is the last track.

Same frame: yes. Exact. Cost: Chrome 5.5-5.8, WebKit 9.3-10.0.

#### The i-th slot named x: several arrays in one grid

`--arrays-l3: --arrays-x` on the array; `--arrays-of: --arrays-x` on the reader or the array; `--arrays-j` counts slots from there, named or not.

Same frame: yes. Exact. Cost: Chrome 5.8-6.5, WebKit 6.2-10.6.

#### Two numbers an entry: --arrays-value and --arrays-value-y of entry i, or column i and row r

`.arrays-array.arrays-xy` > children with `--arrays-n` and `--arrays-m` (or, packed, `--arrays-tracks` and `--arrays-tracks-y` on the array); the reader gets both; `--arrays-r` picks the row (unset: the row of `--arrays-i`), `--arrays-j` still a range of columns.

Same frame: yes, both numbers moving; readers in the port. Exact. Cost: Chrome 7.9 µs a read (two numbers), WebKit 9.9.

#### Entry i of a cyclic array, round either way

`.arrays-cycle` with `--arrays-tracks`, any number of tracks; readers are children and in flow.

Same frame: yes, forwards past the entries and backwards from -1. Exact. Cost: Chrome 6.1-6.4, WebKit 11.1-12.2 (on these fixed-size tracks).

#### Rank within a bin: 1 for the first child put in a bin, 2 for the next, to 32

`.arrays-bins` > children with `--arrays-bin`; what is inside gets `--arrays-bin` and `--arrays-rank`.

Same frame: yes, with a bin changing every frame. Exact to 32; 33 reads 1. Cost: Chrome 5.6-6.3, WebKit 9.8-10.1.

#### The largest number in a bin

`.arrays-bins.arrays-max` > children with `--arrays-bin` and `--arrays-n`; a reader `.arrays-at` with `--arrays-i` the bin; a range sums the maxes.

Same frame: yes, with an item changing bin and number every frame. Exact. Cost: Chrome 16.1 µs a child plus its reader, WebKit 25.9.

#### How many bins hold something

`.arrays-bins > .arrays-count`; what is inside gets `--arrays-count`.

Same frame: yes, with an item moving every frame. Exact for bins up to the box's width in px. Cost: as above.

#### Water filling: slot k reads min(cap k, level), the level what fills the width

`.arrays-array.arrays-packed` with `--arrays-tracks: minmax(0, cap 1) minmax(0, cap 2) ...`, the width is the water.

Same frame: yes, caps and width moving. To 1/64 px. Cost: Chrome 4.2, WebKit 9.5.

#### A sort: entry i in order of a key; the i-th smallest, the largest (-1), the sum of the smallest few; equal keys in markup order

`.arrays-array.arrays-sort` > children with `--arrays-key` (whole) and `--arrays-n`; readers as for child entries.

Same frame: yes, with a key moving past the others every frame. Exact. Cost: Chrome 5.5, WebKit 9.5.

#### How many bins in use are below a child's bin: its rank among the distinct bins, from 0

`.arrays-bins` (not max): a `<b class="arrays-below">` inside a child; what is inside it gets `--arrays-below`.

Same frame: yes, with an item moving every frame, so the bins in use change. Exact for bins up to the box's width in px. Cost: Chrome 8.2, WebKit 15.2.

#### First-fit packing: each child's column and row where it lands, rows from the top

`.arrays-pack` with `--arrays-columns` > children with `--arrays-w` (columns taken), a `.arrays-where` in each; what is inside its `<u>` gets `--arrays-column` and `--arrays-row`.

Same frame: yes, with two spans changing every frame. Exact. Cost: Chrome 19.6 an item with its where, WebKit 42.2.

#### Where a child is: its offset from the grid's top-left; in an array of child entries, the sum of the entries before it

A `<b class="arrays-where"><u><u></u></u></b>` inside a child of an array, bins, shares, pack, sort, map or slide; what is inside the `<u>` gets `--arrays-x` and `--arrays-y`.

Same frame: yes, with entries, shares and widths moving. Exact (1/64 px with fractions). Cost: Chrome about 10 a read, WebKit about 30.

#### Places in a sort: 1 for the smallest key, equal keys in markup order

`.arrays-sort` > children with `--arrays-key` and a `.arrays-where`; what is inside its `<u>` gets `--arrays-place`.

Same frame: yes, with two keys moving past the others every frame. Exact. Cost: Chrome 17.4 an entry with its where, WebKit 40.9.

#### A tile map: where each named area is and how big, and whether it is in the map

`.arrays-tiles` with `--arrays-columns`, `--arrays-rows` and `--arrays-areas` (the grid-template-areas strings, picked by state if you like) > children at `grid-area: name` with a `.arrays-where`; what is inside its `<u>` gets `--arrays-x`, `--arrays-y`, `--arrays-width`, `--arrays-height` and `--arrays-fits`.

Same frame: yes, with six maps (one invalid) switching every few frames. Exact, in tiles. Cost: Chrome 32.5 a child with its where, WebKit 96.3 (the old sheet in the same harness: 124.1 against 118.1).

#### 2D packing around walls: each child of w x h tiles where first fit puts it, row by row from the top, around the map's named areas and the children before it; whether it fits in the map

`.arrays-tiles.arrays-pack` with a map: children at `grid-area: name` are walls, the others carry `--arrays-w` and `--arrays-h` and a `.arrays-where`; what is inside its `<u>` gets `--arrays-x`, `--arrays-y`, `--arrays-column`, `--arrays-row` and `--arrays-fits`.

Same frame: yes, with three maps switching and two spans moving every frame. Exact. Cost: Chrome 34.1 an item (25 maps of 12, switching), WebKit 107.3 (one map of 100: 5.9 ms a frame).

#### The push: boxes in order, each at the larger of its target and the end of the box before (1D non-penetration in one layout)

`.arrays-push` > children with `--arrays-h` (width) and `--arrays-target`, a `.arrays-where` in each; what is inside its `<u>` gets `--arrays-x`, the box's start.

Same frame: yes, with two targets and two widths moving every frame. Exact. Cost: Chrome 26.8 a box with its where, WebKit 50.2.

#### The push from the end: each box at the smaller of its target and the start of the box after less its width, none past the wall

`.arrays-push.arrays-end` with `--arrays-wall`, the same children. `.arrays-nested` on either nests the children in each other, each `<i>` holding its `.arrays-where` first and then the next child. It is 2x (Chrome) to 2.3x (WebKit) faster at 300 (vs-calc/trials/nested-push.mjs). It takes at most a few hundred children (HTML parsers stop nesting at 512 deep), and targets and ends under 65,536 px in the push.

Same frame: yes, the same. Exact. Cost: Chrome 24.2, WebKit 44.1.

#### Groups ranked by their totals: each group's bar at its total, sorted largest or smallest first (two stages in one frame)

`.arrays-ranked` with `--arrays-bins` (up to 16; up to 32 with the class `arrays-wide`) and `--arrays-desc: 1` for largest first. It holds first G `<b class="arrays-group"><b class="arrays-total"></b></b>`, then `<b class="arrays-bars">` holding G `<b>`, then the items with `--arrays-bin` and `--arrays-n`; `--arrays-key` under `--arrays-span` orders items inside a group. Each bar's top is its rank times `--arrays-band` (2 px), its left and right its group's total. `.arrays-max` ranks each group's largest instead. A `<b>` in an item is its segment of its group's bar (a sorted stacked bar). A `<b class="arrays-labels">` after the bars holds a label a group, right-aligned to the box's start at its bar's top. For many items, `.arrays-copy` with `--arrays-copy-width` reads the ranks back once instead of a lookup a segment (up to 16 groups). After the items it takes `<b class="arrays-ranks"><b><div class="arrays-segments">`, holding G `<b class="arrays-group">` and the items again, each with its `<b>`; the first items then hold no `<b>`.

Same frame: yes, with the totals moving. Exact in Chrome, WebKit and Firefox (pipeline/check.mjs, FORMS=sheet).

#### Grouped sums: each child reads the sum of the earlier children in its group; an item after a group reads its total; with --arrays-n 1, counts

`.arrays-groups` > children with `--arrays-bin` and `--arrays-n` (whole, from 1), a `.arrays-where` in each; what is inside its `<u>` gets `--arrays-y` (the sum before it) and `--arrays-x` (the bin less 1).

Same frame: yes, with two values moving every frame. Exact. Cost: Chrome 20.1 an item (19.3 with values to 1,000), WebKit 39.9 (178 with values to 1,000).

#### The most intervals at one point; each interval's lane (interval colouring, first fit by start)

`.arrays-overlap` > children with `--arrays-i` (start, whole, from 1) and `--arrays-span` (length), a `.arrays-where` in each; a `.arrays-count` in the grid gets `--arrays-count`, what is inside a child's `.arrays-where` `<u>` gets `--arrays-y` (its lane from 0).

Same frame: yes, with two intervals moving every frame. Exact. Cost: Chrome 5.3 an item (5.5 at 1,800), WebKit 13.3 (14.0 at 1,800).

#### Next-fit lines: how many lines a row of widths takes, each child's line and its place on it

`.arrays-lines` with `--arrays-columns` (the row's width) > children with `--arrays-n`, a `.arrays-where` in each; `.arrays-count` gets the lines, a child's `.arrays-where` `--arrays-y` (its line from 0) and `--arrays-x` (before it on the line).

Same frame: yes, with a width moving every frame. Exact. Cost: Chrome 3.5 an item (3.7 at 1,800), WebKit 9.1 (9.4 at 1,800).

#### Column and row maxima of a matrix, from one grid

`.arrays-array.arrays-xy.arrays-cells` > children with `--arrays-i` (column), `--arrays-r` (row), `--arrays-n` (width) and `--arrays-m` (height); a reader with `--arrays-i` and `--arrays-r` gets the column's widest as `--arrays-value` and the row's tallest as `--arrays-value-y`.

Same frame: yes, with entries moving. Exact.

#### Entries at any depth in a bins max

`.arrays-bins.arrays-max` > `.arrays-nest` wrappers (subgrids over every column, no padding) > ... > `<i>` with `--arrays-bin` and `--arrays-n`.

Same frame: yes. Exact.

#### Search in a sort: how many keys are below a key, up to it, equal to it, and whether any is

`.arrays-sort` with a `.arrays-lo` probe before the entries and a `.arrays-hi` probe after, both with the key; inside `.arrays-lo`'s `.arrays-where` `--arrays-lower`, inside `.arrays-hi`'s `--arrays-upper`, inside a `.arrays-between` in `.arrays-hi` `--arrays-frequency` and `--arrays-member`.

Same frame: yes, with the key moving over absent, present and end keys and an entry moving. Exact. Cost: Chrome 11.2 an element, WebKit 17.0.

#### A key range: which entries have a key in [from, to], as a bit mask and the six highest bits; many queries over one row

`.arrays-range` > `<i style="--arrays-key: k; --arrays-bit: b">` (b 1 to 19) and queries `<b class="arrays-in" style="--arrays-from: f; --arrays-to: t; --arrays-not: b"><b><u><u></u></u></b></b>`; an entry and its query may share a `<div>` (display: contents); `.arrays-range.arrays-mask` for the mask alone (no top bits).

Same frame: yes (probes/algos/range.mjs). Exact, keys and bounds moving, any whole keys, 19 bits. Cost: Chrome 3.1 ms for 100 queries over 19 entries, mask only (vs-calc range), WebKit 6.

#### A window: entries counted from a moving start

A `<b class="arrays-window">` with `--arrays-i` and `--arrays-span` in the port of an array; readers inside it (`--arrays-i: 1` its first, `-1` its last, ranges).

Same frame: yes, with the window moving every frame. Exact. Cost: Chrome 8.8, WebKit 20.5 (the old sheet in the same harness: 16.2 against 18.8).

#### A keyed map: the largest number written at any whole key

`.arrays-map` > children with `--arrays-key` and `--arrays-n`; a reader `.arrays-at` with `--arrays-key`.

Same frame: yes, with a key and a value moving every frame. Exact; an unused key, or one outside `--arrays-min-key` .. `--arrays-max-key` (±1000 by default), reads 0; keys to ±20,000 measured. Cost: Chrome 18.0 (300 keys over 20,000, every key in range), WebKit 63.1 (an earlier figure, 32.5, had 271 of 300 keys outside the range).

#### Formulas: sums, maxima, constant factors, min and difference, any depth, over numbers and whole computations

`.arrays-sum`, `.arrays-largest`, `.arrays-scale`, `.arrays-least` (with `.arrays-rest`), `.arrays-stack`, `.arrays-tallest`, leaves with `--arrays-n`, readers `.arrays-at` in any node; see Formulas.

Same frame: yes (check 46). Exact within 6 digits through `var()`. Cost: see Formulas.

#### A second and a third pass in one grid: rows sized from sums of columns, a column from sums of rows

In the port of an array: `<b class="arrays-hop">` with `--arrays-i`, `--arrays-j` (the columns it reads) and `--arrays-r` (its row). Its `<u>` gets `--arrays-value` (the span's sum) and sets `--arrays-put` (any style function of it; unset, the sum itself), and the row is as tall as its largest hop. `<b class="arrays-hop-y">` with `--arrays-i`, `--arrays-j` (rows) and `--arrays-r` (its column after the entries; needs `--arrays-length`) does the same in the other axis. The readers are `.arrays-at-y` (rows `--arrays-i` to `--arrays-j`) and `.arrays-at-x` (hop columns).

Same frame: yes, entries moving (check 60). Exact on whole px; a written `--arrays-put` floors to 1/64 px. Cost: Chrome 7.6 µs a hop at 256 (probes/hop.mjs), WebKit 23.

#### A sum of whole numbers, a max of sums, f(k) by a lookup table, without a grid

`<b class="arrays-text">` with the author's counters (`counter-reset`) and `--arrays-text: counter(a, arrays-tally) counter(b, arrays-tally)` (`'\\a'` between lines); `arrays-table` and `.arrays-sq`, `.arrays-sqrt` or `--arrays-font` for f; the inner `<u>` of `<u><u></u></u>` gets `--arrays-value`; see Text.

Same frame: yes (check 61). Exact. Cost: Chrome 1.13 ms for 256 numbers summed and looked up (probes/font2.mjs), WebKit 2.25.

#### Prefix sums: each entry the sum so far, and the sum before it

`.arrays-scan` > entries `<i style="--arrays-n: 12"></i>`, then readers `<b class="arrays-at" style="--arrays-i: k"><u></u></b>` (k 1 to the length, whole). The `<u>` gets `--arrays-value`, the sum of entries 1 to k, and `--arrays-before`, the sum of entries 1 to k - 1. A reader whose k never changes can be placed by `style="grid-area: 1 / 1 / span k / span k"` instead.

Same frame: yes (checks 61, 66). Exact, whole numbers. Cost: Chrome 2.5 ms for 300 entries, every sum read (150 readers, placed by grid-area; vs-calc prefix), WebKit 5.0.

#### Signed extremes: max(positives) + min(negatives) of any number of signed numbers; laid-out widths times factors in the same collapse, and through scopes two laid-out widths in one (a difference p1 W1 - p2 W2); as a child of a `.arrays-stack` or `.arrays-tallest` it counts there as its value, with no reader

`.arrays-collapse` > formula children (floated: they give the width W and stay out of the margins). They are `<i style="--arrays-n: x">` (signed px) or `--arrays-p: p` (p% of the width it sits in), `<b class="arrays-scope">` (a box with its own margin and its own laid-out width, nesting), and a `<b class="arrays-at"><u></u></b>`. Numbers run from -10,000 up.

Same frame: yes (checks 63, 64). Exact. Cost: Chrome 1.43 ms a chain of 256 (probes/algos/margins.mjs), WebKit 2.50.

#### max(0, A - B) of two laid-out widths as a width, with no reader; so min(a, b) and |a - b| on the width side too

`<div class="arrays-minus">A<b>B</b></div>` (A and B width nodes; B under 2^20 px); `min` = minus(a + b, max(a, b)), `abs` = minus(a, b) + minus(b, a).

Same frame: yes (probes/algos/minus.mjs). Exact, inputs moving, in a sum, a collapse, a least, a scale, two deep.

#### A height as a width, live: what a .arrays-least, a collapse or a stack is, laid on as a width

`<div class="arrays-sum"><b class="arrays-turn"><b><b>H</b></b></b></div>`, with `--arrays-tick` (and `--arrays-tick-2`) on a box around it changing whenever an input under it does.

Same frame: yes (probes/novel/live-turn/tick-traps.mjs). Exact, inputs moving, nested, under .arrays-largest, .arrays-least, a collapse; idles at rest. Cost: Chrome 14.6 a turn, WebKit 40.7.

#### A factor in flow: f x a laid-out size, counted by whatever contains it

`.arrays-zoom` with `--arrays-zoom: f` on a node or a leaf; nests.

Same frame: yes (check 63). To 1/64 px a zoomed length (exact for quarters, eighths ...); f > 0. Cost: Chrome a dot product of 256: 2.57 (probes/algos/zoom.mjs), WebKit 3.62.

#### Baselines: a row of max(a) + max(d), and each item handed max(a) - a_j

`.arrays-baseline` > `<i style="--arrays-n: a; --arrays-m: d">` (a `.arrays-where` inside an item reads `--arrays-y`), a reader for the row.

Same frame: yes (check 63). Exact. Cost: Chrome 1.56 a row of 256 (probes/algos/baseline.mjs), WebKit 5.00.

#### The best contiguous split into K parts: the least possible largest part

`.arrays-columns` with `--arrays-parts: K` > `<i style="--arrays-n: h">`; for WebKit two copies in a `.arrays-alternate` with `--arrays-parity` flipped at each change, its reader reading the copy shown.

Same frame: yes (check 63). Exact. Cost: Chrome 1.10 for 256 in 8 parts (probes/algos/multicol.mjs), WebKit 4.0.

#### Flex shares: weights, shrink, floors and caps in one layout

`.arrays-flex` (a width) > `<i style="--arrays-n: start; --arrays-grow: g; --arrays-shrink: s; --arrays-min: lo; --arrays-max: hi">`; what is inside an `<i>` reads its width.

Same frame: yes (check 63). To 1/64 px. Cost: Chrome 1.91 for 256 (probes/algos/flex-freeze.mjs), WebKit 4.38.

#### Sliding-window maxima: the largest of the --arrays-span entries ending at entry j

`.arrays-slide` with `--arrays-span` > children with `--arrays-n`, then readers `.arrays-at` with `--arrays-i`.

Same frame: yes, with two entries moving every frame. Exact. Cost: Chrome 5.2, WebKit 6.4.

#### Fair shares with floors: each child gets max(floor, weight x level), the level what fills the width

`.arrays-shares` with a width > children with `--arrays-n` (the floor) and `--arrays-w` (a whole weight, 1 by default); what is inside a child gets `--arrays-value`.

Same frame: yes, a floor and the width moving. To 1/32 px. Cost: Chrome 10.5 an entry, WebKit 13.4.

<!-- /primitives -->

### Packed maps

`.arrays-map.arrays-packed` keeps many values in one CSS track list, with no element an entry. Write the list in `grid-template-columns` on the map, the fastest way, or in `--arrays-tracks`:

```html
<div class="arrays-map arrays-packed" style="--arrays-min-key: -2; --arrays-max-key: 2;
  grid-template-columns: minmax(12px, max-content)
            minmax(0px, max-content)
            minmax(calc(var(--amount) * 1px), max-content)
            repeat(2, minmax(0px, max-content));">
  <b class="arrays-out">
    <b class="arrays-at" style="--arrays-key: 0"><u><!-- --arrays-value and --arrays-ok --></u></b>
  </b>
  <i style="--arrays-key: var(--moving-key); --arrays-n: var(--moving-value)">
    <b class="arrays-at"><u><!-- reads the entry's current key --></u></b>
  </i>
</div>
```

- Track 1 is `--arrays-min-key`; each track after it is the next whole key. The bounds are inclusive and can change; changing the minimum relabels every track.
- Each track is `minmax(<length>, max-content)`, 1px for 1: `calc(number * 1px)` for numbers, `repeat(n, minmax(0px, max-content))` for gaps, `max(...)` inside the length for duplicate keys. Trailing tracks left out are 0; `--arrays-tracks: none` is an empty map. No `fr`, percentages, `auto`, `subgrid` or auto-repeat.
- Child entries work beside the list: a key reads the largest of its track and every child at that key. Children outside the bounds are ignored. A key outside the bounds reads 0 with `--arrays-ok` 0; an empty key inside them reads 0 with `--arrays-ok` 1.
- A packed map is at least `max-content` wide, so duplicates stay exact under a narrow `width`: clip it with a wrapper.
- A track has no element: an entry that needs a subtree or a moving key stays an `<i>`.

### Formulas

A formula is nested boxes: layout works each box's size out from its children's, and a reader turns a box's size back into a number, in the same frame. The stylesheet doesn't change with the formula; `formula.mjs` (Build) writes the markup for formulas too long to write by hand.

| Node | Markup | Its value |
|---|---|---|
| a leaf | `<i style="--arrays-n: 12"></i>` | 12: that many px wide (in a `.arrays-stack` or a `.arrays-tallest`, that many px tall) |
| a computation as a leaf | an `.arrays-array`, `.arrays-map`, `.arrays-bins.arrays-max`, `.arrays-sort` or `.arrays-slide` among a node's children | its width: an array's total, a map's largest `--arrays-n` at each key summed, the largest in each bin summed, a sort's count of entries, each column's window maximum summed |
| `.arrays-sum` | children side by side | the sum of their widths |
| `.arrays-largest` | children in one column | the largest width |
| `.arrays-scale` | one child; `--arrays-k` an `fr` value of at most `1fr`, `--arrays-more` an `fr` value | (k + more) x the child: `--arrays-k: 0.5fr` halves, `--arrays-more: 1fr` doubles |
| `.arrays-cap` | a slot `<b>` holding E; `--arrays-c` a number (px) | min(E, c), on the width side |
| `.arrays-least` | E1, then a slot `<b>` holding E2 and, if wanted, a `.arrays-rest` | as tall as min(E1, E2); a reader in its `.arrays-rest` reads max(0, E1 - E2) |
| `.arrays-times` | E (a width-side node or a leaf); `--arrays-f` a number more than 0 | f x E, as a height: into a `.arrays-stack` or `.arrays-tallest` |
| `.arrays-stack` | `.arrays-least` nodes, other heights, height leaves | the sum of their heights |
| `.arrays-tallest` | the same | the largest height |
| a reader | `<b class="arrays-at"><u></u></b>` as a child of any node | what is inside gets `--arrays-value`, the node's value, and `--arrays-ok` |
| a stage | a reader whose child has `style="--arrays-k1: var(--arrays-value)"` (`--arrays-k1` to `--arrays-k16`) | keeps the reader's value as `--arrays-k1` for everything inside it |
| `.arrays-calc` | `<b class="arrays-calc" style="width: calc(... anchor-size(--a width) ...)"><u><u></u></u></b>`, after the results it names | its width (any `calc()` of named results: x, /, min, max); the inner `<u>` gets `--arrays-value`; name it for the next |
| `.arrays-collapse` | formula children, `<i style="--arrays-n: x">` (signed px) or `--arrays-p: p` (p% of the width it sits in), `<b class="arrays-scope">` boxes, and a reader | max(positives) + min(negatives) of its margins, a height |
| `.arrays-minus` | `<div class="arrays-minus">A<b>B</b></div>` | max(0, A - B), a width |
| `.arrays-turn` | `<b class="arrays-turn"><b><b>H</b></b></b>` in a width node, `--arrays-tick` on a box around it changed whenever an input under it changes | the height H, as a width |

- Widths go up through `.arrays-sum`, `.arrays-largest` and `.arrays-scale`; `.arrays-least` turns one min into a height, and heights go up through `.arrays-stack` and `.arrays-tallest`. A height becomes a width again by `.arrays-turn` or a `.arrays-hop-y`, or in a stage.
- A formula can be an entry of an `.arrays-array`, a `.arrays-map` or a `.arrays-bins.arrays-max`, where it counts as its result. A reader can sit anywhere among a node's children, and a formula can sit inside any reader, using what it read as a leaf (`--arrays-n: var(--arrays-value)`).
- Every number is 0 or more. On the width side a negative `--arrays-n` makes every reader above it read `--arrays-ok: 0` and `--arrays-value: 0`. For signed numbers add an offset B to every leaf: a sum of k leaves reads its total less k x B.
- Exact while every number crossing `var()` fits 6 significant digits (Chrome keeps no more in a registered number): whole numbers and eighths under 10,000; values crossing a stage, under 1,000 in eighths.
- `.arrays-scale`'s factors are written `fr`s: no CSS turns a computed number into one.

### Text

A number can be a CSS counter printed in a font whose glyphs draw nothing and are as wide as a table says. The text is then as wide as the numbers it prints, and a `<u>` over it reads that back. The counters are the page's own, written with `counter-reset` and `counter-increment`; `--arrays-text` says what to print.

```html
<b class="arrays-text" style="counter-reset: a 12 b 40; --arrays-text: counter(a, arrays-tally) counter(b, arrays-tally)"><u><u></u></u></b>
```

| What | Markup | `--arrays-value` of the inner `<u>` |
|---|---|---|
| a sum | counters on one line | the sum: 52 above |
| a max | `'\a'` between counters: each line stands alone | the widest line: a max of sums |
| f(k) by a table | `counter(a, arrays-table)` (k from 0 to 999 as the glyph U+E000 + k) in `.arrays-text.arrays-sq` (round(k^2 / 1000)), `.arrays-sqrt` (round(sqrt(1000 k))) or `style="--arrays-font: arrays-name"` | the sum of f over the line; past 999 `arrays-table` prints the tally, so f = k there |
| a table's totals | `<tr style="counter-increment: a 12 b 7">` in a `<table style="counter-reset: a b">`, and texts printing `counter(a, arrays-tally)` | in a row, the total so far; after the rows (a `<tfoot>`), the total |
| a text in a grid | `<i class="arrays-text" style="...">` as an entry of an `.arrays-array`, `.arrays-bins.arrays-max` or `.arrays-map`, or a leaf of a formula | (no reader of its own) its track or leaf is its text wide |
| two numbers by a table: min, max, a x b, \|a - b\|, a > b | a pair counter `counter-reset: p calc(64 * a + b + 65)` (a, b 0 to 31) printed by `counter(p, arrays-min)`, `arrays-max`, `arrays-product`, `arrays-difference` or `arrays-greater` | g(a, b); pairs on one line add up, any mix of tables |
| a x b | `counter(a, arrays-unary)` (a 1-px glyphs) with `--arrays-each: b` (each glyph spaced b - 1 more) | a x b (b may be a fraction; the product fits six digits) |
| floor(a / b) | `.arrays-text.arrays-divide`, `counter(a, arrays-tally4) '\9'` with `--arrays-tab: b` | floor(a / b) |
| \|a - b\|, its sign, max(0, a - b) | a counter d = a - b (`counter-reset: d a; counter-increment: d calc(-1 * b)`) printed by `arrays-abs`, `arrays-sign` or `arrays-relu` | \|d\|, \|d\| + [d < 0], max(0, d) |
| two numbers from one read | `.arrays-text.arrays-two`, `counter(a, arrays-kilo) counter(b, arrays-tally)` (b 0 to 999) | `--arrays-high` a and `--arrays-low` b |
| a grid result looked up | `<u style="counter-reset: g round(var(--arrays-value))">` inside a grid's reader, a `.arrays-text` inside it printing `counter(g, arrays-table)` | f of the grid's result |

- `arrays-tally` prints any whole number as letters of 0, 1, 10, 100, 1,000, 10,000 and 30,000 px, so a number to 999,999 is at most 38 glyphs.
- Whole numbers 0 or more (counters are integers: `round()` a computed one). The result fits six digits through `var()` and 33,554,428 px of layout; a table's domain is 0 to 999.
- A text keeps its own type: an author's `letter-spacing` or `text-transform` doesn't reach it.
- `--arrays-text` can't be registered with `inherits: false`, and a `"` inside `style="..."` ends the attribute, so write `'\a'`.
- `.arrays-rom` reads f(k) at style time from a variable font, with no text: `<i class="arrays-rom arrays-sqrt" style="--arrays-k: 300"><u></u></i>` gives the `<u>` `--arrays-value: 548`. `.arrays-rom2` reads the five pair tables the same way.

### Loops and sheets

These run on styles-store.css's stored cells (`[data-store]`), read by `[data-store-read]` and `[data-store-read-3]` readers that name the cells by `--store-of`.

A loop is a while loop written by hand. Its cells are the items of one flow, which is also the loop's one shared reader, and one more cell under the flow keeps the clock and the total:

```html
<div class="loop power">
  <div class="loop-flow" data-store-read>
    <div data-store-read-3 class="loop-in" style="--store-of: --x2; --store-of-2: --x4">
      <output id="--x3" for="--x2 --x4" aria-live="off" data-store class="loop-cell" style="--store-name: --x3; --store-start: 6000; --d: 3"></output>
    </div>
    ...one a cell...
    <b class="loop-measure"><i data-store class="loop-core"></i></b>
  </div>
</div>
```
```css
.power .loop-cell { --next: round(80000 * (var(--in-a) + var(--d) * var(--store-value) + var(--in-b)) / max(1, var(--loop-total)));
                    --measure: calc(var(--in-a) + var(--d) * var(--store-value) + var(--in-b)); }
```

- `--next` is a cell's next value, `--measure` what it adds to the total. Inside `.loop-flow`: `--loop-total`, `--loop-t` and `--loop-ok`; inside `.loop-in`, `.loop-in-2` and `.loop-in-3`: `--in-a` to `--in-i`, the values of the names it reads.
- `.loop` sets `--loop-period` (10), `--loop-compute` (3), `--loop-settle` (5) and `--loop-tolerance` (0). The loop stops for good when the largest change is at most `--loop-tolerance` at an iteration's end.
- A loop can be a table: `<table class="loop">`, the row `<tr class="loop-flow" data-store-read>`, a `<td>` a cell and one for the core cell. One loop a page: the name `--loop` is fixed.

A sheet is a `<table class="sheet">` whose cells are stored numbers and whose formulas are rules on a class, one a column:

```html
<td data-store-read-3 style="--store-of: --e2; --store-of-2: --rate">
  <b data-store class="interest" style="--store-name: --c3"><output class="money"></output></b></td>
```
```css
.interest { --store-next: round(var(--in-a) * var(--in-b) / 120000); }
```

- Inside a reader the names it reads are `--in-a`, `--in-b` and `--in-c`; a reader inside it gets `--in-d` to `--in-f`, one more `--in-g` to `--in-i`.
- A fold reads a column into one number: readers with class `sum`, `mean`, `max` or `min`, three names each, nested up to four deep, the `<output>` innermost; it reads `--fold` and `--fold-count`.
- An `<output>` shows its number in the format its class names: `money` (cents as 12.34), `int`, `pct`, `tenths`, `bp` (basis points as 7.50%) or `grade` (tenths of a point as a letter).

### Recipes

- **First-fit decreasing.** Order a pack's children widest first: `.arrays-pack > * { order: calc(-1 * var(--arrays-w)); }`. Equal widths keep the markup's order.
- **A window's median, or any order statistic of a window.** In an `.arrays-array.arrays-sort`, push the keys outside the window past every key inside it, keep the number as `--arrays-n`, and read the middle of the window:

  ```css
  .win > i { --idx: calc(sibling-index() - 1); --inside: calc(clamp(0, var(--idx) - var(--start) + 1, 1) * clamp(0, var(--start) + 3 - var(--idx), 1));
    --arrays-key: calc(var(--v) + (1 - var(--inside)) * 1000); --arrays-n: var(--v); }
  ```

  A reader with `--arrays-i: 2` then reads the median of the 3 from `--start`. 1000 has to be above every key. One window a grid.
- **Sort results of separate computations, in the same frame.** Values only flow down a grid, so totals worked out in different grids can't be another grid's keys; anchors carry them across. Make each result a box as wide as it is (an `.arrays-array` is as wide as its total) and name it; each mark's `top` counts the results that beat its own:

  ```html
  <div class="board" style="position: relative">
    <div class="arrays-array" style="anchor-name: --t1; width: max-content">...</div>   <!-- one a result -->
    <div class="arrays-array" style="anchor-name: --t2; width: max-content">...</div>
    <b class="bar" style="position: absolute; left: anchor(--t1 left); right: anchor(--t1 right);
      top: calc(clamp(0, (anchor-size(--t2 width) - anchor-size(--t1 width)) / 1px * 2 + 0, 1) * 20px)"></b>
    <b class="bar" style="position: absolute; left: anchor(--t2 left); right: anchor(--t2 right);
      top: calc(clamp(0, (anchor-size(--t1 width) - anchor-size(--t2 width)) / 1px * 2 + 1, 1) * 20px)"></b>
  </div>
  ```

  The `+ 1` breaks a tie in favour of the earlier result. Each mark sums one term per other result, so the markup grows as the square of their number: 32 bars, 1.6 ms an update in Chrome and 2 in WebKit. The bars and the results they name share a containing block (the board); in Firefox, compare in `top` and span with `anchor()` edges ([QUIRKS.md](QUIRKS.md) Q3).
- **argmax and argmin.** Pack the number and its place into one, `--arrays-n: calc(var(--v) * S + (S - i))` with S above the count, and read any max (a bin of `.arrays-bins.arrays-max`, `.arrays-slide`, `.arrays-map`): `round(down, value / S)` is the number and `S - mod(round(value), S)` its place, ties to the first. For the smallest, write a bound minus the number. Keep the packed number under 1,000,000.

### Limits

- Entries are 0 or more: a track can't be negative. Add an offset for signed numbers. An array's sum stays under layout's range, about 33 million px.
- Compute from `--arrays-value`, never from `100cqw` directly: Chrome's `cqw` is a hair under a whole number.
- Ranks go to 32 and `.arrays-bins.arrays-max` has 32 bins. A range that mixes a positive end with a negative one needs the end known: `.arrays-count`, or `--arrays-length`. A cyclic array's ranges go forwards only.
- An `.arrays-xy` array has as many rows as entries; a reader reads one row, `--arrays-r` takes no range.
- A reader is `position: fixed` against its array's `contain: layout`: no transform, filter, perspective or other containment between them.
- In Firefox, put `.arrays-calc` boxes and the results they name in a container as wide as its content (`width: max-content`): Firefox 158 keeps an `anchor-size()` until the box is laid out again ([QUIRKS.md](QUIRKS.md) Q3).
- Bins in use are counted up to the box's width in px. The smallest number in a bin is a max of a bound minus the number.
- Each distinct `.arrays-rom2` read is a font variation of its own, and WebKit's load time grows faster than their number on a page. All 5,120 pair-table entries on one page took 53.6 s to load in WebKit 26.4, against 0.5 s in Chrome 155. As five pages of 1,324 reads, all five loaded in under 7 s (`probes/rom2-api-check.mjs`, 2026-10-22). Spread many reads over pages, or use the pair counters of `.arrays-text`.

## Browsers

Chrome 155 and Safari's WebKit 26.4, measured headless with Playwright: Chrome and WebKit pass all 53 requirements in [SPEC.md](SPEC.md). Firefox 158 passes 48. It has no view timelines, which the loops and sheets need. It lays out in 1/60 px, so formulas over fractions of a px are up to 0.03 off. `.arrays-calc` needs a container as wide as its content there, and a collapse read back through a hop's column reads wrong. [QUIRKS.md](QUIRKS.md) has the engine bugs the sheet works around.

## Performance

Each primitive above gives its cost. For formulas, an update forced:

| Cost | Chrome | WebKit |
|---|---|---|
| a chain of 250 nested `.arrays-sum` / `.arrays-largest` nodes | 0.37 ms | 1.1 ms |
| a stage, over 1 / 8 / 16 small arrays | 0.04 / 0.51 / 1.88 ms | 0.10 / 1.40 / 9.20 ms |
| 32 formulas needing one moving 100-entry array's total: one reader shared, or a copy in each | 0.90 / 14.8 ms | 2.0 / 28.0 ms |
| a page without formulas, 1,000 array readers | unchanged | unchanged |

- Share a result through a reader rather than copy a computation into each formula, and keep stages few.
- Put moving numbers on the entries: 1,000 entries each animating its own `--arrays-n` take 13.6 ms a frame in Chrome and 16 in WebKit, against 32.0 and 54 with one moving number inherited from the grid (`probes/waste.mjs`).
- On an `.arrays-plain` array (whole indices from 1 to the length, nothing negative or fractional) readers skip the index math. A window max of 298 readers drops from 8.1 to 4.9 ms in Chrome and 14 to 8 in WebKit.

## Demos

- `demo.html`: every primitive, live.
- `sheets/`: a loan, a gradebook, an invoice and a plate, as spreadsheets on styles-store.css.
- `ports/`: Observable Plot's test plots drawn on styles-array.css, each over Plot's own snapshot.
- `coverage/coverage.html`: the Array API standard's functions in CSS, checked against NumPy.
- `chain-rows.html`: a for loop laid out as table rows, the board inlined.

## Build

- `node libraries/arrays/build.mjs` writes `styles-array.css`, `arrays-preload.html` and this file's primitives (from `primitives.mjs`). It refuses a property registered twice with different types.
- `node libraries/arrays/check.mjs` checks every primitive frame by frame against a model over 60 frames, the numbers moving, in Chrome and WebKit (`ENGINES=Firefox` runs Firefox). `CHECKS=61,62` runs only those checks; `MUTATE=1` lists the reads whose model barely moves.
- `node libraries/arrays/quirks/run.mjs` runs QUIRKS.md's reftests in the three engines. `node libraries/arrays/sheets/check.mjs loan`, `node libraries/arrays/pipeline/check.mjs` and `node libraries/arrays/probes/compile-check.mjs` check the sheets, the compiled programs and `formula.mjs`.
- `node libraries/arrays/probes/engines.mjs &` keeps one headless Chrome and one WebKit running for the checks to connect to; `node libraries/arrays/probes/engines.mjs stop` ends them.
- `node libraries/arrays/probes/shrink.mjs <seed> <formula> [engine]` finds the smallest case behind a compile-check miss; `node libraries/arrays/probes/shoot.mjs 26,27` screenshots demo.html's cards into `out/shots/`.
- `node libraries/arrays/lut.mjs --dump` decodes the embedded fonts; `node libraries/arrays/lut.mjs <name> '<f of k>'` prints the `@font-face` of another table.
- `formula.mjs`: `compile(f)` takes `{c: 12}`, `{css: 'var(--x)', v}`, `{array: [leaves]}`, `{op: 'add' | 'max' | 'min' | 'sub' | 'absdiff', of: [a, b]}`, `{op: 'scale', k, of: [a]}` and `{op: 'apply', css: 'min($v, 40)', js: (v) => Math.min(v, 40), of: [a]}`, and returns `{html, stages, hops, result}`, the result in `#out`.

## License

MIT, see the repository's LICENSE. The pages in `ports/` draw Observable Plot's test plots: `LICENSE-THIRD-PARTY` has Plot's ISC notice.

## Credits

The ports draw [Observable Plot](https://github.com/observablehq/plot)'s test plots and compare against its snapshots. The coverage follows the [Array API Standard](https://data-apis.org/array-api/) 2025.12 and checks against [NumPy](https://numpy.org).
