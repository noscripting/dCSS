# dcss-array.css

dcss-array.css does the data work of d3, the JavaScript library for data charts, in HTML, with no script on the page. A sum is a `<figure>` around a list: the browser lays the list out, and the size of that layout is the answer. Change a number and the answer changes in the same frame. It works in Chrome and Safari.

Part of DCSS, Data-Driven CSS: stylesheets that do the data work d3 does in JavaScript. dcss-array does d3-array's job: sums, sorts, bins and search. With [dcss-store](https://github.com/noscripting/dcss-store), [dcss-loop](https://github.com/noscripting/dcss-loop) and [dcss-unround](https://github.com/noscripting/dcss-unround).

It is for pages where script can't run or isn't wanted: Markdown and CMS output, docs, feeds, a Content-Security-Policy that forbids script. It covers sums and statistics, ticks and axes, number and UTC date formatting, scales, easing, treemaps, UTC time intervals and map projections, each call written with d3's own names. Underneath them are grid primitives you can use directly: reads by index, sums over ranges, bins, sorts and search.

Visit [noscript.ing](https://noscript.ing) for demos.

## Installation

Each call is a file of its own in `parts/`, named after its class. Download the ones the page uses and link them; nothing else is needed. This page prints the total and the average of three numbers, with two parts that come to 6 KB gzipped:

```html
<!doctype html>
<link rel="stylesheet" href="parts/dcss-mean.css">
<link rel="stylesheet" href="parts/dcss-format-fixed.css">

<figure class="dcss-mean" style="height: 1lh; overflow: clip">
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

<!-- families -->

| File in `families/` | Calls | Size, gzipped |
|---|---|---:|
| `ticks.css` | ticks, nice, the four axes, the identity scale's ticks | 10 KB |
| `array.css` | sum, count, mean, min, max, extent, length; ascending, descending; the index extrema; bisect, bisector; share; median, quantile and their indexes, the discrete scales, cumsum; bin; variance, deviation; the precision helpers; range | 20 KB |
| `hierarchy.css` | slice, dice and slice-dice treemaps, partition | 0.9 KB |
| `scale.css` | linear, pow, sqrt, log, band and identity scales | 7.5 KB |
| `format.css` | format types f, %, s and general; a log scale's ticks and labels; an Arabic locale | 18 KB |
| `ease.css` | every d3-ease function | 2.9 KB |
| `time.css` | UTC time intervals: day, week, month, year, hour, minute, second | 15 KB |
| `date-format.css` | utcFormat in 41 formats | 4.2 KB |
| `geo.css` | identity, equirectangular, mercator, transverse mercator and stereographic projections, rotation, distance | 16 KB |

<!-- /families -->

`dcss-array-all.css` imports every family, for a page that needs all of them. `families.json` lists each file with its classes and sizes. Parts and families mix on one page, in any order. Link the core too for the grid primitives and text reads, and `dcss-array-extras.css` for the lists, loops and sheets (Reference), whose names have no `dcss-` prefix.

## Writing a call

Every call in the families works the same way. The class goes on a `<figure>`, never on the list, and is `dcss-` followed by d3's name in kebab case: d3.bisectLeft is `.dcss-bisect-left`. Its arguments are custom properties on the figure, named as d3 names them (`--start`, `--stop`, `--count`).

### The data

The data is the `<ul>` or `<ol>` inside the figure, one `<li>` per datum, each with its number as `--value`. A hierarchy is nested lists. Give each datum its own `--value`: it never takes its parent's. An item without one is skipped, as d3 skips a missing value, and the call answers as d3 does with `--dcss-err` 0: the sum, mean, count, min, max, extent, variance, bins and median, and the quantile at `--p` 0, 0.5 and 1. The quantile at any other `--p` and the median and quantile indexes give no answer. A value they can't take exactly, off the 1/64 grid (12.3 is not a 64th; 12.25 is) or past a call's range, leaves no answer and `--dcss-err` 1, never a rounded one: give tenths or cents as whole numbers and scale the answer.

A call lays its list out and measures it, so it sets the boxes of the list and its items itself. In a page that orders its CSS with `@layer`, link dcss unlayered or in the last layer: a rule on lists in a later layer (`ol { padding-inline-start: 1rem }`) beats dcss's and changes the answers with no error. A call measures across and down whatever the page's `writing-mode`, so in a vertical page its printed answer reads across.

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

Where the answer is a number, the element right after the list holds it. Its children and their pseudo-elements get the number as `--dcss-sum` (or the call's own name), and pass it down to everything inside them. The number is a `calc()` of whole numbers, which DevTools shows as written: to see it as a number, register a property (`@property --n { syntax: '<number>'; inherits: false; initial-value: 0 }`) and set `--n: var(--dcss-sum)`. An empty `<output>` there prints it. To use the number in another call, put a `<div>` after the list and the next call inside it.

The list is drawn at its answer: a sum is a staircase as wide as the sum and as tall as the count. Leave its items empty, since text in them spills over the result. To hide the drawing, give the figure a height and `overflow: clip`, as in Installation. Don't shrink or hide the list itself: its size is the answer, and an extent whose list is `height: 0` reads the wrong minimum.

A figure is as wide as its container. Where it would shrink to its content, in a flex row or an inline-block, it is 12em wide. The element after the list keeps its text on one line, and starts as wide as the drawing: align text in it to the start, since `text-align: right` moves a printed number to the drawing's far end. The sheet sets the display and size of the figure, its list, its items, the element after the list and the empty `<output>`'s `::after`; style the rest as you like.

Beside each result, `--dcss-ready` is 0 until the number is read, and `--dcss-err` is 0, or says why there is no answer.

#### When a call can't answer

A call that can't answer sets `--dcss-err` to 1 (an input it can't take: a value off the 1/64 grid or past its range) or 2 (d3 has no answer, as for the mean of nothing), and an `<output>` or formatter in error prints nothing. An item with no number is not an error: it is skipped, as d3 skips it. With no answer to give, a call publishes no number, so a call or formatter that takes its answer fails too, with nothing written between them. A number read straight from a result in error isn't d3's answer: a `counter()` of an index in error shows 0. To show a message instead, wrap the reading in one element inside the result and query its `--dcss-err`:

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

The page shows "Highest: item 1". Set an item past the call's range, `--value: 9000`, and it shows "no answer". Show the answer by default and hide it in error, as here. The other way round, hiding it until the call is ready and then showing it with a style query, leaves the number blank in Chrome ([Q11](QUIRKS.md#q11-chrome-counter-text-stays-empty-on-an-item-a-style-query-shows-again-inside-a-container-result)).

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
- Where both calls publish the same name, copy the outer one to a name of your own on an element between them: `--first: var(--dcss-median)`.
- In a form, keep calls outside an `<output>`. A form's reset [replaces an output's children with text](https://html.spec.whatwg.org/multipage/form-elements.html#the-output-element). Radios and checkboxes can pick values written in CSS; what someone types in an input doesn't reach CSS.

Numbers are kept as pixels: whole numbers up to 2^24, fractions to 1/64, totals under 33 million. Give money in whole cents and divide for printing with `.dcss-scale-linear` (see [Format](#format-familiesformatcss)), since 19.99 isn't a multiple of 1/64. In cents the mean takes nothing below -1024, -$10.24: for larger refunds, take the sum and divide it by the count with a scale.

### Medians, quantiles and the discrete scales

A median, quantile or quantileSorted reads its list once, through three nested elements written after it. Put what reads the answer in the innermost one:

```html
<figure class="dcss-median">
  <ol><li style="--value: 4"></li> <li style="--value: 1"></li> <li style="--value: 3"></li> <li style="--value: 2"></li></ol>
  <div><div><div>
    <output class="dcss-format-fixed" style="--value: var(--dcss-median); --precision: 1"></output>   <!-- 2.5 -->
  </div></div></div>
</figure>
```

The three elements measure the list in two places, one for each of the two middle values. Variance and deviation (`.dcss-variance`, `.dcss-deviation`) read their list through three nested elements the same way. What the innermost element holds is drawn out of the page's flow: the outer element keeps one line for it, so give the figure a height when the answer takes more.

A call takes another's answer as an input written straight inside it. A call that can't answer publishes no number, so the next one has none either: it fails too and its text stays hidden. This page chains a median, a precision helper and a formatter, and prints `1,234.6`:

```html
<figure class="dcss-median">
  <ol><li style="--value: .125"></li> <li style="--value: .25"></li> <li style="--value: .5"></li></ol>
  <div><div><div>
    <div class="dcss-precision-fixed" style="--step: var(--dcss-median)">
      <output class="dcss-format-fixed"
              style="--value: 1234.5678; --comma: 1;
                     --precision: var(--dcss-precision-fixed)"></output>
    </div>
  </div></div></div>
</figure>
```

A quantile scale reads its list once too, through four nested elements: one more than the median, since the fourth works out which range the query falls in, and what it holds gets the range. In full, with a list of three and two ranges (the answer is 1):

```html
<figure class="dcss-scale-quantile" style="--value: 3; --ranges: 2; --range-0: 0; --range-1: 1">
  <ol><li style="--value: 1"></li> <li style="--value: 2"></li> <li style="--value: 4"></li></ol>
  <div><div><div><div>
    <output class="dcss-format-fixed" style="--value: var(--dcss-scale-quantile); --precision: 0"></output>
  </div></div></div></div>
</figure>
```

A bare `<output>` there shows the range as it is, text included.

A threshold or quantize scale takes no list and no wrappers: everything inside it reads the answer. A threshold scale's thresholds are `--domain-0` to `--domain-15`, in order (d3's 0.5 when there are none); a quantize scale splits `--domain-0` to `--domain-1` (0 and 1 by default) into `--ranges` equal parts. This page prints `mid`:

```html
<figure class="dcss-scale-threshold" style="--value: 0.5; --domain-0: 0.25; --domain-1: 0.75;
        --ranges: 3; --range-0: 'low'; --range-1: 'mid'; --range-2: 'high'">
  <output></output>
</figure>
```

Thresholds out of order or with a gap are refused with error 1, since d3 takes them sorted.

Cumsum takes a second list after its values, one item per value: everything inside the i-th item reads the i-th running total as `--dcss-cumsum`. This page prints 1, 3 and 6:

```html
<figure class="dcss-cumsum">
  <ol><li style="--value: 1"></li> <li style="--value: 2"></li> <li style="--value: 3"></li></ol>
  <ol><li><output class="dcss-format-fixed" style="--value: var(--dcss-cumsum); --precision: 0"></output></li>
      <li><output class="dcss-format-fixed" style="--value: var(--dcss-cumsum); --precision: 0"></output></li>
      <li><output class="dcss-format-fixed" style="--value: var(--dcss-cumsum); --precision: 0"></output></li></ol>
</figure>
```

Bins (`.dcss-bin`) take a second list the same way, one item per bin, each reading its bin's count and bounds.

To give a call the answer of a call of its own kind (a precision helper on another's result), set the input on a plain element between them: written on the call itself, it would read that call's own answer.

## Writing a call in MathML

A call can also be written in Content MathML, the W3C's markup for what a formula means, and compiled before the page is served by `mathml.mjs`, a Node script beside the sheets that needs nothing else: `node mathml.mjs page.html > built.html`, or `import { toDcss } from 'dcss-array.css/mathml.mjs'` in a program. Browsers don't draw Content MathML and CSS can't read it, so the build writes each formula as a `calc()` the browser computes.

```html
<math display="block"><apply><median/>
  <apply><mean/><cn>120</cn><cn>80.5</cn></apply>
  <apply><mean/><cn>90</cn><ci>feb</ci></apply>
  <cn>100</cn>
</apply></math>
```

The build writes a figure whose caption is the formula, median(mean(120, 80.5), mean(90, feb), 100), in Presentation MathML, which browsers draw and screen readers read, with the Content MathML kept as its annotation; then an `<output>` whose `--value` is the formula as one `calc()`, printed by the formatter the `<math>` names (its class and settings, as in [Format](#format-familiesformatcss)), or to six decimals with commas, as the calls print their own (d3.format(",.6~f")). `<ci>feb</ci>` reads `--feb` (a name is any CSS identifier, `𝑚` included): set it on an ancestor and the answer follows in the same frame. A name the page doesn't set, or sets to something that isn't a number, leaves no answer and `--dcss-err` 1.

| Content MathML | computes as |
|---|---|
| `<median/>`, `<csymbol cd="s_data1">median</csymbol>` | d3.median |
| `<mean/>`, `<csymbol cd="s_data1">mean</csymbol>` | d3.mean |
| `<min/>`, `<max/>`, or `<csymbol cd="minmax1">min</csymbol>` (`max`) of one `<csymbol cd="set1">set</csymbol>` | d3.min, d3.max |
| `<plus/>`, `<csymbol cd="arith1">plus</csymbol>`, two arguments or more | d3.sum |
| `<minus/>` (one argument or two), `<times/>`, `<divide/>`, `<power/>`, and arith1's `minus`, `unary_minus`, `times`, `divide`, `power` | JavaScript's `-`, `*`, `/` and `Math.pow` |
| `<root/>`, with a `<degree>` holding a whole `<cn>` from 2, or arith1's `root` | `Math.sqrt`, or `Math.pow(x, 1 / n)` |
| `<abs/>`, `<floor/>`, `<ceiling/>`, and rounding1's `floor`, `ceiling` | `Math.abs`, `Math.floor`, `Math.ceil` |

A formula is not laid out: the build sees every number, so the page's number is d3's own double, or JavaScript's for arithmetic, with no 1/64 grid and no range but a double's. 12.3 is 12.3, the mean of 1, 2 and 4 is 2.3333333333333335, and a formula inside a formula takes it as d3 composes calls. The build adds in d3's order, divides as IEEE does in each engine, and ranks a median's values against each other where the page sets them. With that default an answer from 9,007,199,255 up prints nothing, with error 1 (its millionths pass 2^53): give it `.dcss-format-si`.

Arguments are `<cn>` numbers (decimal; `type` integer, real, double, e-notation or rational) and `<ci>` names. The build stops with the file, line and reason, rather than write a page that shows a wrong or blank answer, on:

- an equation or a relation (`<eq/>`, `<lt/>`, `<and/>`): it says something about numbers rather than computing one;
- `<exp/>`, `<ln/>`, `<log/>` and the trigonometric functions: CSS's `exp()`, `log()` and `sin()` round otherwise than JavaScript's `Math`, so the page's number wouldn't be the one a script computes; `<factorial/>`, which CSS doesn't have;
- an operator with no d3 call: `<sum/>` binds a variable over limits, `<variance/>` and `<sdev/>` divide by n where d3 divides by n - 1, `<card/>` and a `set1` set drop repeated values;
- a qualifier (`<bvar>`, `<condition>`, `<lowlimit>`), `definitionURL`, or Content MathML outside an annotation that it can't compile, which browsers would show as nothing;
- a number that is no double: `INF`, past the largest double, a base other than 10, a rational whose parts pass 2^53;
- one `<ci>` alone, which MathML reads as a data set, and a name dcss reads itself (`value`, `dcss-*`);
- medians comparing more than 2,048 pairs of values the page sets, a median of 46 names or more: a list that long is a `.dcss-median` call ([Writing a call](#writing-a-call));
- a formula beside text in a `<p>`, since the figure would end the paragraph (a `<p>` holding only the formula is replaced).

A `<math>` without an `<apply>` is left as it is, the rest of the page is copied byte for byte, and the build run on its own output changes nothing. It links the sheets the formatter needs beside the page's link to dcss. Not yet: the quantile, variance and deviation, extent.

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

- **A histogram.** A `.dcss-bin` with `--count` gives d3's bins; draw each bar from an element in its bin's `<li>`, placed against the figure, since the `<li>`s themselves are the call's measuring grid and keep their own size. Eight scores in ten bins, bars 1, 2, 2, 2 and 1 high from 50 up:

  ```html
  <figure class="dcss-bin histogram" style="--domain-0: 0; --domain-1: 100; --count: 10">
    <ol aria-hidden="true">
      <li style="--value: 72"></li> <li style="--value: 85"></li> <li style="--value: 91"></li> <li style="--value: 64"></li>
      <li style="--value: 58"></li> <li style="--value: 77"></li> <li style="--value: 88"></li> <li style="--value: 69"></li>
    </ol>
    <ol>
      <li><b style="--i: 0"></b></li> <li><b style="--i: 1"></b></li> <li><b style="--i: 2"></b></li> <li><b style="--i: 3"></b></li> <li><b style="--i: 4"></b></li>
      <li><b style="--i: 5"></b></li> <li><b style="--i: 6"></b></li> <li><b style="--i: 7"></b></li> <li><b style="--i: 8"></b></li> <li><b style="--i: 9"></b></li>
    </ol>
  </figure>
  <style>
    .histogram { position: relative; height: 100px; }
    .histogram b { position: absolute; bottom: 0; left: calc(var(--i) * 10%); width: 9%;
                   height: calc(var(--dcss-bin-length) * 20px); background: steelblue; }
  </style>
  ```

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

Each table lists the names a page sets and reads: the classes, their inputs and their results. [SPEC.md](SPEC.md) has every input's exact range and what happens outside it. In the d3 calls, `--dcss-ready` is 1 once the answer is read, and `--dcss-err` is 1 for an input the call can't take and, in most calls, 2 where d3's own answer is undefined or NaN; either way the number is hidden and the call's text prints nothing.

Calls by family: [Array](#array-familiesarraycss), [Ticks](#ticks-familiestickscss), [Format](#format-familiesformatcss), [Scale](#scale-familiesscalecss), [Ease](#ease-familieseasecss), [Hierarchy](#hierarchy-familieshierarchycss), [Time](#time-familiestimecss), [Date format](#date-format-familiesdate-formatcss), [Geo](#geo-familiesgeocss). The grid primitives: [Grid markup](#grid-markup), [Outputs](#outputs), [Primitives](#primitives), [Packed maps](#packed-maps), [Formulas](#formulas), [Text](#text), [Loops and sheets](#loops-and-sheets), [Limits](#limits).

<!-- calls -->

### Ticks: families/ticks.css

#### `.dcss-axis-bottom`, `.dcss-axis-top`, `.dcss-axis-left`, `.dcss-axis-right`

Draws d3's axis for a linear scale, labelled in its tickFormat. Source: [d3.axisBottom](https://d3js.org/d3-axis#axisBottom), [d3.axisTop](https://d3js.org/d3-axis#axisTop), [d3.axisLeft](https://d3js.org/d3-axis#axisLeft), [d3.axisRight](https://d3js.org/d3-axis#axisRight).

```html
<ol class="dcss-axis-bottom" style="--start: 0; --stop: 87; --count: 10">
  <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
  <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
</ol>
```

| Input | Takes | Default |
|---|---|---|
| `--start`, `--stop` | the scale's domain |  |
| `--count` | how many ticks to aim for | 10 |
| `<li>`s | one per tick, up to 64; the spare ones are hidden |  |

Output: the drawn axis, as long as the list; on each `<li>`, `--dcss-tick` and `--dcss-tick-at`.

16 `<li>`s cover any 10-tick axis. The axis sets d3's `font: 10px sans-serif`, so an `em` on it or inside it is 10px: size it in px or `rem`. Set the range on an ancestor to share it, and in a rule when state changes it (`.chart:has(#zoom:checked) { --stop: 870 }`), since an inline style beats any rule.

#### `.dcss-ticks`

The same ticks, not drawn: place them yourself, `left: calc(var(--dcss-tick-at) * 100%)`. Source: [d3.ticks](https://d3js.org/d3-array/ticks#ticks), [d3.tickIncrement](https://d3js.org/d3-array/ticks#tickIncrement), [d3.tickStep](https://d3js.org/d3-array/ticks#tickStep).

| Input | Takes | Default |
|---|---|---|
| `--start`, `--stop`, `--count` | as an axis takes them | 10 ticks |

Output: on each `<li>`: `--dcss-tick`, its value, and `--dcss-tick-at`, its place from 0 to 1; on the list: `--dcss-tick-step`, `--dcss-tick-increment`, `--dcss-tick-count` and `--dcss-tick-precision`.

#### `.dcss-nice`

Rounds a domain out to nice numbers. Source: [d3.nice](https://d3js.org/d3-array/ticks#nice).

| Input | Takes | Default |
|---|---|---|
| `--start`, `--stop`, `--count` | the domain and the ticks to aim for | 10 ticks |

Output: `--dcss-nice-start` and `--dcss-nice-stop`, for everything inside.

To span a list's data, put an axis inside a `.dcss-nice` (`--start: var(--dcss-min); --stop: var(--dcss-max)`) inside an extent's result. It repeats d3's rounding 4 times, where d3 repeats it until the range settles.

#### `.dcss-identity-ticks`, `.dcss-identity-tick-format`

An identity scale's ticks, and an `<output>` that prints one at their precision. Source: [d3.scaleIdentity](https://d3js.org/d3-scale/linear#scaleIdentity).

| Input | Takes | Default |
|---|---|---|
| `--start`, `--stop` | the domain |  |
| `--source-count` | how many ticks to aim for; `--identity-count` overrides it | 10 |
| `<li>`s | up to 512 |  |

Output: on the list, `--dcss-tick-count`, `--dcss-identity-ticks-ready` and `--dcss-identity-ticks-error`; on each active `<li>`, its `--dcss-tick` and `--dcss-identity-item-ready`.

`.dcss-identity-tick-format` goes with `.dcss-format-fixed` on an `<output>` inside `.dcss-identity-ticks` whose `--value` is the tick.

### Array: families/array.css

The data is a list of `<li style="--value: n">` in a `<figure>` ([Writing a call](#writing-a-call)).

#### `.dcss-sum`

Adds the list's numbers, of any sign: the positives are laid out across and the negatives down, and the sum is the one less the other. A sum of 64ths is exact, so it is d3.fsum's too. Source: [d3.sum](https://d3js.org/d3-array/summarize#sum), [d3.fsum](https://d3js.org/d3-array/add#fsum).

```html
<figure class="dcss-sum">
  <ul><li style="--value: 12"></li> <li style="--value: -40"></li> <li style="--value: 30.5"></li></ul>
  <output></output>                  <!-- prints 2.5 -->
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid |  |

Output: `--dcss-sum`.

An item that isn't a number is skipped, as d3 skips it; a sum says nothing of it. A value off the 1/64 grid leaves no answer (error 1): the sum can't take it exactly.

#### `.dcss-mean`

Averages the list's numbers. The same list gives their sum, count and length. Source: [d3.mean](https://d3js.org/d3-array/summarize#mean).

```html
<figure class="dcss-mean">
  <ul><li style="--value: 120"></li> <li style="--value: -95"></li> <li style="--value: 140"></li></ul>
  <output></output>                  <!-- prints 55 -->
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, -1024 or more |  |

Output: `--dcss-mean`; `--dcss-sum`, `--dcss-count`, `--dcss-length`.

Each negative value is offset by 1024 and counted apart, up to 4,095 values. A value below -1024, or off the 1/64 grid, leaves no answer (error 1). An item that isn't a number is skipped, as d3 skips it; no numbers at all is d3's undefined, error 2.

#### `.dcss-count`

Counts the list's numbers. Source: [d3.count](https://d3js.org/d3-array/summarize#count).

```html
<figure class="dcss-count">
  <ul><li style="--value: 3"></li> <li style="--value: -2"></li> <li style="--value: 7"></li></ul>
  <output></output>                  <!-- prints 3 -->
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number |  |

Output: `--dcss-count`.

An item that isn't a number is skipped, as d3 skips it.

#### `.dcss-length`

Counts the list's items, numbers or not: d3's `array.length`. Source: this library.

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number |  |

Output: `--dcss-length`.

#### `.dcss-min`, `.dcss-max`, `.dcss-extent`

The least and greatest number of the list, or both. Source: [d3.min](https://d3js.org/d3-array/summarize#min), [d3.max](https://d3js.org/d3-array/summarize#max), [d3.extent](https://d3js.org/d3-array/summarize#extent).

```html
<figure class="dcss-extent">
  <ul><li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 3"></li></ul>
  <output></output>                  <!-- prints 3–40 -->
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, within ±131,072, or a whole number from -131,072 to 8,257,535 |  |

Output: `--dcss-min`, `--dcss-max`: an extent gives both, and its `<output>` prints `3–40`.

A value below -131,072, or off the 1/64 grid, leaves no answer (error 1). An item that isn't a number is skipped, as d3 skips it; no numbers is error 2.

#### `.dcss-ascending`, `.dcss-descending`

Compares two numbers set on the call. Source: [d3.ascending](https://d3js.org/d3-array/sort#ascending), [d3.descending](https://d3js.org/d3-array/sort#descending).

```html
<div class="dcss-ascending" style="--a: 1; --b: 2">
  <output class="dcss-format-fixed" style="--value: var(--dcss-ascending); --precision: 0"></output>   <!-- −1 -->
</div>
```

| Input | Takes | Default |
|---|---|---|
| `--a`, `--b`, on the call | numbers |  |

Output: `--dcss-ascending`, `--dcss-descending`: -1, 0 or 1.

#### `.dcss-min-index`, `.dcss-max-index`, `.dcss-least-index`, `.dcss-greatest-index`

The place, from 0, of the least or greatest number. Source: [d3.minIndex](https://d3js.org/d3-array/summarize#minIndex), [d3.maxIndex](https://d3js.org/d3-array/summarize#maxIndex), [d3.leastIndex](https://d3js.org/d3-array/summarize#leastIndex), [d3.greatestIndex](https://d3js.org/d3-array/summarize#greatestIndex).

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, within ±1024; up to 64 items |  |

Output: `--dcss-min-index`, `--dcss-max-index`, `--dcss-least-index`, `--dcss-greatest-index`; -1 for an empty list.

The first wins a tie. d3.scan is `.dcss-least-index`, but for d3's undefined where it gives -1.

#### `.dcss-least`, `.dcss-greatest`

The least or greatest number, as d3.least and d3.greatest give it with their default comparator. Source: [d3.least](https://d3js.org/d3-array/summarize#least), [d3.greatest](https://d3js.org/d3-array/summarize#greatest).

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, within ±1024; up to 64 items |  |

Output: `--dcss-least`, `--dcss-greatest`.

#### `.dcss-bisect-left`, `.dcss-bisect-right`, `.dcss-bisect`

Where the figure's `--value` goes in a sorted list. Source: [d3.bisectLeft](https://d3js.org/d3-array/bisect#bisectLeft), [d3.bisectRight](https://d3js.org/d3-array/bisect#bisectRight), [d3.bisect](https://d3js.org/d3-array/bisect#bisect).

| Input | Takes | Default |
|---|---|---|
| `--value`, on the figure | the number to place |  |
| `--value`, on each `<li>` | a number on the 1/64 grid, within ±1024; up to 64 items |  |
| `--lo`, `--hi` | the search range, `[lo, hi)` | 0 and the list's length |

Output: `--dcss-bisect-left`, `--dcss-bisect-right`; `.dcss-bisect` is right and also gives `--dcss-bisect`.

A bisect figure draws nothing and is one line tall, with its answer in it: give it no height or `overflow`. On an unsorted list the left variant counts the keys below the query: how many scored 80 or more is a count less `.dcss-bisect-left` at 80.

#### `.dcss-bisector-left`, `.dcss-bisector-right`, `.dcss-bisector`

d3.bisector(d => d.value): each datum's value as its `--value`. Source: [d3.bisector](https://d3js.org/d3-array/bisect#bisector).

| Input | Takes | Default |
|---|---|---|
| `--value`, on the figure | the number to place |  |
| `--value`, on each `<li>` | a number on the 1/64 grid, within ±1024; up to 64 items |  |
| `--lo`, `--hi` | the search range | 0 and the list's length |

Output: `--dcss-bisector-left`, `--dcss-bisector-right`, `--dcss-bisector` (right).

#### `.dcss-share`

Each item's fraction of the list's total. Source: this library.

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, 0 or more, at most 4,095; up to 64 items |  |

Output: inside an item's `.dcss-share-read > .dcss-share-result`: `--dcss-share` and `--dcss-total`.

#### `.dcss-median`, `.dcss-quantile`

The middle number of the list, or the one at any place `--p` between its least and greatest. Source: [d3.median](https://d3js.org/d3-array/summarize#median), [d3.quantile](https://d3js.org/d3-array/summarize#quantile).

```html
<figure class="dcss-quantile" style="--p: 0.75">
  <ol><li style="--value: 3"></li> <li style="--value: 1"></li> <li style="--value: 4"></li> <li style="--value: 2"></li></ol>
  <div><div><div><output class="dcss-format-fixed" style="--value: var(--dcss-quantile); --precision: 2"></output></div></div></div>   <!-- 3.25 -->
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, from -131,072 to 131,071, or a whole number from -131,072 to 8,257,535 |  |
| `--p`, on a quantile | a number, 0 to 1 |  |

Output: `--dcss-median`, `--dcss-quantile`, inside the third of three nested elements after the list ([Medians, quantiles and the discrete scales](#medians-quantiles-and-the-discrete-scales)).

0 to 64 values. An item with no number is skipped, as d3 skips it, by the median and by the quantile at `--p` 0, 0.5 and 1; at any other `--p` it leaves no answer. A value off the grid or past the range leaves no answer.

#### `.dcss-quantile-sorted`

A quantile of a list already sorted: the list taken in its order. Source: [d3.quantileSorted](https://d3js.org/d3-array/summarize#quantileSorted).

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, from -131,072 to 131,071, or a whole number from -131,072 to 8,257,535 |  |
| `--p` | a number, 0 to 1 |  |

Output: `--dcss-quantile-sorted`, read as a quantile's.

An item with no number leaves no answer where the quantile reads it, as in d3, and is passed over elsewhere.

#### `.dcss-median-index`, `.dcss-quantile-index`

The place, from 0, of the number a median or quantile takes. Source: [d3.medianIndex](https://d3js.org/d3-array/summarize#medianIndex), [d3.quantileIndex](https://d3js.org/d3-array/summarize#quantileIndex).

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, within ±131,072 |  |
| `--p`, on a quantile index | a number, 0 to 1 |  |

Output: `--dcss-median-index`, `--dcss-quantile-index`, read as a median's; -1 for no values.

Where several values equal the one at the index, d3's choice follows its quickselect ([5, 5, 5] gives 0, [4, 4, 4, 4] gives 2); these take the copy their order picks: values ascending, equal ones last place first, and at `--p` 0 or less the first place, as d3.minIndex. A value off the grid, or a `--p` that isn't a number, leaves no answer.

#### `.dcss-scale-threshold`

Maps `--value` to a range by thresholds. Source: [d3.scaleThreshold](https://d3js.org/d3-scale/threshold#scaleThreshold).

| Input | Takes | Default |
|---|---|---|
| `--value` | the query |  |
| `--domain-0` to `--domain-15` | the thresholds, ascending | 0.5 |
| `--ranges`, `--range-0` to `--range-16` | the range: 2 to 17 numbers or quoted text | 2; 0 and 1 |
| `--unknown` | the answer to a missing query |  |

Output: `--dcss-scale-threshold`, on everything inside the call.

#### `.dcss-scale-quantize`

Maps `--value` to a range by equal steps of its domain. Source: [d3.scaleQuantize](https://d3js.org/d3-scale/quantize#scaleQuantize).

| Input | Takes | Default |
|---|---|---|
| `--value` | the query |  |
| `--domain-0`, `--domain-1` | the domain | 0 and 1 |
| `--ranges`, `--range-0` to `--range-16` | the range: 2 to 17 numbers or quoted text | 2; 0 and 1 |
| `--unknown` | the answer to a missing query |  |

Output: `--dcss-scale-quantize`, on everything inside the call.

#### `.dcss-scale-quantile`

Maps `--value` to a range by the quantiles of the list. Source: [d3.scaleQuantile](https://d3js.org/d3-scale/quantile#scaleQuantile).

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, within ±131,072, or a whole number from -131,072 to 8,257,535 |  |
| `--value`, on the figure | the query |  |
| `--ranges`, `--range-0` to `--range-16` | the range: 2 to 17 numbers or quoted text | 2; 0 and 1 |
| `--unknown` | the answer to a missing query |  |

Output: `--dcss-scale-quantile`, inside the fourth of four nested elements after the list.

#### `.dcss-cumsum`

The running total of the list: a second list after the values, one `<li>` per value. Source: [d3.cumsum](https://d3js.org/d3-array/summarize#cumsum), [d3.fcumsum](https://d3js.org/d3-array/add#fcumsum).

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, within ±1024; up to 64 items |  |

Output: inside the second list's i-th `<li>`, the total of the first i values: `--dcss-cumsum`.

A missing value adds 0.

#### `.dcss-bin`

Counts the list's values in bins, as d3.bin() with a domain and thresholds or a count: a second list after the values has one `<li>` per bin, and everything in it reads that bin. Source: [d3.bin](https://d3js.org/d3-array/bin#bin).

```html
<figure class="dcss-bin" style="--domain-0: 0; --domain-1: 30; --threshold-0: 10; --threshold-1: 20">
  <ol><li style="--value: 3"></li> <li style="--value: 12"></li> <li style="--value: 15"></li> <li style="--value: 28"></li></ol>
  <ol>
    <li><output class="dcss-format-fixed" style="--value: var(--dcss-bin-length); --precision: 0"></output></li>   <!-- 1 -->
    <li><output class="dcss-format-fixed" style="--value: var(--dcss-bin-length); --precision: 0"></output></li>   <!-- 2 -->
    <li><output class="dcss-format-fixed" style="--value: var(--dcss-bin-length); --precision: 0"></output></li>   <!-- 1 -->
  </ol>
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--domain-0`, `--domain-1` | the domain: a value outside it isn't counted |  |
| `--threshold-0` to `--threshold-31` | the thresholds, ascending; one outside the domain is dropped, as d3 drops it |  |
| `--count` | in place of thresholds, d3's `thresholds(count)`: the domain's ticks for that count, those on its ends dropped; up to 32 ticks |  |
| `--value`, on each `<li>` of the first list | a number; up to 64 items |  |

Output: inside the second list's `<li>` for bin b: `--dcss-bin-length` (how many values it holds), `--dcss-bin-x0` and `--dcss-bin-x1`.

Write one `<li>` in the second list per bin, one more than the thresholds kept; an item past the last bin has no answer, and so does a call with no domain, a domain backwards, more than 64 values, or a count that gives more than 32 ticks. d3's default domain (the data's extent) and thresholds (Sturges' count) aren't taken: write them.

#### `.dcss-variance`, `.dcss-deviation`

The variance of the list's values and its square root, as d3.variance() and d3.deviation() give them (the sample variance, divided by n - 1): the list once, then three plain elements; what is in the third reads the answers. Source: [d3.variance](https://d3js.org/d3-array/summarize#variance), [d3.deviation](https://d3js.org/d3-array/summarize#deviation).

```html
<figure class="dcss-variance">
  <ul><li style="--value: 5"></li> <li style="--value: 1"></li> <li style="--value: 2"></li> <li style="--value: 3"></li> <li style="--value: 4"></li></ul>
  <div><div><div>
    <output class="dcss-format-fixed" style="--value: var(--dcss-variance); --precision: 1"></output>   <!-- 2.5 -->
  </div></div></div>
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number in 64ths from -1024 to 1024; an item with none is skipped, as d3 skips it; up to 64 items |  |

Output: inside the third element: `--dcss-variance` and `--dcss-deviation`.

The answer is the true variance rounded once, which d3's running sum gives in about a third of lists and misses by a few units in the last place in the others. Fewer than two numbers, more than 64 items, or a value outside the range give no answer. The figure is a line tall and clips: give it another height for more lines.

#### `.dcss-precision-fixed`, `.dcss-precision-prefix`, `.dcss-precision-round`

The precision d3.format needs for a step. Source: [d3.precisionFixed](https://d3js.org/d3-format#precisionFixed), [d3.precisionPrefix](https://d3js.org/d3-format#precisionPrefix), [d3.precisionRound](https://d3js.org/d3-format#precisionRound).

| Input | Takes | Default |
|---|---|---|
| `--step` | the step |  |
| `--value`, on a prefix | the value |  |
| `--max`, on a round | the largest value |  |

Output: `--dcss-precision-fixed`, `--dcss-precision-prefix`, `--dcss-precision-round`, on the element and inside it.

#### `.dcss-range`

The numbers from `--start` to `--stop` by `--step`, one per `<li>`. Source: [d3.range](https://d3js.org/d3-array/ticks#range).

| Input | Takes | Default |
|---|---|---|
| `--start`, `--stop`, `--step` | numbers | 0, the stop, 1 |

Output: on each `<li>`: `--dcss-range`, and `--dcss-range-ready` 0 once the range has ended.

Values are numbers on the grid: strings, objects, accessors and comparators aren't taken.

### Hierarchy: families/hierarchy.css

#### `.dcss-treemap-slice`, `.dcss-treemap-dice`, `.dcss-treemap-slice-dice`

d3.treemap() with that tile, after hierarchy.sum(): each `<li>` of a nested list laid out at its node's rectangle, in a figure of the size you give it. Source: [d3.treemapSlice](https://d3js.org/d3-hierarchy/treemap#treemapSlice), [d3.treemapDice](https://d3js.org/d3-hierarchy/treemap#treemapDice), [d3.treemapSliceDice](https://d3js.org/d3-hierarchy/treemap#treemapSliceDice).

| Input | Takes | Default |
|---|---|---|
| `--value`, on each leaf `<li>` | a number 0 or more; in slice-dice, on every inner `<li>` too, its subtree's sum |  |

Output: the `<li>`s, laid out: draw on them.

#### `.dcss-partition`

d3.partition(), up to 12 levels; the top band is the root's, so wrap the list in one `<li>` to draw it. Source: [d3.partition](https://d3js.org/d3-hierarchy/partition#partition).

```html
<figure class="dcss-partition" style="width: 640px; height: 240px">
  <ul>
    <li>Citrus <ul><li style="--value: 30">Orange</li> <li style="--value: 20">Lemon</li></ul></li>
    <li style="--value: 40">Apples</li>
  </ul>
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--value`, on each leaf `<li>` | a number 0 or more |  |

Output: the `<li>`s, laid out: draw on them.

The total can be from 64 to 2^31 times the figure's width in pixels (2.2 million at 960 px); under 64, the layout is narrower than the figure.

### Scale: families/scale.css

#### `.dcss-scale-linear`, `.dcss-piecewise`

Maps `--value` from a domain to a range, and back. Source: [d3.scaleLinear](https://d3js.org/d3-scale/linear#scaleLinear).

```html
<div class="dcss-scale-linear" style="--domain-0: 0; --domain-1: 100; --range-0: 32; --range-1: 212; --value: 21">
  21 °C is <output class="dcss-format-fixed" style="--value: var(--dcss-scale-linear); --precision: 1"></output> °F   <!-- 69.8 -->
</div>
```

| Input | Takes | Default |
|---|---|---|
| `--value` | the number to map |  |
| `--domain-0`, `--domain-1`, `--range-0`, `--range-1` | the two stops, set on the element or inherited | 0, 1, 0, 1 |
| `--stops`, `--domain-2` to `--domain-7`, `--range-2` to `--range-7` | with `.dcss-piecewise`: up to 8 stops | 2 |
| `--clamp`, `--round` | 1 for d3's clamp and rangeRound | 0 |

Output: `--dcss-scale-linear` and `--dcss-scale-linear-invert`, on the element and inside it.

Without `.dcss-piecewise` a scale takes two stops and is several times faster. Its ticks and nice are `.dcss-ticks` and `.dcss-nice` on its domain's two ends; its tickFormat is a `.dcss-format-fixed` with `--precision: var(--dcss-tick-precision)`, 2 less for `%`. Ranges of colours or dates, custom interpolators and inputs that aren't numbers aren't available. Where the browser has `@function`, `--dcss-scale-linear(x, d0, d1, r0, r1)` is the same scale as a function, then clamp and round (0 or 1): write a plain value before it for the browsers without, and guard one that uses `var()`, as for [the easings](#ease-familieseasecss).

#### `.dcss-scale-pow`, `.dcss-scale-sqrt`

A power scale, and its square root. Source: [d3.scalePow](https://d3js.org/d3-scale/pow#scalePow), [d3.scaleSqrt](https://d3js.org/d3-scale/pow#scaleSqrt).

| Input | Takes | Default |
|---|---|---|
| `--value`, the stops | as a linear scale takes them |  |
| `--exponent`, on pow | the exponent | 1 |

Output: `--dcss-scale-pow`, `--dcss-scale-pow-invert`; `--dcss-scale-sqrt`, `--dcss-scale-sqrt-invert`.

Functions: `--dcss-scale-pow(x, d0, d1, r0, r1, exponent)`, `--dcss-scale-sqrt(x, d0, d1, r0, r1)`.

#### `.dcss-scale-log`

A log scale, a negative domain as in d3. Source: [d3.scaleLog](https://d3js.org/d3-scale/log#scaleLog).

| Input | Takes | Default |
|---|---|---|
| `--value`, the stops | as a linear scale takes them |  |
| `--base` | the base | 10 |

Output: `--dcss-scale-log`, `--dcss-scale-log-invert`.

Its ticks and nice are `.dcss-ticks-log` and `.dcss-nice-log`. Function: `--dcss-scale-log(x, d0, d1, r0, r1)`.

#### `.dcss-scale-band`

With `.dcss-scale-linear`, on a figure: d3's bar chart, scaleBand across the `<li>`s and scaleLinear([0, max]) up. Source: [d3.scaleBand](https://d3js.org/d3-scale/band#scaleBand).

```html
<figure class="dcss-scale-band dcss-scale-linear" style="--padding: 0.1; width: 600px; height: 340px; padding: 30px 0 30px 40px">
  <ul><li style="--value: 0.08167">A</li> <li style="--value: 0.01492">B</li> <li style="--value: 0.02782">C</li></ul>
  <div><ol class="dcss-axis-left" style="--start: 0; --stop: var(--dcss-max)">
    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
  </ol></div>
</figure>
```

| Input | Takes | Default |
|---|---|---|
| `--value`, on each `<li>` | a number on the 1/64 grid, 0 or more |  |
| `--padding`, `--padding-inner`, `--padding-outer`, `--align` | the band scale's, as d3's; the outer at least half the inner | 0, 0, 0, 0.5 |

Output: the bars, each its `<li>`'s `::before`; the element after the list gets `--dcss-max`.

The figure is the plot and its padding the margins, so give it a width and a height. Each bar is steelblue unless you colour it, and the `<li>`'s text is its label, under the plot. The max is exact when it has 4 significant digits or fewer, so a max that falls on a tick stays on it.

#### `.dcss-scale-identity`

`--value` back, as d3.scaleIdentity gives it. Source: [d3.scaleIdentity](https://d3js.org/d3-scale/linear#scaleIdentity).

| Input | Takes | Default |
|---|---|---|
| `--value` | a number |  |

Output: `--dcss-scale-identity` and `--dcss-scale-identity-invert`, with `--dcss-scale-identity-ready` and `--dcss-scale-identity-error`.

Its ticks are `.dcss-identity-ticks`.

### Format: families/format.css

#### `.dcss-format-fixed`, `.dcss-format-percent`, `.dcss-format-si`

Prints `--value` into the element's `::after` as d3.format does with type `f`, `%` or `s`. Source: [d3.format](https://d3js.org/d3-format#format).

```html
<output class="dcss-format-fixed" style="--value: 1234.5; --precision: 2; --comma: 1"></output>   <!-- 1,234.50 -->
<output class="dcss-format-percent" style="--value: 0.234; --precision: 1"></output>             <!-- 23.4% -->
<output class="dcss-format-si" style="--value: 999.5; --precision: 3"></output>                   <!-- 1.00k -->
<output class="dcss-format-si" style="--value: 1234; --precision: 3; --trim: 1"></output>         <!-- 1.23k -->
```

| Input | Takes | Default |
|---|---|---|
| `--value` | a number, or another call's answer |  |
| `--precision` | d3's `.2`: decimal places for f and %, significant digits for s | 6 |
| `--comma`, `--sign`, `--symbol` | 1 for d3's `,`, `+` and `$` | 0 |
| `--trim` | 1 for d3's `~` | 0; 1 for SI and log labels |

Output: the text, in `::after`.

Fixed and percent round by the number's exact value, ties going up, as d3 does: 4.35 at one decimal is 4.3 (4.35 is a hair under it). The minus is d3's U+2212. SI picks its prefix after rounding, so `.3s` prints 999.5 as `1.00k`. A missing `--value`, such as an empty median's, prints nothing; so does a number past the format's range, with error 1. To divide before printing, use `.dcss-scale-linear` rather than `/` in `--value`: Safari computes `calc(a / b)` as `a × (1 / b)`, a bit off, so a tie can round the other way.

#### `.dcss-format-general`

d3's general format (no type): 12 significant digits, trailing zeros removed, in plain decimal notation. Source: [d3.format](https://d3js.org/d3-format#format).

```html
<output class="dcss-format-general" style="--value: 2.718281828459045"></output>                  <!-- 2.71828182846 -->
```

| Input | Takes | Default |
|---|---|---|
| `--value` | a number |  |
| `--precision` | significant digits | 12 |
| `--trim` | 0 to keep trailing zeros | 1 |

Output: the text, in `::after`.

#### `.dcss-ticks-log`, `.dcss-nice-log`, `.dcss-ticks-log-format`

A log scale's ticks and nice; with a formatter inside a `.dcss-ticks-log`, `.dcss-ticks-log-format` prints only where d3's log tickFormat prints. Source: [d3.scaleLog](https://d3js.org/d3-scale/log#scaleLog).

| Input | Takes | Default |
|---|---|---|
| `--start`, `--stop`, `--count` | the domain and the ticks to aim for | 10 ticks |
| `--base` | the base | 10 |

Output: as `.dcss-ticks` and `.dcss-nice`; `--dcss-tick-show` 1 where a label prints.

#### `.dcss-format-locale`, `.dcss-locale-arabic`

Arabic digits and separators for the specifier `$,.2f`, on `.dcss-format-locale.dcss-locale-arabic`. Source: [d3.formatLocale](https://d3js.org/d3-format#formatLocale).

| Input | Takes | Default |
|---|---|---|
| `--value` | a number |  |
| `--dcss-locale-precision`, `--dcss-locale-sign` | its precision and sign | 2, 0 |
| `data-dcss-locale-prefix`, `data-dcss-locale-suffix` | the currency affixes |  |

Output: the text, in `::after`.

### Ease: families/ease.css

#### `.dcss-ease-<name>`

d3-ease's functions in kebab case: `linear`; `quad-in`, `quad-out`, `quad-in-out`, and the same for `cubic`, `poly`, `sin`, `exp`, `circle`, `bounce`, `back` and `elastic`; and d3's short names (`.dcss-ease-quad` and so on), each the variant d3 aliases it to. Source: [d3.easeCubic](https://d3js.org/d3-ease#easeCubic).

```html
<span class="dcss-ease-cubic-in-out" style="--value: 0.25">
  <output class="dcss-format-fixed" style="--value: var(--dcss-ease-cubic-in-out); --precision: 4"></output>   <!-- 0.0625 -->
</span>
```

| Input | Takes | Default |
|---|---|---|
| `--value` | t |  |
| `--exponent`, `--overshoot`, `--amplitude`, `--period` | poly's exponent, back's overshoot, elastic's amplitude and period | 3, 1.70158, 1, 0.3 |

Output: `--dcss-ease-<name>`.

Where the browser has `@function`, each easing is also a function, the class's other inputs after t: `--dcss-ease-poly-in(0.5, 2)` is 0.25. A browser without `@function` drops a declaration that calls one with plain numbers, so write a plain value first; a call with `var()` among its arguments gets past that first check and fails later, so put it inside `@supports at-rule(@function)`: `.bar { width: 50%; } @supports at-rule(@function) { .bar { width: calc(--dcss-ease-cubic-in-out(var(--progress)) * 100%); } }`.

### Time: families/time.css

#### `.dcss-utc-<interval>-<op>`

d3's UTC time intervals on epoch milliseconds: `day` (unixDay too), `hour`, `minute`, `second`, `sunday` to `saturday`, `month` and `year`, each with five calls, `-floor`, `-ceil`, `-round`, `-offset` and `-count`. Source: [d3.utcDay](https://d3js.org/d3-time#utcDay).

```html
<!-- Links families/format.css too. 2023-11-14 22:13:20 UTC, floored to its day. -->
<span class="dcss-utc-day-floor" style="--value: 1700000000000">
  <output class="dcss-format-fixed" style="--value: var(--dcss-utc-day); --precision: 0"></output>   <!-- 1699920000000 -->
</span>
```

| Input | Takes | Default |
|---|---|---|
| `--value` | the time: within ±8×10¹² ms for day, hour, minute and second, ±8×10¹⁵ for the weekdays, ±8×10¹³ for month and year |  |
| `--step` | offset's step, to ±10,000 | 1 |
| `--start`, `--stop` | count's range |  |
| `--every` | a year period from 1 to 10,000, counted from year zero; count needs 1 | 1 |

Output: `--dcss-utc-<interval>`, such as `--dcss-utc-day`, on the call and everything inside it.

Round picks the later interval on a tie. A time or a result outside its range is error 1, and the number is hidden. Month and year offsets keep the day and time and overflow as Date's setters do, so January 31 plus a month is March 2 or 3. A fraction of a millisecond is dropped.

### Date format: families/date-format.css

#### `.dcss-date-format-N`

Prints the epoch milliseconds in `--value` as d3's English utcFormat does with specifier N of the list below. Source: [d3.utcFormat](https://d3js.org/d3-time-format#utcFormat).

| Input | Takes | Default |
|---|---|---|
| `--value` | the time, in years -9999 to 19999 |  |

Output: the text; inside the call, the numbers behind it: `--dcss-date-year`, `--dcss-date-month`, `--dcss-date-day`, `--dcss-date-hour`, `--dcss-date-minute`, `--dcss-date-second`, `--dcss-date-millis`, `--dcss-date-weekday`, `--dcss-date-iso-year`, `--dcss-date-iso-week`, `--dcss-date-week-sunday`, `--dcss-date-week-monday`.

Outside its years the text is hidden with an error.

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

### Geo: families/geo.css

#### `.dcss-geo-identity`, `.dcss-geo-equirectangular`, `.dcss-geo-mercator`, `.dcss-geo-transverse-mercator`, `.dcss-geo-stereographic`, `.dcss-geo-rotation`

Projects the point `--x`, `--y`. Source: [d3.geoIdentity](https://d3js.org/d3-geo/projection#geoIdentity), [d3.geoEquirectangular](https://d3js.org/d3-geo/cylindrical#geoEquirectangular), [d3.geoMercator](https://d3js.org/d3-geo/cylindrical#geoMercator), [d3.geoTransverseMercator](https://d3js.org/d3-geo/cylindrical#geoTransverseMercator), [d3.geoStereographic](https://d3js.org/d3-geo/azimuthal#geoStereographic), [d3.geoRotation](https://d3js.org/d3-geo/math#geoRotation).

| Input | Takes | Default |
|---|---|---|
| `--x`, `--y` | the point, within ±1e6 |  |
| `--scale` | from 0.001 to 10,000 | d3's |
| `--translate-x`, `--translate-y`, `--reflect-x`, `--reflect-y`, `--angle`, `--center-lambda`, `--center-phi`, `--rotate-lambda`, `--rotate-phi`, `--rotate-gamma` | d3's settings | d3's |

Output: `--dcss-geo-x`, `--dcss-geo-y`.

Shapes aren't clipped; polygons, lines and streams aren't available. Moving points are costly: see Performance.

#### `.dcss-geo-identity-invert`, `.dcss-geo-equirectangular-invert`, `.dcss-geo-mercator-invert`, `.dcss-geo-transverse-mercator-invert`, `.dcss-geo-stereographic-invert`, `.dcss-geo-rotation-invert`

Projects the point `--x`, `--y` back: d3's projection.invert. Source: [d3.geoMercator](https://d3js.org/d3-geo/cylindrical#geoMercator).

| Input | Takes | Default |
|---|---|---|
| `--x`, `--y`, the settings | as the projection takes them |  |

Output: `--dcss-geo-x`, `--dcss-geo-y`.

#### `.dcss-geo-identity-config`, `.dcss-geo-equirectangular-config`, `.dcss-geo-mercator-config`, `.dcss-geo-transverse-mercator-config`, `.dcss-geo-stereographic-config`

The settings back, as d3's getters give them. Source: [d3.geoMercator](https://d3js.org/d3-geo/cylindrical#geoMercator).

| Input | Takes | Default |
|---|---|---|
| the settings | as the projection takes them |  |

Output: `--dcss-geo-scale`, `--dcss-geo-angle`.

#### `.dcss-geo-mercator-extent`, `.dcss-geo-transverse-mercator-extent`

The clip rectangle, as projection.clipExtent gives it. Source: [d3.geoMercator](https://d3js.org/d3-geo/cylindrical#geoMercator).

| Input | Takes | Default |
|---|---|---|
| `--clip-enabled`, `--clip-x0`, `--clip-y0`, `--clip-x1`, `--clip-y1` | the clip rectangle |  |

Output: `--dcss-geo-clip-kind`, 0 for null and 1 with `--dcss-geo-clip-x0`, `--dcss-geo-clip-y0`, `--dcss-geo-clip-x1`, `--dcss-geo-clip-y1`.

#### `.dcss-geo-distance`

The great-circle distance between two points, in radians. Source: [d3.geoDistance](https://d3js.org/d3-geo/math#geoDistance).

| Input | Takes | Default |
|---|---|---|
| `--longitude-a`, `--latitude-a`, `--longitude-b`, `--latitude-b` | the points, in degrees |  |

Output: `--dcss-geo-distance`.

<!-- /calls -->

### Grid markup

- A grid is one computation. Its children, `<i>`, are the entries, the inputs. Its readers, `<b class="dcss-at"><u></u></b>`, are the outputs, and each reads the nearest grid around it.
- A reader goes in `<b class="dcss-out">`, the grid's first child, or inside an entry. In a grid with no child entries (a packed array, a cycle), it is a child of the grid.
- The results land on the `<u>` inside a reader and everything in it. That `<u>` is yours: put content there. Leave the entries, readers and `dcss-out` empty, since content in them can change what they read.
- A grid inside a reader's `<u>` reads its own entries, so one computation feeds the next in the same frame. Results only flow down: results of several entries reach another grid's entries a frame later, through dcss-store.css.
- Put changing numbers on the entries. A number that changes above a grid and is inherited through it restyles every reader, used or not.
- Every name `dcss-array.css` and the families use starts with `dcss-`, the calls' and its own grids', readers' and numbers' alike. The lists (`.list`, `.pager`, `--if`, `--page`), the loops (`.loop` and `.loop-*`) and the sheets (`.sheet` and the formats and folds below) are in `dcss-array-extras.css`, which a page links only when it uses them; its internal numbers include `--dcss-p-*`, and its anchor names are `--dcss-where`, `--dcss-lo` and `--dcss-hi`. A call's results aren't registered, so they keep any value you give them elsewhere.
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

Each kind of grid: the names it uses and what it computes; its markup is in the [SPEC.md](SPEC.md) requirement beside it, and what it gives in [Outputs](#outputs). Every one reads in the frame its numbers change, exact for whole numbers except where [Limits](#limits) says; [Performance](#performance) gives each one's cost.

<!-- primitives -->

| Names | What it computes | SPEC.md |
|---|---|---|
| `.dcss-array`, `--dcss-n`, `.dcss-at`, `--dcss-i`, `.dcss-out` | Entry i of an array of child entries | A1 |
| `.dcss-track-count` | Counting the entries: negative indices and the end's check without writing `--dcss-array-length` | A7 |
| `--dcss-i` | Entry -i (from the end) | A1, A10 |
| `--dcss-i`, `--dcss-j` | The sum of entries i to j, either order; -1 as the end; i = j | A2 |
| `.dcss-array`, `.dcss-packed`, `--dcss-tracks`, `--dcss-array-length` | Track i of a packed array, any length | A3 |
| `--dcss-tracks`, `--dcss-of`, `--dcss-i`, `--x`, `--dcss-j` | The i-th slot named x: several arrays in one grid | A4 |
| `.dcss-array`, `.dcss-xy`, `--dcss-n`, `--dcss-m`, `--dcss-tracks`, `--dcss-tracks-y`, `--dcss-r`, `--dcss-i`, `--dcss-j` | Two numbers per entry: --dcss-value and --dcss-value-y of entry i, or column i and row r | A6, A9 |
| `.dcss-cycle`, `--dcss-tracks` | Entry i of a cyclic array, round either way | A5 |
| `.dcss-bins`, `--dcss-bin` | Rank within a bin: 1 for the first child put in a bin, 2 for the next, to 32 | A15 |
| `.dcss-bins`, `.dcss-bin-max`, `--dcss-bin`, `--dcss-n`, `.dcss-at`, `--dcss-i` | The largest number in a bin | A18 |
| `.dcss-bins`, `.dcss-track-count` | How many bins hold something | A16 |
| `.dcss-array`, `.dcss-packed`, `--dcss-tracks` | Water filling: slot k reads min(cap k, level), the level what fills the width | A25 |
| `.dcss-array`, `.dcss-sort`, `--dcss-key`, `--dcss-n` | A sort: entry i in order of a key; the i-th smallest, the largest (-1), the sum of the smallest few; equal keys in markup order | A19 |
| `.dcss-bins`, `.dcss-below` | How many bins in use are below a child's bin: its rank among the distinct bins, from 0 | A17 |
| `.dcss-pack`, `--dcss-columns`, `--dcss-w`, `.dcss-where` | First-fit packing: each child's column and row where it lands, rows from the top | A27 |
| `.dcss-where` | Where a child is: its offset from the grid's top-left; in an array of child entries, the sum of the entries before it | A24, A28 |
| `.dcss-sort`, `--dcss-key`, `.dcss-where` | Places in a sort: 1 for the smallest key, equal keys in markup order | A20 |
| `.dcss-tiles`, `--dcss-columns`, `--dcss-rows`, `--dcss-areas`, `.dcss-where` | A tile map: where each named area is and how big, and whether it is in the map | A29 |
| `.dcss-tiles`, `.dcss-pack`, `--dcss-w`, `--dcss-h`, `.dcss-where` | 2D packing around walls: each child of w x h tiles where first fit puts it, row by row from the top, around the map's named areas and the children before it; whether it fits in the map | A30 |
| `.dcss-push`, `--dcss-h`, `--dcss-target`, `.dcss-where` | The push: boxes in order, each at the larger of its target and the end of the box before (1D non-penetration in one layout) | A31 |
| `.dcss-push`, `.dcss-end`, `--dcss-wall`, `.dcss-nested`, `.dcss-where` | The push from the end: each box at the smaller of its target and the start of the box after less its width, none past the wall | A31, A54 |
| `.dcss-ranked`, `--dcss-bins`, `.dcss-wide`, `--dcss-desc`, `.dcss-group`, `.dcss-group-total`, `.dcss-bars`, `--dcss-bin`, `--dcss-n`, `--dcss-key`, `--dcss-span`, `--dcss-band`, `.dcss-bin-max`, `.dcss-labels`, `--dcss-gap`, `.dcss-copy`, `--dcss-copy-width`, `.dcss-ranks`, `.dcss-segments` | Groups ranked by their totals: each group's bar at its total, sorted largest or smallest first (two stages in one frame) | A55, A57 |
| `.dcss-groups`, `--dcss-bin`, `--dcss-n`, `.dcss-where` | Grouped sums: each child reads the sum of the earlier children in its group; an item after a group reads its total; with --dcss-n 1, counts | A32 |
| `.dcss-overlap`, `--dcss-i`, `--dcss-span`, `.dcss-where`, `.dcss-track-count` | The most intervals at one point; each interval's lane (interval colouring, first fit by start) | A33 |
| `.dcss-lines`, `--dcss-columns`, `--dcss-n`, `.dcss-where`, `.dcss-track-count` | Next-fit lines: how many lines a row of widths takes, each child's line and its place on it | A34 |
| `.dcss-array`, `.dcss-xy`, `.dcss-cells`, `--dcss-i`, `--dcss-r`, `--dcss-n`, `--dcss-m` | Column and row maxima of a matrix, from one grid | A36 |
| `.dcss-bins`, `.dcss-bin-max`, `.dcss-nest`, `--dcss-bin`, `--dcss-n` | Entries at any depth in a bins max | A18 |
| `.dcss-sort`, `.dcss-lo`, `.dcss-hi`, `.dcss-where`, `.dcss-between` | Search in a sort: how many keys are below a key, up to it, equal to it, and whether any is | A21 |
| `.dcss-key-range`, `--dcss-key`, `--dcss-bit`, `.dcss-in`, `--dcss-from`, `--dcss-to`, `--dcss-not`, `.dcss-mask` | A key range: which entries have a key in [from, to], as a bit mask and the six highest bits; many queries over one row | A37 |
| `.dcss-window`, `--dcss-i`, `--dcss-span` | A window: entries counted from a moving start | A11 |
| `.dcss-map`, `--dcss-key`, `--dcss-n`, `.dcss-at` | A keyed map: the largest number written at any whole key | A22 |
| `.dcss-width-sum`, `.dcss-largest`, `.dcss-scale`, `.dcss-width-min`, `.dcss-rest`, `.dcss-stack`, `.dcss-tallest`, `--dcss-n`, `.dcss-at` | Formulas: sums, maxima, constant factors, min and difference, any depth, over numbers and whole computations | A38 to A41 |
| `.dcss-hop`, `--dcss-i`, `--dcss-j`, `--dcss-r`, `--dcss-put`, `.dcss-hop-y`, `--dcss-array-length`, `.dcss-at-y`, `.dcss-at-x`, `.dcss-row`, `.dcss-width-min`, `.dcss-stack`, `.dcss-tallest` | A second and a third pass in one grid: rows sized from sums of columns, a column from sums of rows | A42 |
| `.dcss-text`, `--dcss-text`, `dcss-table`, `.dcss-sq`, `.dcss-sqrt`, `--dcss-font` | A sum of whole numbers, a max of sums, f(k) by a lookup table, without a grid | A43, A44, A50 |
| `.dcss-scan`, `--dcss-n`, `.dcss-at`, `--dcss-i` | Prefix sums: each entry the sum so far, and the sum before it | A127 |
| `.dcss-collapse`, `--dcss-n`, `--dcss-p`, `.dcss-scope`, `.dcss-at` | Signed extremes: max(positives) + min(negatives) of any number of signed numbers; laid-out widths times factors in the same collapse, and through scopes two laid-out widths in one (a difference p1 W1 - p2 W2); as a child of a `.dcss-stack` or `.dcss-tallest` it counts there as its value, with no reader | A45 to A47 |
| `.dcss-minus` | max(0, A - B) of two laid-out widths as a width, with no reader; so min(a, b) and |a - b| on the width side too | A48 |
| `.dcss-width-sum`, `.dcss-turn`, `--dcss-turn-tick`, `--dcss-turn-tick-2` | A height as a width, live: what a .dcss-width-min, a collapse or a stack is, laid on as a width | A49 |
| `.dcss-zoom`, `--dcss-zoom` | A factor in flow: f x a laid-out size, counted by whatever contains it | A45 |
| `.dcss-baseline`, `--dcss-n`, `--dcss-m`, `.dcss-where` | Baselines: a row of max(a) + max(d), and each item handed max(a) - a_j | A45 |
| `.dcss-columns`, `--dcss-parts`, `--dcss-n`, `.dcss-alternate`, `--dcss-parity` | The best contiguous split into K parts: the least possible largest part | A45 |
| `.dcss-flex`, `--dcss-n`, `--dcss-grow`, `--dcss-shrink`, `--dcss-flex-min`, `--dcss-flex-max` | Flex shares: weights, shrink, floors and caps in one layout | A45 |
| `.dcss-slide`, `--dcss-span`, `--dcss-n`, `.dcss-at`, `--dcss-i` | Sliding-window maxima: the largest of the --dcss-span entries ending at entry j | A35 |
| `.dcss-shares`, `--dcss-n`, `--dcss-w` | Fair shares with floors: each child gets max(floor, weight x level), the level what fills the width | A26 |
| `.dcss-axis-bottom`, `.dcss-ticks`, `--start`, `--stop`, `--count`, `--dcss-tick`, `--dcss-tick-at`, `--dcss-tick-step`, `--dcss-tick-increment`, `--dcss-tick-count`, `.dcss-nice`, `--dcss-nice-start`, `--dcss-nice-stop` | d3's axis and d3-array's ticks, tickIncrement, tickStep and nice: a range's ticks as d3 picks them, drawn and labelled as d3.axisBottom draws them | A58, A59 |
| `.dcss-piles`, `--dcss-span`, `--dcss-bin`, `--dcss-n`, `--dcss-key`, `.dcss-starts` | Items stacked by group, each at the sum of the heights before it in its group; where each group starts (a counting sort) | A56 |
| `.list`, `--if`, `.pager`, `--page`, `.dcss-size` | A list in plain CSS (order sorts it, its width wraps it), items dropped, a page of it, and its size as numbers | A56 |

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
| f(k) by a table | `counter(a, dcss-table)` (k from 0 to 999 as the glyph U+E000 + k) in `.dcss-text.dcss-sq` (round(k^2 / 1000)), `.dcss-sqrt` (round(sqrt(1000 k))) or `style="--dcss-font: <font name>"` | the sum of f over the line; past 999 `dcss-table` prints the tally, so f = k there |
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
- `.dcss-rom` reads f(k) at style time from a variable font, with no text: `<i class="dcss-rom dcss-sqrt" style="--dcss-k: 300"><u></u></i>` gives the `<u>` `--dcss-value: 548`. `.dcss-rom2` reads the five pair tables the same way: `<i class="dcss-rom2 dcss-pair-min" style="--dcss-a: 5; --dcss-b: 9"><u></u></i>` gives the `<u>` `--dcss-value: 5`, a and b from 0 to 31, with `.dcss-pair-max`, `.dcss-pair-product`, `.dcss-pair-difference` or `.dcss-pair-greater` for the others. Spread many `.dcss-rom2` reads over several pages, or use the pair counters of `.dcss-text` instead: each distinct read is a font variation of its own, and Safari loads a page of many slowly ([Performance](#performance)).

### Loops and sheets

These are in `dcss-array-extras.css`: link it beside dcss-store.css. They run on dcss-store.css: their numbers are its stored cells (`[data-store]`), read by `[data-store-read]` and `[data-store-read-3]` elements that name the cells by `--store-of`. A loop is a while loop written by hand. Its cells are the items of one `.loop-flow`, which reads all of them, and one more cell under the flow keeps the clock and the total. The markup, with one `.loop-in` per cell:

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
- A fold reads a column into one number: elements with the class `sum`, `mean`, `max` or `min` name three cells each, nest up to four deep with the `<output>` innermost, and give `--fold` and `--fold-count`; a mean's `<output>` may set `--fold-scale` (10 shows a mean of whole numbers in tenths).
- An `<output>` shows its number in the format its class names: `money` (cents as 12.34), `int`, `pct`, `tenths`, `bp` (basis points as 7.50%) or `grade` (tenths of a point as a letter).

### Limits

- Entries are 0 or more, since a track can't be negative: add an offset for signed numbers. An array's sum stays under layout's range, about 33 million px.
- Compute from `--dcss-value`, never from `100cqw` directly: Chrome's `cqw` is a hair under a whole number.
- Ranks go to 32, and `.dcss-bins.dcss-bin-max` has 32 bins. A range that mixes a positive end with a negative one needs the end known: `.dcss-track-count`, or `--dcss-array-length`. A cyclic array's ranges go forwards only.
- An `.dcss-xy` array has as many rows as entries; a reader reads one row, and `--dcss-r` takes no range.
- A reader is placed against its grid, so nothing between them can have a transform, filter, perspective or containment of its own.
- Bins in use are counted up to the box's width in px. For the smallest number in a bin, take the max of a bound minus the number.
- A reduction's value is kept to 1/64, and up to 63 skipped items are counted. Water filling, flex shares and `.dcss-zoom` factors are exact to 1/64 px, fair shares to 1/32 px.
- One call's answer can be another's input, up to the length Browsers gives for Safari.
- In Firefox, put `.dcss-calc` boxes and the results they name in a container as wide as its content (`width: max-content`): Firefox keeps an `anchor-size()` until the box is laid out again ([QUIRKS.md](QUIRKS.md) Q3).

## Browsers

<!-- browsers -->

Chrome and Safari's engine both run everything: headless Chrome 155 and WebKit 26.4 (Playwright's build of Safari's engine, not Safari itself) pass all 112 requirements in [SPEC.md](SPEC.md). The d3 calls give d3's own answer to 3,206 of the 7,049 calls d3's tests make (45%), and cover 26 of d3's 508 functions in full and 73 more in part; SPEC.md's implementation report has the count for each call. Easings and scales come within 1e-12 of d3. A treemap's boxes are within 2/64 px per level of d3's for totals up to 50,000; near a million, WebKit is 0.3 px off and Chrome 0.02 px.

In Chrome, a reduction's list wider or taller than 262,144 px (2^18) reads without its 64ths, and past 2^24 px without whole pixels: a sum whose positives or negatives pass 2^18, a mean whose sum and 1024 for each negative value do, or one with 64 negative values or more.

Safari drops an input copied into one formula past 65,535 tokens: a scale's answer is short enough to be another scale's domain stop or exponent, or a projection's point; a scale's inverse copies its stops up to 34 times and its exponent up to 86, and a projection's answer (about 12,000 tokens) is too long for those inputs.

Firefox 158 computes `calc()` in 32-bit floats, so the calls that need a double's exact digits (exact sums, dates, most formatting) give wrong answers there, and it has no view timelines, which loops and sheets need. It passes 71 of the 112 requirements. `@function` runs only in Chrome: WebKit 26.4 and Firefox 158 don't parse it, and the classes work everywhere. [QUIRKS.md](QUIRKS.md) has the engine bugs the sheet works around.

<!-- /browsers -->

## Performance

The work happens in layout, in the frame a number changes. Chrome loads any one family in 40 ms or less. <!-- performance -->

In WebKit, the median of three cold loads beside the core (2026-10-28):

| File in `families/` | Size | Load in WebKit 26.4 |
|---|---:|---:|
| `ticks.css` | 128 KB | 14 ms |
| `array.css` | 263 KB | 15 ms |
| `hierarchy.css` | 6.6 KB | 10 ms |
| `scale.css` | 120 KB | 12 ms |
| `format.css` | 235 KB | 15 ms |
| `ease.css` | 41 KB | 10 ms |
| `time.css` | 315 KB | 15 ms |
| `date-format.css` | 36 KB | 10 ms |
| `geo.css` | 248 KB | 13 ms |

The core is 284 KB, 73 KB gzipped; `dcss-array-extras.css`, the lists, loops and sheets, 15 KB, 3.8 KB gzipped. Parts, gzipped, the median part of each family against the whole family:

| Family | Parts | A part | The family |
|---|---:|---:|---:|
| `ticks.css` | 8 | 2.9 KB (0.5–5.7) | 10 KB |
| `array.css` | 38 | 1.7 KB (0.8–5.8) | 20 KB |
| `hierarchy.css` | 4 | 0.6 KB (0.6–0.7) | 0.9 KB |
| `scale.css` | 6 | 2.3 KB (0.5–3.0) | 7.5 KB |
| `format.css` | 9 | 3.4 KB (1.0–11.6) | 18 KB |
| `ease.css` | 37 | 0.7 KB (0.5–1.0) | 2.9 KB |
| `time.css` | 65 | 0.8 KB (0.8–3.7) | 15 KB |
| `date-format.css` | 41 | 3.4 KB (3.3–3.5) | 4.2 KB |
| `geo.css` | 20 | 1.5 KB (0.6–2.1) | 16 KB |

<!-- /performance -->

- SI formatting is too slow for 30 outputs changing every frame.
- Variance and bins cost what a mean does: 50 figures of 64 values, one value in each moving every frame, take 18 ms a frame in Chrome and 22 in WebKit for variance, 12 and 23 for bins (8 thresholds), against 18 and 34 for means (2026-10-28).
- Sorting separate results with anchors (Recipes): 32 bars take 1.6 ms an update in Chrome and 2 in WebKit.
- Put changing numbers on the entries: 1,000 entries each animating its own `--dcss-n` take 13.6 ms a frame in Chrome and 16 in WebKit, against 32.0 and 54 with one changing number inherited from the grid.
- `.dcss-nested` makes the push 2x (Chrome) to 2.3x (WebKit) faster at 300 boxes.
- Map projections are costly to move: 300 points moving every frame, a reader each, take 450 ms a frame in Chrome and 680 in WebKit for stereographic, 325 and 470 for mercator, 1,200 and 1,620 for an equirectangular inverse (2026-10-28). A still map costs nothing after its first frame.
- A call reads its `--value` once, as numbers the browser keeps exactly, so another call's answer works as its input in Safari. That read is part of every update. With 300 calls moving every frame, a reader each, a frame takes: easings 20 ms in Chrome and 24 in WebKit; UTC day floors 24 and 35; linear scales 38 and 65; pow scales 101 and 198; piecewise linear scales 149 and 285 (2026-10-28).
- On an `.dcss-plain` array (whole indices from 1 to the length, nothing negative or fractional), readers skip the index math: a window max of 298 readers drops from 8.1 to 4.9 ms in Chrome and from 14 to 8 in WebKit.
- `.dcss-rom2` reads load slowly in Safari: all 5,120 pair-table entries on one page took 53.6 s to load in WebKit 26.4, against 0.5 s in Chrome 155; as five pages of 1,324 reads, each loaded in under 7 s (2026-10-22).
- A treemap's line drifts with its length: WebKit is 0.29 px off at 1,000 siblings.

Each grid primitive's cost, Chrome then WebKit: a frame's time with 300 readers less the same page without them, divided by 300, the numbers changing every frame, in µs unless written otherwise.

<!-- primitive-costs -->

| Primitive | Cost |
|---|---|
| Entry i of an array of child entries | Chrome 6.3-6.5 µs per read, WebKit 9.1-9.6 |
| Counting the entries | Chrome 8.2 µs per read, WebKit 29.3 |
| Track i of a packed array, any length | Chrome 5.5-5.8, WebKit 9.3-10.0 |
| The i-th slot named x | Chrome 5.8-6.5, WebKit 6.2-10.6 |
| Two numbers per entry | Chrome 7.9 µs per read (two numbers), WebKit 9.9 |
| Entry i of a cyclic array, round either way | Chrome 6.1-6.4, WebKit 11.1-12.2 (on these fixed-size tracks) |
| Rank within a bin | Chrome 5.6-6.3, WebKit 9.8-10.1 |
| The largest number in a bin | Chrome 16.1 µs a child plus its reader, WebKit 25.9 |
| Water filling | Chrome 4.2, WebKit 9.5 |
| A sort | Chrome 5.5, WebKit 9.5 |
| How many bins in use are below a child's bin | Chrome 8.2, WebKit 15.2 |
| First-fit packing | Chrome 19.6 per item with its where, WebKit 42.2 |
| Where a child is | Chrome about 10 per read, WebKit about 30 |
| Places in a sort | Chrome 17.4 per entry with its where, WebKit 40.9 |
| A tile map | Chrome 32.5 per child with its where, WebKit 96.3 (the old sheet in the same harness: 124.1 against 118.1) |
| 2D packing around walls | Chrome 34.1 per item (25 maps of 12, switching), WebKit 107.3 (one map of 100: 5.9 ms per frame) |
| The push | Chrome 26.8 per box with its where, WebKit 50.2 |
| The push from the end | Chrome 24.2, WebKit 44.1 |
| Grouped sums | Chrome 20.1 per item (19.3 with values to 1,000), WebKit 39.9 (178 with values to 1,000) |
| Interval lanes | Chrome 5.3 per item (5.5 at 1,800), WebKit 13.3 (14.0 at 1,800) |
| Next-fit lines | Chrome 3.5 per item (3.7 at 1,800), WebKit 9.1 (9.4 at 1,800) |
| Search in a sort | Chrome 11.2 per element, WebKit 17.0 |
| A key range | Chrome 3.1 ms for 100 queries over 19 entries, mask only (vs-calc range), WebKit 6 |
| A window | Chrome 8.8, WebKit 20.5 (the old sheet in the same harness: 16.2 against 18.8) |
| A keyed map | Chrome 18.0 (300 keys over 20,000, every key in range), WebKit 63.1 (an earlier figure, 32.5, had 271 of 300 keys outside the range) |
| Formulas | see Formulas |
| A second and a third pass in one grid | Chrome 7.6 µs per hop at 256, WebKit 23 |
| Sums and lookups in text | Chrome 1.13 ms for 256 numbers summed and looked up, WebKit 2.25 |
| Prefix sums | Chrome 2.5 ms for 300 entries, every sum read (150 readers, placed by grid-area; vs-calc prefix), WebKit 5.0 |
| Signed extremes | Chrome 1.43 ms a chain of 256, WebKit 2.50 |
| A height as a width, live | Chrome 14.6 per turn, WebKit 40.7 |
| A factor in flow | Chrome a dot product of 256: 2.57, WebKit 3.62 |
| Baselines | Chrome 1.56 a row of 256, WebKit 5.00 |
| The best contiguous split into K parts | Chrome 1.10 for 256 in 8 parts, WebKit 4.0 |
| Flex shares | Chrome 1.91 for 256, WebKit 4.38 |
| Sliding-window maxima | Chrome 5.2, WebKit 6.4 |
| Fair shares with floors | Chrome 10.5 per entry, WebKit 13.4 |
| Ticks and axes | Chrome 0.42 ms a .dcss-ticks of 16, 1.17 a drawn axis, 0.84 a .dcss-nice, WebKit 0.74, 1.62 and 1.51 ms |

<!-- /primitive-costs -->

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
