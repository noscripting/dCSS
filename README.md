# dCSS

dCSS is a CSS library of data functions, 66 of them in six families: arrays (sums, means, medians, sorting), scales, number and date formats, math and motion. Each one is a class. You write the numbers in a list, and the browser's layout works out the answer. No JavaScript runs. Each function is named after the d3 function it follows, and d3's own tests check that it gives the same answer.

It is not a chart library. It gives you the numbers, and your CSS draws them.

## Installation

Download or clone this repository and save your page in its folder. Each function has its own file in `parts/`, so a page links only the ones it uses. This page links two, and `.dcss-mean` gives the sum too:

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

To use many, link `dcss.css` and a family's sheet from `families/`, or all of them at once with `dcss-all.css`.

## Writing a call

Put the class on a `<figure>`. The numbers go in a `<ul>`, one `--value` per `<li>`, and every element after the list reads the answer as a custom property named after the call, `--dcss-sum` for `.dcss-sum`. An empty `<output>` prints it. Change a `--value` and every answer updates in the same frame.

```html
<figure class="dcss-sum">
  <ul aria-hidden="true"><li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 30"></li></ul>
  <output></output>                  <!-- prints 82 -->
  <figcaption>Fruit sold: apples 12, pears 40, plums 30</figcaption>
</figure>
```

- Each call is named after its d3 function (`d3.bisectLeft` is `.dcss-bisect-left`) and takes d3's arguments as custom properties, like `--p` for a quantile. The Reference below names each one's inputs.
- A value like `12.99` is read in two decimals, and the answers are exact decimals. For up to six, add the `dcss-decimals` class to the figure and set `--decimals`.
- Each item takes up room in proportion to its number, so a list of big numbers is a big box. Hide it with `overflow: clip` on the figure, and give screen readers the numbers in a `<figcaption>`.
- When there is no answer, nothing prints and `--dcss-err` says why: 2 where d3 has no answer either, like the mean of an empty list, and 1 where the call failed.
- A call written straight inside another takes the outer one's answer as its input, in the same frame.

## Reference

<!-- calls -->

Every call has its own page, with a live example, on [noscript.ing](https://noscript.ing/examples/layoutcompute/primitives/#dcss).

### Array

From `families/array.css`.

| Call | What it does |
|---|---|
| [`.dcss-sum`](https://noscript.ing/examples/layoutcompute/primitives/dcss-sum) | Gives the total. Values with up to 3 decimals, like prices, are taken as written. |
| [`.dcss-mean`](https://noscript.ing/examples/layoutcompute/primitives/dcss-mean) | Gives the average. |
| [`.dcss-count`](https://noscript.ing/examples/layoutcompute/primitives/dcss-count) | Counts the items with a number. |
| [`.dcss-length`](https://noscript.ing/examples/layoutcompute/primitives/dcss-length) | Counts every item. |
| [`.dcss-min`](https://noscript.ing/examples/layoutcompute/primitives/dcss-min) | Gives the smallest. |
| [`.dcss-max`](https://noscript.ing/examples/layoutcompute/primitives/dcss-max) | Gives the largest. Values with up to 3 decimals are taken as written. |
| [`.dcss-extent`](https://noscript.ing/examples/layoutcompute/primitives/dcss-extent) | Gives the smallest and the largest, as `--dcss-min` and `--dcss-max`. |
| [`.dcss-summarize`](https://noscript.ing/examples/layoutcompute/primitives/dcss-summarize) | Gives sum, count, length, mean, min, max, median, variance and deviation at once, for up to 1,024 items from -1024 to 65535. |
| [`.dcss-min-index`](https://noscript.ing/examples/layoutcompute/primitives/dcss-min-index), [`.dcss-max-index`](https://noscript.ing/examples/layoutcompute/primitives/dcss-max-index) | Give where the smallest and the largest are, from 0. |
| [`.dcss-least`](https://noscript.ing/examples/layoutcompute/primitives/dcss-least), [`.dcss-greatest`](https://noscript.ing/examples/layoutcompute/primitives/dcss-greatest) | Give the smallest and the largest, as min and max do. They are d3's other names for them. |
| [`.dcss-least-index`](https://noscript.ing/examples/layoutcompute/primitives/dcss-least-index), [`.dcss-greatest-index`](https://noscript.ing/examples/layoutcompute/primitives/dcss-greatest-index) | Give where the least and the greatest are, from 0. |
| [`.dcss-lookup`](https://noscript.ing/examples/layoutcompute/primitives/dcss-lookup) | Gives the `--value` of the row whose `--key` is the figure's `--find`; a key in no row is error 2. |
| [`.dcss-median`](https://noscript.ing/examples/layoutcompute/primitives/dcss-median) | Gives the middle value. |
| [`.dcss-quantile`](https://noscript.ing/examples/layoutcompute/primitives/dcss-quantile), [`.dcss-quantile-sorted`](https://noscript.ing/examples/layoutcompute/primitives/dcss-quantile-sorted) | Give the value at `--p`, 0 to 1, interpolated as d3 does; sorted takes a list already in order. |
| [`.dcss-median-index`](https://noscript.ing/examples/layoutcompute/primitives/dcss-median-index), [`.dcss-quantile-index`](https://noscript.ing/examples/layoutcompute/primitives/dcss-quantile-index) | Give where those are, from 0. |
| [`.dcss-variance`](https://noscript.ing/examples/layoutcompute/primitives/dcss-variance), [`.dcss-deviation`](https://noscript.ing/examples/layoutcompute/primitives/dcss-deviation) | Give the variance and its square root for up to 1,024 values from -1024 to 65535. |
| [`.dcss-scale-quantile`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-quantile) | Places `--value` among the list's quantiles into `--range-0` to `--range-16`. |
| [`.dcss-scale-threshold`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-threshold) | Places `--value` by the thresholds `--domain-0` to `--domain-15` into the ranges; outside them, `--unknown`. |
| [`.dcss-scale-quantize`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-quantize) | Cuts `--domain-0` to `--domain-1` evenly into the ranges. |
| [`.dcss-bisect-left`](https://noscript.ing/examples/layoutcompute/primitives/dcss-bisect-left), [`.dcss-bisect-right`](https://noscript.ing/examples/layoutcompute/primitives/dcss-bisect-right), [`.dcss-bisect`](https://noscript.ing/examples/layoutcompute/primitives/dcss-bisect) | Give where `--value` goes in the sorted list, before equal values (left) or after them. |
| [`.dcss-bisector-left`](https://noscript.ing/examples/layoutcompute/primitives/dcss-bisector-left), [`.dcss-bisector-right`](https://noscript.ing/examples/layoutcompute/primitives/dcss-bisector-right), [`.dcss-bisector`](https://noscript.ing/examples/layoutcompute/primitives/dcss-bisector) | Give the same places through d3's bisector. |
| [`.dcss-ascending`](https://noscript.ing/examples/layoutcompute/primitives/dcss-ascending), [`.dcss-descending`](https://noscript.ing/examples/layoutcompute/primitives/dcss-descending) | Give -1, 0 or 1 for `--a` against `--b`. |
| [`.dcss-cumsum`](https://noscript.ing/examples/layoutcompute/primitives/dcss-cumsum) | Gives running totals, one per `<li>` of a second list, to 8,388,607. |
| [`.dcss-bin`](https://noscript.ing/examples/layoutcompute/primitives/dcss-bin) | Counts the values into bins cut from `--domain-0` to `--domain-1` at `--threshold-0` to `--threshold-31`, or `--count` of them; each bin is a `<li>` of a second list with `--dcss-bin-length`. |
| [`.dcss-rollup-sum`](https://noscript.ing/examples/layoutcompute/primitives/dcss-rollup-sum), [`.dcss-rollup-count`](https://noscript.ing/examples/layoutcompute/primitives/dcss-rollup-count) | Give the total or the count for each key. Items carry `--key`, the figure declares `--key-0` to `--key-31`, and an element after the list with `--key: 2` gets that key's answer. |
| [`.dcss-share`](https://noscript.ing/examples/layoutcompute/primitives/dcss-share) | Gives each item's fraction of the total, `--dcss-share`, to its `.dcss-share-read > .dcss-share-result`, and the total, `--dcss-total`. |
| [`.dcss-precision-fixed`](https://noscript.ing/examples/layoutcompute/primitives/dcss-precision-fixed), [`.dcss-precision-prefix`](https://noscript.ing/examples/layoutcompute/primitives/dcss-precision-prefix), [`.dcss-precision-round`](https://noscript.ing/examples/layoutcompute/primitives/dcss-precision-round) | Give the precision a format needs for steps of `--step`, with `--value` or `--max`. |
| [`.dcss-range`](https://noscript.ing/examples/layoutcompute/primitives/dcss-range) | Gives one `<li>` per number from `--start` to `--stop` by `--step`. |

### Scale

From `families/scale.css`.

| Call | What it does |
|---|---|
| [`.dcss-scale-linear`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-linear) | Maps `--value` from `--domain-0`, `--domain-1` onto `--range-0`, `--range-1`; `-invert` maps back. |
| [`.dcss-scale-pow`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-pow), [`.dcss-scale-sqrt`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-sqrt), [`.dcss-scale-log`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-log) | Map the same way through a power (`--exponent`), a square root or a logarithm. |
| [`.dcss-scale-identity`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-identity) | Gives `--value` back unchanged. |
| [`.dcss-piecewise`](https://noscript.ing/examples/layoutcompute/primitives/dcss-piecewise) | Maps `--value` linearly through up to 8 `--stops`. |
| [`.dcss-scale-ordinal`](https://noscript.ing/examples/layoutcompute/primitives/dcss-scale-ordinal) | Picks `--range-0` to `--range-15` by `--value`'s place in `--domain-0` to `--domain-15`; a value in no slot takes `--unknown`. |

### Format

From `families/format.css`. Set `--comma`, `--sign`, `--symbol` or `--trim` to 1 to turn that flag on. Inside an element with `lang`, a format prints in that language.

| Call | What it does |
|---|---|
| [`.dcss-format-fixed`](https://noscript.ing/examples/layoutcompute/primitives/dcss-format-fixed) | Prints `--value` with `--precision` decimals. |
| [`.dcss-format-percent`](https://noscript.ing/examples/layoutcompute/primitives/dcss-format-percent) | Prints `--value` as a percentage. |
| [`.dcss-format-si`](https://noscript.ing/examples/layoutcompute/primitives/dcss-format-si) | Prints `--value` with an SI prefix, like 12.3k. |
| [`.dcss-format-general`](https://noscript.ing/examples/layoutcompute/primitives/dcss-format-general) | Prints `--value` to `--precision` significant digits. |
| [`.dcss-format-locale`](https://noscript.ing/examples/layoutcompute/primitives/dcss-format-locale), [`.dcss-locale-arabic`](https://noscript.ing/examples/layoutcompute/primitives/dcss-locale-arabic) | Print `--value` as money in Arabic, with Arabic digits and separators, as d3's Arabic locale does with `$,.2f`. `--dcss-locale-precision` sets the decimals and `--dcss-locale-sign` the sign. |

### Dates

From `families/dates.css`. A format with no letter of its own is a class by number, `.dcss-date-format-N`: 18 `%s.%L`, 19 `%s.%f`, 35 `%%`, 36 `.%L`, 37 `:%S`, 38 `%I:%M`, 39 `%I %p`, 40 `%a %d`.

| Call | What it does |
|---|---|
| [`.dcss-utc-<interval>-<op>`](https://noscript.ing/examples/layoutcompute/primitives/dcss-utc-interval-op) | Takes epoch milliseconds to a UTC `day`, `hour`, `minute`, `second`, `sunday` to `saturday`, `month` or `year`, by `floor`, `ceil`, `round`, `offset` or `count`. |
| [`.dcss-date-format-<specifier>`](https://noscript.ing/examples/layoutcompute/primitives/dcss-date-format-specifier) | Prints epoch milliseconds by one of d3's specifiers. Each letter has its own class, so `.dcss-date-format-Y` is `%Y`. Case matters, so the page needs `<!doctype html>`. A format with no letter of its own goes by number, as listed above. |
| [`.dcss-date-format-y`](https://noscript.ing/examples/layoutcompute/primitives/dcss-date-format-year) | Prints `%y`, the year's last two digits. It and the eight other lowercase letters with an uppercase twin (a, b, g, m, q, s, u, x) have their part at `parts/dcss-date-format-<letter>-lower.css`. |

### Math

From `families/math.css`. Each call takes your own formula, written once as `--dcss-formula` in terms of `--dcss-input`. A `.dcss-solve` with `data-dcss-steps="n"` halves the range n times, one nested element a step, and `node steps.mjs page.html built.html` writes those elements for you.

| Call | What it does |
|---|---|
| [`.dcss-solve`](https://noscript.ing/examples/layoutcompute/primitives/dcss-solve) | Finds the input where the formula reaches `--target`, halving between `--from` and `--to`, as a spreadsheet's Goal Seek does. |
| [`.dcss-solve-newton`](https://noscript.ing/examples/layoutcompute/primitives/dcss-solve-newton) | Adds Newton's steps, with the slope you write as `--dcss-slope`, for many digits in few steps. |
| [`.dcss-solve-turning-point`](https://noscript.ing/examples/layoutcompute/primitives/dcss-solve-turning-point) | Finds the formula's peak or dip between `--from` and `--to`. |
| [`.dcss-solve-every`](https://noscript.ing/examples/layoutcompute/primitives/dcss-solve-every) | Finds every input that reaches `--target`, the range cut into `data-dcss-pieces`. |
| [`.dcss-evaluate`](https://noscript.ing/examples/layoutcompute/primitives/dcss-evaluate) | Gives the formula's value at `--at`. |
| [`.dcss-solve-rows`](https://noscript.ing/examples/layoutcompute/primitives/dcss-solve-rows) | Solves the formula on every row of a box at once, each line starting where it reaches its value. |
| [`.dcss-sample`](https://noscript.ing/examples/layoutcompute/primitives/dcss-sample) | Samples the formula from `--from` to `--to` and hands the samples to a list call as its list. On its own, it draws them. |

### Motion

From `families/motion.css`.

| Call | What it does |
|---|---|
| [`.dcss-motion`](https://noscript.ing/examples/layoutcompute/primitives/dcss-motion) | Moves an element every frame by the acceleration you write as `--dcss-motion-acceleration`, from `--dcss-motion-position` and `--dcss-motion-speed`. The page needs [store.css](https://github.com/noscripting/store) too, for its clock. |

<!-- /calls -->

In browsers with `@function` (Chrome), the scales and the UTC date calls are also CSS functions, in `families/functions.css`: `--dcss-scale-linear(x, d0, d1, r0, r1)`, `--dcss-utc-day-floor(t)` and the rest, with the class's inputs as arguments. Wrap them in `@supports`, since a browser without `@function` leaves the property at its initial value.

Under the calls are about 80 grid classes in `dcss.css` (`.dcss-array`, `.dcss-bins`, `.dcss-ranked`, `.dcss-text`, `.dcss-int`…). `dcss-extras.css` adds `.list`, `.pager`, `.loop` and `.sheet`, helpers that need [store.css](https://github.com/noscripting/store) too. Their names have no prefix, so they can clash with a page's own classes.

## Browsers

At a page zoom or screen scale that isn't a whole number (90%, 125%, a Windows laptop set to 150%), the calls that read layout give no answer, error 1. At 100% and 200%, and on a Retina screen, they answer.

<!-- browsers -->

| Browser | Support |
|---|---|
| Chrome 155 | Yes |
| Safari (WebKit 26.4) | Yes |
| Firefox 159 | Every call but `.dcss-summarize`, `.dcss-variance` and `.dcss-deviation`, over lists of whole numbers (two decimals for some calls) and formats of up to 7 digits. Firefox's `calc()` keeps 32-bit floats, and past what they hold a call gives no answer, `--dcss-err: 1`. |

A few cases past a call's bounds still print a wrong number instead of none, in all three browsers.

<!-- /browsers -->

## Performance

<!-- performance -->

Layout does the work, in the same frame a number changes. Each family is at most 62 KB gzipped and loads in 22 ms or less in WebKit 26.4 (2026-10-31).

The time a frame takes, with one value changing every frame:

| Page | Chrome | WebKit |
|---|---|---|
| 20 medians of 8 items, printed | 6.3 ms | 9.6 ms |
| 20 variances of 8 items, printed | 8.2 ms | 10.3 ms |
| 20 sums of 256 items | 4.3 ms | 9.8 ms |

Measured 2026-10-30 and 2026-11-01.

<!-- /performance -->

## License

MIT.

## Credits

[d3](https://d3js.org), by Mike Bostock and its contributors: the calls follow its functions, and its tests check them.
