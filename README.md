# dcss-array.css

dcss-array.css does d3's data work in HTML, with no script on the page. A sum is a `<figure>` around a list: the browser lays the list out, and the size of that layout is the answer. Change a number and the answer changes in the same frame. It works in Chrome and Safari.

Part of DCSS, Data-Driven CSS: stylesheets that do the data work d3 does in JavaScript. dcss-array does d3-array's job: sums, sorts, bins and search. With [dcss-store](https://github.com/noscripting/dcss-store), [dcss-loop](https://github.com/noscripting/dcss-loop) and [dcss-unround](https://github.com/noscripting/dcss-unround).

It is for pages where script can't run or isn't wanted: Markdown and CMS output, docs, feeds, a Content-Security-Policy that forbids script. It covers sums and statistics, ticks and axes, number and date formatting, scales, easing, treemaps, colors, dates and map projections, each call written with d3's own names. Underneath them are grid primitives you can use directly: reads by index, sums over ranges, bins, sorts and search.

Visit [noscript.ing](https://noscript.ing) for demos.

## Installation

Each call is a file of its own in `parts/`, named after its class. Download the ones the page uses and link them; nothing else is needed. This page sums three numbers and prints the total and the average, with two parts that come to 8 KB gzipped:

```html
<!doctype html>
<link rel="stylesheet" href="parts/dcss-sum.css">
<link rel="stylesheet" href="parts/dcss-format-fixed.css">

<figure class="dcss-sum" style="height: 1lh; overflow: clip">
  <ul><li style="--value: 120"></li> <li style="--value: 95"></li> <li style="--value: 140"></li></ul>
  <div>
    <output class="dcss-format-fixed" style="--value: var(--dcss-sum); --precision: 0"></output>   <!-- 355 -->
    <output class="dcss-format-fixed" style="--value: var(--dcss-mean); --precision: 1"></output>  <!-- 118.3 -->
  </div>
</figure>
```

The class names d3's function. The list is the data, one `--value` per item. Everything in the `<div>` after the list can read the results: `--dcss-sum`, `--dcss-mean` and `--dcss-count`. `.dcss-format-fixed` prints a number the way d3.format does. Change a `--value` with a rule, a `:has()` or an animation, and the outputs follow.

The list is drawn as it computes, one pixel per unit, so the figure is one line tall and clips the rest. [TUTORIAL.md](TUTORIAL.md) builds a small sales summary step by step.

### Whole families

A page that uses many calls can link the core, `dcss-array.css`, and the families that hold them instead. The same page with families:

```html
<link rel="stylesheet" href="dcss-array.css">
<link rel="stylesheet" href="families/array.css">
<link rel="stylesheet" href="families/format.css">
```

| File in `families/` | Calls | Size, gzipped |
|---|---|---:|
| `array.css` | sum, count, mean, min, max, extent, length; ascending, descending; the index extrema; bisect, bisector; share; median, quantile, the discrete scales, cumsum; the precision helpers; variance, deviation, range | 26 KB |
| `ticks.css` | ticks, nice, the four axes, the identity scale's ticks | 13 KB |
| `format.css` | format types f, %, s and general; a log scale's ticks and labels; an Arabic locale | 18 KB |
| `scale.css` | linear, pow, sqrt, log, band and identity scales | 6 KB |
| `ease.css` | every d3-ease function | 2 KB |
| `hierarchy.css` | slice, dice and slice-dice treemaps, partition, a pack of five circles | 158 KB |
| `aggregate.css` | sum, count, mean, cumsum, fsum and fcumsum over typed values | 223 KB |
| `order.css` | median, quantile, quantileSorted, their indexes and mode over typed values | 82 KB |
| `extrema.css` | min, max, extent, least, greatest, their indexes, scan, ascending and descending over typed values | 40 KB |
| `color.css` | rgb, hsl, lab, hcl, lch, gray and cubehelix, and conversions between them | 142 KB |
| `color-text.css` | color text: names, hex, `rgb()` and `hsl()` strings | 155 KB |
| `date-parse.css` | utcParse in 41 formats, and calendar fields | 42 KB |
| `date-parse-local.css` | timeParse in Pacific time, the same formats | 54 KB |
| `time.css` | UTC and Pacific time intervals: day, week, month, year, hour, minute, second | 90 KB |
| `date-format.css` | timeFormat and utcFormat in 41 formats | 7 KB |
| `geo.css` | identity, equirectangular, mercator, transverse mercator and stereographic projections, rotation, distance | 76 KB |
| `random.css` | randomLcg | 5 KB |

`dcss-array-all.css` imports every family, for a page that needs all of them. `families.json` lists each file with its classes and sizes. Parts and families mix on one page, in any order. Link the core too for the grid primitives and text reads.

Parts save most for the small calls: the median part of `array.css` is 4 KB, the whole family 26 KB. The typed families save least, since most of each part is a circuit the family shares. For two or more calls from `aggregate.css`, `order.css`, `extrema.css` or `color-text.css` on one page, link the family: three parts of `order.css` come to 3.8 MB, the whole family to 1.8 MB.

## Writing a call

Every call in the families works the same way. The class goes on a `<figure>`, never on the list, and is `dcss-` followed by d3's name in kebab case: d3.bisectLeft is `.dcss-bisect-left`. Its arguments are custom properties on the figure, named as d3 names them (`--start`, `--stop`, `--count`).

### The data

The data is the `<ul>` or `<ol>` inside the figure, one `<li>` per datum, each with its number as `--value`. Where d3 groups data, `--key` gives the group, a whole number from 1. A hierarchy is nested lists. Give each datum its own `--value`: an item without one is an error, and never takes its parent's value.

```html
<figure class="dcss-sum">
  <ul aria-hidden="true"><li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 30"></li></ul>
  <output></output>                  <!-- prints 82 -->
  <figcaption>Fruit sold: apples 12, pears 40, plums 30</figcaption>
</figure>
```

A screen reader never hears a `--value`, so where the numbers matter, say them in text too, in a caption or a table as above. Mark the list `aria-hidden="true"`; otherwise it is announced as a row of empty items. An `<output>` is a status region and a screen reader may announce each change; `aria-live="off"` on it stops that.

To give two calls the same numbers, set them once on an ancestor (`--jan: 120`) and write `--value: var(--jan)` in each list. The values are inline style, so a Content-Security-Policy has to allow `style-src 'unsafe-inline'`, or the values go in a linked stylesheet (`.sales li:nth-child(1) { --value: 120 }`). Text reads use fonts embedded as `data:` URLs, which need `font-src data:`.

### Reading the answer

Where d3's answer is a layout, as in a treemap or an axis, the `<li>`s are placed at it, in source order. Draw on them.

Where the answer is a number, the element right after the list holds it. Its children and their pseudo-elements get the number as `--dcss-sum` (or the call's own name), and pass it down to everything inside them. An empty `<output>` there prints it. To use the number in another call, put a `<div>` after the list and the next call inside it.

The list is drawn at its answer: a sum is a staircase as wide as the sum and as tall as the count. Leave its items empty, since text in them spills over the result. To hide the drawing, give the figure a height and `overflow: clip`, as in Installation. Don't shrink or hide the list itself: its size is the answer, and an extent whose list is `height: 0` reads the wrong minimum.

A figure is as wide as its container. Where it would shrink to its content, in a flex row or an inline-block, it is 12em wide. The element after the list keeps its text on one line, and starts as wide as the drawing: align text in it to the start, since `text-align: right` moves a printed number to the drawing's far end. The sheet sets the display and size of the figure, its list, its items, the element after the list and the empty `<output>`'s `::after`; style the rest as you like.

Beside each result, `--dcss-ready` is 0 until the number is read, and `--dcss-err` is 0, or says why there is no answer.

#### When a call can't answer

A call that can't answer sets `--dcss-err` to 1 (an input it can't take) or 2 (d3 has no answer, as for the mean of nothing), and an `<output>` or formatter in error prints nothing. A number read straight from a result in error isn't d3's answer: a `counter()` of an index in error shows 0. To show a message instead, wrap the reading in one element inside the result and query its `--dcss-err`:

```html
<style>
  .ok output::after { counter-reset: i var(--dcss-max-index); content: counter(i); }
  .bad { display: none; }
  @container style(--dcss-err: 1) { .ok { display: none; } .bad { display: inline; } }
</style>
<figure class="dcss-max-index" style="height: 1lh; overflow: clip">
  <ul><li style="--value: 3"></li><li style="--value: 9"></li><li style="--value: 4"></li></ul>
  <div><span><span class="ok">Highest: item <output></output></span><span class="bad">no answer</span></span></div>
</figure>
```

The page shows "Highest: item 1". Set an item past the call's range, `--value: 9000`, and it shows "no answer".

To test a page from script, read the number a call gives (`getComputedStyle(el).getPropertyValue('--dcss-sum')`) and its `--dcss-err`, or compare a screenshot. The printed text is generated content, and script reads it back as `counter()` expressions, not digits.

### Using two calls together

Nest one call inside the other's result. Here a sum feeds a scale, and two outputs print the scaled number, the second one doubled:

```html
<figure id="total" class="dcss-sum">
  <ul>
    <li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 30"></li>
  </ul>
  <div>
    <div class="dcss-scale-linear"
         style="--value: var(--dcss-sum);
                --domain-0: 0; --domain-1: 2000;
                --range-0: 0; --range-1: 1000">
      <output id="si" class="dcss-format-si"
              style="--value: var(--dcss-scale-linear); --precision: 3"></output> <!-- 41.0 -->
      <output class="dcss-format-fixed"
              style="--value: calc(var(--dcss-scale-linear) * 2); --precision: 2"></output> <!-- 82.00 -->
    </div>
  </div>
</figure>
```

Results only travel inward, to what is inside them, in the same frame. A call nested in another's result needs its own height and `overflow: clip` to hide its drawing.

- A call's `--value` is its own: the calls inside it don't inherit it, and one with none has no answer. Settings such as `--domain-0`, `--precision` and `--start` do inherit, so a shared one can go on an ancestor.
- Where both calls publish the same name, copy the outer one to a name of your own on an element between them: `--first: var(--dcss-date-parse)`.
- In a form, keep calls outside an `<output>`. A form's reset [replaces an output's children with text](https://html.spec.whatwg.org/multipage/form-elements.html#the-output-element). Radios and checkboxes can pick values written in CSS; what someone types in an input doesn't reach CSS.

Numbers are kept as pixels: whole numbers up to 2^24, fractions to 1/64, totals under 33 million, 0 or more. Give money in whole cents and divide for printing with `.dcss-scale-linear` (see [Format](#format-familiesformatcss)), since 19.99 isn't a multiple of 1/64.

### Typed values

The calls above read numbers from a list, which suits a page written by hand. The typed calls, in `order.css`, `aggregate.css` and `extrema.css`, take each value as properties on the call element itself, with its type, so d3's nulls, NaNs and empty slots arrive as d3 sees them:

- `--length`: how many values.
- `--type-N` for slot N, from 0: 0 a number, 1 null, 2 undefined, 3 NaN.
- `--value-N`: the number, for type 0.

```html
<div class="dcss-fsum" style="--length: 3; --type-0: 0; --value-0: 0.1;
     --type-1: 1; --type-2: 0; --value-2: 0.2">
  <output class="dcss-format-fixed" style="--value: var(--dcss-fsum); --precision: 2"></output>   <!-- 0.30 -->
</div>
```

Set these on the call element only: on an ancestor they give `--dcss-err: 1`. Write them where the page is made, from the data:

```js
// in a template or a build step: an array to a typed call's style attribute
const typed = (values) => `--length: ${values.length}; ` + values.map((v, i) =>
  v === null ? `--type-${i}: 1` : v === undefined ? `--type-${i}: 2` : Number.isNaN(v) ? `--type-${i}: 3`
  : `--type-${i}: 0; --value-${i}: ${v}`).join('; ');

// text to character codes, for the color and date parsers
const text = (s) => `--length: ${s.length}; ` + [...s].map((c, i) => `--c${i}: ${c.charCodeAt(0)}`).join('; ');
```

Each family's section in Reference lists its other inputs (strings, objects, accessors) and its own longer names, which also work.

## The grid primitives

The core, `dcss-array.css`, works without d3's names. Numbers go in as `--dcss-n` on `<i>` entries inside a grid. A reader, `<b class="dcss-at">`, picks one by `--dcss-i`, and the `<u>` inside it gets the result as `--dcss-value`:

```html
<!doctype html>
<link rel="stylesheet" href="dcss-array.css">
<style>.dcss-at u::after { counter-reset: v var(--dcss-value); content: counter(v); }</style>

<div class="dcss-array dcss-track-count">
  <b class="dcss-out"><b class="dcss-at" style="--dcss-i: 2"><u></u></b></b>
  <i style="--dcss-n: 12"></i>
  <i style="--dcss-n: 40"></i>
  <i style="--dcss-n: 30"></i>
</div>
```

The page shows 40, entry 2. With `--dcss-i: 1; --dcss-j: -1` the reader shows the sum, 82; with `--dcss-i: -1`, the last entry, 30. Change any `--dcss-n`, by a rule, a transition or an animation, and the reader follows in the same frame. [Grid markup](#grid-markup) in Reference has the rules, and the sections after it each kind of grid.

The text reads (`.dcss-text`) use fonts embedded in the sheet. To have them right from the first frame, copy the `<link rel="preload">` lines of `dcss-preload.html` into the page's `<head>`. Loops and sheets also need [dcss-store.css](https://noscript.ing) on the page.

## Recipes

- **First-fit decreasing.** Order a pack's children widest first: `.dcss-pack > * { order: calc(-1 * var(--dcss-w)); }`. Equal widths keep the markup's order.
- **A window's median, or any order statistic of a window.** In an `.dcss-array.dcss-sort`, push the keys outside the window past every key inside it, keep the number as `--dcss-n`, and read the middle of the window:

  ```css
  .win > i { --idx: calc(sibling-index() - 1); --inside: calc(clamp(0, var(--idx) - var(--start) + 1, 1) * clamp(0, var(--start) + 3 - var(--idx), 1));
    --dcss-key: calc(var(--v) + (1 - var(--inside)) * 1000); --dcss-n: var(--v); }
  ```

  A reader with `--dcss-i: 2` then reads the median of the 3 entries from entry `--start`, counting from 1 when `dcss-out` is the grid's first child. 1000 has to be above every key. Use one window per grid.
- **Sort results of separate computations, in the same frame.** Values only flow down a grid, so totals worked out in different grids can't be another grid's keys; anchors carry them across. Make each result a box as wide as it is (an `.dcss-array` is as wide as its total) and name it. Each mark's `top` counts the results that beat its own:

  ```html
  <div class="board" style="position: relative">
    <div class="dcss-array" style="anchor-name: --t1; width: max-content">...</div>   <!-- one per result -->
    <div class="dcss-array" style="anchor-name: --t2; width: max-content">...</div>
    <b class="bar" style="position: absolute; left: anchor(--t1 left); right: anchor(--t1 right);
      top: calc(clamp(0, (anchor-size(--t2 width) - anchor-size(--t1 width)) / 1px * 2 + 0, 1) * 20px)"></b>
    <b class="bar" style="position: absolute; left: anchor(--t2 left); right: anchor(--t2 right);
      top: calc(clamp(0, (anchor-size(--t1 width) - anchor-size(--t2 width)) / 1px * 2 + 1, 1) * 20px)"></b>
  </div>
  ```

  The `+ 1` breaks a tie in favour of the earlier result. Each mark sums one term per other result, so the markup grows as the square of their number. The bars and the results they name share a containing block, here `.board`. In Firefox, compare in `top` and span with `anchor()` edges ([QUIRKS.md](QUIRKS.md) Q3).
- **argmax and argmin.** Pack the number and its place into one, `--dcss-n: calc(var(--v) * S + (S - i))` with S above the count, and read any max (a bin of `.dcss-bins.dcss-bin-max`, `.dcss-slide`, `.dcss-map`): `round(down, value / S)` is the number and `S - mod(round(value), S)` its place, ties going to the first. For the smallest, write a bound minus the number. Keep the packed number under 1,000,000.

## Reference

The full contract, with each requirement's result in each engine, is [SPEC.md](SPEC.md). In the d3 calls, `--dcss-err` is 1 for an input the call can't take and, in most calls, 2 where d3's own answer is undefined or NaN; either way the number is hidden and the call's text prints nothing.

Calls by family: [Array](#array-familiesarraycss), [Ticks](#ticks-familiestickscss), [Format](#format-familiesformatcss), [Scale](#scale-familiesscalecss), [Ease](#ease-familieseasecss), [Hierarchy](#hierarchy-familieshierarchycss), [Aggregate](#aggregate-familiesaggregatecss), [Order](#order-familiesordercss), [Extrema](#extrema-familiesextremacss), [Color](#color-familiescolorcss), [Date parse](#date-parse-familiesdate-parsecss), [Time](#time-familiestimecss), [Date format](#date-format-familiesdate-formatcss), [Geo](#geo-familiesgeocss), [Random](#random-familiesrandomcss). The grid primitives: [Grid markup](#grid-markup), [Outputs](#outputs), [Primitives](#primitives), [Packed maps](#packed-maps), [Formulas](#formulas), [Text](#text), [Loops and sheets](#loops-and-sheets), [Limits](#limits).

### Array: families/array.css

#### Reductions

| Class | Gives | Notes |
|---|---|---|
| `dcss-sum` | `--dcss-sum`, and also `--dcss-count`, `--dcss-mean`, `--dcss-length` | one list gives all four |
| `dcss-count`, `dcss-mean` | `--dcss-count`, `--dcss-mean` | |
| `dcss-min`, `dcss-max` | `--dcss-min`, `--dcss-max` | |
| `dcss-extent` | `--dcss-min` and `--dcss-max` | an `<output>` prints `3–40` |
| `dcss-length` | `--dcss-length` | the list's length, skipped items included |

```html
<figure class="dcss-extent">
  <ul><li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 3"></li></ul>
  <output></output>                  <!-- prints 3–40 -->
</figure>
```

An empty `<output>` after the list prints the result as d3.format(",") does, to 6 decimals, a line above the list. An item whose `--value` isn't a number of 0 or more is skipped, as d3 skips it (an empty `<li>` is d3's null). The results count the rest, and `--dcss-err` is 1 to say an item was skipped. The mean, min, max or extent of no items is d3's undefined, error 2; the mean beside a sum of no items is 0, where d3 gives undefined. A min or max is drawn as boxes stacked as wide as the largest. For typed values (null, strings, objects, accessors), use `aggregate.css`.

#### Comparisons and index extrema

| Class | Takes | Gives |
|---|---|---|
| `dcss-ascending`, `dcss-descending` | `--a` and `--b`, finite, within ±2^24 | `--dcss-ascending` or `--dcss-descending`: -1, 0 or 1, on the call and inside it |
| `dcss-min-index`, `dcss-max-index`, `dcss-least-index`, `dcss-greatest-index` | a list of 0 to 64 values on the 1/64 grid within ±1024 | the winner's position from 0; the first wins a tie; -1 for an empty list |
| `dcss-least`, `dcss-greatest` | the same list | the winning value as `--dcss-least` or `--dcss-greatest` |

```html
<style>
  .comparison::after {
    counter-reset: comparison var(--dcss-ascending);
    content: counter(comparison);
  }
  .winner::after {
    counter-reset: winner var(--dcss-min-index);
    content: counter(winner);
  }
</style>
<output class="comparison dcss-ascending" style="--a: 12; --b: 40"></output>   <!-- -1 -->

<figure class="dcss-min-index">
  <ol>
    <li style="--value: 4"></li>
    <li style="--value: -2"></li>
    <li style="--value: -2"></li>
  </ol>
  <div><output class="winner"></output></div>   <!-- 1 -->
</figure>
```

A missing or NaN `--a` or `--b` is error 2, one out of bounds error 1. The index calls skip null, missing and NaN items. Whole numbers up to 65,536, such as prices in cents, fit divided by 64 (`--value: calc(8417 / 64)`): they stay exact and in order, so the index is the same. An off-grid value, one out of bounds or more than 64 items is error 1; a least or greatest of nothing is error 2. With the default comparison, least and min agree, and greatest and max. For strings, accessors and comparators, use `extrema.css`.

#### Bisect and bisectors

| Class | Takes | Gives |
|---|---|---|
| `dcss-bisect-left`, `dcss-bisect-right`, `dcss-bisect` (right) | the query as the figure's `--value`; a sorted list of up to 1,024 whole numbers within ±2^24; optional `--lo` and `--hi` | the insertion index from 0, as `--dcss-bisect-left` or `--dcss-bisect-right` (`--dcss-bisect` too, for right) |
| `dcss-bisector-left`, `dcss-bisector-right` | the same, 0 to 64 whole numbers, each datum's `value` as its `--value` | d3.bisector(d => d.value)'s index, as `--dcss-bisector-left` or `--dcss-bisector-right` |

```html
<figure class="dcss-bisect-left" style="--value: 2">
  <ol>
    <li style="--value: 1">1</li>
    <li style="--value: 2">2</li>
    <li style="--value: 2">2</li>
    <li style="--value: 4">4</li>
  </ol>
  <output></output> <!-- 1; the right variant gives 3 -->
</figure>
```

A bisect figure draws nothing and is one line tall, with its answer in it: give it no height or `overflow`, unlike a reduction's figure. `--lo` and `--hi` limit the search to `[lo, hi)`, whole numbers with `0 <= lo <= hi <= length`; they default to 0 and the list's length. A bad key or bound inside the search is error 1, a missing query error 2. On an unsorted list, the left variant counts the keys below the query and the right one those at or below it. So how many scored 80 or more is a sum's `--dcss-count` minus `.dcss-bisect-left` at 80: for 72, 85, 91, 64, 78, 88, 95, 70, 83 and 59, that is 10 minus 5.

#### Shares

`.dcss-share` gives each item its fraction of the list's total. The label stays in the item, and a `.dcss-share-result` inside a `.dcss-share-read` gets the numbers:

```html
<figure class="dcss-share">
  <ol>
    <li style="--value: 96">
      <span>Documents, 96 MB</span>
      <span class="dcss-share-read">
        <span class="dcss-share-result">
          <output class="dcss-format-percent"
                  style="--value: var(--dcss-share); --precision: 1"></output>
        </span>
      </span>
    </li>
    <li style="--value: 224">
      <span>Photos, 224 MB</span>
      <span class="dcss-share-read">
        <span class="dcss-share-result">
          <output class="dcss-format-percent"
                  style="--value: var(--dcss-share); --precision: 1"></output>
        </span>
      </span>
    </li>
  </ol>
</figure>
```

The outputs print `30.0%` and `70.0%`. Inside `.dcss-share-result`, `--dcss-total` is 320 and `--dcss-share` is the item's fraction, 0.3 or 0.7, which also works in a style: `width: calc(var(--dcss-share) * 100%)`. Put each item's label in one wrapper, or inside the result. A share takes 1 to 64 values, each 0 or more, a multiple of 1/64 and at most 4,095. A total of 0 is error 2; any bad value, or more than 64 items, is error 1 for the whole call.

#### Median, quantile, discrete scales and cumsum

These calls read their list through wrappers. `.dcss-call-read` measures the list; the `.dcss-call-result` inside it gets the number. `.dcss-call-input` between two calls passes the first one's readiness and errors on to the next, so its text stays hidden when the first has no answer. This page chains a median, a precision helper and a formatter, and prints `1,234.6`:

```html
<figure class="dcss-median">
  <ol>
    <li style="--value: .125"></li>
    <li style="--value: .25"></li>
    <li style="--value: .5"></li>
  </ol>
  <div class="dcss-call-read">
    <div class="dcss-call-result">
      <div class="dcss-call-input">
        <div class="dcss-precision-fixed" style="--step: var(--dcss-median)">
          <div class="dcss-call-input">
            <output class="dcss-format-fixed"
                    style="--value: 1234.5678; --comma: 1;
                           --precision: var(--dcss-precision-fixed)"></output>
          </div>
        </div>
      </div>
    </div>
  </div>
</figure>
```

| Class | Takes | Gives |
|---|---|---|
| `dcss-median`, `dcss-quantile` | 0 to 64 values, 1/64 steps within ±131,072 or whole numbers from -131,072 to 8,257,535; quantile takes `--p` | `--dcss-median`, `--dcss-quantile` |
| `dcss-quantile-sorted` | the same, chosen by position in the list, not sorted | `--dcss-quantile-sorted` |
| `dcss-scale-threshold` | up to 16 ascending thresholds within ±2^24 as the list; the query as `--value` | `--dcss-scale-threshold` |
| `dcss-scale-quantize` | `--domain-0` and `--domain-1` (0 and 1 by default), ascending; one empty `<li>` per threshold | `--dcss-scale-quantize` |
| `dcss-scale-quantile` | 0 to 64 values as for quantile; the query as `--value` | `--dcss-scale-quantile` |
| `dcss-cumsum` | 0 to 64 values on the 1/64 grid within ±1024, signed; a second `<ol class="dcss-scan-results">` with one `<li><div class="dcss-call-result">` per value | each result's own `--dcss-cumsum`; missing values add 0 |

When the rank falls between two values, as for an even median or most quantiles, the answer needs the list twice. Put an `.dcss-order-upper` inside the first result, holding the same list and another `.dcss-call-read > .dcss-call-result`; that last result gets the answer. Add `.dcss-source-order` to it for quantileSorted. Write changing values once as properties such as `--a` and use them in both lists.

```html
<figure class="dcss-median">
  <ol><li style="--value: 4"></li> <li style="--value: 1"></li> <li style="--value: 3"></li> <li style="--value: 2"></li></ol>
  <div class="dcss-call-read">
    <div class="dcss-call-result">
      <div class="dcss-order-upper">
        <ol><li style="--value: 4"></li> <li style="--value: 1"></li> <li style="--value: 3"></li> <li style="--value: 2"></li></ol>
        <div class="dcss-call-read">
          <div class="dcss-call-result">
            <output class="dcss-format-fixed" style="--value: var(--dcss-median); --precision: 1"></output>   <!-- 2.5 -->
          </div>
        </div>
      </div>
    </div>
  </div>
</figure>
```

The three discrete scales take `--ranges` (2 by default, up to 17) and `--range-0` to `--range-16`, numbers or quoted text; `--unknown` is the answer for a missing query. A bare `<output>` prints a text range; use a formatter for a number. A threshold or quantize call reads through `.dcss-call-read > .dcss-range-copy > .dcss-call-result`. A quantile scale uses its list three times: inside the first result, `.dcss-quantile-low` and then `.dcss-quantile-high` each hold the list and a read, and the high one's result holds `.dcss-range-copy > .dcss-call-result`. In full, with a list of three and two ranges (the answer is 1):

```html
<figure class="dcss-scale-quantile" style="--value: 3; --ranges: 2; --range-0: 0; --range-1: 1">
  <ol><li style="--value: 1"></li><li style="--value: 2"></li><li style="--value: 4"></li></ol>
  <div class="dcss-call-read"><div class="dcss-call-result">
    <div class="dcss-quantile-low">
      <ol><li style="--value: 1"></li><li style="--value: 2"></li><li style="--value: 4"></li></ol>
      <div class="dcss-call-read"><div class="dcss-call-result">
        <div class="dcss-quantile-high">
          <ol><li style="--value: 1"></li><li style="--value: 2"></li><li style="--value: 4"></li></ol>
          <div class="dcss-call-read"><div class="dcss-call-result">
            <div class="dcss-range-copy"><div class="dcss-call-result">
              <output class="dcss-format-fixed" style="--value: var(--dcss-scale-quantile); --precision: 0"></output>
            </div></div>
          </div></div>
        </div>
      </div></div>
    </div>
  </div></div>
</figure>
```

Keep the thresholds in order and the repeated lists identical; the sheet takes both as given. A value off the grid is error 1; an empty quantile or a missing `--p` is error 2. To repeat a call on its own result, set the next input on the `.dcss-call-input` wrapper, so it keeps the previous result before the next call reuses the name.

#### Precision helpers

| Class | Takes | Gives |
|---|---|---|
| `dcss-precision-fixed` | `--step` | `--dcss-precision-fixed` |
| `dcss-precision-prefix` | `--step` and `--value` | `--dcss-precision-prefix` |
| `dcss-precision-round` | `--step` and `--max` | `--dcss-precision-round` |

```html
<output class="dcss-precision-fixed" style="--step: .01"></output> <!-- 2 -->
<output class="dcss-precision-prefix" style="--step: .01; --value: 1000"></output> <!-- 5 -->
<output class="dcss-precision-round" style="--step: .01; --max: 1.01"></output> <!-- 3 -->

<div class="dcss-precision-fixed" style="--step: .01">
  <div class="dcss-call-input">
    <output class="dcss-format-fixed"
            style="--value: 1.2345; --precision: var(--dcss-precision-fixed)"></output>   <!-- 1.23 -->
  </div>
</div>
```

A precision helper gives its number on itself and inside it, so one container can set a formatter's precision. Steps are from 1e-30 to under 1e31 in size, signs as d3 treats them; a step of 0 is error 2. A precision used by a formatter must stay in the formatter's range: 0 to 15 for fixed and percent, 1 to 15 for SI.

#### Variance and deviation

`.dcss-variance` and `.dcss-deviation` give the sample variance (dividing by n - 1) and its square root, as `--dcss-variance` and `--dcss-deviation`, within 1e-9 of d3's. They take up to 16 values as in [Typed values](#typed-values), and types 4 (string) and 5 (object) too. `--accessor` is 0 for the value itself, 1 for `.value` (from `--field-type-N` and `--field-value-N`), 2 for the index from 1, 3 for undefined; the value it picks must be a number, null or undefined. With fewer than two valid values there is no result, as d3 returns undefined.

#### Ranges

`.dcss-range` gives d3.range's values, one per `<li>`: `--start`, `--stop` and `--step` (not 0), on the 1/64 grid within ±1024, up to 64 values. Each `<li>` gets `--dcss-range`, and `--dcss-range-ready` 1, or 0 when the range has ended. Too few `<li>`s, or more than 64 values, is error 1.

```html
<figure class="dcss-range" style="--start: 0; --stop: 5; --step: 1">
  <ol><li></li><li></li><li></li><li></li><li></li></ol>   <!-- 0, 1, 2, 3, 4 -->
</figure>
```

### Ticks: families/ticks.css

#### Ticks, nice and axes

`.dcss-axis-bottom`, `-top`, `-left` and `-right` draw d3's axis for a linear scale from `--start` to `--stop`, with `--count` ticks (10 by default), as long as the list. Give it one `<li>` per tick; the spare ones are hidden, up to 64 ticks, and 16 cover any 10-tick axis. Labels print in d3's tickFormat. The axis sets d3's `font: 10px sans-serif`, so an `em` on it or inside it is 10px: size it in px or `rem`.

```html
<ol class="dcss-axis-bottom" style="--start: 0; --stop: 87; --count: 10">
  <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
  <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
</ol>
```

| Class | Takes | Gives |
|---|---|---|
| `dcss-axis-bottom`, `-top`, `-left`, `-right` | `--start`, `--stop`, `--count` | a drawn axis; on each `<li>`, `--dcss-tick` (its value) and `--dcss-tick-at` (its place, 0 to 1); on the list, `--dcss-tick-step`, `--dcss-tick-increment`, `--dcss-tick-count` |
| `dcss-ticks` | the same | the same numbers, with nothing drawn: place them yourself, `.grid > li { left: calc(var(--dcss-tick-at) * 100%) }` |
| `dcss-nice` | the same | `--dcss-nice-start` and `--dcss-nice-stop` for everything inside |

Set the range on an ancestor to share it, and in a rule when state changes it (`.chart:has(#zoom:checked) { --stop: 870 }`), since an inline style beats any rule. To span a list's data, put the axis inside a `.dcss-nice` (`--start: var(--dcss-min); --stop: var(--dcss-max)`) inside an extent's result. A label is centred on its tick, so inside a figure, which clips at its edges, give the axis a margin on each side. `.dcss-nice` repeats d3's rounding 4 times, which settles every range in d3's own tests; about 2.4% of random ranges need more.

#### Identity ticks

`.dcss-identity-ticks` gives an identity scale's ticks from `--start`, `--stop` and `--source-count` (10 by default; `--identity-count` overrides it), up to 512 `<li>` slots. The ends are within ±1024, their span from 0.001 to 2048, the count a whole number from 1 to 256. The list gets `--dcss-tick-count` and each active `<li>` its `--dcss-tick`. For labels, put an `<output class="dcss-format-fixed dcss-identity-tick-format">` inside it with `--value` the tick: it takes the precision the list works out, `--dcss-tick-precision`.

### Format: families/format.css

#### Fixed, percent and SI

`.dcss-format-fixed`, `.dcss-format-percent` and `.dcss-format-si` are d3.format's types `f`, `%` and `s`. They go on one element, most often an `<output>`, take the number as `--value` and print into `::after` the text d3.format prints:

```html
<output class="dcss-format-fixed" style="--value: 1234.5; --precision: 2; --comma: 1"></output>   <!-- 1,234.50 -->
<output class="dcss-format-percent" style="--value: 0.234; --precision: 1"></output>             <!-- 23.4% -->
<output class="dcss-format-si" style="--value: 999.5; --precision: 3"></output>                   <!-- 1.00k -->
<output class="dcss-format-si" style="--value: 1234; --precision: 3; --trim: 1"></output>         <!-- 1.23k -->
```

| Field | d3 | Default |
|---|---|---|
| `--precision` | `.2` | 6; decimal places for f and %, significant digits for s |
| `--comma` | `,` | 0 |
| `--sign` | `+` (1), `-` (0) | 0 |
| `--symbol` | `$` (1) | 0 |
| `--trim` (SI) | `~` (1) | 0 |

Fixed and percent round as d3 does, by the number's exact value with ties going up, so 4.35 at one decimal is 4.3 (4.35 is a hair under it). The minus is d3's U+2212, hidden when a negative rounds to zero unless `--sign: 1`. With `$`, a percentage has no `%`, as in d3. The number times 10 to the precision must be under 2^53 (16 digits in all). `--value` can be another call's answer, `var(--dcss-scale-linear)`, and keeps every digit. A missing `--value`, such as an empty median's, prints nothing.

To divide before printing, use `.dcss-scale-linear` rather than `/` in `--value`. WebKit computes `calc(a / b)` as `a × (1 / b)`, one bit off, and a tie can then round the other way: `--value: calc(8347.5 / 100)` prints 83.48 in WebKit and 83.47 in Chrome and d3. A scale divides exactly in both, as d3.scaleLinear does:

```html
<div class="dcss-scale-linear" style="--value: 8347.5; --domain-0: 0; --domain-1: 100; --range-0: 0; --range-1: 1">
  <output class="dcss-format-fixed" style="--value: var(--dcss-scale-linear); --precision: 2"></output>   <!-- 83.47 -->
</div>
```

SI picks its prefix after rounding, so `.3s` prints 999.5 as `1.00k`. It takes 1 to 15 significant digits, and 0 or values from 1e-30 to under 1e31 in size. Below 1e-24 d3 rounds a second time, and the precision left must stay above 0 (`precision + floor(log10(abs(value))) + 24 > 0`). Past these limits it prints nothing, with error 1.

#### General labels

`.dcss-format-general` is d3's general number format: 12 significant digits, trailing zeros removed. `--precision` takes 1 to 15, `--trim: 0` keeps the zeros, and sign, currency and grouping use the fields above.

```html
<output class="dcss-format-general" style="--value: 2.718281828459045"></output>   <!-- 2.71828182846 -->
```

It prints plain decimal notation only: the rounded exponent must be at least -6 and under the precision. A number d3 would print in scientific notation prints nothing, with error 1.

#### Log ticks and labels

A log scale's ticks are `.dcss-ticks-log` and its nice `.dcss-nice-log`, each with `--start`, `--stop`, `--count` and `--base` (10 by default). A label is a `.dcss-format-fixed`, `.dcss-format-si` or `.dcss-format-general` with the class `.dcss-ticks-log-format`, inside a `.dcss-ticks-log`. It prints only where d3's log tickFormat prints, and `--trim: 1` is d3's `~`. Base-e ticks and nice can be a last bit off d3's, because CSS's `exp()` isn't JavaScript's `Math.exp()`.

#### Arabic locale

`.dcss-format-locale.dcss-locale-arabic` prints Arabic digits and separators for the specifier `$,.2f`. Set `--value`, and put the currency affixes in `data-dcss-locale-prefix` and `data-dcss-locale-suffix`. Other locales and grouping patterns aren't available.

### Scale: families/scale.css

#### Linear, pow, sqrt and log

`.dcss-scale-linear` on any element is d3.scaleLinear. It takes `--domain-0`, `--domain-1`, `--range-0`, `--range-1` and `--value`, set on it or inherited, and gives `--dcss-scale-linear` and `--dcss-scale-linear-invert` to the element and everything inside it:

```html
<div class="dcss-scale-linear" style="--domain-0: 0; --domain-1: 100; --range-0: 32; --range-1: 212; --value: 21">
  21 °C is <output class="dcss-format-fixed" style="--value: var(--dcss-scale-linear); --precision: 1"></output> °F   <!-- 69.8 -->
</div>
```

| Class | Takes | Gives |
|---|---|---|
| `dcss-scale-linear` | the inputs above; up to 8 stops, `--domain-0` to `--domain-7` and `--range-0` to `--range-7`, with `--stops` (2 by default); `--clamp: 1`, `--round: 1` (d3's rangeRound) | `--dcss-scale-linear`, `--dcss-scale-linear-invert` |
| `dcss-scale-pow` | the same, and `--exponent` (1 by default) | `--dcss-scale-pow`, `--dcss-scale-pow-invert` |
| `dcss-scale-sqrt` | the same | `--dcss-scale-sqrt`, `--dcss-scale-sqrt-invert` |
| `dcss-scale-log` | the same; a negative domain works as in d3 | `--dcss-scale-log`, `--dcss-scale-log-invert` |

A linear, pow or sqrt scale's ticks and nice are `.dcss-ticks` and `.dcss-nice` on its domain's two ends. Its tickFormat is a `.dcss-format-fixed` whose `--precision` is the tick list's `--dcss-tick-precision`, 2 less for `%`. A log scale's are under [Log ticks and labels](#log-ticks-and-labels). Linear, pow and sqrt scales equal d3's answer exactly. A log scale is within 256 × 2^-52 of it, since the browsers' `log()` and `exp()` differ from JavaScript's in the last bits. Ranges of colours or dates, custom interpolators and inputs that aren't numbers aren't available.

Where the browser has `@function` (Chrome), a two-stop linear scale is also a function, `--dcss-scale-linear(x, d0, d1, r0, r1)`, with clamp and round (0 or 1) after: `--dcss-scale-linear(21, 0, 100, 32, 212)` is 69.8. Pow, sqrt and log scales are functions too: `--dcss-scale-pow(x, d0, d1, r0, r1, exponent)`, `--dcss-scale-sqrt(...)` and `--dcss-scale-log(...)`, with clamp and round after. Write a plain value first for the browsers without `@function`, and guard a call that uses `var()`, as for [the easings](#ease-familieseasecss).

#### Band scale

`.dcss-scale-band.dcss-scale-linear` on a `<figure>` is d3's bar chart: d3.scaleBand across the `<li>`s and d3.scaleLinear([0, d3.max]) up, one bar per `<li>` at its `--value`. The figure's content box is the plot and its padding the margins, so give it a width and a height. `--padding` (or `--padding-inner` and `--padding-outer`, the outer at least half the inner) and `--align` are d3's, 0, 0 and 0.5 by default. Each bar is its `<li>`'s `::before`, steelblue unless you colour it, and the `<li>`'s text is its label, under the plot. The element after the list gets `--dcss-max`, for an axis:

```html
<figure class="dcss-scale-band dcss-scale-linear" style="--padding: 0.1; width: 600px; height: 340px; padding: 30px 0 30px 40px">
  <ul><li style="--value: 0.08167">A</li> <li style="--value: 0.01492">B</li> <li style="--value: 0.02782">C</li></ul>
  <div><ol class="dcss-axis-left" style="--start: 0; --stop: var(--dcss-max)">
    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
  </ol></div>
</figure>
```

Each bar lands within 1/32 px of d3's, and the axis's ticks at d3's places. The max is read from the layout as a logarithm: any value from 2^-64 to 2^64, to about 1/100,000 of itself (0.127019 for 0.12702). It is exact when it has 4 significant digits or fewer (10, 1000, 0.3), so a max that falls on a tick stays on it.

#### Identity scale

`.dcss-scale-identity` gives the query `--value` back unchanged, as both `--dcss-scale-identity` and `--dcss-scale-identity-invert`; the domain and range don't change it, as in d3. A missing query is error 1. Its ticks are `.dcss-identity-ticks` in `ticks.css`.

```html
<span class="dcss-scale-identity" style="--value: 12">
  <span style="display: inline-block; width: calc(var(--dcss-scale-identity) * 1px)"></span>   <!-- 12px wide -->
</span>
```

### Ease: families/ease.css

Every easing d3-ease exports is a class, `.dcss-ease-<name>`, on any element: `quad-in`, `quad-out`, `quad-in-out`, and the same for `cubic`, `poly`, `sin`, `exp`, `circle`, `bounce`, `back` and `elastic`, plus `linear`. The short names (`.dcss-ease-quad`, `.dcss-ease-bounce` and so on) are d3's aliases. `--value` is t, and the answer is `--dcss-ease-<name>`. d3's parameters are properties: `--exponent` (poly, 3 by default), `--overshoot` (back, 1.70158), `--amplitude` and `--period` (elastic, 1 and 0.3).

```html
<span class="dcss-ease-cubic-in-out" style="--value: 0.25">
  <output class="dcss-format-fixed" style="--value: var(--dcss-ease-cubic-in-out); --precision: 4"></output>   <!-- 0.0625 -->
</span>
```

Where the browser has `@function` (Chrome), every easing is also a CSS function, `--dcss-ease-<name>(t)`, with the class's other inputs after t in the order above: `--dcss-ease-poly-in(0.5, 2)` is 0.25. A browser without `@function` drops a declaration that calls one with plain numbers, so write a plain value first. A call with `var()` among its arguments gets past that first check and fails later, so the plain value is lost too: put such calls inside `@supports at-rule(@function)`.

```css
.bar { width: 50%; }
@supports at-rule(@function) { .bar { width: calc(--dcss-ease-cubic-in-out(var(--progress)) * 100%); } }
```

### Hierarchy: families/hierarchy.css

#### Treemaps and partition

`.dcss-treemap-slice`, `.dcss-treemap-dice`, `.dcss-treemap-slice-dice` and `.dcss-partition` go on a figure of the size you give it, holding a nested list. Each leaf `<li>` has its value as `--value`. Every `<li>` is laid out at its node's rectangle, as d3.treemap().tile(...) or d3.partition() places it after hierarchy.sum(); draw on the `<li>`s.

```html
<figure class="dcss-partition" style="width: 640px; height: 240px">
  <ul>
    <li>Citrus <ul><li style="--value: 30">Orange</li> <li style="--value: 20">Lemon</li></ul></li>
    <li style="--value: 40">Apples</li>
  </ul>
</figure>
```

A partition keeps the top band for the root, as d3 does: wrap the list in one `<li>` to draw it. Slice, dice and partition add up the leaves themselves. Slice-dice turns each level a quarter, and there every inner `<li>` needs its subtree's sum as `--value` too. The total can be from 64 to 2^31 times the figure's width in pixels (2.2 million at 960 px); under 64, the layout is narrower than the figure. A partition takes 12 levels.

#### Five-circle pack

`.dcss-pack-five` takes five radii, `--r0` to `--r4`, each from 0.25 to 32, and places them as d3.packSiblings does, then centres them as its enclosing circle does. The call and everything inside it get `--dcss-pack-x0`, `--dcss-pack-y0` and `--dcss-pack-r0`, and so on to index 4. A missing or out-of-range radius is error 1.

```html
<div class="dcss-pack-five" style="--r0: 10; --r1: 14; --r2: 22; --r3: 8; --r4: 2"></div>
```

### Aggregate: families/aggregate.css

`.dcss-aggregate-sum`, `.dcss-aggregate-count`, `.dcss-aggregate-mean`, `.dcss-aggregate-cumsum`, `.dcss-fsum` and `.dcss-fcumsum` take typed values on the call element and give `--dcss-<name>` (`--dcss-fsum`, `--dcss-aggregate-mean`) to everything inside it. Exact sums keep binary64's lost digits, as d3's fsum does.

```html
<div class="dcss-fsum" style="--dcss-input-length: 3;
     --dcss-input-0-type: 0; --dcss-input-0-value: 12;
     --dcss-input-1-type: 0; --dcss-input-1-value: 40;
     --dcss-input-2-type: 0; --dcss-input-2-value: 30">
  <output style="counter-reset: total var(--dcss-fsum)"></output>   <!-- --dcss-fsum is 82 -->
</div>
```

| Input | What it is |
|---|---|
| `--length` or `--dcss-input-length` | how many values, 0 to 20 |
| `--type-N` or `--dcss-input-N-type` | 0 number, 1 null, 2 undefined, 3 NaN, 4 string, 5 object |
| `--value-N` or `--dcss-input-N-value` | the number, finite, within ±Number.MAX_VALUE / 64 |
| `--dcss-accessor` | 0 the value, 1 `.value`, 2 the index from 1, 3 undefined, 4 the count accessor's field |
| `data-dcss-capacity="8"` or `"4"` | computes only that many slots, which is faster; a longer list is error 1. A call with `data-dcss-backend="layout"` always computes 20 |

A string is 1 to 4 ASCII characters. Strings of one or two digits, with an optional space before them, count as numbers; one with a character no number can have is skipped; other number-shaped strings, such as `1e3`, are error 1. The cumulative calls take one `<ol class="dcss-aggregate-results">` inside the call, with one `<li>` per value, and each `<li>` gets its own `--dcss-cumsum` or `--dcss-fcumsum`. The mean of nothing has no value, without an error.

### Order: families/order.css

`.dcss-order-median`, `.dcss-order-quantile`, `.dcss-order-quantile-sorted`, `.dcss-order-median-index`, `.dcss-order-quantile-index` and `.dcss-order-mode` take typed values, so any finite number works as written:

```html
<!-- Ten order amounts. The median prints 59.50; links families/format.css too. -->
<div class="dcss-order-median" style="--length: 10;
     --type-0: 0; --value-0: 42;    --type-1: 0; --value-1: 18.5;
     --type-2: 0; --value-2: 77;    --type-3: 0; --value-3: 18.5;
     --type-4: 0; --value-4: 130;   --type-5: 0; --value-5: 64;
     --type-6: 0; --value-6: 9.99;  --type-7: 0; --value-7: 55;
     --type-8: 0; --value-8: 77;    --type-9: 0; --value-9: 210">
  <output class="dcss-format-fixed"
          style="--value: var(--dcss-order-median); --precision: 2"></output>
</div>
```

The same values on `.dcss-order-quantile` with `--order-p-type: 0; --order-p-number: 0.9` give the 90th percentile, 138. Results are `--dcss-order-<name>`, read anywhere inside the call.

| Input | What it is |
|---|---|
| `--length` | 0 to 16 values (0 to 8 for the index calls) |
| `--type-N` | 0 number, 1 null, 2 undefined, 3 NaN, 4 ASCII string, 5 object |
| `--value-N` | the number |
| `--length-N`, `--char-xNxJ` | a string's length (up to 16) and its character codes |
| `--accessor` | 0 the value, 1 `.value` (from `--field-type-N` and `--field-value-N`), 2 the index from 1, 3 undefined |
| `--order-p-type` | the quantile's p: 0 a number in `--order-p-number`, 1 null (p is 0), 2 undefined, 3 NaN, 4 a string of 1 to 4 characters that isn't a number, in `--order-p-length` and `--order-p-char-J` |

Mode gives `--dcss-order-mode-value` and `--dcss-order-type`, with a string's length and characters. `--dcss-ready` says the inputs are valid, and `--dcss-order-present` that there is a result. An index call of nothing gives -1; a value call of nothing has no result. For a median index of more than 8 values, sort them in a grid and read the middle entry (A sort, under [Primitives](#primitives)).

### Extrema: families/extrema.css

`.dcss-extrema-<name>` is d3's `min`, `max`, `extent`, `minIndex`, `maxIndex`, `least`, `greatest`, `leastIndex`, `greatestIndex`, `scan`, `ascending` or `descending` (`.dcss-extrema-min-index`) over typed values:

```html
<link rel="stylesheet" href="dcss-array.css">
<link rel="stylesheet" href="families/extrema.css">
<figure class="dcss-extrema-min"
  style="--extrema-size:2; --extrema-0-type:0; --extrema-0-number:5;
         --extrema-1-type:0; --extrema-1-number:2">
  <div style="width:calc(var(--dcss-extrema-number) * 10px)"></div>   <!-- 20px wide -->
</figure>
```

It takes 0 to 10 slots, written as in [Typed values](#typed-values) or with this family's own names:

| Input | What it is |
|---|---|
| `--extrema-size` | how many slots |
| `--extrema-i-type` | 0 number, 1 ASCII text, 2 null, 3 undefined, 4 NaN, 5 object |
| `--extrema-i-number` | the number, compared with every binary digit |
| `--extrema-i-length`, `--extrema-i-c0` to `-c2` | text of up to 3 characters |
| `--extrema-mode` | how items compare: 0 natural order, 1 `.value`, 2 the index plus one, 3 undefined, 4 identity, 5 `.name`, 6 `.v`, 7 subtraction, 8 subtraction of `.value` |
| `--extrema-direction: 1` | reverses least and greatest |
| `--extrema-i-field-*`, `--extrema-i-object-<key>-*` | an object's compared field, and its `name`, `value`, `v` and `index`, each typed the same way; an absent field is type 3 |

Results are `--dcss-extrema-type`, `-number`, `-length`, `-c0` to `-c2` and `-index`; an extent's ends are `--dcss-extrema-min-number` and `--dcss-extrema-max-number`, and an object result keeps its `-object-<key>-*` fields. `--dcss-ready: 1; --dcss-err: 0` means the call is valid. Read the type and value only when `--dcss-extrema-field-ready` is 1: at 0 the answer is d3's NaN or undefined. `ascending` and `descending` compare the first two slots. Two strings compare as text; a string against a number works for empty text and unsigned numbers of up to three digits.

### Color: families/color.css

#### Constructors

`.dcss-rgb`, `.dcss-hsl`, `.dcss-lab`, `.dcss-hcl`, `.dcss-lch` and `.dcss-gray` give d3's color coordinates and opacity as numbers:

```html
<span class="dcss-rgb" style="--r: 70; --g: 130; --b: 180">
  <span style="display: inline-block; width: 1em; height: 1em;
    background: rgb(var(--dcss-rgb-r) var(--dcss-rgb-g) var(--dcss-rgb-b)
                    / var(--dcss-rgb-opacity))"></span>
</span>
```

The inputs are the coordinates' names (`--r`, `--g`, `--b`; `--h`, `--s`, `--l`; `--l`, `--a`, `--b`; or `--h`, `--c`, `--l`), each finite within ±2^24, and `--opacity`, 1 by default. Each output is `--dcss-<class>-<field>`, such as `--dcss-hsl-s`. Lch gives Hcl's `h`, `c` and `l`; gray gives Lab's `l`, with `a` and `b` 0. Nothing is clamped, opacity included. A missing coordinate is error 1, and the others stay available. They give coordinates only: formatting and color methods aren't available.

For typed arguments, add `.dcss-color-input` to the constructor. Set `--arg-count`, then each argument's `--arg-N-type` (1 number, 2 null, 3 undefined, 4 NaN, 5 a numeric string) and `--arg-N-value`, or for a string `--arg-N-length` and `--arg-N-char-M`. A string is up to 16 characters, with five digits and an exponent up to 9; a number is within ±1024.

#### Conversions

`.dcss-convert-rgb`, `-hsl`, `-lab`, `-hcl` or `-lch` converts a color, together with a class naming its source, such as `.dcss-from-lab`. `--from` says the same as a number: 1 RGB, 2 HSL, 3 Lab, 4 Hcl. `--from-0`, `--from-1` and `--from-2` hold the source's coordinates and `--from-opacity` its opacity (1 by default). The results are `--dcss-convert-<target>-<field>`.

```html
<div class="dcss-convert-hcl dcss-from-lab"
     style="--from:3;--from-0:50;--from-1:4;--from-2:-5"></div>
```

RGB channels go from 0 to 255, HSL saturation and lightness from 0 to 1, and other coordinates within ±1024. `.dcss-convert-cubehelix` takes `--r`, `--g`, `--b` (0 to 255) and `--opacity`. A missing field is an error for the fields that need it; the others stay usable.

#### Color text

The color parsers are in `families/color-text.css`. CSS can't read the letters of a string, so the text goes in one character per custom property, as its character code. `tomato` is `--length: 6` and `--c0` to `--c5`: 116, 111, 109, 97, 116, 111. A build step writes them (`[...text].map(c => c.charCodeAt(0))`).

```html
<!-- Links families/color-text.css (families/color.css is not needed) and families/format.css. -->
<div class="dcss-parse-color-complete" style="--length: 6;
     --c0: 116; --c1: 111; --c2: 109; --c3: 97; --c4: 116; --c5: 111">
  <span style="display: inline-block; width: 1em; height: 1em;
    background: rgb(var(--dcss-color-r) var(--dcss-color-g) var(--dcss-color-b))"></span>
  <output class="dcss-format-fixed"
          style="--value: var(--dcss-color-r); --precision: 0"></output>   <!-- 255 -->
</div>
```

| Class | Reads | Gives |
|---|---|---|
| `dcss-parse-color-complete` | 0 to 64 ASCII characters: CSS names, hex, and comma-separated `rgb()`, `rgba()`, `hsl()`, `hsla()` | `--dcss-color-kind` and the fields below |
| `dcss-parse-color-function` | 1 to 64 characters of comma-separated `rgb()`, `rgba()`, `hsl()` or `hsla()` | the same |
| `dcss-color-coerce-*` | a parser's fields | a named constructor's fields |

`--dcss-color-kind` is 0 for d3's null, 1 for RGB and 2 for HSL. The fields are `--dcss-color-r`, `-g`, `-b` and `-opacity`, and for HSL `--dcss-color-h`, `-s` and `-l`, each with its own readiness. Where d3 gives null or NaN, the field is left out rather than set to 0: an alpha of 0 or less keeps the opacity and leaves out the RGB fields. A number in the text has up to five significant digits, at most five after the point, an exponent up to 9 and a value up to 1024 in size. A character code that is missing or not a whole number is an error; well-formed text that isn't a color gives kind 0 with no error. The space-separated syntax (`rgb(70 130 180)`) isn't available.

### Date parse: families/date-parse.css

#### Formats

`.dcss-date-parse-N` parses date text as d3's English utcParse does, into epoch milliseconds, `--dcss-date-parse`. The text goes in as character codes, `--length` and `--c0` onward, as in [Color text](#color-text), up to 24 characters. `.dcss-local-date-parse-N`, in `families/date-parse-local.css`, parses in Pacific time (America/Los_Angeles), as timeParse does there.

```html
<!-- The text "432", format 23 (%L): 432 ms past 1900-01-01, UTC. -->
<div class="dcss-date-parse-23"
     style="--length:3;--c0:52;--c1:51;--c2:50"></div>
```

N is the format's place in this list: d3's 38 formats, then three ISO ones (38 to 40).

<!-- date-parse-formats -->

| N | Format | N | Format | N | Format | N | Format |
|---:|---|---:|---|---:|---|---:|---|
| 0 | `%c` | 1 | `%a %m/%d/%Y` | 2 | `%A %m/%d/%Y` | 3 | `%U %Y` |
| 4 | `%a %U %Y` | 5 | `%A %U %Y` | 6 | `%w %U %Y` | 7 | `%w %V %Y` |
| 8 | `%w %V %G` | 9 | `%w %V %g` | 10 | `%V %g` | 11 | `%u %W %Y` |
| 12 | `%W %Y` | 13 | `%a %W %Y` | 14 | `%A %W %Y` | 15 | `%w %W %Y` |
| 16 | `%m/%d/%y` | 17 | `%x` | 18 | `%b %d, %Y` | 19 | `%B %d, %Y` |
| 20 | `%j %m/%d/%Y` | 21 | `%H:%M:%S` | 22 | `%X` | 23 | `%L` |
| 24 | `%f` | 25 | `%I:%M:%S %p` | 26 | `%Y %q` | 27 | `%Y %q %m` |
| 28 | `%% %m/%d/%Y` | 29 | `%m/%d/%Y %Z` | 30 | `%-m/%0d/%_Y` | 31 | `%Y %U %w` |
| 32 | `%V %Y` | 33 | `%V %G` | 34 | `%Q` | 35 | `%s` |
| 36 | `%s.%L` | 37 | `%s.%f` | 38 | `%Y-%m-%d` | 39 | `%Y-%m-%dT%H:%M:%SZ` |
| 40 | `%Y-%m-%dT%H:%M:%S.%LZ` |

<!-- /date-parse-formats -->

Calendar dates take years 100 to 9999; epoch numbers, years -9999 to 19999. A character code that is missing or not a whole number hides the result with error 1. Other locales and the browser's own time zone aren't available.

#### Calendar fields

`.dcss-parse-calendar-<form>` parses ISO weeks, Sunday and Monday weeks and quarters, from the same character codes into the same `--dcss-date-parse`. The UTC forms are `isoWYear`, `isoYear` and `isoYear2`, for years 1900 to 2099. The Pacific forms are `localIsoWYear`, `localIsoWYear2`, `localIsoYear2`, `weekSunday`, `weekSundayDefault`, `weekMonday`, `weekMondayDefault`, `quarter` and `quarterMonth`, for years 1990 to 2037. Weeks and days are one or two digits as the format has them; ISO weeks run 1 to 53, quarters 1 to 4.

### Time: families/time.css

`families/time.css` holds d3's time intervals on epoch milliseconds, in UTC and in Pacific time. Each interval has five calls, `-floor`, `-ceil`, `-round`, `-offset` and `-count`, and each takes the time as `--value`; offset also takes `--step` (1 by default), and count takes `--start` and `--stop`. The answer is on the call and everything inside it.

```html
<!-- Links families/format.css too. 2023-11-14 22:13:20 UTC, floored to its day. -->
<span class="dcss-utc-day-floor" style="--value: 1700000000000">
  <output class="dcss-format-fixed" style="--value: var(--dcss-utc-day); --precision: 0"></output>   <!-- 1699920000000 -->
</span>
```

| Classes | Gives | Times it takes |
|---|---|---|
| `dcss-utc-day-*`, `-hour-*`, `-minute-*`, `-second-*` | `--dcss-utc-day` and so on; the day calls are d3's unixDay too | within ±8×10¹² ms; a fraction of a millisecond is dropped |
| `dcss-utc-sunday-*` to `dcss-utc-saturday-*` | `--dcss-utc-sunday` and so on | within ±8×10¹⁵ ms |
| `dcss-utc-month-*`, `dcss-utc-year-*` | `--dcss-utc-month`, `--dcss-utc-year` | within ±8×10¹³ ms |
| `dcss-local-day-*`, `dcss-local-month-*` | `--dcss-local-day`, `--dcss-local-month` | 2007 to 2037 (1167609600000 to 2145916800000) |
| `dcss-local-hour-*`, `dcss-local-minute-*` (no count) | `--dcss-local-hour`, `--dcss-local-minute` | 2007 to 2037 |
| `dcss-local-sunday-*` to `dcss-local-saturday-*` | `--dcss-local-sunday` and so on | years -9999 to 19999 |

- Round picks the later interval on a tie. A time or a result outside its range is error 1, and the number is hidden.
- Month and year offsets keep the day and time and overflow as Date's setters do, so January 31 plus a month is March 2 or 3. For years, `--every` picks a period from 1 to 10,000 (1 by default), counted from year zero; count needs `--every: 1`. Steps go to ±10,000.
- The Pacific calls follow America/Los_Angeles daylight saving time. In a spring gap they take the later instant, in an autumn fold the earlier. Their steps go to ±240 for days and months, ±10,000 for hours and minutes, ±1,000 for weekdays. The weekday calls follow the zone's full history; the others its rule from 2007 to 2037.

### Date format: families/date-format.css

`.dcss-date-format-N` prints epoch milliseconds in `--value` as d3's English utcFormat does, and `.dcss-local-date-format-N` as timeFormat does in Pacific time. N is the specifier's place in this list:

<!-- date-format-formats -->

| N | Format | N | Format | N | Format | N | Format |
|---:|---|---:|---|---:|---|---:|---|
| 0 | `%c` | 1 | `%a` | 2 | `%A` | 3 | `%b` |
| 4 | `%B` | 5 | `%d` | 6 | `%e` | 7 | `%g` |
| 8 | `%G` | 9 | `%H` | 10 | `%I` | 11 | `%j` |
| 12 | `%m` | 13 | `%M` | 14 | `%p` | 15 | `%q` |
| 16 | `%Q` | 17 | `%s` | 18 | `%s.%L` | 19 | `%s.%f` |
| 20 | `%S` | 21 | `%0S` | 22 | `%_S` | 23 | `%-S` |
| 24 | `%L` | 25 | `%u` | 26 | `%f` | 27 | `%U` |
| 28 | `%W` | 29 | `%V` | 30 | `%x` | 31 | `%X` |
| 32 | `%y` | 33 | `%Y` | 34 | `%Z` | 35 | `%%` |
| 36 | `.%L` | 37 | `:%S` | 38 | `%I:%M` | 39 | `%I %p` |
| 40 | `%a %d` |

<!-- /date-format-formats -->

The time must fall in years -9999 to 19999; outside that, the text is hidden with an error. The numbers behind the text, such as `--dcss-date-year`, are there to use inside the call.

### Geo: families/geo.css

The `.dcss-geo-*` calls are d3's identity, equirectangular, rotation, stereographic, mercator and transverse mercator projections, and distance. A point call takes `--x` and `--y` and gives `--dcss-geo-x` and `--dcss-geo-y`; `-invert` gives the inverse. Distance gives `--dcss-geo-distance` in radians. The settings are d3's: scale, translation, reflection, angle, center and rotation.

- Points are within ±1e6, scale from 0.001 to 10,000. The `-config` calls give the settings back, with scale and translation up to 1e12.
- Mercator's `-extent` calls give its clip rectangle: kind 0 is null, kind 1 has four corner fields. Shapes aren't clipped; polygons, lines and streams aren't available.
- Mercator's `-fit-extent` calls work out scale and translation from 1 to 64 points, `--length` and `--longitude-1`, `--latitude-1` onward, and a rectangle, `--extent-x0`, `--extent-y0`, `--extent-x1`, `--extent-y1`. The points must be finite and the rectangle more than 0 across.
- Points come within 1e-6 of d3's, distance within 1e-12, fitted settings within 0.001.

### Random: families/random.css

`.dcss-random-lcg` is d3-random 3.0.1's randomLcg with a `--seed` from 0 up to 1. It holds an `<ol>` or `<ul>` of 1 to 199 `<li>`s, and the first `<li>` is the first draw, the second the second, and so on. Each `<li>` gets `--dcss-random-lcg`, and the generator's 32-bit state as two whole numbers from 0 to 65,535, `--dcss-random-lcg-low` and `--dcss-random-lcg-high`; the fraction is off by at most 1/4294967296. A missing seed, or more than 199 `<li>`s, hides the numbers with an error.

```html
<figure class="dcss-random-lcg" style="--seed: 0.5">
  <ol><li></li><li></li><li></li></ol>
</figure>
```

### Grid markup

- A grid is one computation. Its children, `<i>`, are the entries, the inputs. Its readers, `<b class="dcss-at"><u></u></b>`, are the outputs, and each reads the nearest grid around it.
- A reader goes in `<b class="dcss-out">`, the grid's first child, or inside an entry. In a grid with no child entries (a packed array, a cycle), it is a child of the grid.
- The results land on the `<u>` inside a reader and everything in it. That `<u>` is yours: put content there. Leave the entries, readers and `dcss-out` empty, since content in them can change what they read.
- A grid inside a reader's `<u>` reads its own entries, so one computation feeds the next in the same frame. Results only flow down: results of several entries reach another grid's entries a frame later, through dcss-store.css.
- Put changing numbers on the entries. A number that changes above a grid and is inherited through it restyles every reader, used or not.
- Every name the sheet uses starts with `dcss-`, the calls' and its own grids', readers' and numbers' alike; its internal numbers include `--dcss-p-*`, and its anchor names are `--dcss-where`, `--dcss-lo` and `--dcss-hi`. A call's results (`--dcss-*`, listed in `src/names.mjs`), which aren't registered, so they keep any value you give them elsewhere.
- Every grid resets its padding, border, `writing-mode` and `direction`.

[Primitives](#primitives) lists every kind of grid with its markup.

### Outputs

| Name | Set on | Holds |
|---|---|---|
| `--dcss-value` | a reader's `<u>` | the entry, track, sum, maximum or table value read |
| `--dcss-ok` | a reader's `<u>` | 1 for a valid read; 0 for an index or key out of range, which also reads `--dcss-value` 0 |
| `--dcss-value-y` | a reader's `<u>` in an `.dcss-xy` array | the entry's second number, or row r |
| `--dcss-rank` | the `<u>` of a bins entry | its place among the children of its bin, from 1 |
| `--dcss-track-count` | the `<u>` of an `.dcss-track-count` | bins in use, the most intervals at one point, or lines |
| `--dcss-below` | the `<u>` of an `.dcss-below` | the bins in use below its own |
| `--dcss-x`, `--dcss-y` | the inner `<u>` of an `.dcss-where` | where the child is, in the grid's units |
| `--dcss-place` | the inner `<u>` of an `.dcss-where` in a sort | its place, 1 for the smallest key |
| `--dcss-column`, `--dcss-row` | the inner `<u>` of an `.dcss-where` in a pack | where first fit put it |
| `--dcss-width`, `--dcss-height`, `--dcss-fits` | the inner `<u>` of an `.dcss-where` in tiles | its area's size, and 1 when it fits the map |
| `--dcss-lower`, `--dcss-upper`, `--dcss-frequency`, `--dcss-member` | the inner `<u>` of a search probe | keys below, keys up to, keys equal, and whether there is one |
| `--dcss-before` | a scan reader's `<u>` | the sum of the entries before |
| `--dcss-high`, `--dcss-low` | the inner `<u>` of an `.dcss-two` text | the two numbers of one read |
| `--dcss-top1` to `--dcss-top6` | the inner `<u>` of an `.dcss-in` query | the six highest bits of its mask, which is its `--dcss-value` |

### Primitives

Each kind of grid: what it computes, its markup, whether it reads in the same frame it changes, and how exact it is. [Performance](#performance) gives each one's cost.

<!-- primitives -->

#### Entry i of an array of child entries

`.dcss-array` > children with `--dcss-n`; a reader `.dcss-at` with `--dcss-i`, in the port (`<b class="dcss-out">`, the first child) or a child of an entry; what is inside the reader gets `--dcss-value` and `--dcss-ok`.

Same frame: yes, both. Whole numbers exact; fractions to 1/64 px.

#### Counting the entries: negative indices and the end's check without writing `--dcss-array-length`

`.dcss-track-count` on the array: the grid works the count out from its last child's place (`:nth-child`), up to 360,359 entries, any number of entries: 40 entries, `-1`, `-40`, the total and entry 35, every frame, both engines.

Same frame: yes. Exact.

#### Entry -i (from the end)

`--dcss-i: -1`.

Same frame: yes. Exact.

#### The sum of entries i to j, either order; -1 as the end; i = j

`--dcss-i: 2; --dcss-j: 4`; `--dcss-i: 1; --dcss-j: -1` is the total.

Same frame: yes. Exact.

#### Track i of a packed array, any length

`.dcss-array.dcss-packed` with `--dcss-tracks` (the track list, line names included: `[--dcss-x] 90px 70px`) and `--dcss-array-length` for the end; without it -1 is the last track.

Same frame: yes. Exact.

#### The i-th slot named x: several arrays in one grid

`--dcss-l3: --dcss-x` on the array; `--dcss-of: --dcss-x` on the reader or the array; `--dcss-j` counts slots from there, named or not.

Same frame: yes. Exact.

#### Two numbers an entry: --dcss-value and --dcss-value-y of entry i, or column i and row r

`.dcss-array.dcss-xy` > children with `--dcss-n` and `--dcss-m` (or, packed, `--dcss-tracks` and `--dcss-tracks-y` on the array); the reader gets both; `--dcss-r` picks the row (unset: the row of `--dcss-i`), `--dcss-j` still a range of columns.

Same frame: yes, both numbers moving; readers in the port. Exact.

#### Entry i of a cyclic array, round either way

`.dcss-cycle` with `--dcss-tracks`, any number of tracks; readers are children and in flow.

Same frame: yes, forwards past the entries and backwards from -1. Exact.

#### Rank within a bin: 1 for the first child put in a bin, 2 for the next, to 32

`.dcss-bins` > children with `--dcss-bin`; what is inside gets `--dcss-bin` and `--dcss-rank`.

Same frame: yes, with a bin changing every frame. Exact to 32; 33 reads 1.

#### The largest number in a bin

`.dcss-bins.dcss-bin-max` > children with `--dcss-bin` and `--dcss-n`; a reader `.dcss-at` with `--dcss-i` the bin; a range sums the maxes.

Same frame: yes, with an item changing bin and number every frame. Exact.

#### How many bins hold something

`.dcss-bins > .dcss-track-count`; what is inside gets `--dcss-track-count`.

Same frame: yes, with an item moving every frame. Exact for bins up to the box's width in px.

#### Water filling: slot k reads min(cap k, level), the level what fills the width

`.dcss-array.dcss-packed` with `--dcss-tracks: minmax(0, cap 1) minmax(0, cap 2) ...`, the width is the water.

Same frame: yes, caps and width moving. To 1/64 px.

#### A sort: entry i in order of a key; the i-th smallest, the largest (-1), the sum of the smallest few; equal keys in markup order

`.dcss-array.dcss-sort` > children with `--dcss-key` (whole) and `--dcss-n`; readers as for child entries.

Same frame: yes, with a key moving past the others every frame. Exact.

#### How many bins in use are below a child's bin: its rank among the distinct bins, from 0

`.dcss-bins` (not max): a `<b class="dcss-below">` inside a child; what is inside it gets `--dcss-below`.

Same frame: yes, with an item moving every frame, so the bins in use change. Exact for bins up to the box's width in px.

#### First-fit packing: each child's column and row where it lands, rows from the top

`.dcss-pack` with `--dcss-columns` > children with `--dcss-w` (columns taken), a `.dcss-where` in each; what is inside its `<u>` gets `--dcss-column` and `--dcss-row`.

Same frame: yes, with two spans changing every frame. Exact.

#### Where a child is: its offset from the grid's top-left; in an array of child entries, the sum of the entries before it

A `<b class="dcss-where"><u><u></u></u></b>` inside a child of an array, bins, shares, pack, sort, map or slide; what is inside the `<u>` gets `--dcss-x` and `--dcss-y`.

Same frame: yes, with entries, shares and widths moving. Exact (1/64 px with fractions).

#### Places in a sort: 1 for the smallest key, equal keys in markup order

`.dcss-sort` > children with `--dcss-key` and a `.dcss-where`; what is inside its `<u>` gets `--dcss-place`.

Same frame: yes, with two keys moving past the others every frame. Exact.

#### A tile map: where each named area is and how big, and whether it is in the map

`.dcss-tiles` with `--dcss-columns`, `--dcss-rows` and `--dcss-areas` (the grid-template-areas strings, picked by state if you like) > children at `grid-area: name` with a `.dcss-where`; what is inside its `<u>` gets `--dcss-x`, `--dcss-y`, `--dcss-width`, `--dcss-height` and `--dcss-fits`.

Same frame: yes, with six maps (one invalid) switching every few frames. Exact, in tiles.

#### 2D packing around walls: each child of w x h tiles where first fit puts it, row by row from the top, around the map's named areas and the children before it; whether it fits in the map

`.dcss-tiles.dcss-pack` with a map: children at `grid-area: name` are walls, the others carry `--dcss-w` and `--dcss-h` and a `.dcss-where`; what is inside its `<u>` gets `--dcss-x`, `--dcss-y`, `--dcss-column`, `--dcss-row` and `--dcss-fits`.

Same frame: yes, with three maps switching and two spans moving every frame. Exact.

#### The push: boxes in order, each at the larger of its target and the end of the box before (1D non-penetration in one layout)

`.dcss-push` > children with `--dcss-h` (width) and `--dcss-target`, a `.dcss-where` in each; what is inside its `<u>` gets `--dcss-x`, the box's start.

Same frame: yes, with two targets and two widths moving every frame. Exact.

#### The push from the end: each box at the smaller of its target and the start of the box after less its width, none past the wall

`.dcss-push.dcss-end` with `--dcss-wall`, the same children. `.dcss-nested` on either nests the children in each other, each `<i>` holding its `.dcss-where` first and then the next child. It is 2x (Chrome) to 2.3x (WebKit) faster at 300 (vs-calc/trials/nested-push.mjs). It takes at most a few hundred children (HTML parsers stop nesting at 512 deep), and targets and ends under 65,536 px in the push.

Same frame: yes, the same. Exact.

#### Groups ranked by their totals: each group's bar at its total, sorted largest or smallest first (two stages in one frame)

`.dcss-ranked` with `--dcss-bins` (up to 16; up to 32 with the class `dcss-wide`) and `--dcss-desc: 1` for largest first. It holds first G `<b class="dcss-group"><b class="dcss-group-total"></b></b>`, then `<b class="dcss-bars">` holding G `<b>`, then the items with `--dcss-bin` and `--dcss-n`; `--dcss-key` under `--dcss-span` orders items inside a group. Each bar's top is its rank times `--dcss-band` (2 px), its left and right its group's total. `.dcss-bin-max` ranks each group's largest instead. A `<b>` in an item is its segment of its group's bar (a sorted stacked bar). A `<b class="dcss-labels">` after the bars holds a label a group, right-aligned to the box's start at its bar's top. For many items, `.dcss-copy` with `--dcss-copy-width` reads the ranks back once instead of a lookup a segment (up to 16 groups). After the items it takes `<b class="dcss-ranks"><b><div class="dcss-segments">`, holding G `<b class="dcss-group">` and the items again, each with its `<b>`; the first items then hold no `<b>`.

Same frame: yes, with the totals moving. Exact in Chrome, WebKit and Firefox.

#### Grouped sums: each child reads the sum of the earlier children in its group; an item after a group reads its total; with --dcss-n 1, counts

`.dcss-groups` > children with `--dcss-bin` and `--dcss-n` (whole, from 1), a `.dcss-where` in each; what is inside its `<u>` gets `--dcss-y` (the sum before it) and `--dcss-x` (the bin less 1).

Same frame: yes, with two values moving every frame. Exact.

#### The most intervals at one point; each interval's lane (interval colouring, first fit by start)

`.dcss-overlap` > children with `--dcss-i` (start, whole, from 1) and `--dcss-span` (length), a `.dcss-where` in each; a `.dcss-track-count` in the grid gets `--dcss-track-count`, what is inside a child's `.dcss-where` `<u>` gets `--dcss-y` (its lane from 0).

Same frame: yes, with two intervals moving every frame. Exact.

#### Next-fit lines: how many lines a row of widths takes, each child's line and its place on it

`.dcss-lines` with `--dcss-columns` (the row's width) > children with `--dcss-n`, a `.dcss-where` in each; `.dcss-track-count` gets the lines, a child's `.dcss-where` `--dcss-y` (its line from 0) and `--dcss-x` (before it on the line).

Same frame: yes, with a width moving every frame. Exact.

#### Column and row maxima of a matrix, from one grid

`.dcss-array.dcss-xy.dcss-cells` > children with `--dcss-i` (column), `--dcss-r` (row), `--dcss-n` (width) and `--dcss-m` (height); a reader with `--dcss-i` and `--dcss-r` gets the column's widest as `--dcss-value` and the row's tallest as `--dcss-value-y`.

Same frame: yes, with entries moving. Exact.

#### Entries at any depth in a bins max

`.dcss-bins.dcss-bin-max` > `.dcss-nest` wrappers (subgrids over every column, no padding) > ... > `<i>` with `--dcss-bin` and `--dcss-n`.

Same frame: yes. Exact.

#### Search in a sort: how many keys are below a key, up to it, equal to it, and whether any is

`.dcss-sort` with a `.dcss-lo` probe before the entries and a `.dcss-hi` probe after, both with the key; inside `.dcss-lo`'s `.dcss-where` `--dcss-lower`, inside `.dcss-hi`'s `--dcss-upper`, inside a `.dcss-between` in `.dcss-hi` `--dcss-frequency` and `--dcss-member`.

Same frame: yes, with the key moving over absent, present and end keys and an entry moving. Exact.

#### A key range: which entries have a key in [from, to], as a bit mask and the six highest bits; many queries over one row

`.dcss-key-range` > `<i style="--dcss-key: k; --dcss-bit: b">` (b 1 to 19) and queries `<b class="dcss-in" style="--dcss-from: f; --dcss-to: t; --dcss-not: b"><b><u><u></u></u></b></b>`; an entry and its query may share a `<div>` (display: contents); `.dcss-key-range.dcss-mask` for the mask alone (no top bits).

Same frame: yes. Exact, keys and bounds moving, any whole keys, 19 bits.

#### A window: entries counted from a moving start

A `<b class="dcss-window">` with `--dcss-i` and `--dcss-span` in the port of an array; readers inside it (`--dcss-i: 1` its first, `-1` its last, ranges).

Same frame: yes, with the window moving every frame. Exact.

#### A keyed map: the largest number written at any whole key

`.dcss-map` > children with `--dcss-key` and `--dcss-n`; a reader `.dcss-at` with `--dcss-key`.

Same frame: yes, with a key and a value moving every frame. Exact; an unused key, or one outside `--dcss-min-key` .. `--dcss-max-key` (±1000 by default), reads 0; keys to ±20,000 checked.

#### Formulas: sums, maxima, constant factors, min and difference, any depth, over numbers and whole computations

`.dcss-width-sum`, `.dcss-largest`, `.dcss-scale`, `.dcss-width-min` (with `.dcss-rest`), `.dcss-stack`, `.dcss-tallest`, leaves with `--dcss-n`, readers `.dcss-at` in any node; see Formulas.

Same frame: yes (check 46). Exact within 6 digits through `var()`.

#### A second and a third pass in one grid: rows sized from sums of columns, a column from sums of rows

In the port of an array: `<b class="dcss-hop">` with `--dcss-i`, `--dcss-j` (the columns it reads) and `--dcss-r` (its row). Its `<u>` gets `--dcss-value` (the span's sum) and sets `--dcss-put` (any style function of it; unset, the sum itself), and the row is as tall as its largest hop. `<b class="dcss-hop-y">` with `--dcss-i`, `--dcss-j` (rows) and `--dcss-r` (its column after the entries; needs `--dcss-array-length`) does the same in the other axis. The readers are `.dcss-at-y` (rows `--dcss-i` to `--dcss-j`) and `.dcss-at-x` (hop columns).

Same frame: yes, entries moving (check 60). Exact on whole px; a written `--dcss-put` floors to 1/64 px.

#### A sum of whole numbers, a max of sums, f(k) by a lookup table, without a grid

`<b class="dcss-text">` with the author's counters (`counter-reset`) and `--dcss-text: counter(a, dcss-tally) counter(b, dcss-tally)` (`'\\a'` between lines); `dcss-table` and `.dcss-sq`, `.dcss-sqrt` or `--dcss-font` for f; the inner `<u>` of `<u><u></u></u>` gets `--dcss-value`; see Text.

Same frame: yes (check 61). Exact.

#### Prefix sums: each entry the sum so far, and the sum before it

`.dcss-scan` > entries `<i style="--dcss-n: 12"></i>`, then readers `<b class="dcss-at" style="--dcss-i: k"><u></u></b>` (k 1 to the length, whole). The `<u>` gets `--dcss-value`, the sum of entries 1 to k, and `--dcss-before`, the sum of entries 1 to k - 1. A reader whose k never changes can be placed by `style="grid-area: 1 / 1 / span k / span k"` instead.

Same frame: yes (checks 61, 66). Exact, whole numbers.

#### Signed extremes: max(positives) + min(negatives) of any number of signed numbers; laid-out widths times factors in the same collapse, and through scopes two laid-out widths in one (a difference p1 W1 - p2 W2); as a child of a `.dcss-stack` or `.dcss-tallest` it counts there as its value, with no reader

`.dcss-collapse` > formula children (floated: they give the width W and stay out of the margins). They are `<i style="--dcss-n: x">` (signed px) or `--dcss-p: p` (p% of the width it sits in), `<b class="dcss-scope">` (a box with its own margin and its own laid-out width, nesting), and a `<b class="dcss-at"><u></u></b>`. Numbers run from -10,000 up.

Same frame: yes (checks 63, 64). Exact.

#### max(0, A - B) of two laid-out widths as a width, with no reader; so min(a, b) and |a - b| on the width side too

`<div class="dcss-minus">A<b>B</b></div>` (A and B width nodes; B under 2^20 px); `min` = minus(a + b, max(a, b)), `abs` = minus(a, b) + minus(b, a).

Same frame: yes. Exact, inputs moving, in a sum, a collapse, a least, a scale, two deep.

#### A height as a width, live: what a .dcss-width-min, a collapse or a stack is, laid on as a width

`<div class="dcss-width-sum"><b class="dcss-turn"><b><b>H</b></b></b></div>`, with `--dcss-turn-tick` (and `--dcss-turn-tick-2`) on a box around it changing whenever an input under it does.

Same frame: yes. Exact, inputs moving, nested, under .dcss-largest, .dcss-width-min, a collapse; idles at rest.

#### A factor in flow: f x a laid-out size, counted by whatever contains it

`.dcss-zoom` with `--dcss-zoom: f` on a node or a leaf; nests.

Same frame: yes (check 63). To 1/64 px a zoomed length (exact for quarters, eighths ...); f > 0.

#### Baselines: a row of max(a) + max(d), and each item handed max(a) - a_j

`.dcss-baseline` > `<i style="--dcss-n: a; --dcss-m: d">` (a `.dcss-where` inside an item reads `--dcss-y`), a reader for the row.

Same frame: yes (check 63). Exact.

#### The best contiguous split into K parts: the least possible largest part

`.dcss-columns` with `--dcss-parts: K` > `<i style="--dcss-n: h">`; for WebKit two copies in a `.dcss-alternate` with `--dcss-parity` flipped at each change, its reader reading the copy shown.

Same frame: yes (check 63). Exact.

#### Flex shares: weights, shrink, floors and caps in one layout

`.dcss-flex` (a width) > `<i style="--dcss-n: start; --dcss-grow: g; --dcss-shrink: s; --dcss-flex-min: lo; --dcss-flex-max: hi">`; what is inside an `<i>` reads its width.

Same frame: yes (check 63). To 1/64 px.

#### Sliding-window maxima: the largest of the --dcss-span entries ending at entry j

`.dcss-slide` with `--dcss-span` > children with `--dcss-n`, then readers `.dcss-at` with `--dcss-i`.

Same frame: yes, with two entries moving every frame. Exact.

#### Fair shares with floors: each child gets max(floor, weight x level), the level what fills the width

`.dcss-shares` with a width > children with `--dcss-n` (the floor) and `--dcss-w` (a whole weight, 1 by default); what is inside a child gets `--dcss-value`.

Same frame: yes, a floor and the width moving. To 1/32 px.

#### d3's axis and d3-array's ticks, tickIncrement, tickStep and nice: a range's ticks as d3 picks them, drawn and labelled as d3.axisBottom draws them

`.dcss-axis-bottom` (`-top`, `-left`, `-right`) or `.dcss-ticks` (not drawn) with `--start`, `--stop`, `--count`, an `<li>` a tick: each `<li>` gets `--dcss-tick` and `--dcss-tick-at`, the list `--dcss-tick-step`, `--dcss-tick-increment`, `--dcss-tick-count`. `.dcss-nice` with the same three gets `--dcss-nice-start` and `--dcss-nice-stop`.

Same frame: yes: calc(), no layout. Equal to d3's answer on all 254 calls d3-array's tests make with finite numbers; places within 1/32 px of d3's axis and labels the same pixels as d3's text.

<!-- /primitives -->

### Packed maps

`.dcss-map.dcss-packed` keeps many values in one CSS track list, with no element per entry. Write the list in `grid-template-columns` on the map, which is fastest, or in `--dcss-tracks`:

```html
<div class="dcss-map dcss-packed" style="--dcss-min-key: -2; --dcss-max-key: 2;
  grid-template-columns: minmax(12px, max-content)
            minmax(0px, max-content)
            minmax(calc(var(--amount) * 1px), max-content)
            repeat(2, minmax(0px, max-content));">
  <b class="dcss-out">
    <b class="dcss-at" style="--dcss-key: 0"><u><!-- --dcss-value and --dcss-ok --></u></b>
  </b>
  <i style="--dcss-key: var(--moving-key); --dcss-n: var(--moving-value)">
    <b class="dcss-at"><u><!-- reads the entry's current key --></u></b>
  </i>
</div>
```

- Track 1 is `--dcss-min-key`, and each track after it the next whole key. The bounds are inclusive and can change; changing the minimum relabels every track.
- Each track is `minmax(<length>, max-content)`, 1px for 1: `calc(number * 1px)` for numbers, `repeat(n, minmax(0px, max-content))` for gaps, `max(...)` inside the length for duplicate keys. Tracks left off the end are 0, and `--dcss-tracks: none` is an empty map. `fr`, percentages, `auto`, `subgrid` and auto-repeat don't work here.
- Child entries work beside the list: a key reads the largest of its track and every child at that key. Children outside the bounds are left out. A key outside the bounds reads 0 with `--dcss-ok` 0; an empty key inside them reads 0 with `--dcss-ok` 1.
- A packed map is at least `max-content` wide, so duplicates stay exact under a narrow `width`: clip it with a wrapper.
- A track has no element, so an entry that needs content inside it, or a key that changes, stays an `<i>`.

### Formulas

A formula is nested boxes: layout works out each box's size from its children's, and a reader turns a box's size back into a number, in the same frame. The stylesheet stays the same whatever the formula.

| Node | Markup | Its value |
|---|---|---|
| a leaf | `<i style="--dcss-n: 12"></i>` | 12: that many px wide (in a `.dcss-stack` or a `.dcss-tallest`, that many px tall) |
| a computation as a leaf | an `.dcss-array`, `.dcss-map`, `.dcss-bins.dcss-bin-max`, `.dcss-sort` or `.dcss-slide` among a node's children | its width: an array's total, a map's largest `--dcss-n` at each key summed, the largest in each bin summed, a sort's count of entries, each column's window maximum summed |
| `.dcss-width-sum` | children side by side | the sum of their widths |
| `.dcss-largest` | children in one column | the largest width |
| `.dcss-scale` | one child; `--dcss-k` an `fr` value of at most `1fr`, `--dcss-more` an `fr` value | (k + more) x the child: `--dcss-k: 0.5fr` halves, `--dcss-more: 1fr` doubles |
| `.dcss-cap` | a `<b>` holding E; `--dcss-c` a number (px) | min(E, c), as a width |
| `.dcss-width-min` | E1, then a `<b>` holding E2 and, if wanted, a `.dcss-rest` | as tall as min(E1, E2); a reader in its `.dcss-rest` reads max(0, E1 - E2) |
| `.dcss-times` | E (a width node or a leaf); `--dcss-f` a number more than 0 | f x E, as a height: into a `.dcss-stack` or `.dcss-tallest` |
| `.dcss-stack` | `.dcss-width-min` nodes, other heights, height leaves | the sum of their heights |
| `.dcss-tallest` | the same | the largest height |
| a reader | `<b class="dcss-at"><u></u></b>` as a child of any node | what is inside gets `--dcss-value`, the node's value, and `--dcss-ok` |
| a stage | a reader whose child has `style="--dcss-k1: var(--dcss-value)"` (`--dcss-k1` to `--dcss-k16`) | keeps the reader's value as `--dcss-k1` for everything inside it |
| `.dcss-calc` | `<b class="dcss-calc" style="width: calc(... anchor-size(--a width) ...)"><u><u></u></u></b>`, after the results it names | its width (any `calc()` of named results: x, /, min, max); the inner `<u>` gets `--dcss-value`; name it for the next |
| `.dcss-collapse` | formula children, `<i style="--dcss-n: x">` (signed px) or `--dcss-p: p` (p% of the width it sits in), `<b class="dcss-scope">` boxes, and a reader | max(positives) + min(negatives) of its margins, a height |
| `.dcss-minus` | `<div class="dcss-minus">A<b>B</b></div>` | max(0, A - B), a width |
| `.dcss-turn` | `<b class="dcss-turn"><b><b>H</b></b></b>` in a width node, `--dcss-turn-tick` on a box around it changed whenever an input under it changes | the height H, as a width |

- Widths add up through `.dcss-width-sum`, `.dcss-largest` and `.dcss-scale`. `.dcss-width-min` turns a minimum into a height, and heights add up through `.dcss-stack` and `.dcss-tallest`. A height becomes a width again through `.dcss-turn`, an `.dcss-hop-y` or a stage.
- A formula can be an entry of an `.dcss-array`, a `.dcss-map` or a `.dcss-bins.dcss-bin-max`, where it counts as its result. A reader can sit anywhere among a node's children, and a formula can sit inside any reader, using what it read as a leaf (`--dcss-n: var(--dcss-value)`).
- Every number is 0 or more. On the width side, a negative `--dcss-n` makes every reader above it read `--dcss-ok: 0` and `--dcss-value: 0`. For signed numbers, add an offset B to every leaf: a sum of k leaves then reads its total plus k x B.
- A formula is exact while every number passed through `var()` fits in 6 significant digits: whole numbers and eighths under 10,000, and values passed through a stage under 1,000 in eighths.
- `.dcss-scale`'s factors are written as `fr`s, since no CSS turns a computed number into one.

### Text

A number can be a CSS counter printed in a font whose glyphs draw nothing and are as wide as a table says. The text is then as wide as the numbers it prints, and a `<u>` over it reads that width back. The counters are the page's own, written with `counter-reset` and `counter-increment`; `--dcss-text` says what to print.

```html
<b class="dcss-text" style="counter-reset: a 12 b 40; --dcss-text: counter(a, dcss-tally) counter(b, dcss-tally)"><u><u></u></u></b>
```

| What | Markup | `--dcss-value` of the inner `<u>` |
|---|---|---|
| a sum | counters on one line | the sum: 52 above |
| a max | `'\a'` between counters: each line stands alone | the widest line: a max of sums |
| f(k) by a table | `counter(a, dcss-table)` (k from 0 to 999 as the glyph U+E000 + k) in `.dcss-text.dcss-sq` (round(k^2 / 1000)), `.dcss-sqrt` (round(sqrt(1000 k))) or `style="--dcss-font: dcss-name"` | the sum of f over the line; past 999 `dcss-table` prints the tally, so f = k there |
| a table's totals | `<tr style="counter-increment: a 12 b 7">` in a `<table style="counter-reset: a b">`, and texts printing `counter(a, dcss-tally)` | in a row, the total so far; after the rows (a `<tfoot>`), the total |
| a text in a grid | `<i class="dcss-text" style="...">` as an entry of an `.dcss-array`, `.dcss-bins.dcss-bin-max` or `.dcss-map`, or a leaf of a formula | (no reader of its own) its track or leaf is as wide as its text |
| two numbers by a table: min, max, a x b, \|a - b\|, a > b | a pair counter `counter-reset: p calc(64 * a + b + 65)` (a, b 0 to 31) printed by `counter(p, dcss-pair-min)`, `dcss-pair-max`, `dcss-pair-product`, `dcss-pair-difference` or `dcss-pair-greater` | g(a, b); pairs on one line add up, any mix of tables |
| a x b | `counter(a, dcss-unary)` (a glyphs of 1px) with `--dcss-each: b` (each glyph spaced b - 1 more) | a x b (b may be a fraction; the product fits six digits) |
| floor(a / b) | `.dcss-text.dcss-divide`, `counter(a, dcss-tally4) '\9'` with `--dcss-tab: b` | floor(a / b) |
| \|a - b\|, its sign, max(0, a - b) | a counter d = a - b (`counter-reset: d a; counter-increment: d calc(-1 * b)`) printed by `dcss-abs`, `dcss-sign` or `dcss-relu` | \|d\|, \|d\| + [d < 0], max(0, d) |
| two numbers from one read | `.dcss-text.dcss-two`, `counter(a, dcss-kilo) counter(b, dcss-tally)` (b 0 to 999) | `--dcss-high` a and `--dcss-low` b |
| a grid result looked up | `<u style="counter-reset: g round(var(--dcss-value))">` inside a grid's reader, a `.dcss-text` inside it printing `counter(g, dcss-table)` | f of the grid's result |

- `dcss-tally` prints any whole number as glyphs of 0, 1, 10, 100, 1,000, 10,000 and 30,000 px, so a number up to 999,999 takes at most 38 glyphs.
- Use whole numbers, 0 or more: counters are integers, so `round()` a computed one. The result fits six digits through `var()` and 33,554,428 px of layout; a table's keys run from 0 to 999.
- A text keeps its own type: your `letter-spacing` or `text-transform` doesn't reach it.
- `--dcss-text` can't be registered with `inherits: false`, and a `"` inside `style="..."` ends the attribute, so write `'\a'`.
- `.dcss-rom` reads f(k) at style time from a variable font, with no text: `<i class="dcss-rom dcss-sqrt" style="--dcss-k: 300"><u></u></i>` gives the `<u>` `--dcss-value: 548`. `.dcss-rom2` reads the five pair tables the same way. Spread many `.dcss-rom2` reads over several pages, or use the pair counters of `.dcss-text` instead: each distinct read is a font variation of its own, and Safari loads a page of many slowly ([Performance](#performance)).

### Loops and sheets

These run on dcss-store.css: their numbers are its stored cells (`[data-store]`), read by `[data-store-read]` and `[data-store-read-3]` elements that name the cells by `--store-of`. A loop is a while loop written by hand. Its cells are the items of one `.loop-flow`, which reads all of them, and one more cell under the flow keeps the clock and the total. The markup, with one `.loop-in` per cell:

```html
<div class="loop power">
  <div class="loop-flow" data-store-read>
    <div data-store-read-3 class="loop-in" style="--store-of: --x2; --store-of-2: --x4">
      <output id="--x3" for="--x2 --x4" aria-live="off" data-store class="loop-cell" style="--store-name: --x3; --store-start: 6000; --d: 3"></output>
    </div>
    ...
    <b class="loop-measure"><i data-store class="loop-core"></i></b>
  </div>
</div>
```
```css
.power .loop-cell { --next: round(80000 * (var(--in-a) + var(--d) * var(--store-value) + var(--in-b)) / max(1, var(--loop-total)));
                    --measure: calc(var(--in-a) + var(--d) * var(--store-value) + var(--in-b)); }
```

- `--next` is a cell's next value, and `--measure` what it adds to the total. Inside `.loop-flow` you can read `--loop-total`, `--loop-t` and `--loop-ok`; inside `.loop-in`, `.loop-in-2` and `.loop-in-3`, `--in-a` to `--in-i`, the values of the cells it names.
- `.loop` sets `--loop-period` (10), `--loop-compute` (3), `--loop-settle` (5) and `--loop-tolerance` (0). The loop stops for good when the largest change at the end of an iteration is at most `--loop-tolerance`.
- A loop can be a table: `<table class="loop">`, the row `<tr class="loop-flow" data-store-read>`, one `<td>` per cell and one for the core cell. A page has one loop, since the name `--loop` is fixed.

A sheet is a `<table class="sheet">` whose cells are stored numbers and whose formulas are rules on a class, one class per column:

```html
<td data-store-read-3 style="--store-of: --e2; --store-of-2: --rate">
  <b data-store class="interest" style="--store-name: --c3"><output class="money"></output></b></td>
```
```css
.interest { --store-next: round(var(--in-a) * var(--in-b) / 120000); }
```

- Inside a `[data-store-read-3]`, the cells it names are `--in-a`, `--in-b` and `--in-c`; a second one inside it gives `--in-d` to `--in-f`, and a third `--in-g` to `--in-i`.
- A fold reads a column into one number: elements with the class `sum`, `mean`, `max` or `min` name three cells each, nest up to four deep with the `<output>` innermost, and give `--fold` and `--fold-count`.
- An `<output>` shows its number in the format its class names: `money` (cents as 12.34), `int`, `pct`, `tenths`, `bp` (basis points as 7.50%) or `grade` (tenths of a point as a letter).

### Limits

- Entries are 0 or more, since a track can't be negative: add an offset for signed numbers. An array's sum stays under layout's range, about 33 million px.
- Compute from `--dcss-value`, never from `100cqw` directly: Chrome's `cqw` is a hair under a whole number.
- Ranks go to 32, and `.dcss-bins.dcss-bin-max` has 32 bins. A range that mixes a positive end with a negative one needs the end known: `.dcss-track-count`, or `--dcss-array-length`. A cyclic array's ranges go forwards only.
- An `.dcss-xy` array has as many rows as entries; a reader reads one row, and `--dcss-r` takes no range.
- A reader is placed against its grid, so nothing between them can have a transform, filter, perspective or containment of its own.
- Bins in use are counted up to the box's width in px. For the smallest number in a bin, take the max of a bound minus the number.
- A reduction's value is kept to 1/64. In Chrome, a list wider than 262,144 px (2^18) reads without its 64ths, and past 2^24 px without whole pixels. Up to 63 skipped items are counted.
- In Firefox, put `.dcss-calc` boxes and the results they name in a container as wide as its content (`width: max-content`): Firefox keeps an `anchor-size()` until the box is laid out again ([QUIRKS.md](QUIRKS.md) Q3).

## Browsers

Chrome and Safari both run everything: Chrome 155 and WebKit 26.4, headless, pass all 119 requirements in [SPEC.md](SPEC.md). The d3 calls give d3's own answer to 4,670 of the 7,049 calls d3's tests make (66%), and cover 69 of d3's 508 functions in full; SPEC.md's implementation report has the count for each call. Easings and scales come within 1e-12 of d3. A treemap's boxes are within 2/64 px per level of d3's for totals up to 50,000; near a million, WebKit is 0.3 px off and Chrome 0.02 px.

Firefox 158 computes `calc()` in 32-bit floats, so the calls that need a double's exact digits (exact sums, dates, colors, most formatting) give wrong answers there, and it has no view timelines, which loops and sheets need. It passes 57 of the 119 requirements. `@function` runs only in Chrome: WebKit 26.4 and Firefox 158 don't parse it, and the classes work everywhere. [QUIRKS.md](QUIRKS.md) has the engine bugs the sheet works around.

## Performance

The work happens in layout, in the frame a number changes. Chrome loads any one family in 40 ms or less. In WebKit, the median of three cold loads beside the core (2026-10-26):

| File in `families/` | Size | Load in WebKit 26.4 |
|---|---:|---:|
| `array.css` | 427 KB | 24 ms |
| `ticks.css` | 172 KB | 19 ms |
| `format.css` | 246 KB | 16 ms |
| `scale.css` | 89 KB | 12 ms |
| `ease.css` | 37 KB | 11 ms |
| `hierarchy.css` | 2.7 MB | 59 ms |
| `aggregate.css` | 4.0 MB | 76 ms |
| `order.css` | 1.8 MB | 42 ms |
| `extrema.css` | 956 KB | 27 ms |
| `color.css` | 3.1 MB | 59 ms |
| `color-text.css` | 3.7 MB | 75 ms |
| `date-parse.css` | 1.0 MB | 32 ms |
| `date-parse-local.css` | 1.1 MB | 30 ms |
| `time.css` | 1.6 MB | 37 ms |
| `date-format.css` | 88 KB | 12 ms |
| `geo.css` | 1.7 MB | 33 ms |
| `random.css` | 60 KB | 12 ms |

The core is 308 KB, 76 KB gzipped. Parts, gzipped, the median part of each family against the whole family:

| Family | Parts | A part | The family |
|---|---:|---:|---:|
| `array.css` | 35 | 4.4 KB (3.6–16) | 26 KB |
| `ticks.css` | 8 | 2.9 KB (0.5–8.4) | 13 KB |
| `format.css` | 9 | 3.3 KB (1.0–12) | 18 KB |
| `scale.css` | 6 | 2.1 KB (0.5–2.6) | 6.2 KB |
| `ease.css` | 38 | 0.4 KB | 2.1 KB |
| `color.css` | 22 | 5.1 KB (0.8–104) | 142 KB |
| `date-parse.css`, `date-parse-local.css` | 106 | 8.6 KB (0.5–20) | 42, 54 KB |
| `time.css` | 118 | 0.7 KB (0.5–16) | 90 KB |
| `date-format.css` | 82 | 5.9 KB | 7.5 KB |
| `geo.css` | 22 | 1.6 KB (0.5–30) | 76 KB |
| `aggregate.css` | 6 | 46 KB (44–158) | 223 KB |
| `order.css` | 6 | 47 KB | 82 KB |
| `extrema.css` | 12 | 36 KB | 40 KB |
| `color-text.css` | 3 | 113 KB (12–141) | 155 KB |

- The typed aggregates compute 20 slots whatever the length. With four values, an fsum update takes 3 ms in Chrome and 6 in WebKit at `data-dcss-capacity="4"`, against 39 and 76 at 20 slots.
- SI formatting is too slow for 30 outputs changing every frame.
- Sorting separate results with anchors (Recipes): 32 bars take 1.6 ms an update in Chrome and 2 in WebKit.
- Put changing numbers on the entries: 1,000 entries each animating its own `--dcss-n` take 13.6 ms a frame in Chrome and 16 in WebKit, against 32.0 and 54 with one changing number inherited from the grid.
- On an `.dcss-plain` array (whole indices from 1 to the length, nothing negative or fractional), readers skip the index math: a window max of 298 readers drops from 8.1 to 4.9 ms in Chrome and from 14 to 8 in WebKit.
- `.dcss-rom2` reads load slowly in Safari: all 5,120 pair-table entries on one page took 53.6 s to load in WebKit 26.4, against 0.5 s in Chrome 155; as five pages of 1,324 reads, each loaded in under 7 s (2026-10-22).
- A treemap's line drifts with its length: WebKit is 0.29 px off at 1,000 siblings.

Each grid primitive's cost, Chrome then WebKit: a frame's time with 300 readers less the same page without them, divided by 300, the numbers changing every frame, in µs unless written otherwise.

| Primitive | Cost |
|---|---|
| Entry i of an array of child entries | Chrome 6.3-6.5 µs a read, WebKit 9.1-9.6 |
| Counting the entries: negative indices and the end's check without writing `--dcss-array-length` | Chrome 8.2 µs a read, WebKit 29.3 |
| Track i of a packed array, any length | Chrome 5.5-5.8, WebKit 9.3-10.0 |
| The i-th slot named x: several arrays in one grid | Chrome 5.8-6.5, WebKit 6.2-10.6 |
| Two numbers an entry: --dcss-value and --dcss-value-y of entry i, or column i and row r | Chrome 7.9 µs a read (two numbers), WebKit 9.9 |
| Entry i of a cyclic array, round either way | Chrome 6.1-6.4, WebKit 11.1-12.2 (on these fixed-size tracks) |
| Rank within a bin: 1 for the first child put in a bin, 2 for the next, to 32 | Chrome 5.6-6.3, WebKit 9.8-10.1 |
| The largest number in a bin | Chrome 16.1 µs a child plus its reader, WebKit 25.9 |
| Water filling: slot k reads min(cap k, level), the level what fills the width | Chrome 4.2, WebKit 9.5 |
| A sort: entry i in order of a key; the i-th smallest, the largest (-1), the sum of the smallest few; equal keys in markup order | Chrome 5.5, WebKit 9.5 |
| How many bins in use are below a child's bin: its rank among the distinct bins, from 0 | Chrome 8.2, WebKit 15.2 |
| First-fit packing: each child's column and row where it lands, rows from the top | Chrome 19.6 an item with its where, WebKit 42.2 |
| Places in a sort: 1 for the smallest key, equal keys in markup order | Chrome 17.4 an entry with its where, WebKit 40.9 |
| A tile map: where each named area is and how big, and whether it is in the map | Chrome 32.5 a child with its where, WebKit 96.3 (the old sheet in the same harness: 124.1 against 118.1) |
| 2D packing around walls: each child of w x h tiles where first fit puts it, row by row from the top, around the map's named areas and the children before it; whether it fits in the map | Chrome 34.1 an item (25 maps of 12, switching), WebKit 107.3 (one map of 100: 5.9 ms a frame) |
| The push: boxes in order, each at the larger of its target and the end of the box before (1D non-penetration in one layout) | Chrome 26.8 a box with its where, WebKit 50.2 |
| The push from the end: each box at the smaller of its target and the start of the box after less its width, none past the wall | Chrome 24.2, WebKit 44.1 |
| Grouped sums: each child reads the sum of the earlier children in its group; an item after a group reads its total; with --dcss-n 1, counts | Chrome 20.1 an item (19.3 with values to 1,000), WebKit 39.9 (178 with values to 1,000) |
| The most intervals at one point; each interval's lane (interval colouring, first fit by start) | Chrome 5.3 an item (5.5 at 1,800), WebKit 13.3 (14.0 at 1,800) |
| Next-fit lines: how many lines a row of widths takes, each child's line and its place on it | Chrome 3.5 an item (3.7 at 1,800), WebKit 9.1 (9.4 at 1,800) |
| Search in a sort: how many keys are below a key, up to it, equal to it, and whether any is | Chrome 11.2 an element, WebKit 17.0 |
| A key range: which entries have a key in [from, to], as a bit mask and the six highest bits; many queries over one row | Chrome 3.1 ms for 100 queries over 19 entries, mask only (vs-calc range), WebKit 6 |
| A window: entries counted from a moving start | Chrome 8.8, WebKit 20.5 (the old sheet in the same harness: 16.2 against 18.8) |
| A keyed map: the largest number written at any whole key | Chrome 18.0 (300 keys over 20,000, every key in range), WebKit 63.1 (an earlier figure, 32.5, had 271 of 300 keys outside the range) |
| A second and a third pass in one grid: rows sized from sums of columns, a column from sums of rows | Chrome 7.6 µs a hop at 256, WebKit 23 |
| A sum of whole numbers, a max of sums, f(k) by a lookup table, without a grid | Chrome 1.13 ms for 256 numbers summed and looked up, WebKit 2.25 |
| Prefix sums: each entry the sum so far, and the sum before it | Chrome 2.5 ms for 300 entries, every sum read (150 readers, placed by grid-area; vs-calc prefix), WebKit 5.0 |
| Signed extremes: max(positives) + min(negatives) of any number of signed numbers; laid-out widths times factors in the same collapse, and through scopes two laid-out widths in one (a difference p1 W1 - p2 W2); as a child of a `.dcss-stack` or `.dcss-tallest` it counts there as its value, with no reader | Chrome 1.43 ms a chain of 256, WebKit 2.50 |
| A height as a width, live: what a .dcss-width-min, a collapse or a stack is, laid on as a width | Chrome 14.6 a turn, WebKit 40.7 |
| A factor in flow: f x a laid-out size, counted by whatever contains it | Chrome a dot product of 256: 2.57, WebKit 3.62 |
| Baselines: a row of max(a) + max(d), and each item handed max(a) - a_j | Chrome 1.56 a row of 256, WebKit 5.00 |
| The best contiguous split into K parts: the least possible largest part | Chrome 1.10 for 256 in 8 parts, WebKit 4.0 |
| Flex shares: weights, shrink, floors and caps in one layout | Chrome 1.91 for 256, WebKit 4.38 |
| Sliding-window maxima: the largest of the --dcss-span entries ending at entry j | Chrome 5.2, WebKit 6.4 |
| Fair shares with floors: each child gets max(floor, weight x level), the level what fills the width | Chrome 10.5 an entry, WebKit 13.4 |
| d3's axis and d3-array's ticks, tickIncrement, tickStep and nice: a range's ticks as d3 picks them, drawn and labelled as d3.axisBottom draws them | Chrome 0.42 ms a .dcss-ticks of 16, 1.17 a drawn axis, 0.84 a .dcss-nice, WebKit 0.74, 1.62 and 1.51 ms |

Formulas, an update forced:

| Cost | Chrome | WebKit |
|---|---|---|
| a chain of 250 nested `.dcss-width-sum` / `.dcss-largest` nodes | 0.37 ms | 1.1 ms |
| a stage, over 1 / 8 / 16 small arrays | 0.04 / 0.51 / 1.88 ms | 0.10 / 1.40 / 9.20 ms |
| 32 formulas needing one changing 100-entry array's total: one reader shared, or a copy in each | 0.90 / 14.8 ms | 2.0 / 28.0 ms |
| a page without formulas, 1,000 array readers | unchanged | unchanged |

Share a result through a reader rather than copy a computation into each formula, and keep stages few.

## Build

`dcss-array.css`, the families, `families.json` and `dcss-array-all.css` are written by `build.mjs`, and the `parts/` folder by `parts.mjs`, both in `libraries/dcss/` of the [noscript.ing repo](https://github.com/noscripting/noscript.ing).

## License

MIT, see the repository's LICENSE. The pages in `ports/` draw Observable Plot's test plots: `LICENSE-THIRD-PARTY` has Plot's ISC notice.

## Credits

- The calls follow [d3](https://d3js.org)'s functions, and are checked against the calls d3's own tests make.
- The ports draw [Observable Plot](https://github.com/observablehq/plot)'s test plots and compare against its snapshots.
- The coverage follows the [Array API Standard](https://data-apis.org/array-api/) 2025.12 and checks against [NumPy](https://numpy.org).
