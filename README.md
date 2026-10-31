# dcss.css

dcss.css computes what d3, the JavaScript library for data charts, computes, in HTML with no script: statistics, ticks and axes, scales, number and date formats, easing, treemaps, UTC time and map projections. It works in Chrome and Safari, not Firefox ([Browsers](#browsers)).

## Installation

Write the data once, as a table the reader sees, and each result as a MathML formula over it. Then build the page once with `mathml.mjs` and Node.js:

```html
<!doctype html>
<link rel="stylesheet" href="dcss.css">
<style>.sales { --jan: 120; --feb: 95; }</style>

<section class="sales" data-dcss-scope>
  <table data-dcss-series="sales">
    <tr><th>January</th><td data-dcss-value="var(--jan)"></td></tr>
    <tr><th>February</th><td data-dcss-value="var(--feb)"></td></tr>
    <tr><th>March</th><td data-dcss-value>140</td></tr>
  </table>
  <math class="dcss-format-fixed" style="--precision: 1">
    <apply><eq/><ci>average</ci><apply><mean/><ci>sales</ci></apply></apply>
  </math>
  <p>The average is <output class="dcss-format-fixed" style="--precision: 1" data-dcss-result="average"></output>.</p>
</section>
```

```sh
node mathml.mjs page.html built.html
```

Add `--watch` to build it again each time you save. The built page shows average = mean(sales) = 118.3, and the sentence the same. It runs no script: set `--jan` in CSS and both follow. A median or a maximum is one more `<math>` on the same table. [TUTORIAL.md](TUTORIAL.md) builds a sales summary step by step; [SPEC.md](SPEC.md) A131 to A155 say what the build takes. From LaTeX, [LaTeXML](https://math.nist.gov/~BMiller/LaTeXML/) writes the `<math>`:

```sh
latexmlmath --cmml=- 'M = \frac{P r}{1 - (1 + r)^{-n}}'
```

## Without the build

Each call is a class, and a file in `parts/`. One class per figure; `.dcss-summarize` gives nine at once. A sum is a `<figure>` around a list: the browser lays the list out, and its size is the answer. This page links two parts that come to 8 KB gzipped:

```html
<!doctype html>
<link rel="stylesheet" href="parts/dcss-mean.css">
<link rel="stylesheet" href="parts/dcss-format-fixed.css">

<figure class="dcss-mean dcss-format-fixed">
  <ul><li style="--value: 120"></li> <li style="--value: 95"></li> <li style="--value: 140"></li></ul>
  <output style="--value: var(--dcss-sum); --precision: 0"></output>   <!-- 355 -->
  <output style="--value: var(--dcss-mean); --precision: 1"></output>  <!-- 118.3 -->
</figure>
```

One `--value` per item; each element after the list reads `--dcss-sum`, `--dcss-mean` and `--dcss-count`, on a line of its own, and follows a changed `--value`.

Or link `dcss.css` and the families [Reference](#reference) names, or `dcss-all.css`:

```html
<link rel="stylesheet" href="dcss.css">
<link rel="stylesheet" href="families/array.css">
<link rel="stylesheet" href="families/format.css">
```

## Writing a call

The class goes on a `<figure>`: d3.bisectLeft is `.dcss-bisect-left`. Arguments are custom properties with d3's names, such as `--p`.

```html
<figure class="dcss-sum">
  <ul aria-hidden="true"><li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 30"></li></ul>
  <output></output>                  <!-- prints 82 -->
  <figcaption>Fruit sold: apples 12, pears 40, plums 30</figcaption>
</figure>
```

The list is drawn at its answer: hide it with a height and `overflow: clip` on the figure, never on the list. Screen readers don't hear a `--value`: say the numbers in a caption. Numbers are exact in 64ths, halves included; give cents as whole numbers.

A call that can't answer prints nothing and sets `--dcss-err`: 1 for an input it can't take, 2 where d3 has no answer. To show a message:

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

## Using two calls together

Put a call inside another's answer. A sum feeding a scale:

```html
<figure class="dcss-sum">
  <ul>
    <li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 30"></li>
  </ul>
  <div class="dcss-scale-linear"
       style="--value: var(--dcss-sum);
              --domain-0: 0; --domain-1: 2000;
              --range-0: 0; --range-1: 1000">
    <output class="dcss-format-si"
            style="--value: var(--dcss-scale-linear); --precision: 3"></output> <!-- 41.0 -->
    <output class="dcss-format-fixed"
            style="--value: calc(var(--dcss-scale-linear) * 2); --precision: 2"></output> <!-- 82.00 -->
  </div>
</figure>
```

An axis on a nice domain reads `.dcss-nice`'s `--dcss-nice-start` and `--dcss-nice-stop`. Give it more `<li>` than ticks:

```html
<link rel="stylesheet" href="dcss.css">
<link rel="stylesheet" href="families/ticks.css">
<style>:root { --lo: -3.5; --hi: 31.2; }</style>

<figure class="dcss-nice" style="--start: var(--lo); --stop: var(--hi); --count: 6">
  <ol class="dcss-axis-bottom" style="width: 600px; --start: var(--dcss-nice-start); --stop: var(--dcss-nice-stop); --count: 6">
    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
  </ol>   <!-- −5 to 35 by 5, 75 px apart -->
</figure>
```

A median or quantile goes to each element after the list, and a format on the figure formats every output in it:

```html
<figure class="dcss-median dcss-format-fixed" style="--precision: 1">
  <ol><li style="--value: 4"></li> <li style="--value: 1"></li> <li style="--value: 3"></li> <li style="--value: 2"></li></ol>
  <output style="--value: var(--dcss-median)"></output>   <!-- 2.5 -->
</figure>
```
One list, every answer. Each element after the list reads the sum, count, length, mean, min, max, median, variance and deviation, on a line of its own:

```html
<figure class="dcss-summarize dcss-format-fixed" style="--precision: 1">
  <ul><li style="--value: 72.5"></li> <li style="--value: 88"></li> <li style="--value: 95"></li> <li style="--value: 47"></li></ul>
  <output style="--value: var(--dcss-mean)"></output>  <!-- 75.6 -->
</figure>
```

Everything inside such an element reads them too, so answers sit in a sentence:

```html
<figure class="dcss-summarize dcss-format-fixed" style="--precision: 1">
  <ul><li style="--value: 72.5"></li> <li style="--value: 88"></li> <li style="--value: 95"></li> <li style="--value: 47"></li></ul>
  <p>
    Mean <output style="--value: var(--dcss-mean)"></output>,   <!-- 75.6 -->
    least <output style="--value: var(--dcss-min)"></output>    <!-- 47.0 -->
  </p>
</figure>
```

A caption and any number of outputs lay out in the order written, and the figure grows to hold them:

```html
<figure class="dcss-summarize dcss-format-fixed" style="--precision: 1">
  <figcaption>Scores</figcaption>
  <ul><li style="--value: 72.5"></li> <li style="--value: 88"></li> <li style="--value: 95"></li> <li style="--value: 47"></li></ul>
  <output style="--value: var(--dcss-mean)"></output>       <!-- 75.6 -->
  <output style="--value: var(--dcss-max)"></output>        <!-- 95.0 -->
  <output style="--value: var(--dcss-deviation)"></output>  <!-- 21.3 -->
</figure>
```




## Reference

Each call gives its answer as `--dcss-` and its name to the elements directly inside the one it reads into, not deeper; `--dcss-ready` and `--dcss-err` inherit. [SPEC.md](SPEC.md) has each input's range.

<!-- calls -->

### Ticks: families/ticks.css

- [`.dcss-axis-bottom`](https://d3js.org/d3-axis#axisBottom), [`.dcss-axis-top`](https://d3js.org/d3-axis#axisTop), [`.dcss-axis-left`](https://d3js.org/d3-axis#axisLeft), [`.dcss-axis-right`](https://d3js.org/d3-axis#axisRight): an `<ol>` drawn from `--start` to `--stop`, `--count` ticks, a `<li>` each.
- [`.dcss-ticks`](https://d3js.org/d3-array/ticks#ticks), [`.dcss-nice`](https://d3js.org/d3-array/ticks#nice): the ticks undrawn, each `<li>` reading `--dcss-tick`; the domain made nice.
- [`.dcss-identity-ticks`](https://d3js.org/d3-scale/linear#scaleIdentity), [`.dcss-identity-tick-format`](https://d3js.org/d3-scale/linear#scaleIdentity): `--source-count` or `--identity-count` ticks, and their labels.

### Array: families/array.css

- [`.dcss-sum`](https://d3js.org/d3-array/summarize#sum), [`.dcss-mean`](https://d3js.org/d3-array/summarize#mean), [`.dcss-count`](https://d3js.org/d3-array/summarize#count), `.dcss-length`, [`.dcss-min`](https://d3js.org/d3-array/summarize#min), [`.dcss-max`](https://d3js.org/d3-array/summarize#max), [`.dcss-extent`](https://d3js.org/d3-array/summarize#extent): of the list; length counts its items.
- `.dcss-summarize`: sum, count, length, mean, min, max, median, variance and deviation of one list, to each element after it and everything inside.
- [`.dcss-min-index`](https://d3js.org/d3-array/summarize#minIndex), [`.dcss-max-index`](https://d3js.org/d3-array/summarize#maxIndex), [`.dcss-least-index`](https://d3js.org/d3-array/summarize#leastIndex), [`.dcss-greatest-index`](https://d3js.org/d3-array/summarize#greatestIndex), [`.dcss-least`](https://d3js.org/d3-array/summarize#least), [`.dcss-greatest`](https://d3js.org/d3-array/summarize#greatest): where the least or greatest is, or its value.
- [`.dcss-median`](https://d3js.org/d3-array/summarize#median), [`.dcss-quantile`](https://d3js.org/d3-array/summarize#quantile), [`.dcss-quantile-sorted`](https://d3js.org/d3-array/summarize#quantileSorted), [`.dcss-median-index`](https://d3js.org/d3-array/summarize#medianIndex), [`.dcss-quantile-index`](https://d3js.org/d3-array/summarize#quantileIndex): read three elements deep; `--p` places a quantile.
- [`.dcss-variance`](https://d3js.org/d3-array/summarize#variance), [`.dcss-deviation`](https://d3js.org/d3-array/summarize#deviation): read by the element after the list, as the summary's.
- [`.dcss-scale-quantile`](https://d3js.org/d3-scale/quantile#scaleQuantile), [`.dcss-scale-threshold`](https://d3js.org/d3-scale/threshold#scaleThreshold), [`.dcss-scale-quantize`](https://d3js.org/d3-scale/quantize#scaleQuantize): `--value` to `--range-0` to `--range-16` (`--ranges` of them) or `--unknown`, by the list four elements deep or by `--domain-0` to `--domain-15`.
- [`.dcss-bisect-left`](https://d3js.org/d3-array/bisect#bisectLeft), [`.dcss-bisect-right`](https://d3js.org/d3-array/bisect#bisectRight), [`.dcss-bisect`](https://d3js.org/d3-array/bisect#bisect), [`.dcss-bisector-left`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-bisector-right`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-bisector`](https://d3js.org/d3-array/bisect#bisector): where the figure's `--value` goes in the sorted list.
- [`.dcss-ascending`](https://d3js.org/d3-array/sort#ascending), [`.dcss-descending`](https://d3js.org/d3-array/sort#descending): comparing `--a` and `--b`.
- [`.dcss-cumsum`](https://d3js.org/d3-array/summarize#cumsum), [`.dcss-bin`](https://d3js.org/d3-array/bin#bin): a second list, a `<li>` per total or bin; bins cut `--domain-0` to `--domain-1` at `--threshold-0` to `--threshold-31` or by `--count`.
- `.dcss-share`: each item's fraction, `--dcss-share`, in its `.dcss-share-read > .dcss-share-result`.
- [`.dcss-precision-fixed`](https://d3js.org/d3-format#precisionFixed), [`.dcss-precision-prefix`](https://d3js.org/d3-format#precisionPrefix), [`.dcss-precision-round`](https://d3js.org/d3-format#precisionRound): for `--step`, with `--value` or `--max`.
- [`.dcss-range`](https://d3js.org/d3-array/ticks#range): one `<li>` per number, `--start` to `--stop` by `--step`.

### Hierarchy: families/hierarchy.css

- [`.dcss-treemap-slice`](https://d3js.org/d3-hierarchy/treemap#treemapSlice), [`.dcss-treemap-dice`](https://d3js.org/d3-hierarchy/treemap#treemapDice), [`.dcss-treemap-slice-dice`](https://d3js.org/d3-hierarchy/treemap#treemapSliceDice), [`.dcss-partition`](https://d3js.org/d3-hierarchy/partition#partition): a nested list laid out, leaves sized by `--value`.

### Scale: families/scale.css

- [`.dcss-scale-linear`](https://d3js.org/d3-scale/linear#scaleLinear), [`.dcss-scale-pow`](https://d3js.org/d3-scale/pow#scalePow), [`.dcss-scale-sqrt`](https://d3js.org/d3-scale/pow#scaleSqrt), [`.dcss-scale-log`](https://d3js.org/d3-scale/log#scaleLog), [`.dcss-scale-identity`](https://d3js.org/d3-scale/linear#scaleIdentity): `--value` from `--domain-0`, `--domain-1` to `--range-0`, `--range-1`, and back as `-invert`.
- `.dcss-piecewise`: up to 8 stops, `--stops`.
- [`.dcss-scale-band`](https://d3js.org/d3-scale/band#scaleBand): with `.dcss-scale-linear`, a bar chart: `--padding`, `--padding-inner`, `--padding-outer`, `--align`.

### Format: families/format.css

- [`.dcss-format-fixed`](https://d3js.org/d3-format#format), [`.dcss-format-percent`](https://d3js.org/d3-format#format), [`.dcss-format-si`](https://d3js.org/d3-format#format), [`.dcss-format-general`](https://d3js.org/d3-format#format): `--value` printed with `--precision`; 1 in `--comma`, `--sign`, `--symbol` or `--trim` for d3's `,`, `+`, `$` or `~`.
- [`.dcss-ticks-log`](https://d3js.org/d3-scale/log#scaleLog), [`.dcss-nice-log`](https://d3js.org/d3-scale/log#scaleLog), [`.dcss-ticks-log-format`](https://d3js.org/d3-scale/log#scaleLog): a log scale's ticks.
- [`.dcss-format-locale`](https://d3js.org/d3-format#formatLocale), [`.dcss-locale-arabic`](https://d3js.org/d3-format#formatLocale): Arabic `$,.2f`, `--dcss-locale-precision`, `--dcss-locale-sign`.

### Ease: families/ease.css

- [`.dcss-ease-<name>`](https://d3js.org/d3-ease#easeCubic): each d3-ease function of `--value`: `.dcss-ease-cubic-in-out`.

### Time: families/time.css

- [`.dcss-utc-<interval>-<op>`](https://d3js.org/d3-time#utcDay): epoch milliseconds to a UTC `day`, `hour`, `minute`, `second`, `sunday` to `saturday`, `month` or `year` by `floor`, `ceil`, `round`, `offset` or `count`.

### Date format: families/date-format.css

- [`.dcss-date-format-N`](https://d3js.org/d3-time-format#utcFormat): epoch milliseconds printed with specifier N:

```
 0 %c       1 %a       2 %A       3 %b       4 %B       5 %d       6 %e       7 %g
 8 %G       9 %H      10 %I      11 %j      12 %m      13 %M      14 %p      15 %q
16 %Q      17 %s      18 %s.%L   19 %s.%f   20 %S      21 %0S     22 %_S     23 %-S
24 %L      25 %u      26 %f      27 %U      28 %W      29 %V      30 %x      31 %X
32 %y      33 %Y      34 %Z      35 %%      36 .%L     37 :%S     38 %I:%M   39 %I %p
40 %a %d
```

### Geo: families/geo.css

- [`.dcss-geo-<projection>`](https://d3js.org/d3-geo/projection#geoProjection): `--x`, `--y` by `identity`, `equirectangular`, `mercator`, `transverse-mercator`, `stereographic` or `rotation`, with `-invert`, `-config` or `-extent` after it.
- [`.dcss-geo-distance`](https://d3js.org/d3-geo/math#geoDistance): in radians.

<!-- /calls -->

### As CSS functions

Where the browser has `@function` (Chrome; Safari Technology Preview), these calls are also functions, with no element and no list. Their arguments are the class's inputs in order, and a value the class refuses gives NaN:

- `--dcss-ease-<name>(t)`, with the exponent, overshoot, amplitude or period after `t`: `--dcss-ease-cubic-in-out(0.25)` is 0.0625.
- `--dcss-scale-linear(x, d0, d1, r0, r1, clamp, round)`, and `-pow` (the exponent after `r1`), `-sqrt` and `-log`.
- `--dcss-scale-band(i, n, r0, r1, padding-inner, padding-outer, align, round)`: the `i`-th of `n` bands. A point scale is padding-inner 1.
- `--dcss-utc-<interval>-floor(t)`, `-ceil(t)`, `-round(t)`, `-offset(t, step)` and `-count(start, stop)` for `day`, `hour`, `minute`, `second` and `sunday` to `saturday`.
- `--dcss-geo-<projection>-x(lon, lat, scale, translate-x, translate-y, rotate-lambda, rotate-phi, rotate-gamma, center-lambda, center-phi, angle, reflect-x, reflect-y)` and `-y`, with `-invert` before `-x`, for `equirectangular`, `mercator` and `transverse-mercator`; `identity` has no rotate or center, and `--dcss-geo-rotation-x(lon, lat, lambda, phi, gamma)` only the angles. `--dcss-geo-distance(lon-a, lat-a, lon-b, lat-b)` is in radians.

A browser without `@function` drops the declaration, so write a plain value before it:

```css
.dot { translate: 0 0; translate: calc(--dcss-geo-mercator-x(-58.38, -34.6) * 1px) calc(--dcss-geo-mercator-y(-58.38, -34.6) * 1px); }
```

### Grid primitives: dcss.css

[SPEC.md](SPEC.md) has their markup.

- `.dcss-array`, `.dcss-track-count`, `.dcss-out`, `.dcss-at`, `.dcss-packed`, `.dcss-cycle`, `.dcss-xy`, `.dcss-cells`, `.dcss-plain`, `.dcss-window`, `.dcss-slide`, `.dcss-scan`: arrays.
- `.dcss-bins`, `.dcss-bin-max`, `.dcss-below`, `.dcss-nest`, `.dcss-sort`, `.dcss-where`, `.dcss-lo`, `.dcss-hi`, `.dcss-between`, `.dcss-map`, `.dcss-key-range`, `.dcss-in`, `.dcss-mask`: bins, sorts and maps.
- `.dcss-pack`, `.dcss-tiles`, `.dcss-push`, `.dcss-end`, `.dcss-nested`, `.dcss-overlap`, `.dcss-lines`, `.dcss-groups`, `.dcss-piles`, `.dcss-starts`, `.dcss-shares`, `.dcss-baseline`, `.dcss-columns`, `.dcss-alternate`, `.dcss-flex` (`--dcss-grow`, `--dcss-shrink`, `--dcss-flex-min`, `--dcss-flex-max`): packing and sharing.
- `.dcss-ranked` (`--dcss-desc`, `--dcss-gap`), `.dcss-wide`, `.dcss-group`, `.dcss-group-total`, `.dcss-bars`, `.dcss-labels`, `.dcss-copy`, `.dcss-ranks`, `.dcss-segments`: ranked groups.
- `.dcss-width-sum`, `.dcss-largest`, `.dcss-scale` (`--dcss-more`), `.dcss-cap` (`--dcss-c`), `.dcss-width-min`, `.dcss-rest`, `.dcss-times` (`--dcss-f`), `.dcss-stack`, `.dcss-tallest`, `.dcss-calc`, `.dcss-collapse` (`--dcss-p`), `.dcss-scope`, `.dcss-minus`, `.dcss-turn` (`--dcss-turn-tick-2`), `.dcss-zoom` (`--dcss-zoom`), `.dcss-hop` (`--dcss-put`), `.dcss-hop-y`, `.dcss-at-x`, `.dcss-at-y`, `.dcss-row`: formulas.
- `.dcss-text` (`--dcss-text`, `--dcss-each`, `--dcss-tab`), `.dcss-divide`, `.dcss-two`, `.dcss-pair-<table>`, `.dcss-sq`, `.dcss-sqrt`, `.dcss-rom`, `.dcss-rom2` (`--dcss-a`, `--dcss-b`): text reads, in fonts `dcss-preload.html` preloads.
- `.list` (`--if`), `.pager` (`--page`), `.dcss-size`, `.loop` (`--next`, `--measure`), `.sheet` (`--fold-scale`): in `dcss-extras.css`, with [store.css](https://noscript.ing).

## Browsers

<!-- browsers -->

Headless Chrome 155 and WebKit 26.4, Safari's engine, pass all 162 requirements of [SPEC.md](SPEC.md), and the calls match d3 on 3,206 of the 7,049 calls in d3's tests. Firefox 158 computes `calc()` in 32-bit floats, so exact sums, dates and most formatting go wrong there: it passes 70. [QUIRKS.md](QUIRKS.md) has the engine bugs.

<!-- /browsers -->

## Performance

<!-- performance -->

Layout does the work, in the frame a number changes. A family is at most 30 KB gzipped and loads in 15 ms or less in WebKit 26.4 (2026-10-28). Twenty printed medians, a value moving: 6.3 ms a frame in Chrome, 9.6 in WebKit; variance 8.2, 10.3 (2026-10-30).

<!-- /performance -->

## License

MIT, see the repository's LICENSE.

## Credits

- [d3](https://d3js.org), whose functions the calls follow and whose tests check them.
