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

For many calls, link `dcss.css` and a family sheet, or everything with `dcss-all.css`.

## Writing a call

The call is a class on a `<figure>`. The list holds the numbers, one `--value` an item, and the elements after it read the answers as `--dcss-` plus the call's name. Change a `--value` and every answer follows in the same frame.

```html
<figure class="dcss-sum">
  <ul aria-hidden="true"><li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 30"></li></ul>
  <output></output>                  <!-- prints 82 -->
  <figcaption>Fruit sold: apples 12, pears 40, plums 30</figcaption>
</figure>
```

- A call is named after d3's function (`d3.bisectLeft` is `.dcss-bisect-left`) and takes d3's arguments as custom properties (`--p`). [SPEC.md](SPEC.md) has each one's inputs and limits.
- `12.99` is taken in two decimals and the answers are exact decimals. For more, `class="dcss-decimals"` and `--decimals: 3` on the figure, up to 6.
- The list is drawn at the answer's size: hide it with `overflow: clip` on the figure, and say the numbers in a caption for screen readers.
- No answer prints nothing and sets `--dcss-err`: 2 where d3 has none either, 1 where the call failed.
- A call reads another's answer written straight inside it, in the same frame.

## Reference

<!-- calls -->

- **Array** (`families/array.css`): [`.dcss-sum`](https://d3js.org/d3-array/summarize#sum), [`.dcss-mean`](https://d3js.org/d3-array/summarize#mean), [`.dcss-count`](https://d3js.org/d3-array/summarize#count), `.dcss-length`, [`.dcss-min`](https://d3js.org/d3-array/summarize#min), [`.dcss-max`](https://d3js.org/d3-array/summarize#max), [`.dcss-extent`](https://d3js.org/d3-array/summarize#extent), `.dcss-summarize`, [`.dcss-min-index`](https://d3js.org/d3-array/summarize#minIndex), [`.dcss-max-index`](https://d3js.org/d3-array/summarize#maxIndex), [`.dcss-least`](https://d3js.org/d3-array/summarize#least), [`.dcss-greatest`](https://d3js.org/d3-array/summarize#greatest), [`.dcss-least-index`](https://d3js.org/d3-array/summarize#leastIndex), [`.dcss-greatest-index`](https://d3js.org/d3-array/summarize#greatestIndex), [`.dcss-lookup`](https://d3js.org/d3-array/group#index), [`.dcss-median`](https://d3js.org/d3-array/summarize#median), [`.dcss-quantile`](https://d3js.org/d3-array/summarize#quantile), [`.dcss-quantile-sorted`](https://d3js.org/d3-array/summarize#quantileSorted), [`.dcss-median-index`](https://d3js.org/d3-array/summarize#medianIndex), [`.dcss-quantile-index`](https://d3js.org/d3-array/summarize#quantileIndex), [`.dcss-variance`](https://d3js.org/d3-array/summarize#variance), [`.dcss-deviation`](https://d3js.org/d3-array/summarize#deviation), [`.dcss-scale-quantile`](https://d3js.org/d3-scale/quantile#scaleQuantile), [`.dcss-scale-threshold`](https://d3js.org/d3-scale/threshold#scaleThreshold), [`.dcss-scale-quantize`](https://d3js.org/d3-scale/quantize#scaleQuantize), [`.dcss-bisect-left`](https://d3js.org/d3-array/bisect#bisectLeft), [`.dcss-bisect-right`](https://d3js.org/d3-array/bisect#bisectRight), [`.dcss-bisect`](https://d3js.org/d3-array/bisect#bisect), [`.dcss-bisector-left`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-bisector-right`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-bisector`](https://d3js.org/d3-array/bisect#bisector), [`.dcss-ascending`](https://d3js.org/d3-array/sort#ascending), [`.dcss-descending`](https://d3js.org/d3-array/sort#descending), [`.dcss-cumsum`](https://d3js.org/d3-array/summarize#cumsum), [`.dcss-bin`](https://d3js.org/d3-array/bin#bin), [`.dcss-rollup-sum`](https://d3js.org/d3-array/group#rollup), [`.dcss-rollup-count`](https://d3js.org/d3-array/group#rollup), `.dcss-share`, [`.dcss-precision-fixed`](https://d3js.org/d3-format#precisionFixed), [`.dcss-precision-prefix`](https://d3js.org/d3-format#precisionPrefix), [`.dcss-precision-round`](https://d3js.org/d3-format#precisionRound), [`.dcss-range`](https://d3js.org/d3-array/ticks#range).
- **Scale** (`families/scale.css`): [`.dcss-scale-linear`](https://d3js.org/d3-scale/linear#scaleLinear), [`.dcss-scale-pow`](https://d3js.org/d3-scale/pow#scalePow), [`.dcss-scale-sqrt`](https://d3js.org/d3-scale/pow#scaleSqrt), [`.dcss-scale-log`](https://d3js.org/d3-scale/log#scaleLog), [`.dcss-scale-identity`](https://d3js.org/d3-scale/linear#scaleIdentity), `.dcss-piecewise`, [`.dcss-scale-ordinal`](https://d3js.org/d3-scale/ordinal#scaleOrdinal).
- **Format** (`families/format.css`): [`.dcss-format-fixed`](https://d3js.org/d3-format#format), [`.dcss-format-percent`](https://d3js.org/d3-format#format), [`.dcss-format-si`](https://d3js.org/d3-format#format), [`.dcss-format-general`](https://d3js.org/d3-format#format), [`.dcss-format-locale`](https://d3js.org/d3-format#formatLocale), [`.dcss-locale-arabic`](https://d3js.org/d3-format#formatLocale). Flags are 1 in `--comma`, `--sign`, `--symbol` or `--trim`; in an element with `lang`, a format prints in that language.
- **Dates** (`families/dates.css`): [`.dcss-utc-<interval>-<op>`](https://d3js.org/d3-time#utcDay), [`.dcss-date-format-<specifier>`](https://d3js.org/d3-time-format#utcFormat), `.dcss-date-format-y`. One class per letter, `.dcss-date-format-Y` for `%Y` (case matters: the page needs `<!doctype html>`; a lowercase letter with an uppercase twin keeps its part at `parts/dcss-date-format-y-lower.css`); a composite by number, `.dcss-date-format-N`: 18 `%s.%L`, 19 `%s.%f`, 35 `%%`, 36 `.%L`, 37 `:%S`, 38 `%I:%M`, 39 `%I %p`, 40 `%a %d`.
- **Math** (`families/math.css`): `.dcss-solve`, `.dcss-solve-newton`, `.dcss-solve-turning-point`, `.dcss-solve-every`, `.dcss-evaluate`, `.dcss-solve-rows`, `.dcss-sample`. Your own formula, written once as `--dcss-formula` in terms of `--dcss-input`, solved for an input (`.dcss-solve` is a spreadsheet's Goal Seek), its peaks, its value, or sampled as a list; `node steps.mjs page.html built.html` writes the `<i>`s a `data-dcss-steps` asks for.
- **Motion** (`families/motion.css`): `.dcss-motion`. An element stepped every frame by the acceleration you write, on a store.css frame cell.

<!-- /calls -->

Where the browser has `@function` (Chrome, Safari Technology Preview), the scales and the UTC date calls are also CSS functions in `families/functions.css`: `--dcss-scale-linear(x, d0, d1, r0, r1)`, `--dcss-utc-day-floor(t)` and the rest, with the class's inputs as arguments; wrap a call in `@supports`, since a browser without `@function` leaves the property at its initial value.

The calls are built on about 80 lower-level grid classes in `dcss.css` (`.dcss-array`, `.dcss-bins`, `.dcss-ranked`, `.dcss-text`, `.dcss-int`…), each in [SPEC.md](SPEC.md); `dcss-extras.css` adds the `.list`, `.pager`, `.loop` and `.sheet` helpers that run on [store.css](https://noscript.ing).

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
