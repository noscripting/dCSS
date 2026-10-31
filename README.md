# dcss.css

dcss.css computes with no script, in HTML: a list's statistics, ticks and nice ranges, scales, number and date formats, UTC dates, and a formula of your own, solved, evaluated, sampled or set in motion, each as d3 or a spreadsheet works it out. It works in Chrome and Safari, not Firefox ([Browsers](#browsers)).

## Installation

No build, no script: link a call's part, or `dcss.css` and its family. Each call is a class, and a file in `parts/`. One class per figure; `.dcss-summarize` gives nine at once. A sum is a `<figure>` around a list: the browser lays the list out, and its size is the answer. This page links two parts that come to 9 KB gzipped:

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

Formulas written as Content MathML over a table the reader sees compile to these calls with [BASICSS](https://github.com/noscripting/basicss)'s MathML format.

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

A range made nice reads `.dcss-nice`'s `--dcss-nice-start` and `--dcss-nice-stop`, as d3.nice gives them:

```html
<figure class="dcss-nice" style="--start: -3.5; --stop: 31.2; --count: 6">
  <output class="dcss-format-fixed" style="--value: var(--dcss-nice-start); --precision: 0"></output> <!-- −5 -->
  <output class="dcss-format-fixed" style="--value: var(--dcss-nice-stop); --precision: 0"></output> <!-- 35 -->
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




## Looking up a value

A spreadsheet's exact lookup: `.dcss-lookup` gives the `--value` of the row whose `--key` is the figure's `--find`, as d3.index's get does. Keys are numbers: a product number, a year, a size. Prices go in cents:

```html
<figure class="dcss-lookup dcss-format-fixed" style="--find: 102; --precision: 2; height: 1lh; overflow: clip">
  <ul aria-hidden="true">
    <li style="--key: 101; --value: 1250"></li>
    <li style="--key: 102; --value: 899"></li>
    <li style="--key: 205; --value: 4500"></li>
  </ul>
  <div><output style="--value: calc(var(--dcss-lookup) / 100)"></output></div>  <!-- 8.99 -->
</figure>
```

A key in no row prints nothing, error 2; a key in two rows, error 1. A list has no limit on rows. For brackets (a tax band, a shipping tier: the row whose range holds the number), use `.dcss-scale-threshold`.

## Numbers in your language

A format prints as the page's language does, from `lang`, with d3's own locales: German marks thousands with a dot and puts the euro after.

```html
<p lang="de-DE">
  <output class="dcss-format-fixed" style="--value: 1234.5; --precision: 2; --comma: 1; --symbol: 1"></output>  <!-- 1.234,50 € -->
</p>
```

`--symbol: 1` is the currency. Every language d3-format has a file for works, 58 of them (`fr-FR`, `es-MX`, `pt-BR`, `ja-JP`, the Arabic ones with their own digits): put `lang` on `<html>` once. A language d3 has no file for (`es-AR`) prints as d3's default, `en-US`; `en-IN` too, since it groups digits by two.

## Reference

Each call gives its answer as `--dcss-` and its name to the elements directly inside the one it reads into, not deeper; `--dcss-ready` and `--dcss-err` inherit. [SPEC.md](SPEC.md) has each input's range.

<!-- calls -->

### Array: families/array.css

- [`.dcss-sum`](https://d3js.org/d3-array/summarize#sum), [`.dcss-mean`](https://d3js.org/d3-array/summarize#mean), [`.dcss-count`](https://d3js.org/d3-array/summarize#count), `.dcss-length`, [`.dcss-min`](https://d3js.org/d3-array/summarize#min), [`.dcss-max`](https://d3js.org/d3-array/summarize#max), [`.dcss-extent`](https://d3js.org/d3-array/summarize#extent): of the list; length counts its items.
- `.dcss-summarize`: sum, count, length, mean, min, max, median, variance and deviation of one list, to each element after it and everything inside.
- [`.dcss-min-index`](https://d3js.org/d3-array/summarize#minIndex), [`.dcss-max-index`](https://d3js.org/d3-array/summarize#maxIndex), [`.dcss-least-index`](https://d3js.org/d3-array/summarize#leastIndex), [`.dcss-greatest-index`](https://d3js.org/d3-array/summarize#greatestIndex), [`.dcss-least`](https://d3js.org/d3-array/summarize#least), [`.dcss-greatest`](https://d3js.org/d3-array/summarize#greatest): where the least or greatest is, or its value.
- [`.dcss-lookup`](https://d3js.org/d3-array/group#index): the `--value` of the row whose `--key` is the figure's `--find`, as a spreadsheet's exact lookup.
- [`.dcss-median`](https://d3js.org/d3-array/summarize#median), [`.dcss-quantile`](https://d3js.org/d3-array/summarize#quantile), [`.dcss-quantile-sorted`](https://d3js.org/d3-array/summarize#quantileSorted), [`.dcss-median-index`](https://d3js.org/d3-array/summarize#medianIndex), [`.dcss-quantile-index`](https://d3js.org/d3-array/summarize#quantileIndex): read three elements deep; `--p` places a quantile.
- [`.dcss-variance`](https://d3js.org/d3-array/summarize#variance), [`.dcss-deviation`](https://d3js.org/d3-array/summarize#deviation): read by the element after the list, as the summary's.
- [`.dcss-scale-quantile`](https://d3js.org/d3-scale/quantile#scaleQuantile), [`.dcss-scale-threshold`](https://d3js.org/d3-scale/threshold#scaleThreshold), [`.dcss-scale-quantize`](https://d3js.org/d3-scale/quantize#scaleQuantize): `--value` to `--range-0` to `--range-16` (`--ranges` of them) or `--unknown`, by the list four elements deep or by `--domain-0` to `--domain-15`.
- [`.dcss-bisect-left`](https://d3js.org/d3-array/bisect#bisectLeft), [`.dcss-bisect-right`](https://d3js.org/d3-array/bisect#bisectRight), [`.dcss-bisect`](https://d3js.org/d3-array/bisect#bisect), [`.dcss-bisector-left`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-bisector-right`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-bisector`](https://d3js.org/d3-array/bisect#bisector): where the figure's `--value` goes in the sorted list.
- [`.dcss-ascending`](https://d3js.org/d3-array/sort#ascending), [`.dcss-descending`](https://d3js.org/d3-array/sort#descending): comparing `--a` and `--b`.
- [`.dcss-cumsum`](https://d3js.org/d3-array/summarize#cumsum), [`.dcss-bin`](https://d3js.org/d3-array/bin#bin): a second list, a `<li>` per total or bin; bins cut `--domain-0` to `--domain-1` at `--threshold-0` to `--threshold-31` or by `--count`.
- `.dcss-share`: each item's fraction, `--dcss-share`, in its `.dcss-share-read > .dcss-share-result`.
- [`.dcss-precision-fixed`](https://d3js.org/d3-format#precisionFixed), [`.dcss-precision-prefix`](https://d3js.org/d3-format#precisionPrefix), [`.dcss-precision-round`](https://d3js.org/d3-format#precisionRound): for `--step`, with `--value` or `--max`.
- [`.dcss-range`](https://d3js.org/d3-array/ticks#range): one `<li>` per number, `--start` to `--stop` by `--step`.
- [`.dcss-ticks`](https://d3js.org/d3-array/ticks#ticks), [`.dcss-nice`](https://d3js.org/d3-array/ticks#nice): a range's ticks, each `<li>` reading `--dcss-tick`, from `--start` to `--stop`, `--count` of them (10); the range made nice, `--dcss-nice-start` and `--dcss-nice-stop`.

### Scale: families/scale.css

- [`.dcss-scale-linear`](https://d3js.org/d3-scale/linear#scaleLinear), [`.dcss-scale-pow`](https://d3js.org/d3-scale/pow#scalePow), [`.dcss-scale-sqrt`](https://d3js.org/d3-scale/pow#scaleSqrt), [`.dcss-scale-log`](https://d3js.org/d3-scale/log#scaleLog), [`.dcss-scale-identity`](https://d3js.org/d3-scale/linear#scaleIdentity): `--value` from `--domain-0`, `--domain-1` to `--range-0`, `--range-1`, and back as `-invert`.
- `.dcss-piecewise`: up to 8 stops, `--stops`.
- [`.dcss-scale-ordinal`](https://d3js.org/d3-scale/ordinal#scaleOrdinal): `--value`'s place in `--domain-0` to `--domain-15` (`--domains` of them) picks `--range-0` to `--range-15` (`--ranges` of them, cycled), to everything inside: `--dcss-scale-ordinal`; a value in no slot takes `--unknown`, else the range at `--domains`, none with `--implicit: 0`.

### Format: families/format.css

- [`.dcss-format-fixed`](https://d3js.org/d3-format#format), [`.dcss-format-percent`](https://d3js.org/d3-format#format), [`.dcss-format-si`](https://d3js.org/d3-format#format), [`.dcss-format-general`](https://d3js.org/d3-format#format): `--value` printed with `--precision`; 1 in `--comma`, `--sign`, `--symbol` or `--trim` for d3's `,`, `+`, `$` or `~`.
- [`.dcss-format-locale`](https://d3js.org/d3-format#formatLocale), [`.dcss-locale-arabic`](https://d3js.org/d3-format#formatLocale): Arabic `$,.2f`, `--dcss-locale-precision`, `--dcss-locale-sign`.

### Dates: families/dates.css

- [`.dcss-utc-<interval>-<op>`](https://d3js.org/d3-time#utcDay): epoch milliseconds to a UTC `day`, `hour`, `minute`, `second`, `sunday` to `saturday`, `month` or `year` by `floor`, `ceil`, `round`, `offset` or `count`.
- [`.dcss-date-format-N`](https://d3js.org/d3-time-format#utcFormat): epoch milliseconds printed with specifier N:

```
 0 %c       1 %a       2 %A       3 %b       4 %B       5 %d       6 %e       7 %g
 8 %G       9 %H      10 %I      11 %j      12 %m      13 %M      14 %p      15 %q
16 %Q      17 %s      18 %s.%L   19 %s.%f   20 %S      21 %0S     22 %_S     23 %-S
24 %L      25 %u      26 %f      27 %U      28 %W      29 %V      30 %x      31 %X
32 %y      33 %Y      34 %Z      35 %%      36 .%L     37 :%S     38 %I:%M   39 %I %p
40 %a %d
```

### Math: families/math.css

- `.dcss-solve`: where the page's own function reaches `--target` (0 without it): `--from`, `--to` on it, nested `<i>`s (or `data-dcss-steps` and the build writes them), the page's rule setting `--dcss-formula` from `--dcss-input` on each; inside the deepest, `--dcss-solve` and `--dcss-solve-width`.
- `.dcss-solve-newton`: with `.dcss-solve`, Newton's steps kept in the bracket: `--dcss-slope`, f's slope (its derivative), beside f (the build writes it from f); `--guess` optional.
- `.dcss-solve-turning-point`: with `.dcss-solve`, where the page's own function is highest or lowest between `--from` and `--to`, one hump: where its slope, `--dcss-slope` (the build writes it from f), reaches 0; halving, with `data-dcss-within` or `data-dcss-steps`.
- `.dcss-solve-every`: every input between `--from` and `--to` where the page's own function reaches `--target`: the range cut into `data-dcss-pieces` (or `data-dcss-apart`, how far apart two answers may be) and each piece a `.dcss-solve` the build writes, with a copy of what the call holds; a piece with no answer hides its copy. With `.dcss-solve-turning-point`, every peak and dip.
- `.dcss-evaluate`: the page's own function at one input, `--at` on it; inside its `<i>` (the build writes it), `--dcss-evaluate` and `--dcss-slope` (the build writes it from f).
- `.dcss-solve-rows`: the inverse of the page's own function on every row of the box at once: `--from`, `--to` across it, `--top`, `--bottom` down it, its first child's pairs of `<i>`s (or `data-dcss-steps`), the page's rule setting `--dcss-formula` from `--dcss-input` on each; each line starts where f reaches its value.
- `.dcss-sample`: with a list call (`.dcss-sum`, `.dcss-max`, `.dcss-mean`…), the page's own function as the list: `--from`, `--to` on it, each item's `--value` the page's `--dcss-formula` at `--dcss-input`, the item's middle, rounded to 64ths; with `--columns`, a grid, and `--dcss-input-y` from `--from-y` to `--to-y` down its rows. Alone, without a list call, its items are drawn (a heat map), each with `--dcss-ready`.

### Motion: families/motion.css

- `.dcss-motion`: on store.css's frame cell (`data-store`), the page's own equation of motion, a leapfrog step a frame: `--dcss-motion-acceleration` from `--dcss-motion-position` and `--dcss-motion-speed`, `--dcss-motion-start-position`, `-start-speed`, `-position-range`, `-speed-range`, `-time-step`; on it and inside it, `--dcss-motion-position` and `--dcss-motion-speed`.

<!-- /calls -->

### Which input gives this value

Write your formula once, as an ordinary rule, and `.dcss-solve` (families/math.css) finds the input where it reaches a value you give, `--target` (0 without one), between two numbers you give, by halving: a spreadsheet's Goal Seek. Here it solves Kepler's equation for an orbit's eccentric anomaly, E − e sin E = M:

```html
<div class="dcss-solve orbit" data-dcss-within="0.002" style="--e: 0.6">
  <span class="planet"></span>
</div>
```

```css
.orbit { --from: 0; --to: 6.283185307179586; --target: var(--m); }
@scope (.orbit) to (.dcss-solve) {
  i { --dcss-formula: calc(var(--dcss-input) - var(--e) * sin(var(--dcss-input) * 1rad)); }
}
.planet {
  translate: calc(cos(var(--dcss-solve) * 1rad) * 100px) calc(sin(var(--dcss-solve) * 1rad) * 100px);
  opacity: var(--dcss-ready);
}
```

`--dcss-formula` is your formula, and `--dcss-input` the number it is tried at: the call writes it, your formula reads it. `data-dcss-within="0.002"` says how close the answer must be, in the same units as `--from` and `--to`, and the build, `node steps.mjs page.html built.html`, works out how many tries that takes (13 here) and writes them as nested `<i>`s around what is inside (no script on the built page). Your rule runs once on every `<i>`, and each `<i>` is one try: the first at `--from`, the second at `--to`, and each one after halves what is left, so n `<i>`s put the answer within |to − from| / 2ⁿ⁻¹. The build reads `--from` and `--to` when they are plain numbers on the element or in a rule on one of its classes; where they aren't, write `data-dcss-steps="13"`, the count itself, or the `<i>`s by hand, `<i><i><i> … <span class="planet"></span> … </i></i></i>`. A solve or an invert with no `<i>`s (the attribute on a page never built) gives `--dcss-err` 1. Animate `--m` and the planet moves, every frame; each `<i>` costs about as much as any other element restyled, so an animated page keeps its solves to tens and its `<i>`s to the precision it draws.

- Every element inside the deepest `<i>` that isn't an `<i>` gets `--dcss-solve` and `--dcss-solve-width`, the width left. An `<i>` there would be one more try. The `<i>`s draw no boxes (`display: contents`), so the planet lays out as the solve's own child.
- `--dcss-ready` is 0, `--dcss-err` 1 and `--dcss-solve` NaN when the formula is on the same side of the target at both ends, isn't a number at some `<i>`, or the solve has no formula or no `--from` and `--to` of its own. A NaN `translate` falls back to none, so `opacity: var(--dcss-ready)` hides a refused answer instead of drawing it in the wrong place.
- `--from`, `--to`, `--target` and `--guess` are the solve's own: set them on the solve itself (its style or a rule on it). A value set only on an element around it is not read, so a solve inside a chart mark that sets its own `--from` refuses instead of answering on the mark's range; nothing inside reads them, and a solve inside another sets its own. The same holds for a sample's ends and a solve-rows' four. To share ends, set them on the calls with one rule: `.demo :is(.dcss-solve, .dcss-sample) { --from: 0; --to: 1; }`.
- The formula must be continuous between the two numbers: a sign change around a pole, like 1/(x − 0.3) on 0 to 1, halves down to the pole. Where it reaches the target more than once, the answer is one of them.
- Register nothing the formula computes: in Safari a registered `<number>` loses digits on the way down, which stops the answer short. Do register what a solve takes from its place. An unregistered `--k: sibling-index()` is worked out again on every `<i>`, where it is 1; with `@property --k { syntax: '<integer>'; inherits: true; initial-value: 0 }` each of 40 solves keeps its own index, and 40 dots spaced evenly along a spiral each solve their share of its length.
- A solve inside another's answer reads the outer `--dcss-solve` on itself (`.inner { --E: var(--dcss-solve) }`). Write each formula in `@scope (.X) to (.dcss-solve)` and the rules can come in any order; unscoped, the inner's must come after the outer's.

For a drawing, halving is the one to use: 13 tries put an answer within a pixel of a 4,096 px range, and at a pixel they cost a frame less than Newton's steps do (Performance). When you need digits (a value printed to many places, a solve inside another's answer), add `.dcss-solve-newton` and the same solve takes Newton's steps, so far fewer `<i>`s reach the last digit:

```html
<div class="dcss-solve dcss-solve-newton orbit" data-dcss-steps="5" style="--e: 0.6; --guess: 1.6">
  <span class="planet"></span>
</div>
```

```css
@scope (.orbit) to (.dcss-solve) {
  i { --dcss-formula: calc(var(--dcss-input) - var(--e) * sin(var(--dcss-input) * 1rad)); }
}
```

Newton needs the formula's slope, its derivative, as `--dcss-slope`, and the build works it out from your formula's text: on a page with a `.dcss-solve-newton`, `node steps.mjs page.html built.html` writes `--dcss-slope: calc(1 - var(--e) * cos(var(--dcss-input) * 1rad))` beside each `--dcss-formula` in the page's `<style>`s, on the same line. It takes `+ - * /`, `pow()`, `sqrt()`, `exp()`, `log()`, `sin()` and the other trigonometric functions and their inverses, `hypot()`, `abs()`, `sign()`, `min()`, `max()`, `clamp()`, `round()`, `mod()` and `rem()`, and keeps the formula's units (an angle in `deg` or `rad`). Every `var()` but `--dcss-input` is a number that doesn't change with it. A formula that reads a property the page works out from `--dcss-input` (directly or through another), has a percentage, or a function it has no slope for gets no slope: the build names it on stderr with its line and builds the rest of the page; write `--dcss-slope` yourself there, or to skip the build. A slope you write is left as it is; the build's own says so in a comment and follows the formula when you change it.

After the two ends, each `<i>` is one step from x to x − f/f′, from `--guess` (the middle without one). A step that would leave what is left of the bracket, or move x more than half its width, halves the bracket instead, so it can't cycle or run off the way plain Newton can. For a drawing, a pixel is enough: from a guess, 5 `<i>`s put Kepler's planet within 0.2 px on a 100 px orbit, and 4 put a cubic-bezier's t within 4e-8. A double's last digit takes 8, and 10 from the middle, where halving takes 54; an animated frame costs about half. Up to 14 `<i>`s; `--dcss-ready` is 0 also when the slope is missing or not a number.

Add `.dcss-solve-turning-point` and the solve finds where your formula is highest or lowest instead: the top of a bounce, the nearest point of a path, the busiest hour of a curve. Give it `--from` and `--to` around one hump:

```html
<div class="dcss-solve dcss-solve-turning-point peak" data-dcss-within="0.001" style="--from: 0; --to: 4">
  <span class="marker"></span>
</div>
```

```css
.peak i { --dcss-formula: calc(var(--dcss-input) * exp(-1 * var(--dcss-input))); }
.marker { translate: calc(var(--dcss-solve) * 100px) 0; opacity: var(--dcss-ready); }
```

The marker sits at 1, where x e⁻ˣ peaks, within 0.001. The build writes the formula's slope beside it, and the solve finds where that slope reaches 0, so a page never built gives `--dcss-err` 1. Between `--from` and `--to` there must be one peak or one dip; at two, the answer is one of them.

The inverts of naturalEarth1 and equalEarth above are solves like this one, with d3's equations as the formula.

### Every place it reaches a value

A solve finds one answer in its range. `.dcss-solve-every` finds each one: the build cuts the range into pieces, makes each piece a solve of its own and copies what the call holds into each, so every answer gets its own copy (a dot, a label):

```html
<style>
  .wave i { --dcss-formula: sin(var(--dcss-input) * 1rad); }
  .wave { position: relative; height: 20px; }
  .dot { position: absolute; left: calc(var(--dcss-solve) * 40px); width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
</style>
<div class="dcss-solve-every wave" data-dcss-apart="1" data-dcss-within="0.01" style="--from: 0; --to: 12.566; --target: 0.5">
  <b class="dot"></b>
</div>
```

Four dots, where the wave reaches 0.5 (0.52, 2.62, 6.81, 8.90). `data-dcss-apart="1"` says how close two answers may be: the build cuts the range into pieces that wide (13 here) and each piece finds at most one, so two answers closer than that show as one; `data-dcss-pieces="13"` gives the count instead. `data-dcss-within` is how close each answer is, as for a solve. A piece with no answer hides its copy (`visibility`, so a screen reader skips it too), and `--dcss-ready` is 0 there. An answer exactly where two pieces meet is found once. A formula that touches the value without crossing it (x² reaching 0) has no answer here: its touches are the turning points, so add `.dcss-solve-turning-point` and the call finds every peak and dip instead. What the call holds is copied, so it holds no `id`. Each piece carries the call's classes, so a rule written `@scope (.wave) to (.dcss-solve)` reaches its tries too.

### The formula at one input

`.dcss-evaluate` gives your formula's value at one number, `--at`: a label on a curve, a price at 30 items, a point to draw a tangent from.

```html
<style>
  .square i { --dcss-formula: calc(var(--dcss-input) * var(--dcss-input)); }
</style>
<p class="dcss-evaluate square" style="--at: 0.3">
  <output class="dcss-format-fixed" style="--value: var(--dcss-evaluate); --precision: 2"></output> <!-- 0.09 -->
</p>
```

The build writes an `<i>` around what the call holds, and your rule runs on it at `--dcss-input` = `--at`. Everything inside gets `--dcss-evaluate`, the value, and `--dcss-slope`, how steeply the formula rises there (0.6 here), which the build writes from your formula as for Newton's solve. `--dcss-ready` is 1 when the value is a number; `--dcss-err` is 1 when it isn't, or `--at` isn't a number set on the call itself. The slope is in your formula's units; to draw it on screen, scale it by your axes (pixels per input across, pixels per value up).

### Every row at once

When many things need one formula's answer (24 moons on one orbit, the ticks of an eased axis, labels on a curve), `.dcss-solve-rows` answers every row of a box in one layout. The page writes its formula once, as for `.dcss-solve`; 32 straight pieces sample it (the build writes them, a first `<span>` of 32 pairs `<i><i></i></i>`), and each line in the box starts where the formula reaches that line's value:

```html
<div class="dcss-solve-rows orbit" data-dcss-steps="32" style="--from: 0; --to: 6.2832; --top: 0; --bottom: 6.2832; height: 240px">
  <p><b class="moon"></b></p> <p><b class="moon"></b></p> …
</div>
```

```css
@scope (.orbit) to (.dcss-solve-rows) {
  i { --dcss-formula: calc(var(--dcss-input) - 0.6 * sin(var(--dcss-input) * 1rad)); }
}
.moon { display: inline-block; width: 0; }   /* drawn by its ::before, which may overflow it */
```

Inputs run across the box, from `--from` at its left edge to `--to` at its right; values run down it, from `--top` at the top to `--bottom` at the bottom. A line whose bottom edge is at value v starts at the input where the formula reaches v, so whatever starts the line sits on the answer: the answer is a position, not a number. Give the thing at a line's start no width (draw it with a pseudo-element): content wider than the room left beside the curve drops to a line below. The formula must rise down the box: for a falling one, put the larger value in `--top`. Where it turns back, a line starts at the last column it has passed its value. The answer follows straight pieces between the n + 1 values: on a 1,000 px box, 32 pairs keep Kepler's inverse at e = 0.6 within 0.42 px and 64 within 0.25 (probes/dcss/invert/check.mjs). Fewer rows cost less: 100 rows with the formula moving take a few ms a frame, 1,000 rows about 15 (Performance).

### The formula as a list: its area, its highest point

Put `.dcss-sample` beside a list call and each item's value is your formula at that item's middle, so every list call reads the curve: `.dcss-sum` its area (times the step), `.dcss-max` its highest value, `.dcss-mean` its average.

```html
<style>
  .wave li { --dcss-formula: sin(var(--dcss-input) * 1rad); }   /* the same --dcss-formula from --dcss-input as a solve's */
</style>
<figure class="dcss-sum dcss-sample wave" style="--from: 0; --to: 3.14159">
  <ul aria-hidden="true"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
  <output class="dcss-format-fixed" style="--value: calc(var(--dcss-sum) * 3.14159 / 16); --precision: 2"></output> <!-- 2.00 -->
</figure>
```

That prints 2.00, the area under one hump of a sine, from 16 values. Each value is rounded to the list's 64ths, so write the formula in units where 1/64 is close enough (pixels are); `--dcss-err` is 1 when the items have no formula, or the figure no `--from` and `--to`. While the formula moves, a sampled list costs a frame what any list of its length does, so a page keeps to a few (Performance).

A formula of two inputs samples on a grid: `--columns` lays the items out in rows of that many, `--dcss-input` runs across a row from `--from` to `--to` and `--dcss-input-y` down the rows from `--from-y` to `--to-y`. Alone, without a list call, the items are yours to draw, a heat map; beside `.dcss-sum`, the sum times both cell sizes is the volume under the formula (a list call keeps its list hidden, so draw and sum in two figures):

```html
<style>
  .hill li { --dcss-formula: calc(64 * exp(-1 * (var(--dcss-input) * var(--dcss-input) + var(--dcss-input-y) * var(--dcss-input-y)))); }
  .map ul { display: grid; grid-template-columns: repeat(var(--columns), 20px); padding: 0; margin: 0; list-style: none; }
  .map li { height: 20px; background: color-mix(in oklab, gold calc(var(--value) / 64 * 100%), navy); }
</style>
<figure class="dcss-sample hill map" style="--from: -1; --to: 1; --from-y: -1; --to-y: 1; --columns: 4">
  <ul aria-hidden="true"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
</figure>
<figure class="dcss-sum dcss-sample hill" style="--from: -1; --to: 1; --from-y: -1; --to-y: 1; --columns: 4">
  <ul aria-hidden="true"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
  <output class="dcss-format-fixed" style="--value: calc(var(--dcss-sum) / 64 * 0.5 * 0.5); --precision: 2"></output> <!-- 2.28 -->
</figure>
```

That draws a 4 by 4 heat map of a hill and prints 2.28, the space under it from 16 values (2.23 exactly; more items come closer). The ×64 is the 64ths again: a formula from 0 to 1 would band into 64 steps. Each item gets `--dcss-ready` and `--dcss-err` of its own. Items that aren't a whole number of rows, a `--columns` that isn't a whole number, or a missing `--from-y` where the formula reads `--dcss-input-y` give `--dcss-err` 1. A cell is (to − from) / columns wide and (to-y − from-y) / rows high, each taken positive.

One rule can feed every call at once: `.demo :is(i, li) { --dcss-formula: … }` on a wrapper holding a `.dcss-solve-rows`, a `.dcss-solve` and a `.dcss-sample`, and dots on the curve, where it reaches a value and the area under it all follow the one formula (probes/dcss/sample/curve.html, with no script: radio buttons change it).

### Motion by your own equation

For something that moves by a force (a pendulum, a spring that follows the pointer, a ball pulled by gravity), write its acceleration once and `.dcss-motion` steps it a frame at a time. It runs on store.css's frame cell, so link store.css and put `data-store` on the element:

```html
<div data-store class="dcss-motion pendulum"><b class="bob"></b></div>
```

```css
.pendulum { --dcss-motion-start-position: 1.2; --dcss-motion-position-range: 4; --dcss-motion-speed-range: 20;
            --dcss-motion-acceleration: calc(-6.5 * sin(var(--dcss-motion-position) * 1rad)); }
.bob { rotate: calc(var(--dcss-motion-position) * 1rad); }
```

The element and everything inside it get `--dcss-motion-position` and `--dcss-motion-speed`, the position and the speed. Each frame the cell takes one leapfrog step: the speed changes by the time step times the acceleration, then the position by the time step times the speed. A spring or a pendulum stepped this way keeps its swing for minutes instead of slowly gaining or losing it. `--dcss-motion-acceleration` may read the position and the speed (damping is a term in the speed), and anything else the page sets, such as the pointer's position. `--dcss-motion-start-position` and `--dcss-motion-start-speed` are where it starts (0); `--dcss-motion-time-step` is the time a frame (1/60): a screen that draws faster runs it faster. The cell keeps both as whole numbers, so each has a range: `--dcss-motion-position-range` (500, kept to 1/1000) and `--dcss-motion-speed-range` (5,000, kept to 1/100). Pick ranges a little wider than the motion; `--dcss-err` is 1 while either is past its range. `--dcss-ready` is 1 from the frame the cell has its first numbers back. Two numbers a cell: for x and y that move apart, nest two cells and copy the outer one's position into a property of your own first, since the inner cell sets its own.

### As CSS functions

Where the browser has `@function` (Chrome; Safari Technology Preview), these calls are also functions, with no element and no list. They are a sheet of their own, `families/functions.css`, or one call's in `parts/functions/<class>.css` (`parts/functions/dcss-scale-linear.css`); the class sheets don't carry them. Their arguments are the class's inputs in order, and a value the class refuses gives NaN:

- `--dcss-scale-linear(x, d0, d1, r0, r1, clamp, round)`, and `-pow` (the exponent after `r1`), `-sqrt` and `-log`.
- `--dcss-utc-<interval>-floor(t)`, `-ceil(t)`, `-round(t)`, `-offset(t, step)` and `-count(start, stop)` for `day`, `hour`, `minute`, `second` and `sunday` to `saturday`.

A browser without `@function` drops the declaration, so write a plain value before it:

```css
.bar { width: 0; width: calc(--dcss-scale-linear(var(--sales), 0, 1000, 0, 600) * 1px); }
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

Headless Chrome 155 and WebKit 26.4, Safari's engine, pass all 126 requirements of [SPEC.md](SPEC.md), and the calls match d3 on 2,120 of the 5,783 calls in d3's tests. Firefox 158 computes `calc()` in 32-bit floats, so exact sums, dates and most formatting go wrong there: it passes 67. [QUIRKS.md](QUIRKS.md) has the engine bugs.

<!-- /browsers -->

## Performance

<!-- performance -->

Layout does the work, in the frame a number changes. A family is at most 36 KB gzipped and loads in 22 ms or less in WebKit 26.4 (2026-10-31). Twenty printed medians, a value moving: 6.3 ms a frame in Chrome, 9.6 in WebKit; variance 8.2, 10.3 (2026-10-30).

<!-- /performance -->

Twenty `.dcss-solve`s animated, good to a pixel (2026-10-31): 13 tries of halving 3.4 ms a frame in Chrome, 9.6 in WebKit; 5 Newton steps 7.4 and 12.3; the Newton machine halving with no slope, 13 tries, 24.7 and 41.0, so the two stay apart. A page using `.dcss-solve` alone carries no Newton step. `.dcss-solve-rows` with f animated, 32 pairs (2026-10-31): 100 rows 2.3 ms a frame in Chrome, 2.9 in WebKit; 1,000 rows 14.7 and 14.3. Twenty `.dcss-motion` pendulums swinging: 4.7 and 5.2. A `.dcss-sum` of 64 samples with the formula moving: 5.8 ms a frame in Chrome, 5.5 in WebKit; twenty, 110 and 79. Twenty `.dcss-evaluate`s with `--at` moving (2026-10-31): 1.3 ms a frame in Chrome, 2.1 in WebKit. Five `.dcss-solve-every`s of 13 pieces, the target moving: 8.5 and 25.3. A grid with the formula moving, drawn and summed: 8 by 8, 18.0 and 20.8; 16 by 16, 76 and 77, about 13 frames a second, most of it the 256-item sum (one row of 256 drawn and summed, 59 and 57), so a moving grid keeps to 8 by 8 and a still one can be larger (probes/dcss/math-cost/cost.mjs). All three calls on one page (20 Newton solves, a 100-row invert, 20 pendulums): 14.3 ms a frame in Chrome, 31.6 in WebKit, about half of it from store.css, linked for the pendulums (probes/dcss/model/together.mjs). One formula feeding a 32-pair invert, two 20-`<i>` solves and a 100-item `.dcss-sample`, the formula changing every frame: 13.8 ms a frame in Chrome, 14.1 in WebKit (probes/dcss/sample/curve-check.mjs).

## License

MIT, see the repository's LICENSE.

## Credits

- [d3](https://d3js.org), whose functions the calls follow and whose tests check them.
