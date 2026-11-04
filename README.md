# dCSS

A CSS arithmetic library. d3's data functions for the DOM: sums, means and medians, scales, number and date formats, lookups, and formulas of your own, worked out by the browser's layout from numbers written in HTML. No JavaScript runs. Works in Chrome and Safari. Firefox computes CSS in single precision, so there the lists take whole numbers and `.dcss-summarize`, `.dcss-variance` and `.dcss-deviation` give no answer.

It is not a chart library. It computes the numbers; your CSS draws them.

## Installation

Each call is a class with its own file in `parts/`. Link the ones you use (this page links two parts that come to 23 KB gzipped):

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

For many calls, link `dcss.css` and the family sheets the Reference names, or all of them with `dcss-all.css`.

## Writing a call

The call is a class on a `<figure>`. The list holds the numbers, one `--value` an item, and the elements after it read the answers as `--dcss-` plus the call's name. Change a `--value` and every answer follows in the same frame.

```html
<figure class="dcss-sum">
  <ul aria-hidden="true"><li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 30"></li></ul>
  <output></output>                  <!-- prints 82 -->
  <figcaption>Fruit sold: apples 12, pears 40, plums 30</figcaption>
</figure>
```

- A call is named after d3's function (`d3.bisectLeft` is `.dcss-bisect-left`) and its arguments after d3's (`--p`). One call per figure; a format class rides along.
- `12.99` is taken in two decimals, and the answers are exact decimals (0.1 + 0.2 is 0.3). For more, `class="dcss-decimals"` and `--decimals: 3` on the figure, up to 6.
- The list is drawn at the answer's size: hide it with `overflow: clip` on the figure, never on the list, and say the numbers in a caption for screen readers.
- No answer prints nothing and sets `--dcss-err`: 2 where d3 has none either (an empty list's mean), 1 where the call failed. A style query on it shows a message instead.
- A call reads another's answer written straight inside it, in the same frame. A list built from another list's answer follows a frame later.
- A format in an element with `lang="de-DE"` prints `1.234,50 €`, with any of d3's locales.

## Reference

Each call gives its answer to the elements directly inside the one it reads into; `--dcss-ready` and `--dcss-err` inherit. [SPEC.md](SPEC.md) has each input's range.

<!-- calls -->

### Array: families/array.css

A list of `<li>` items with `--value` in a `<figure>` of the call's class; the answer is `--dcss-` and the call's name, on the elements after the list. `--find` on a sum, mean, count, length, min, max or extent keeps only the rows whose `--key` equals it. In Firefox the lists take whole numbers.

- [`.dcss-sum`](https://d3js.org/d3-array/summarize#sum) gives the total, `--dcss-sum`; prices with up to 3 decimals as written.
- [`.dcss-mean`](https://d3js.org/d3-array/summarize#mean) gives the average.
- [`.dcss-count`](https://d3js.org/d3-array/summarize#count) counts the items with a number.
- `.dcss-length` counts every item.
- [`.dcss-min`](https://d3js.org/d3-array/summarize#min) gives the smallest.
- [`.dcss-max`](https://d3js.org/d3-array/summarize#max) gives the largest; up to 3 decimals as written.
- [`.dcss-extent`](https://d3js.org/d3-array/summarize#extent) gives both, `--dcss-min` and `--dcss-max`.
- `.dcss-summarize` gives sum, count, length, mean, min, max, median, variance and deviation at once, for up to 1,024 items from -1024 to 65535.
- [`.dcss-min-index`](https://d3js.org/d3-array/summarize#minIndex), [`.dcss-max-index`](https://d3js.org/d3-array/summarize#maxIndex) give where the smallest and the largest are, from 0.
- [`.dcss-least`](https://d3js.org/d3-array/summarize#least), [`.dcss-greatest`](https://d3js.org/d3-array/summarize#greatest) are d3's other names for min and max.
- [`.dcss-least-index`](https://d3js.org/d3-array/summarize#leastIndex), [`.dcss-greatest-index`](https://d3js.org/d3-array/summarize#greatestIndex) give their places.
- [`.dcss-lookup`](https://d3js.org/d3-array/group#index) gives the `--value` of the row whose `--key` is the figure's `--find`; a key in no row is error 2.
- [`.dcss-median`](https://d3js.org/d3-array/summarize#median) gives the middle value.
- [`.dcss-quantile`](https://d3js.org/d3-array/summarize#quantile), [`.dcss-quantile-sorted`](https://d3js.org/d3-array/summarize#quantileSorted) give the value at `--p`, 0 to 1, interpolated as d3 does; sorted takes a list already in order.
- [`.dcss-median-index`](https://d3js.org/d3-array/summarize#medianIndex), [`.dcss-quantile-index`](https://d3js.org/d3-array/summarize#quantileIndex) give where those are, from 0.
- [`.dcss-variance`](https://d3js.org/d3-array/summarize#variance), [`.dcss-deviation`](https://d3js.org/d3-array/summarize#deviation) give the variance and its square root for up to 1,024 values from -1024 to 65535.
- [`.dcss-scale-quantile`](https://d3js.org/d3-scale/quantile#scaleQuantile) places `--value` among the list's quantiles into `--range-0` to `--range-16`.
- [`.dcss-scale-threshold`](https://d3js.org/d3-scale/threshold#scaleThreshold) places `--value` by the thresholds `--domain-0` to `--domain-15` into the ranges; outside them, `--unknown`.
- [`.dcss-scale-quantize`](https://d3js.org/d3-scale/quantize#scaleQuantize) cuts `--domain-0` to `--domain-1` evenly into the ranges.
- [`.dcss-bisect-left`](https://d3js.org/d3-array/bisect#bisectLeft), [`.dcss-bisect-right`](https://d3js.org/d3-array/bisect#bisectRight), [`.dcss-bisect`](https://d3js.org/d3-array/bisect#bisect) give where `--value` goes in the sorted list, before equal values (left) or after them.
- [`.dcss-bisector-left`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-bisector-right`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-bisector`](https://d3js.org/d3-array/bisect#bisector) are d3's bisector over the same list.
- [`.dcss-ascending`](https://d3js.org/d3-array/sort#ascending), [`.dcss-descending`](https://d3js.org/d3-array/sort#descending) give -1, 0 or 1 for `--a` against `--b`.
- [`.dcss-cumsum`](https://d3js.org/d3-array/summarize#cumsum) gives running totals, one per `<li>` of a second list, to 8,388,607.
- [`.dcss-bin`](https://d3js.org/d3-array/bin#bin) counts the values into bins cut from `--domain-0` to `--domain-1` at `--threshold-0` to `--threshold-31`, or `--count` of them; each bin is a `<li>` of a second list with `--dcss-bin-length`.
- [`.dcss-rollup-sum`](https://d3js.org/d3-array/group#rollup), [`.dcss-rollup-count`](https://d3js.org/d3-array/group#rollup) total or count per key: items carry `--key`, the figure declares `--key-0` to `--key-31`, and an element after the list with `--key: 2` gets that key's answer.
- `.dcss-share` gives each item's fraction of the total, `--dcss-share`, to its `.dcss-share-read > .dcss-share-result`, and the total, `--dcss-total`.
- [`.dcss-precision-fixed`](https://d3js.org/d3-format#precisionFixed), [`.dcss-precision-prefix`](https://d3js.org/d3-format#precisionPrefix), [`.dcss-precision-round`](https://d3js.org/d3-format#precisionRound) are d3's precision helpers for `--step`, with `--value` or `--max`.
- [`.dcss-range`](https://d3js.org/d3-array/ticks#range) gives one `<li>` per number from `--start` to `--stop` by `--step`.

### Scale: families/scale.css

- [`.dcss-scale-linear`](https://d3js.org/d3-scale/linear#scaleLinear) maps `--value` from `--domain-0`, `--domain-1` onto `--range-0`, `--range-1`; `-invert` maps back.
- [`.dcss-scale-pow`](https://d3js.org/d3-scale/pow#scalePow), [`.dcss-scale-sqrt`](https://d3js.org/d3-scale/pow#scaleSqrt), [`.dcss-scale-log`](https://d3js.org/d3-scale/log#scaleLog) do the same by a power (`--exponent`), a square root or a logarithm.
- [`.dcss-scale-identity`](https://d3js.org/d3-scale/linear#scaleIdentity) gives the value itself.
- `.dcss-piecewise` is a linear scale through up to 8 `--stops`.
- [`.dcss-scale-ordinal`](https://d3js.org/d3-scale/ordinal#scaleOrdinal) picks `--range-0` to `--range-15` by `--value`'s place in `--domain-0` to `--domain-15`; a value in no slot takes `--unknown`.

### Format: families/format.css

A flag is 1 in `--comma`, `--sign`, `--symbol` or `--trim`, d3's `,`, `+`, `$` and `~`. In an element with `lang`, a format prints in that language, with d3's locales.

- [`.dcss-format-fixed`](https://d3js.org/d3-format#format) prints `--value` with `--precision` decimals.
- [`.dcss-format-percent`](https://d3js.org/d3-format#format) prints it as a percentage.
- [`.dcss-format-si`](https://d3js.org/d3-format#format) prints it with an SI prefix, 12.3k.
- [`.dcss-format-general`](https://d3js.org/d3-format#format) prints it to `--precision` significant digits.
- [`.dcss-format-locale`](https://d3js.org/d3-format#formatLocale), [`.dcss-locale-arabic`](https://d3js.org/d3-format#formatLocale) print Arabic `$,.2f`, with `--dcss-locale-precision` and `--dcss-locale-sign`.

### Dates: families/dates.css

- [`.dcss-utc-<interval>-<op>`](https://d3js.org/d3-time#utcDay) takes epoch milliseconds to a UTC `day`, `hour`, `minute`, `second`, `sunday` to `saturday`, `month` or `year`, by `floor`, `ceil`, `round`, `offset` or `count`.
- [`.dcss-date-format-<specifier>`](https://d3js.org/d3-time-format#utcFormat) prints epoch milliseconds by one of d3's specifiers, one class per letter: `.dcss-date-format-Y` is `%Y` (case matters, so the page needs `<!doctype html>`). A specifier with no letter goes by number, `.dcss-date-format-N`:
- `.dcss-date-format-y` and the eight other lowercase letters with an uppercase twin (a, b, g, m, q, s, u, x) keep their part at `parts/dcss-date-format-y-lower.css`, since a disk that folds case can't hold both names. 18 `%s.%L`, 19 `%s.%f`, 35 `%%`, 36 `.%L`, 37 `:%S`, 38 `%I:%M`, 39 `%I %p`, 40 `%a %d`.

### Math: families/math.css

The page writes its formula once, `--dcss-formula` in terms of `--dcss-input`, on the call's nested `<i>` elements, and `node steps.mjs page.html built.html` writes the `<i>`s a `data-dcss-steps` or `data-dcss-within` asks for.

- `.dcss-solve` finds the input where the formula reaches `--target`, halving between `--from` and `--to`: a spreadsheet's Goal Seek.
- `.dcss-solve-newton` adds Newton's steps, with the slope you write as `--dcss-slope`, for many digits in few steps.
- `.dcss-solve-turning-point` finds the formula's peak or dip between `--from` and `--to`.
- `.dcss-solve-every` finds every input that reaches `--target`, the range cut into `data-dcss-pieces`.
- `.dcss-evaluate` gives the formula's value at `--at`.
- `.dcss-solve-rows` solves the formula on every row of a box at once, each line starting where it reaches its value.
- `.dcss-sample` samples the formula from `--from` to `--to` and hands it to a list call as its list; alone, it draws the samples.

### Motion: families/motion.css

- `.dcss-motion` steps an element by the acceleration you write, `--dcss-motion-acceleration` from `--dcss-motion-position` and `--dcss-motion-speed`, a leapfrog step a frame on a store.css frame cell.

<!-- /calls -->

### Functions: families/functions.css

Where the browser has `@function` (Chrome, and Safari Technology Preview), the scales and the UTC date calls are also CSS functions, with no element and no list; one at a time in `parts/functions/`. Their arguments are the class's inputs in order.

- `--dcss-scale-linear(x, d0, d1, r0, r1, clamp, round)`, and `-pow` (the exponent after `r1`), `-sqrt` and `-log`.
- `--dcss-utc-<interval>-floor(t)`, `-ceil(t)`, `-round(t)`, `-offset(t, step)` and `-count(start, stop)` for `day`, `hour`, `minute`, `second` and `sunday` to `saturday`.

A browser without `@function` sets the property to its initial value, not to the value written before it, so put the call in `@supports`:

```css
.bar { width: 0; }
@supports (width: calc(--dcss-scale-linear(1, 0, 2, 0, 4) * 1px)) {
  .bar { width: calc(--dcss-scale-linear(var(--sales), 0, 1000, 0, 600) * 1px); }
}
```

### Grid primitives: dcss.css

The calls are built on about 80 lower-level classes in `dcss.css`: arrays of `<i>` entries read by index (`.dcss-array`, `.dcss-at`), entries counted into bins or sorted (`.dcss-bins`, `.dcss-sort`), bars placed by their group's total (`.dcss-ranked`), widths summed and compared (`.dcss-width-sum`), text read as numbers (`.dcss-text`) and a page's own counter read as a number (`.dcss-int`). [SPEC.md](SPEC.md) documents each. `dcss-extras.css` adds the `.list`, `.pager`, `.loop` and `.sheet` helpers, which run on [store.css](https://noscript.ing).

## Browsers

<!-- browsers -->

Chrome 155 and WebKit 26.4 (Safari's engine) pass 100 and 99 of the 141 requirements in [SPEC.md](SPEC.md), whose report says per call what is right and what is not. Firefox 159 passes 76: its `calc()` keeps 32-bit floats, so every call but `.dcss-summarize`, `.dcss-variance` and `.dcss-deviation` answers there, over lists of whole numbers (two decimals for a sum, max, median, lookup or rollup within the bounds SPEC.md gives each) and with a format of up to 7 digits; past that it gives `--dcss-err: 1`, never a wrong number. [QUIRKS.md](QUIRKS.md) has the engine bugs.

<!-- /browsers -->

At a page zoom or screen scale whose product isn't a whole number (90%, 125%, a laptop set to 150%), every call that reads layout gives no answer, error 1 ([QUIRKS.md](QUIRKS.md), Q30); at 100% and 200%, and on a Retina screen, the calls answer.

## Performance

<!-- performance -->

Layout does the work, in the frame a number changes. A family is at most 62 KB gzipped and loads in 22 ms or less in WebKit 26.4 (2026-10-31). Twenty printed medians, a value moving: 6.3 ms a frame in Chrome, 9.6 in WebKit; variance 8.2, 10.3 (2026-10-30). Twenty sums of 256 items, a value moving: 4.3 ms a frame in Chrome, 9.8 in WebKit (2026-11-01).

<!-- /performance -->

## License

MIT.

## Credits

- [d3](https://d3js.org), whose functions the calls follow and whose tests check them.
