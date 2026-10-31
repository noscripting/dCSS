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
- [`.dcss-scale-symlog`](https://d3js.org/d3-scale/symlog#scaleSymlog), [`.dcss-scale-radial`](https://d3js.org/d3-scale/linear#scaleRadial): as `.dcss-scale-linear`, with `-invert`, `--clamp`, `--round` and `.dcss-piecewise`; symlog's `--constant` is 1 if not set.
- [`.dcss-scale-sequential`](https://d3js.org/d3-scale/sequential#scaleSequential), [`.dcss-scale-sequential-log`](https://d3js.org/d3-scale/sequential#scaleSequentialLog), [`.dcss-scale-sequential-pow`](https://d3js.org/d3-scale/sequential#scaleSequentialPow), [`.dcss-scale-sequential-sqrt`](https://d3js.org/d3-scale/sequential#scaleSequentialSqrt), [`.dcss-scale-sequential-symlog`](https://d3js.org/d3-scale/sequential#scaleSequentialSymlog): `--value` from `--domain-0`, `--domain-1` to `--range-0`, `--range-1` (0 and 1 if not set), with `--clamp`, `--round`, and `--exponent` or `--constant`.
- [`.dcss-scale-diverging`](https://d3js.org/d3-scale/diverging#scaleDiverging), [`.dcss-scale-diverging-log`](https://d3js.org/d3-scale/diverging#scaleDivergingLog), [`.dcss-scale-diverging-pow`](https://d3js.org/d3-scale/diverging#scaleDivergingPow), [`.dcss-scale-diverging-sqrt`](https://d3js.org/d3-scale/diverging#scaleDivergingSqrt), [`.dcss-scale-diverging-symlog`](https://d3js.org/d3-scale/diverging#scaleDivergingSymlog): the same over three stops, `--domain-0` to `--domain-2` and `--range-0` to `--range-2`; with no `--range-0` on the element or above it, the answer is d3's identity interpolator's, the scale's t.
- [`.dcss-scale-band`](https://d3js.org/d3-scale/band#scaleBand), [`.dcss-scale-point`](https://d3js.org/d3-scale/point#scalePoint): the `--index`-th of `--domains` bands (or `--value`'s place in `--domain-0` to `--domain-15`, to everything inside) from `--range-0` to `--range-1`, with `--padding`, `--padding-inner`, `--padding-outer`, `--align`, `--round`: `--dcss-scale-band`, `--dcss-scale-band-bandwidth`, `--dcss-scale-band-step` (`--dcss-scale-point`, `--dcss-scale-point-bandwidth`, `--dcss-scale-point-step`). With `.dcss-scale-linear`, a band scale is a bar chart.
- [`.dcss-scale-ordinal`](https://d3js.org/d3-scale/ordinal#scaleOrdinal): `--value`'s place in `--domain-0` to `--domain-15` (`--domains` of them) picks `--range-0` to `--range-15` (`--ranges` of them, cycled), to everything inside: `--dcss-scale-ordinal`; a value in no slot takes `--unknown`, else the range at `--domains`, none with `--implicit: 0`.

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
- [`.dcss-geo-natural-earth1-raw`](https://d3js.org/d3-geo/cylindrical#geoNaturalEarth1), [`.dcss-geo-equal-earth-raw`](https://d3js.org/d3-geo/cylindrical#geoEqualEarth): `--x`, `--y` in radians to the plane, `--dcss-geo-x`, `--dcss-geo-y`; their inverts are root solves, below.

### Shape: families/shape.css

- [`.dcss-pie`](https://d3js.org/d3-shape/pie#pie): each item's `--dcss-pie-start-angle`, `-end-angle`, `-pad-angle` and `-index`, read four elements deep, from `--start-angle`, `--end-angle`, `--pad-angle` and `--sort-values` (-1 descending, 1 ascending, 0 list order).
- [`.dcss-arc`](https://d3js.org/d3-shape/arc#arc): `--dcss-arc-centroid-x`, `-y`, its path's corners and radii, and drawn as its `clip-path`, from `--inner-radius`, `--outer-radius`, `--start-angle`, `--end-angle`.
- [`.dcss-shape-stack`](https://d3js.org/d3-shape/stack#stack): a `<ul>` a point, a `<li>` with `--value` a key; inside each item's first element, `--dcss-y0`, `--dcss-y1` and `--dcss-stack-index`.
- [`.dcss-stack-offset-expand`](https://d3js.org/d3-shape/stack#stackOffsetExpand), [`.dcss-stack-offset-silhouette`](https://d3js.org/d3-shape/stack#stackOffsetSilhouette), [`.dcss-stack-offset-diverging`](https://d3js.org/d3-shape/stack#stackOffsetDiverging), [`.dcss-stack-order-reverse`](https://d3js.org/d3-shape/stack#stackOrderReverse): beside `.dcss-shape-stack`, its offset and order (none without a class).
- [`.dcss-line`](https://d3js.org/d3-shape/line#line), [`.dcss-area`](https://d3js.org/d3-shape/area#area): the list drawn in its own box, which the page sizes, each `<li>` a point at `--x`, `--y` and its segment from the one before; an item missing either draws nothing and breaks the line (d3's `defined`); an area runs down to the list's `--y0`; `--stroke-width` (1.5).
- [`.dcss-curve-step`](https://d3js.org/d3-shape/curve#curveStep), [`.dcss-curve-step-before`](https://d3js.org/d3-shape/curve#curveStepBefore), [`.dcss-curve-step-after`](https://d3js.org/d3-shape/curve#curveStepAfter), [`.dcss-curve-bump-x`](https://d3js.org/d3-shape/curve#curveBumpX), [`.dcss-curve-bump-y`](https://d3js.org/d3-shape/curve#curveBumpY): on the figure, its curve; linear without one.

### Math: families/math.css

- `.dcss-solve`: where the page's own function reaches `--target` (0 without it): `--from`, `--to` on it, nested `<i>`s, the page's rule setting `--dcss-fn` from `--dcss-at` on each; inside the deepest, `--dcss-solve` and `--dcss-solve-interval`.
- `.dcss-solve-newton`: with `.dcss-solve`, Newton's steps kept in the bracket: `--dcss-slope`, f's slope (its derivative), beside f; `--guess` optional.
- `.dcss-invert`: the inverse of the page's own function on every row of the box at once: `--from`, `--to` across it, `--top`, `--bottom` down it, its first child's pairs of `<i>`s, the page's rule setting `--dcss-fn` from `--dcss-at` on each; each line starts where f reaches its value.
- `.dcss-ode`: on store.css's frame cell (`data-store`), the page's own equation of motion, a leapfrog step a frame: `--dcss-ode-a` from `--dcss-ode-x` and `--dcss-ode-v`, `--dcss-ode-x0`, `-v0`, `-range`, `-v-range`, `-h`; on it and inside it, `--dcss-ode-x` and `--dcss-ode-v`.
- [`.dcss-geo-natural-earth1-raw-invert`](https://d3js.org/d3-geo/cylindrical#geoNaturalEarth1), [`.dcss-geo-equal-earth-raw-invert`](https://d3js.org/d3-geo/cylindrical#geoEqualEarth): 12 nested `<i>`s, Newton's steps from `--y` with d3's derivative, `--x`, `--y` on it; inside the deepest, `--dcss-geo-x`, `--dcss-geo-y` in radians.

<!-- /calls -->

### Which input gives this value

Write your formula once, as an ordinary rule, and `.dcss-solve` (families/math.css) finds the input where it reaches a value you give, `--target` (0 without one), between two numbers you give, by halving: a spreadsheet's Goal Seek. Here it solves Kepler's equation for an orbit's eccentric anomaly, E − e sin E = M:

```html
<div class="dcss-solve orbit" style="--e: 0.6">
  <i><i><i> ... 13 in all ... <i><span class="planet"></span></i> ... </i></i></i>
</div>
```

```css
.orbit { --from: 0; --to: 6.283185307179586; --target: var(--m); }
@scope (.orbit) to (.dcss-solve) {
  i { --dcss-fn: calc(var(--dcss-at) - var(--e) * sin(var(--dcss-at) * 1rad)); }
}
.planet {
  translate: calc(cos(var(--dcss-solve) * 1rad) * 100px) calc(sin(var(--dcss-solve) * 1rad) * 100px);
  opacity: var(--dcss-ready);
}
```

`--dcss-fn` is your formula and `--dcss-at` the input it is tried at; your rule runs once on every `<i>`, and each `<i>` is one try: the first at `--from`, the second at `--to`, and each one after halves what is left. So 13 `<i>`s are 2 ends and 11 halvings, and the answer is within |to − from| / 2¹² (0.0015 here); 26 give |to − from| / 2²⁵, 54 a double's last digit. Animate `--m` and the planet moves, every frame; each `<i>` costs about as much as any other element restyled, so an animated page keeps its solves to tens and its `<i>`s to the precision it draws.

- Every element inside the deepest `<i>` that isn't an `<i>` gets `--dcss-solve` and `--dcss-solve-interval`, the width left. An `<i>` there would be one more try. The `<i>`s draw no boxes (`display: contents`), so the planet lays out as the solve's own child.
- `--dcss-ready` is 0, `--dcss-err` 1 and `--dcss-solve` NaN when the formula is on the same side of the target at both ends, isn't a number at some `<i>`, or the solve has no formula or no `--from` and `--to` of its own. A NaN `translate` falls back to none, so `opacity: var(--dcss-ready)` hides a refused answer instead of drawing it in the wrong place.
- `--from`, `--to`, `--target` and `--guess` are the solve's own: they are reset inside it, so nothing inside reads them, and a solve inside another sets its own.
- The formula must be continuous between the two numbers: a sign change around a pole, like 1/(x − 0.3) on 0 to 1, halves down to the pole. Where it reaches the target more than once, the answer is one of them.
- Register nothing the formula computes: in Safari a registered `<number>` loses digits on the way down, which stops the answer short. Do register what a solve takes from its place. An unregistered `--k: sibling-index()` is worked out again on every `<i>`, where it is 1; with `@property --k { syntax: '<integer>'; inherits: true; initial-value: 0 }` each of 40 solves keeps its own index, and 40 dots spaced evenly along a spiral each solve their share of its length.
- A solve inside another's answer reads the outer `--dcss-solve` on itself (`.inner { --E: var(--dcss-solve) }`). Write each formula in `@scope (.X) to (.dcss-solve)` and the rules can come in any order; unscoped, the inner's must come after the outer's.

Give the formula's slope (its derivative) too and the same solve takes Newton's steps, so far fewer `<i>`s reach the last digit:

```html
<div class="dcss-solve dcss-solve-newton orbit" style="--e: 0.6; --guess: 1.6">
  <i><i><i><i><i><span class="planet"></span></i></i></i></i></i>
</div>
```

```css
@scope (.orbit) to (.dcss-solve) {
  i { --dcss-fn:    calc(var(--dcss-at) - var(--e) * sin(var(--dcss-at) * 1rad));
      --dcss-slope: calc(1 - var(--e) * cos(var(--dcss-at) * 1rad)); }
}
```

After the two ends, each `<i>` is one step from x to x − f/f′, from `--guess` (the middle without one). A step that would leave what is left of the bracket, or move x more than half its width, halves the bracket instead, so it can't cycle or run off the way plain Newton can. For a drawing, a pixel is enough: from a guess, 5 `<i>`s put Kepler's planet within 0.2 px on a 100 px orbit, and 4 put a cubic-bezier's t within 4e-8. A double's last digit takes 8, and 10 from the middle, where halving takes 54; an animated frame costs about half. Up to 14 `<i>`s; `--dcss-ready` is 0 also when the slope is missing or not a number.

The inverts of naturalEarth1 and equalEarth above are solves like this one, with d3's equations as the formula.

### Every row at once

When many things need one formula's answer (24 moons on one orbit, the ticks of an eased axis, labels on a curve), `.dcss-invert` answers every row of a box in one layout. The page writes its formula once, as for `.dcss-solve`; pairs of `<i>`s sample it, and each line in the box starts where the formula reaches that line's value:

```html
<div class="dcss-invert orbit" style="--from: 0; --to: 6.2832; --top: 0; --bottom: 6.2832; height: 240px">
  <span><i><i></i></i><i><i></i></i> … 32 pairs … </span>
  <p><b class="moon"></b></p> <p><b class="moon"></b></p> …
</div>
```

```css
@scope (.orbit) to (.dcss-invert) {
  i { --dcss-fn: calc(var(--dcss-at) - 0.6 * sin(var(--dcss-at) * 1rad)); }
}
.moon { display: inline-block; width: 0; }   /* drawn by its ::before, which may overflow it */
```

Inputs run across the box, from `--from` at its left edge to `--to` at its right; values run down it, from `--top` at the top to `--bottom` at the bottom. A line whose bottom edge is at value v starts at the input where the formula reaches v, so whatever starts the line sits on the answer: the answer is a position, not a number. Give the thing at a line's start no width (draw it with a pseudo-element): content wider than the room left beside the curve drops to a line below. The formula must rise down the box: for a falling one, put the larger value in `--top`. Where it turns back, a line starts at the last column it has passed its value. The answer follows straight pieces between the n + 1 values: on a 1,000 px box, 32 pairs keep Kepler's inverse at e = 0.6 within 0.42 px and 64 within 0.25 (probes/dcss/invert/check.mjs). Fewer rows cost less: 100 rows with the formula moving take a few ms a frame, 1,000 rows about 15 (Performance).

### The area under a curve, and its highest point

These need no call of their own: sample the formula on a list's items and ask the list. Each item's input is its middle, from a registered `--at` (registered, so each item keeps its own index), and its value is rounded to 64ths, the list's unit: one value off 64ths and the list refuses. The area of sin on 0 to π is the sum times the step:

```html
<figure class="dcss-sum wave"><ul aria-hidden="true"><li></li> … 64 … </ul><output></output></figure>
```

```css
@property --at { syntax: '<number>'; inherits: true; initial-value: 0; }
.wave li { --at: calc((sibling-index() - 0.5) * 3.14159 / sibling-count());
           --value: round(calc(64 * sin(var(--at) * 1rad)), 0.015625); }   /* 64 times f, kept to 64ths */
```

`--dcss-sum` × π / 64 / 64 is 2.0002 (exactly 2); with `.dcss-max` in place of `.dcss-sum`, the highest value. While the formula moves, each such list costs a frame what any list of its length does, so a page keeps to a few (Performance; probes/dcss/sample/probe.mjs).

### Motion by your own equation

For something that moves by a force (a pendulum, a spring that follows the pointer, a ball pulled by gravity), write its acceleration once and `.dcss-ode` steps it a frame at a time. It runs on store.css's frame cell, so link store.css and put `data-store` on the element:

```html
<div data-store class="dcss-ode pendulum"><b class="bob"></b></div>
```

```css
.pendulum { --dcss-ode-x0: 1.2; --dcss-ode-range: 4; --dcss-ode-v-range: 20;
            --dcss-ode-a: calc(-6.5 * sin(var(--dcss-ode-x) * 1rad)); }
.bob { rotate: calc(var(--dcss-ode-x) * 1rad); }
```

The element and everything inside it get `--dcss-ode-x` and `--dcss-ode-v`, the position and the speed. Each frame the cell takes one leapfrog step: v changes by h × a, then x by h × v. A spring or a pendulum stepped this way keeps its swing for minutes instead of slowly gaining or losing it. `--dcss-ode-a` may read x and v (damping is a term in v), and anything else the page sets, such as the pointer's position. `--dcss-ode-x0` and `--dcss-ode-v0` are where it starts (0); `--dcss-ode-h` is the time a frame (1/60): a screen that draws faster runs it faster. The cell keeps x and v as whole numbers, so each has a range: `--dcss-ode-range` for x (500, kept to 1/1000) and `--dcss-ode-v-range` for v (5,000, kept to 1/100). Pick ranges a little wider than the motion; `--dcss-err` is 1 while either is past its range. `--dcss-ready` is 1 from the frame the cell has its first numbers back. Two numbers a cell: for x and y that move apart, nest two cells and copy the outer's x into a property of your own first, since the inner cell sets its own.

### As CSS functions

Where the browser has `@function` (Chrome; Safari Technology Preview), these calls are also functions, with no element and no list. They are a sheet of their own, `families/functions.css`, or one call's in `parts/functions/<class>.css` (`parts/functions/dcss-geo-mercator.css`); the class sheets don't carry them. Their arguments are the class's inputs in order, and a value the class refuses gives NaN:

- `--dcss-ease-<name>(t)`, with the exponent, overshoot, amplitude or period after `t`: `--dcss-ease-cubic-in-out(0.25)` is 0.0625.
- `--dcss-scale-linear(x, d0, d1, r0, r1, clamp, round)`, and `-pow` (the exponent after `r1`), `-sqrt` and `-log`.
- `--dcss-scale-symlog(x, d0, d1, r0, r1, constant, clamp, round)` and `--dcss-scale-radial(x, d0, d1, r0, r1, clamp, round)`; `--dcss-scale-sequential(x, d0, d1, r0, r1, clamp, round)` and `--dcss-scale-diverging(x, d0, d1, d2, r0, r1, r2, clamp, round)`, each also `-log`, `-pow` (the exponent after the range), `-sqrt` and `-symlog` (the constant after the range).
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

Headless Chrome 155 and WebKit 26.4, Safari's engine, pass all 193 requirements of [SPEC.md](SPEC.md), and the calls match d3 on 3,206 of the 7,049 calls in d3's tests. Firefox 158 computes `calc()` in 32-bit floats, so exact sums, dates and most formatting go wrong there: it passes 70. [QUIRKS.md](QUIRKS.md) has the engine bugs.

<!-- /browsers -->

## Performance

<!-- performance -->

Layout does the work, in the frame a number changes. A family is at most 30 KB gzipped and loads in 15 ms or less in WebKit 26.4 (2026-10-28). Twenty printed medians, a value moving: 6.3 ms a frame in Chrome, 9.6 in WebKit; variance 8.2, 10.3 (2026-10-30).

<!-- /performance -->

`.dcss-invert` with f animated, 32 pairs (2026-10-31): 100 rows 2.3 ms a frame in Chrome, 2.9 in WebKit; 1,000 rows 14.7 and 14.3. Twenty `.dcss-ode` pendulums swinging: 4.7 and 5.2. The area under a curve, 64 samples on a `.dcss-sum` with the formula moving: 5.8 ms a frame in Chrome, 5.5 in WebKit; twenty, 110 and 79. All three calls on one page (20 Newton solves, a 100-row invert, 20 pendulums): 14.3 ms a frame in Chrome, 31.6 in WebKit, about half of it from store.css, linked for the pendulums (probes/dcss/model/together.mjs).

## License

MIT, see the repository's LICENSE.

## Credits

- [d3](https://d3js.org), whose functions the calls follow and whose tests check them.
