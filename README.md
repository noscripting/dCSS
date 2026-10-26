# dcss-array.css

Computation in a stylesheet. Arrays of numbers laid out by CSS Grid: read by index, summed over ranges, ranked in bins, sorted, searched, packed and looked up by key, with every result in the same frame as its inputs and no script. Also formulas over laid-out sizes, lookup tables in fonts, and loops and spreadsheets on dcss-store.css. Checked frame by frame against a model. Works in Chrome and Safari.

Part of DCSS, Data-Driven CSS: stylesheets that do the data work d3 does in JavaScript. dcss-array does d3-array's job: sums, sorts, bins and search. With [dcss-store](https://github.com/noscripting/dcss-store), [dcss-loop](https://github.com/noscripting/dcss-loop) and [dcss-unround](https://github.com/noscripting/dcss-unround).

Visit [noscript.ing](https://noscript.ing) for demos.

## Installation

Download `dcss-array.css` and link it. Numbers go in as `--arrays-n` on `<i>` entries; a reader, `<b class="arrays-at">`, picks one by `--arrays-i`, and the `<u>` inside it gets the result as `--arrays-value`:

```html
<link rel="stylesheet" href="dcss-array.css">
<style>.arrays-at u::after { counter-reset: v var(--arrays-value); content: counter(v); }</style>

<div class="arrays-array arrays-count">
  <b class="arrays-out"><b class="arrays-at" style="--arrays-i: 2"><u></u></b></b>
  <i style="--arrays-n: 12"></i>
  <i style="--arrays-n: 40"></i>
  <i style="--arrays-n: 30"></i>
</div>
```

The page shows 40, entry 2. With `--arrays-i: 1; --arrays-j: -1` the reader shows the sum, 82; with `--arrays-i: -1`, the last entry, 30. Change any `--arrays-n`, by a rule, a transition or an animation, and the reader follows in the same frame.

Text reads (`.arrays-text`, below) use fonts embedded in the sheet. To have them right from the first frame, copy the `<link rel="preload">` lines of `arrays-preload.html` into the page's `<head>`. Loops and sheets also need [dcss-store.css](https://noscript.ing) on the page.

## Reference

The full contract, with each requirement's result in each engine, is [SPEC.md](SPEC.md).

### Markup

- A grid is one computation. Its children are the entries, `<i>`, the inputs. Its readers, `<b class="arrays-at"><u></u></b>`, are the outputs: each reads the nearest grid around it.
- A reader sits in the port, `<b class="arrays-out">`, the grid's first child, or inside an entry. In a grid with no child entries (a packed array, a cycle), it is a child of the grid.
- The results land on the `<u>` inside a reader, by inheritance. That `<u>` is the author's: put content there. Entries, readers and the port are machinery, and content put in them can move what they read.
- A grid inside a reader's `<u>` reads its own entries, so one computation feeds the next in the same frame. Values flow down only: results of several entries reach another grid's entries a frame later, through dcss-store.css's store.
- Moving numbers belong on the entries. A number that changes above a grid and is inherited through it restyles every reader, used or not.
- Every name the sheet owns starts with `arrays-`. Internal numbers are `--arrays-p-*`; the anchor names are `--arrays-where`, `--arrays-lo` and `--arrays-hi`.
- The d3 ports (DCSS, below) take d3's words: classes `dcss-*`, inputs in d3's own argument words (`--value`, `--start`, `--stop`, `--count`), results under `--dcss-*` (`--dcss-sum`, `--dcss-tick`). The results are not registered, so they keep any value a page gives them elsewhere.
- Every grid resets its padding, border, `writing-mode` and `direction`.

### DCSS: d3 as HTML

DCSS is split by family. Keep `dcss-array.css` for the shared core, then link the family
that owns the calls on the page. `families.json` lists each file, its classes,
dependencies, byte sizes and hash. `dcss-array-all.css` is an explicit compatibility
entry that imports every family; it is intended for pages that need the full API.

For reductions such as `.dcss-sum`, load:

```html
<link rel="stylesheet" href="dcss-array.css">
<link rel="stylesheet" href="families/array.css">
```

The core is 308,019 bytes (75,914 at gzip level 9). Core plus the array family is
732,973 bytes as a combined source. The previous all-family file was 53,262,190
bytes. Color and date parsing remain the largest optional families; this split
changes what a page loads, not the size of their implementations.

At build time, `stylesheetsFor(html, extraCss)` from `runtime.mjs` returns the
required paths in load order. `addFamilyLinks(html)` inserts plain stylesheet
links beside an existing `dcss-array.css` link. No loader script runs in the browser.
The composition compiler selects the same families before trimming its output.
The stylesheet builder also exposes `dcss-array`, `dcss-color` and the other
manifest families: `node tools/noscripting.mjs compose dcss-array --out=array.css`
includes the shared core automatically.


A d3 call is an element; its data is a list; the answer is the list's own layout, or a number in the element after it.

It is for pages where script can't run or isn't wanted (Markdown and CMS output, docs, a strict CSP, feeds), not a replacement for d3. Mail clients that strip custom properties (Gmail, Outlook) drop it.

```html
<figure class="dcss-sum">
  <ul><li style="--value: 12">Apples</li> <li style="--value: 40">Pears</li> <li style="--value: 30">Plums</li></ul>
  <output></output>                  <!-- prints 82 -->
  <figcaption>Fruit sold</figcaption>
</figure>
```

- The class is d3's name, `dcss-` and the export in kebab case, on the `<figure>`, never on the list. Its arguments are numbers in custom properties on it, in d3's words (`--start`, `--stop`, `--count`).
- The data is the `<ul>` or `<ol>` inside it, a datum an `<li>` saying its number as `--value` (`--key`, a whole number from 1, where d3 groups); nested lists for a hierarchy. A datum without one is an error, never its parent's value.
- `--value` is style, which a screen reader never hears: where the number matters, say it in the text too (`Apples, 12`).
- Where d3's answer is a layout, the `<li>`s are laid out at it, in source order; nothing is read back. A reduction's list is drawn one px a unit: draw inside it, or hide it.
- Where it is a number, the element after the list is its size container. The number is read on that container's direct children and pseudo-elements, then inherited inward as `var(--dcss-*)`. An empty `<output>` prints it through its pseudo-element. To compose another call, use a `<div>` after the list and put that call inside it; the container itself does not receive the number.
- A call's `--value` is its own: the calls inside it don't inherit it (each sets its own; one with none has no answer, so a reader's `var()` fallback applies). Settings (`--domain-0`, `--precision`, `--start` …) do inherit, so a shared one can be set on an ancestor, and a `--value` on a plain element is shared by the calls inside it.
- Results reach inward only, in the same frame through `var()`; printed digits trail a moving number by a frame in Chrome. Beside each result, `--dcss-ready` (0 until it is read) and `--dcss-err` (0, or why not).
- Numbers are px: whole to 2^24, fractions to 1/64, a total under 33 million, 6 significant digits through `var()`, 0 or more.
- The sheet owns the display and size of the figure, its list, its items and the element after the list, and the empty `<output>`'s `::after`; the rest is the page's.

### Reductions

`.dcss-sum`, `.dcss-count`, `.dcss-mean`, `.dcss-min`, `.dcss-max`, `.dcss-extent` and `.dcss-length` (the list's length, items skipped included), each a figure as above. Children and pseudo-elements of the result container get `--dcss-sum` (and so on; an extent `--dcss-min` and `--dcss-max`). An empty `<output>` after the list prints it as d3.format(",") does, to 6 decimals, a line above the list (an extent as `3–125`). An item whose `--value` is not a number of 0 or more is skipped, as d3 skips it, and `--dcss-err` is 1. A mean, min, max or extent of no items is d3's undefined, `--dcss-err` 2. In error the `<output>` prints nothing.

```html
<figure class="dcss-extent">
  <ul><li style="--value: 12"></li> <li style="--value: 40"></li> <li style="--value: 3"></li></ul>
  <output></output>                  <!-- prints 3–40 -->
</figure>
```

The list is drawn as it computes. A sum is a staircase as wide as the sum and as tall as the count; a min or max is boxes stacked as wide as the largest and 1 + 2 x (max - min) px tall. The figure clips the width; give it a height and `overflow: clip` to hide the rest. A value is taken to 1/64; in Chrome a list past 262,144 px (2^18) reads without its 64ths, past 2^24 without whole px (ENGINES.md); up to 63 skipped items are counted. `probes/dcss/index.html` shows each, changed by two checkboxes.

### Numeric comparisons and extrema

`.dcss-ascending` and `.dcss-descending` take their own `--a` and `--b` arguments and publish `--dcss-ascending` or `--dcss-descending`: -1, 0 or 1, as d3 does. Inputs are finite CSS numbers within ±2^24. A missing or NaN argument publishes CSS NaN with error 2; an out-of-bound finite argument gives error 1. String/object coercion is unsupported. Values and status are available on the call and its descendants:

```html
<style>
  .comparison::after {
    counter-reset: comparison var(--dcss-ascending);
    content: counter(comparison);
  }
</style>
<output class="comparison dcss-ascending" style="--a: 12; --b: 40"></output>
```

`.dcss-min-index`, `-max-index`, `-least-index` and `-greatest-index` return the zero-based source position of the winning item. For the default numeric comparison, least/min and greatest/max agree. The first source item wins a tie. Put the result in a child of the holder immediately after the list:

```html
<style>
  .winner::after {
    counter-reset: winner var(--dcss-min-index);
    content: counter(winner);
  }
</style>
<figure class="dcss-min-index">
  <ol>
    <li style="--value: 4"></li>
    <li style="--value: -2"></li>
    <li style="--value: -2"></li>
  </ol>
  <div><output class="winner"></output></div>
</figure>
```

The result is 1. `.dcss-least` and `.dcss-greatest` use the same list and holder structure, publishing the winning numeric value as `--dcss-least` or `--dcss-greatest`.

Each call accepts 0–64 numeric values on a 1/64 grid within [-1024, 1024]. Nullish, missing and NaN observations are skipped; an empty or all-missing list returns -1 with error 0 for index calls, or CSS NaN with error 2 for least/greatest values. Off-grid, out-of-bound values or more than 64 items give error 1 and CSS NaN. Results and `--dcss-ready`/`--dcss-err` inherit from the result child across intervening size containers. The call owns the list's computation geometry, as reductions do. Strings, accessors and custom comparator callbacks are unsupported.

`probes/dcss/compare/check.mjs` proves 9/14 original calls per comparison; `probes/dcss/index-extrema/check.mjs` proves minIndex 13/46, maxIndex 13/46, leastIndex 9/26, greatestIndex 9/26, least 8/26 and greatest 8/26 in Chrome and WebKit. Unsupported questions remain in those denominators. The index check also covers 50 boundary, native/reset, nested and error states per engine, and a mutated runtime tie-break.

### Per-item shares

`.dcss-share` computes each item's fraction of one list's total. Write each value once on its `<li>`. The label stays in the list, and a descendant receives the fraction and total for formatting or styling:

```html
<figure class="dcss-share">
  <ol>
    <li style="--value: 96">
      <span>Documents, 96 MB</span>
      <span class="arrays-share-read">
        <span class="arrays-share-result">
          <output class="dcss-format-percent"
                  style="--value: var(--dcss-share); --precision: 1"></output>
        </span>
      </span>
    </li>
    <li style="--value: 224">
      <span>Photos, 224 MB</span>
      <span class="arrays-share-read">
        <span class="arrays-share-result">
          <output class="dcss-format-percent"
                  style="--value: var(--dcss-share); --precision: 1"></output>
        </span>
      </span>
    </li>
  </ol>
</figure>
```

The outputs print `30.0%` and `70.0%`. On `.arrays-share-result` and its descendants, `--dcss-total` is 320 and `--dcss-share` is the item's fraction, 0.3 or 0.7. Use the fraction in a style such as `width: calc(var(--dcss-share) * 100%)`. The reader holder itself does not receive these numbers. Put each item's label content in one wrapper, or place it inside the result holder. Labels and surrounding content keep ordinary flow; result values reach descendants only. The sheet works directly, without a compiler.

The bounded contract accepts 1–64 nonnegative finite values, each a multiple of 1/64 and at most 4,095. A positive total gives ready 1 and error 0, including a zero-valued item whose share is 0. An all-zero total gives error 2. A missing, NaN, negative, off-grid or out-of-range value, or more than 64 items, gives error 1 throughout the call. Error 1 takes precedence over a zero total. Errors publish CSS NaN instead of a usable share or total, and dependent generated text is suppressed. A nested call reads its own list.

This combines the living document's [sum, proportional share and broadcast techniques](../../examples/layoutcompute/README.md) with the same descendant readback used by the other calls. It is a composition of d3's sum and division, so it does not add a new d3 export or increase recorded-call coverage.

[The share example](probes/dcss/share/demo.html) reuses each fraction for percent text and a width. `probes/dcss/share/check.mjs` checks 17 control/data/recovery cases and mutation detection in Chrome and WebKit; `full-sheet-check.mjs` independently checks 36 states per engine against the rebuilt sheet, including nested calls, intervening size containers, label wrapping and upstream formatter errors. These establish correctness and placement within the declared bounds.

`probes/dcss/share/cost.mjs <absolute-worktree-path>` measures the complete list, labels, per-item numeric reuse and formatted percentages, including forced style/layout. Warm CSS-property update times on 2026-10-25, median / p95 milliseconds, 50 samples per cell:

| Items | Changed | Chrome | WebKit |
|---:|---|---:|---:|
| 8 | One | 3.7 / 4.5 | 5 / 6 |
| 8 | All | 6.2 / 7.1 | 5 / 6 |
| 32 | One | 13 / 14.9 | 19 / 20 |
| 32 | All | 24.9 / 28.6 | 21 / 22 |
| 64 | One | 24.2 / 26 | 37 / 39 |
| 64 | All | 50.3 / 55.5 | 42 / 47 |

The 64-item fragment has 393 elements and 64 readers. All 600 timed updates were checked, with 22,880 per-item answers checked including warmups. Paint and navigation are excluded. These are absolute costs of this implementation, not a comparison or a speedup claim. Existing cumsum and font measurements were not rerun.


### Compose a result

Layout computes the sum, the scale consumes that number, and two leaf outputs consume the scaled result. The second output doubles it before formatting: the numeric result remains reusable.

```html
<figure id="total" class="dcss-sum">
  <ul>
    <li style="--value: 12">Apples, 12</li>
    <li style="--value: 40">Pears, 40</li>
    <li style="--value: 30">Plums, 30</li>
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

`probes/dcss/compose-check.mjs` checks six native radio selections plus form reset: 7/7 in Chrome and WebKit, with exact sum and scale values, both texts compared with d3, and an incorrectly placed scale detected. This is a composition check within the existing bounds, not additional recorded-call coverage or a timing measurement. Its generated page is `out/compose/index.html`.

Keep computation elements outside a leaf `<output>` in a form. HTML permits phrasing children in an output, but its [reset algorithm replaces those children with text](https://html.spec.whatwg.org/multipage/form-elements.html#the-output-element). The font-reader experiment observed that replacement in WebKit. The native radios here select CSS-authored values; they do not read a typed input's live value into CSS.

### Use the sheet directly

Link `dcss-array.css`, `families/array.css` and `families/format.css`. The precision helpers and the bounded collection calls below work without a build. This three-call page uses layout for the median, arithmetic for precision, and the existing formatter for text:

```html
<figure class="dcss-median">
  <ol>
    <li style="--value: .125"></li>
    <li style="--value: .25"></li>
    <li style="--value: .5"></li>
  </ol>
  <div class="arrays-call-read">
    <div class="arrays-call-result">
      <div class="arrays-call-input">
        <div class="dcss-precision-fixed" style="--step: var(--dcss-median)">
          <div class="arrays-call-input">
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

This prints `1,234.6`. The median remains available as `--dcss-median`; the precision remains available as `--dcss-precision-fixed`. `arrays-call-read` measures a track; its `arrays-call-result` child receives the number and restores the author's width. `arrays-call-input` snapshots upstream readiness and errors before a new call writes its own. Keep these wrappers outside leaf outputs so native form reset preserves them.

[The hand-written proof](probes/dcss/static/precision.html) links the sheet directly and contains no script. `probes/dcss/static/check.mjs` checks its eight desktop/mobile/change/reset states against d3, plus error suppression and recovery. It also checks the bounded calls below, including all 147 recorded precision questions, plus 150 adjacent-boundary queries and live numeric/text range changes. `optimizer-check.mjs` passes the same authored form through the optional compiler and checks four native/reset states with zero added holders. These checks add no recorded-call coverage beyond the existing implementations. Measured compiler choices for authored cumulative sums are described below; other new holder costs remain unknown.

| Call | Drop-in data and result |
|---|---|
| `dcss-median`, `dcss-quantile` | 0–64 observations on the 1/64 grid within ±1024. Quantile takes `--p`; median fixes it at .5. The result is `--dcss-median` or `--dcss-quantile`. |
| `dcss-quantile-sorted` | The same bounds, selecting by source position rather than sorting; result `--dcss-quantile-sorted`. |
| `dcss-scale-threshold` | Up to 16 ascending numeric thresholds within ±2^24; `--value` is the query. |
| `dcss-scale-quantize` | Ascending `--domain-0`/`--domain-1` (defaults 0/1), and one empty `li` per threshold. Each threshold is computed at runtime from an integer snapshot of `sibling-index()` (Q9). |
| `dcss-scale-quantile` | 0–64 observations within the quantile bounds, and a query `--value`. |
| `dcss-cumsum` | 0–64 signed observations within ±1024 on the 1/64 grid. A second `ol.arrays-scan-results` has one `li > div.arrays-call-result` per input. Each result publishes its own `--dcss-cumsum`; missing/NaN observations contribute zero. |

For an interpolated quantile or an even median, put an `arrays-order-upper` container inside the first `arrays-call-result`. Give it the same observation list and another `arrays-call-read > arrays-call-result`; that last result publishes the interpolated answer. Add `arrays-source-order` to the upper container for quantileSorted. A single read suffices when the selected rank is an integer, as in the three-observation proof. Define changing observations once as ordinary properties such as `--a`, and reference those properties in both lists.

All three discrete scales take an explicit `--ranges` (default 2), from 1 to 17, and `--range-0` through `--range-16`. Threshold and quantize holders are `arrays-call-read > arrays-range-copy > arrays-call-result`. The result property is `--dcss-scale-threshold`, `--dcss-scale-quantize` or `--dcss-scale-quantile`; numeric and quoted text ranges are read through `var()`, without per-page rules. A bare output prints a quoted text range; use a formatter for numeric text. `--unknown` supplies the answer for a missing/NaN query. Threshold input ordering and identical repeated observation lists are author preconditions.

A quantile scale uses three copies of its observation list: the outer figure counts observations at or below the query; inside its first result, `arrays-quantile-low` and then `arrays-quantile-high` each contain a list and reader/result pair. The high result contains `arrays-range-copy > arrays-call-result`. Only the gap containing the query needs interpolated threshold comparisons. [The check](probes/dcss/static/check.mjs) contains complete forms for all holder paths. The compiler can supply these structural details when desired.

Invalid grid values flag error 1; an empty quantile or missing probability flags error 2 and publishes CSS NaN. Use an `arrays-call-input` wrapper between calls to propagate those errors and suppress dependent text. When repeating a function, set its next input on that wrapper, so it captures the previous result before the next call shadows the result name. Compiler-generated private names remain optional. Native controls select CSS-authored values; this does not read a typed input's live value.

### Compile the composition

`compileComposition` in `pipeline/compile.mjs` takes the HTML above and returns `{ html, css, contract }`. It uses the existing arrays sheet, trims it to the fragment, and adds status wiring. The author still writes a figure, list, ordinary containers and leaf outputs, with the same classes and custom properties.

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { compileComposition } from './pipeline/compile.mjs';

const result = compileComposition(readFileSync('fragment.html', 'utf8'), {
  inputs: { '#total': { min: 0, max: 1000, step: 1 / 64 } }
});
writeFileSync('fragment-built.html', result.html);
writeFileSync('fragment.css', result.css);
writeFileSync('fragment-contract.json', JSON.stringify(result.contract, null, 2));
```

Link `fragment.css` when the page loads and insert `fragment-built.html` where the original fragment belongs. This is build-time JavaScript; the generated fragment uses no runtime script. Existing ids, names, `for` associations, controls and labels survive. The compiler adds ids where it needs to address an element and binds static settings inline, including defaults and inherited inline settings. Supplied companion CSS goes in the `css` option for dependency trimming; it remains the page's own stylesheet.

The contract covers `dcss-sum`, a two-stop `dcss-scale-linear`, the discrete scales and precision helpers described below, and leaf `dcss-format-fixed`, `dcss-format-percent` or `dcss-format-si` outputs. Bind a value with `var(--dcss-sum)`, `var(--dcss-scale-linear)`, or `calc(var(--dcss-scale-linear) * 2)`; a finite literal also works. Dynamic collections need declared bounds; literal items can supply the initial min/max bounds. A sum has 1–63 items, nonnegative values on the declared step (a multiple of 1/64), and a maximum total below 2^18. Values outside these bounds are skipped and set an error that reaches every dependent output. These conservative compiler bounds leave the underlying library's broader APIs unchanged.

Each stage records its input and result locations, number or text output, precision limits, upstream dependencies, and readiness/error properties. The implementation decisions list calc, layout and font ROM, including why an unavailable choice was refused. Wrong placement, sideways references, unsupported calls, missing bounds, duplicate ids and unknown implementation targets fail at build time. The HTML topology and bindings stay fixed; native controls may change the datum variables. Scale/format settings are literal inline settings, except for the bounded integer precision bindings described below.

The public `--dcss-ready` and `--dcss-err` at a scalar or formatted result include upstream status. A leaf's generated text is hidden while any dependency is unavailable or erroneous. The original numeric properties remain available for other descendants. Rendering digits does not create an HTML input value or a submitted form field.

`contract.resources` counts emitted elements, layout readers/containers, font readers, distinct font faces and embedded font bytes. Glyph-font reads count as both font reads and layout reads. Two SI font outputs use 40 readers but share ten fonts. `cost.features(result).instances` exposes these counts separately from the older rule counts. The legacy fitted model returns no prediction for a composition; its cost is `null`. `pipeline/contract.mjs` only compares supplied complete-fragment measurements for the same workload with both engines present. An automatic replacement must have no median or p95 regression in either engine for either one-item or all-item updates, and beat observed noise in at least one cell. Each cell needs at least two independent runs of 20 samples; equal, stale or incomparable evidence retains the current choice. The default itself must have a matching measurement. Unknown cost never means zero, and this composition has no measured cost model yet.

`pipeline/registry.mjs` owns operation defaults and runtime family ownership. `form: 'auto'` and HTML composition use the same measured decision rule; fitted predictions only rank experiments. `pipeline/selection.mjs` exports `pipelineSource`, `pipelineArtifact` and `pipelineBinding`. For HTML, `pipeline/measured.mjs` exports their `composition*` equivalents. A cost record is built by `recordedCost(evidence)` in `pipeline/evidence.mjs`: protocol, browser versions, workload, binding, and independent `runs` for `patterns.one` and `patterns.all` in each engine. Bind each candidate to its own emitted artifact and actual consumers. Costs from one run remain performance-unqualified.

Composition also accepts `measurement.plans`: named `{id, implementations, artifact, cost}` records for complete alternative plans. The `baseline` record has empty `implementations`; other records map authored scope selectors to implementation ids. Explicit caller choices cannot be overridden. The compiler compares the complete plan once, including readbacks and downstream consumers. `contract.representations` records typed results, field/item projections, layout/font conversions and resource counts. Pipeline flow stages preserve geometry until a numeric output is requested.

Count and mean use the existing runtime reduction in compiled fragments, with sum's bounded nonnegative input domain. Count publishes `0..n` integer bounds; mean publishes the datum interval with grid-ratio precision. Accessors, coercions and signed data remain outside this compiler subset. Stateful candidates require an explicit latency, capture, restart, reset, termination, readiness and invalidation contract, plus `allowStateful`; none is supplied by this migration.


Font SI is an explicit experiment. Pass the existing `build('variable')` or `build('glyph')` result from `probes/si-rom/compile.mjs` as `fontRom`, set `allowExperimental: true`, `allowWrappers: true`, and request `implementations: { '#si': 'font-rom' }`. The optional lookup compiler is selected with `LOOKUP_COMPILER`, as described in the [font probe](probes/si-rom/README.md). The input moves to a generated span outside the leaf output; the leaf keeps its id, associations and visual declarations. The prototype's content font remains explicit through `--sirom-content-font`; arbitrary author layout/font behavior is not qualified. A font choice does not replace neighboring arithmetic formatters, and fonts are counted once across shared readers. Automatic compilation keeps the existing layout sum and arithmetic scale/formatters.

`pipeline/contract-check.mjs` passes 144 build-time checks with `FONT_ROM=1` and the optional `MATHFONT_COMPILER` supplied. `probes/dcss/compiled-check.mjs` passes ten native-control/reset states for arithmetic, both original font encodings and shared mathfont readers in each of Chrome and WebKit. These include invalid inputs, exact numeric reuse and four d3 texts; every font implementation also passes three delayed/failed-load checks per engine. `pipeline/bytes.mjs` reports 320 existing pages and models unchanged. Firefox is not measured for compiled compositions.

### Compile a threshold scale

A threshold scale selects a range value. Pass this fragment to the same `compileComposition` function:

```html
<figure class="dcss-scale-threshold"
        style="--value: 12; --range-0: 10.25; --range-1: 20.5; --range-2: 30.75">
  <ol>
    <li style="--value: 10">First threshold</li>
    <li style="--value: 20">Second threshold</li>
  </ol>
  <div>
    <output class="dcss-format-fixed"
            style="--value: var(--dcss-scale-threshold); --precision: 2"></output>
  </div>
</figure>
```

This prints `20.50`. The selected number, `--dcss-scale-threshold`, also reaches other descendants of the result container. A plain empty `<output>` after the list prints the selected range value without a formatter. Quoted ranges such as `--range-0: 'low'` return text instead. Text ranges cannot feed numeric formatters.

This compiled operation accepts up to 1,024 sorted numeric thresholds within ±2^24 and up to 1,025 finite numeric or unescaped quoted range values. Numeric ranges and unknown values are zero or have magnitudes from 2^-1006 to below 1e31. Ranges are static inline settings; omitted ranges default to 0 and 1. Use `--ranges: 0` for an empty range. A missing query returns the optional `--unknown` value; otherwise it flags error 2 and prints nothing. Invalid active thresholds flag error 1. Lexical domains, objects, callbacks and `invertExtent` are outside this port.

The compiler preserves the figure, list and leaf outputs, adding private result scopes outside the output. Layout reuses the existing bisect prefix and collection reader: comparisons give each matching threshold one pixel, and one width read gives the range index. Literal numeric thresholds also have a `calc` lowering. Force it with `implementations: { '#your-figure-id': 'calc' }`. Dynamic threshold variables use layout; their fixed bindings must remain sorted and within bounds.

`probes/dcss/discrete/check.mjs` answers 11 of all 24 recorded `scaleThreshold` questions in each engine. Both lowerings pass those 11 questions and 67 added cases, including fractional thresholds and indices through 1,024. Eight native-control states per engine check numeric reuse, fixed formatting, missing/invalid inputs and reset. The remaining 13 recorded questions stay uncovered. The ordinary stylesheet's whole-number bisect contract remains unchanged.

`probes/dcss/discrete/cost.mjs` measures the complete operation: fixed thresholds, query updates, a printed output and numeric reuse. Two fresh-page rounds provide 50 warm samples per engine and lowering. Median / p95 milliseconds:

| Thresholds | Chrome layout | Chrome calc | WebKit layout | WebKit calc |
|---|---|---|---|---|
| 32 | 0.7 / 0.8 | 0.3 / 0.4 | 1 / 2 | below 1 / 1 |
| 256 | 5.4 / 7 | 2.4 / 3.9 | 8 / 8 | 4 / 5 |
| 1,024 | 20.3 / 24.5 | 8.2 / 12.3 | 54 / 58 | 34 / 39 |

Arithmetic wins these fixed-list query workloads. One-threshold updates are below one millisecond; timer resolution limits that comparison. Dynamic data updates are not timed here. These observations do not create a general cost model or change the unmeasured layout default. `out/threshold-demo/index.html`, generated by `probes/dcss/discrete/demo.mjs`, shows native quantity controls, a fee output and reuse of its number in CSS.

`coverage/d3.mjs --update-saved probes/dcss/discrete/check.mjs` refreshes only this check's saved counts, requiring matching compiler fingerprints for Chrome and WebKit. It retains the other recorded results and runs no checks. `--reuse` then regenerates the page without changing any counts.

### Compile a quantize scale

Quantize divides a numeric domain into equally spaced buckets. The compiler generates the private threshold list; the author supplies a figure and its result:

```html
<figure class="dcss-scale-quantize"
        style="--value: 12; --domain-0: 0; --domain-1: 30;
               --range-0: 10.25; --range-1: 20.5; --range-2: 30.75">
  <div>
    <output class="dcss-format-fixed"
            style="--value: var(--dcss-scale-quantize); --precision: 2"></output>
  </div>
</figure>
```

This prints `20.50`; other descendants reuse `--dcss-scale-quantize`. A plain empty output also prints the selected range value. Quoted text ranges and `--unknown` work as in threshold scaling. Endpoints are ascending literals within ±2^24, either zero or magnitudes at least 2^-1006. There are 1–1,025 range values, with the same numeric/text bounds as threshold scaling. Defaults are domain `[0, 1]` and range `[0, 1]`.

CSS computes the boundaries in d3's operation order, using the existing engine-aware division helper. For domain 4.2–6.2 and ten ranges, the last boundary remains `6.000000000000001`. These are CSS computations; the compiler does not replace them with JavaScript answers. The layout lowering reuses the same prefix reader as threshold scaling.

Chrome rejects a single 56,771-character expression for 100 boundaries. The scalar lowering instead registers exact partial counts, with at most 16 comparisons each, then sums those integers. `probes/dcss/discrete/expression-check.mjs` measures the rejection and checks the seven-part result in Chrome and WebKit. The largest partial expression is 9,091 characters; all seven parse in both engines.

`probes/dcss/discrete/check.mjs` answers 33 of all 65 recorded quantize questions in each engine, under both lowerings. Each also passes 103 seeded/boundary cases, including adjacent doubles, coincident endpoints and 1,025 range values. Eight native states per engine check numeric reuse, fixed formatting, missing queries and reset. Object ranges, `thresholds()`, `invertExtent`, ticks and labels remain outside this port.

`OP=quantize node probes/dcss/discrete/cost.mjs` measures the same complete-operation protocol with generated boundaries. Median / p95 milliseconds, 50 samples per cell:

| Boundaries | Chrome layout | Chrome calc | WebKit layout | WebKit calc |
|---|---|---|---|---|
| 32 | 1.9 / 2.1 | 0.7 / 0.7 | 3 / 3 | 1 / 1 |
| 256 | 13.7 / 16.7 | 5.1 / 7.1 | 21 / 22 | 9 / 9 |
| 1,024 | 56.7 / 70.1 | 19.1 / 23.3 | 106 / 110 | 52 / 54 |

Arithmetic wins these fixed-domain query workloads. The compiler's unmeasured default remains layout; force the qualified scalar lowering with `implementations: { '#your-figure-id': 'calc' }`. This does not price dynamic domain settings or larger compositions. The private-collection fix required new measurements for 32 changed layout rounds across threshold and quantize. All 32 scalar rounds and all 48 quantile/median composition rounds were retained. Previous layout measurements remain archived. `OP=quantize node probes/dcss/discrete/demo.mjs` generates `out/quantize-demo/index.html` with native quantity controls and reusable fee output.

The existing NumPy frontend also exposes its `kthGrid` and `KCSS` helpers for reuse. Optional `div` reader scopes accept nested flow content while the previous templates remain unchanged. `probes/dcss/discrete/order-check.mjs` checks 140 two-grid quantiles per engine on signed 1/64 data, including 1,024 entries. It checks both selected values directly and changes every expected answer to prove the comparator catches a mismatch. Chrome and WebKit pass exactly. This is a prerequisite probe, with no additional d3 coverage claimed.

### Compile a quantile or median

The same compiler accepts a collection of signed values and returns a reusable number:

```html
<figure class="dcss-quantile" style="--p: 0.37">
  <ol>
    <li style="--value: 3"></li>
    <li style="--value: 1"></li>
    <li style="--value: 2"></li>
    <li style="--value: 4"></li>
  </ol>
  <div>
    <output class="dcss-format-fixed"
            style="--value: var(--dcss-quantile); --precision: 3"></output>
  </div>
</figure>
```

This prints `2.110`. Use `dcss-median` and `var(--dcss-median)` for the median; its probability is always 0.5. Other descendants of the result container reuse the same number, including another scale. The author writes ordinary figures, lists, containers and leaf outputs. The compiler adds private scopes and retains existing ids, names, labels and `for` associations.

Data has 0–1,024 finite numeric values on a declared 1/64 grid. Values are at least -2^18; the maximum minus the smaller of zero and the minimum is below 2^18. Literal arrays supply their bounds. Plain datum bindings such as `--value: var(--a)` require `inputs: { '#figure-id': { min: -1000, max: 1000, step: 1 / 64 } }`. Controls change those datum variables on the call or its ancestors. Bindings, topology, bounds and probability stay fixed.

Quantile uses d3's R-7 method and clamps probabilities outside `[0, 1]` to the endpoints. The layout lowering reuses the existing order-statistic grids. It reads one selected value for an integer rank, otherwise two, then interpolates with scalar arithmetic. Two registered integer pieces per value retain every 1/64 and freeze each container read before another container changes its meaning. Dynamic arrays use one additional layout read to validate a private copy of the datum bindings. Zero-height rank rows preserve placement without taking visible space. A separate inline-size read freezes the author's available width before numeric containers change what `cqw` means; ordinary result content then supplies its own height.

The scalar alternative reuses the pipeline's stable-rank comparisons and is qualified through 64 values. Dynamic scalar arrays still use layout for validation, followed by scalar ranks and interpolation. Force either qualified lowering with `implementations: { '#figure-id': 'calc' }` or `'layout'`. The default remains layout while a matching complete workload measurement is unavailable.

An empty array or missing quantile probability flags error 2. Invalid dynamic bounds or grid values flag error 1 and suppress dependent formatter text. This port rejects invalid observations; it does not implement d3's filtering of null, undefined or NaN within an array. Coercion, accessors, date values, wider numeric ranges and signed-zero identity remain outside this port. Generated text is not a submitted form value.

`probes/dcss/quantile/check.mjs` reuses the existing recorded calls. Each lowering answers 25 of 43 quantile questions and 6 of 47 median questions in Chrome and WebKit. Layout also passes 120 seeded cases per operation; scalar ranks pass 112, with eight large arrays outside their 64-item bound. Each passes eight native datum, formatting, error and reset states per operation and engine. Changing every numeric expected answer also confirms that the exact comparison detects a mismatch.

`probes/dcss/quantile/cost.mjs` measures the complete form: changing data feeds a quantile at 0.37 and a median, each followed by fixed text and numeric reuse. Two fresh-page rounds give 50 samples per update pattern. The timings below include the normal-flow correction; earlier measurements are archived under `out/quantile-cost/before-natural-flow/` and do not qualify the corrected implementation.

| Values | Chrome layout | Chrome scalar | WebKit layout | WebKit scalar |
|---:|---:|---:|---:|---:|
| 1 | 1.5 / 1.8 | 0.8 / 0.9 | 1.0 / 2.0 | 1.0 / 2.0 |
| 8 | 2.7 / 3.5 | 1.1 / 1.5 | 2.0 / 3.0 | 2.0 / 3.0 |
| 32 | 3.8 / 4.6 | 3.6 / 4.1 | 4.0 / 4.0 | 5.0 / 6.0 |
| 64 | 4.9 / 5.3 | 9.2 / 10.6 | 6.0 / 7.0 | 15.0 / 16.0 |

At 64 values, layout has 560 elements and eight readers; scalar ranks have 294 elements and four readers, including author-width capture and validation. Layout wins that complete workload in both engines. The indexed variant takes 4.7 / 5.5 ms in Chrome and 6 / 7 ms in WebKit, with 562 elements and eight readers. Its former element-count advantage is gone: preserving ordinary flow requires separate in-flow read scopes. At 32 values the engines favor different choices, so the selector retains the current lowering.

`layout-indexed` remains an explicit layout alternative with conservative bound `count * (max - min(0, min)) < 2^18`. It now uses in-flow order-statistic scopes instead of fixed-position column readers. The previous one-grid implementation answered numbers correctly but failed to reserve the result's natural height; it is no longer emitted. Each selected statistic is captured once, using the existing `kthGrid` kernel, then reused by interpolation. The indexed alternative passes the same recorded questions, 70 eligible seeded cases per operation and eight native states per engine. No general size threshold is inferred from these complete-page measurements. `WAYS=layout,calc,layout-indexed SAVED_ONLY=1` verifies the 48 corrected records without opening browsers.

`probes/dcss/quantile/flow-check.mjs` checks quantile, median, source-position quantile and quantile scale with literal and changing datum bindings, 240/640 px author widths, captions and following content, without an explicit figure height. All 40 cases per engine retain the result's full width, natural height and ordinary flow. Validation uses a private zero-height grid, leaving the authored caption, list and result topology intact. The available-width read is counted even when numeric evaluation uses scalar arithmetic.

For d3's `quantileSorted`, use the same figure/list/output pattern with `class="dcss-quantile-sorted"` and `var(--dcss-quantile-sorted)`. It reads the original source positions and interpolates; it does not sort or check sortedness, matching d3 even on a descending array. The default directly reads the one or two known datum bindings with scalar arithmetic, supporting 1,024 values. Numeric evaluation is direct arithmetic. The author-width capture remains one layout read; dynamic data adds validation. The optional `layout-indexed` implementation reads selected source values through in-flow scopes without sorting, within the same cumulative-width bound.

Both implementations answer all four recorded `quantileSorted` calls exactly in Chrome and WebKit. Direct scalar reads also pass 120 seeded cases, including 1,024 values; indexed reads pass 70 eligible cases. Each passes eight native datum, formatting, error and reset states per engine, with wrong-answer mutations detected. Numeric bounds and error meanings are the same as quantile. No timings for this separate operation are claimed.

### Cumulative sums and optional optimization

`probes/dcss/cumsum/foundation-check.mjs` checks per-item numeric reuse and ordinary list flow before compiler integration. Stored scalar prefixes and layout reads over a shared explicit track template each pass 23 array cases in Chrome and WebKit, including five recorded numeric d3 questions and arrays of 128 signed values. Inputs are within ±32 on a 1/64 grid. A negative probe reproduces inline-size containment breaking nested subgrid track inheritance; the explicit-template version avoids that dependency.

`probes/dcss/cumsum/cost.mjs` measures 64 changing datum properties and 64 fixed outputs: two fresh-page rounds, five warmups and 25 samples each. Median / p95 milliseconds are 57.1 / 64.3 in Chrome and 62 / 77 in WebKit for layout, versus 22.9 / 26.1 and 34 / 35 for stored arithmetic. Arithmetic wins this workload. `SAVED_ONLY=1` verifies all eight saved rounds. This foundational probe predates the public operation and adds no coverage. Its nested-template layout is distinct from the shared-grid holder path below.

The public `dcss-cumsum` operation has per-item result addresses: each output consumes the prefix beside it, rather than treating the collection as one number. Compiler contracts name each endpoint, its bounds and its readiness/error scope. `probes/dcss/cumsum/check.mjs` answers 11 of 42 recorded d3 calls, with accessors and values outside its grid contract retained as unsupported questions.

With authored `ol.arrays-scan-results` holders, the optional compiler offers arithmetic and the sheet's shared-grid layout on the **same HTML**. Neither candidate adds, removes or reparents an authored node. Arithmetic reuses `prepareScan` and has zero layout readers; shared layout has `N + 1`, including the author's width capture. Without matching complete-workload measurements the compiler retains shared layout. The uncompiled page links `dcss-array.css` and `families/array.css`.

`probes/dcss/cumsum/authored-check.mjs` checks all three paths at 8, 32 and 64 items: 72 native/change/error/reset cases per engine, exact d3 prefixes, rendered text, numeric reuse and ordinary flow. Full-range cases include ±1023.984375. Input validation examines the original value; two registered integer parts transport valid grid values exactly. This avoids Chrome's registered-number rounding, and saturating the transport keeps WebKit's infinity from contaminating a gated width.

`probes/dcss/cumsum/authored-cost.mjs` measures datum mutation and forced style/layout for the complete form, including validation, every prefix, numeric reuse and generated text. Paint is excluded. Each candidate has two fresh-page rounds in reversed order, five warmups and 25 measured samples per round. One-input and all-input updates are separate workloads; the shared benchmark lock excludes overlapping timing runs. Saved rows bind the protocol, authored source and emitted artifact. `SAVED_ONLY=1` reuses matching rows without opening a browser or acquiring the lock.

Run one engine at a time:

```sh
ENGINES=Chrome N=8,32,64 node probes/dcss/cumsum/authored-cost.mjs
ENGINES=WebKit N=8,32,64 node probes/dcss/cumsum/authored-cost.mjs
SAVED_ONLY=1 node probes/dcss/cumsum/authored-cost.mjs
```

Measured 2026-10-25 in Chrome 155.0.8059.86 and WebKit 26.4. Times are median / p95 milliseconds, 50 samples per cell:

| Items | Changed inputs | Chrome arithmetic | Chrome shared grid | WebKit arithmetic | WebKit shared grid |
|---:|---|---:|---:|---:|---:|
| 8 | One | 2.9 / 3.1 | 4.3 / 4.7 | 4 / 5 | 5 / 5 |
| 8 | All | 3.3 / 4.1 | 5.8 / 6.9 | 4 / 5 | 5 / 6 |
| 32 | One | 11.1 / 13.4 | 16.8 / 19.7 | 16 / 18 | 18 / 19 |
| 32 | All | 11.8 / 14.2 | 22.9 / 27.1 | 17 / 18 | 19 / 20 |
| 64 | One | 22.7 / 26.9 | 34.6 / 39.0 | 34 / 36 | 38 / 41 |
| 64 | All | 23.4 / 27.4 | 45.4 / 51.7 | 34 / 35 | 36 / 39 |

These historical measurements favor arithmetic in all six source/update combinations. They predate the current evidence contract. At 64 items both paths retain 471 author elements; shared layout has 65 readers and arithmetic has zero. These comparisons concern per-item numeric readback and formatting; they do not replace the defaults for other collection operations.

The current `probes/architecture/cumsum-authored-64.json` receipt qualifies the 64-item compiler workload with two independent runs per engine and both mutation patterns. Worst-pattern median / p95 is 25.3 / 34.7 ms arithmetic versus 48.1 / 54.3 ms layout in Chrome, and 36.5 / 41 ms versus 41 / 49 ms in WebKit. `probes/architecture/qualification.mjs` checks its protocol and emitted artifact before reporting it as current. This is one compiler workload; the runtime delivery and the other pilot exports still require their own qualification.

Pass the matching complete-plan evidence to the compiler:

```js
const {source, candidates} = JSON.parse(readFileSync('probes/architecture/cumsum-authored-64.json'));
const measurement = {
  source,
  workload: candidates.calc.workload,
  plans: [
    {id:'baseline', implementations:{}, artifact:candidates.layout.evidence.binding.artifact, cost:candidates.layout},
    {id:'arithmetic', implementations:{'#scan':'calc'}, artifact:candidates.calc.evidence.binding.artifact, cost:candidates.calc}
  ]
};
const result = compileComposition(html, { css, inputs, measurement });
```

The option uses the candidate cost contract: `scope: 'complete'`, `workload`, Chrome/WebKit `ms` and `p95`, and bound evidence with at least two independent runs of 20 samples for each engine and mutation pattern. Source, CSS, bounds, consumers, protocol or emitted-code changes invalidate the evidence. The selector requires an improvement beyond measured noise and no median or p95 regression in either engine; ties or missing comparable costs retain the existing choice. Explicit implementation requests remain explicit. `contract.cost` records the complete workload once. Measurements apply to the recorded browser versions and machine; no general size rule is inferred.

`pipeline/measured-check.mjs` checks 24 source/artifact/selection cases, including stale measurements, changed CSS/bounds, missing engines, regressions, ties and explicit choices. The benchmark's saved comparison records the measured selection for each exact source and update pattern.

`sum`, `count` and `mean` also expose an explicit arithmetic candidate when every list item binds `--value` to an ordinary datum variable supplied on the call or an ancestor. Bindings stay fixed; native controls may change those datum variables. The existing 1–63 item, nonnegative 1/64-grid bounds apply. Arithmetic preserves the list's diagonal positions and result-container geometry, computes reusable numbers without container readback, and retains missing/out-of-range errors. Layout remains the default until matching measurements select otherwise. `pipeline/reduction-check.mjs` checks both candidates against d3 and each other's geometry in Chrome and WebKit, including numeric/width reuse and native reset.

### Compile a quantile scale

Quantile scales compose those order statistics with the existing threshold lookup. The list supplies observations; the query is on the figure; the mapped value flows into its result container:

```html
<figure id="tier" class="dcss-scale-quantile"
        style="--value: 3; --range-0: 10; --range-1: 20; --range-2: 30">
  <ol>
    <li style="--value: 3">First observation</li>
    <li style="--value: 1">Second observation</li>
    <li style="--value: 7">Third observation</li>
  </ol>
  <div class="result">
    <output class="dcss-format-fixed"
            style="--value: var(--dcss-scale-quantile); --precision: 3"></output>
  </div>
</figure>
```

This prints `20.000`. Other descendants reuse `--dcss-scale-quantile`. The compiler preserves the figure, list, result container and output, including their ids, names and associations. An authored result width belongs to presentation; a separate private carrier reads the threshold collection. `probes/dcss/discrete/presentation-check.mjs` checks threshold, quantize and quantile scales through 54 native width/query/reset states per engine, with exact reuse, implicit text and fixed formatting at both 240 and 640 px.

Data uses the quantile frontend's signed 1/64 grid and declared bounds. There are 0–1,024 observations and 0–17 static numeric/text range values. The layout implementation captures each distinct selected order statistic once through in-flow rank grids, interpolates the R-7 boundaries, then compares the query against at most sixteen cuts with scalar arithmetic. It reuses the existing order-statistic and threshold kernels; the result stays in ordinary flow. Its cumulative encoded width must be below 2^18. The scalar implementation shares stable ranks through 64 observations. Choose with `implementations: { '#tier': 'layout' }` or `'calc'`; an unqualified explicit request fails. Datum and query variables can change through native controls while bindings and ranges stay fixed.

Missing queries use `--unknown` when supplied, otherwise error 2. Invalid observations flag error 1 and suppress dependent formatter text. An empty range flags error 2; empty observations with a nonempty range map valid queries to its first value, as d3 does. Invalid-observation filtering, coercion, object ranges, `quantiles()` and `invertExtent()` remain outside this port.

`probes/dcss/quantile-scale/check.mjs` reuses the 74 complete-state questions already recorded from d3. Both lowerings answer 39 exactly in Chrome and WebKit. The remaining questions comprise five boundary-array reads, thirteen inverse extents, sixteen object ranges and one query coercion. Layout also passes 365 added cases, including exact boundaries, their adjacent doubles, repeated values, empty data/ranges and 1,024 observations. Scalar ranks pass 359, with six large cases outside their bound. Each lowering passes nine native data/query, formatting, error and reset states per engine.

`probes/dcss/quantile-scale/cost.mjs` measures the complete scale, fixed output and numeric reuse under native controls. Two fresh-page rounds give 50 samples per cell. All observations and the query change together below; median / p95 milliseconds:

| Observations | Ranges | Chrome layout | Chrome scalar | WebKit layout | WebKit scalar |
|---:|---:|---:|---:|---:|---:|
| 1 | 4 | 0.8 / 1.0 | 0.4 / 0.5 | 1.0 / 1.0 | 1.0 / 1.0 |
| 8 | 4 | 1.6 / 2.1 | 0.7 / 0.8 | 2.0 / 2.0 | 1.0 / 2.0 |
| 32 | 4 | 2.8 / 3.6 | 1.9 / 2.3 | 4.0 / 5.0 | 3.0 / 4.0 |
| 64 | 4 | 4.5 / 5.9 | 5.4 / 6.2 | 7.0 / 8.0 | 9.0 / 9.0 |
| 8 | 17 | 2.0 / 2.6 | 0.9 / 1.1 | 3.0 / 3.0 | 1.0 / 2.0 |
| 64 | 17 | 18.0 / 31.4 | 8.9 / 10.0 | 70.0 / 75.0 | 14.0 / 14.0 |

At 64 observations and four ranges, layout has 561 elements and eight readers; scalar ranks have 159 elements and two readers. Layout improves this complete all-data update in both engines. At seventeen ranges, arithmetic wins both engines: it avoids the many order-statistic grid copies needed for ordinary flow. These results apply to the measured fragments; the compiler does not infer a universal cutoff.

Saved comparisons pass each complete workload through the selector. A replacement must avoid regressions in both median and supplied p95 in each engine; missing tail measurements cannot displace a tail-qualified candidate. The corrected measurements qualify these compositions, not a general size cutoff. `CASES=1:4,8:4,32:4,64:4,8:17,64:17 SAVED_ONLY=1` verifies all 48 records without opening browsers. Earlier fixed-position-reader measurements are archived under `out/quantile-scale-cost/before-natural-flow/`. Failed value, text or geometry checks stop a run before its result is saved.

Coverage reports also retain only successful runs. `probes/dcss/report-cache/check.mjs` checks that a failing exit or thrown error cannot replace a successful saved report with partial counts.

The query can also live on the result `div`, leaving the observations and their computed order statistics above it:

```html
<form>
  <label><input id="three" type="radio" name="query" checked> Query 3</label>
  <label><input id="eight" type="radio" name="query"> Query 8</label>
  <figure id="tier" class="dcss-scale-quantile"
          style="--range-0: 10; --range-1: 20; --range-2: 30">
    <ol>
      <li style="--value: 3">First observation</li>
      <li style="--value: 1">Second observation</li>
      <li style="--value: 7">Third observation</li>
    </ol>
    <div id="query" style="--value: var(--query)">
      <label for="answer">Mapped value</label>
      <output id="answer" name="result" for="three eight"
              class="dcss-format-fixed"
              style="--value: var(--dcss-scale-quantile); --precision: 3"></output>
    </div>
  </figure>
</form>
```

```css
#query { --query: 3; }
form:has(#eight:checked) #query { --query: 8; }
```

This prints `20.000` or `30.000`. If the figure supplies `--value`, it keeps its original meaning. Otherwise an explicit `--value` on the following plain result `div` supplies the query. The contract names that div as the input scope. Place the changing query variable there too: a query variable changed on a shared ancestor still invalidates its descendants. Observations and their bounds remain on the figure and its ancestors. The existing div and leaf output retain their ids and associations.

`QUERY_SCOPE=result` in the quantile-scale check and cost probes exercises this placement. Both lowerings pass 39/74 recorded questions, all eligible added cases and nine native states per engine. At 64 observations, the corrected query-only median / p95 milliseconds are:

| Ranges | Chrome layout | Chrome scalar | WebKit layout | WebKit scalar |
|---:|---:|---:|---:|---:|
| 4 | 0.6 / 0.8 | 0.4 / 0.6 | 1.0 / 2.0 | 1.0 / 1.0 |
| 17 | 1.9 / 2.3 | 0.6 / 0.7 | 6.0 / 6.0 | 1.0 / 2.0 |

Keeping the changing query below the data avoids recomputing order statistics on a query update. `QUERY_SCOPE=result CASES=64:4,64:17 SAVED_ONLY=1` verifies these 16 additional rounds. Results keep ordinary flow as well as their numeric reuse, rendered text and reset behavior. These records replace the earlier fixed-position-reader measurements; no numeric d3 coverage is added by this correction.

### Reusable precision

d3's precision helpers return numbers. These native outputs use `dcss-array.css` and `families/array.css`:

```html
<output class="dcss-precision-fixed" style="--step: .01"></output> <!-- 2 -->
<output class="dcss-precision-prefix" style="--step: .01; --value: 1000"></output> <!-- 5 -->
<output class="dcss-precision-round" style="--step: .01; --max: 1.01"></output> <!-- 3 -->
```

Each publishes the corresponding `--dcss-precision-fixed`, `--dcss-precision-prefix` or `--dcss-precision-round` on itself and its descendants. A container can compute once for several outputs, including the formatter's precision:

```html
<div class="dcss-precision-fixed" style="--step: .01">
  <div class="arrays-call-input">
    <output class="dcss-format-fixed"
            style="--value: 1.2345; --precision: var(--dcss-precision-fixed)"></output>
  </div>
</div>
```

This prints `1.23`. The result remains an integer usable by other descendants, independently of the text. Formatter precision bindings require a declared result range within 0–15 for fixed/percent, or 1–15 for SI. The compiler checks that range and connects readiness and errors. A precision call can also consume another numeric producer; bindings must still flow downward through actual result locations. The drop-in path accepts the same precision variable directly; keep it within the formatter’s supported range.

Steps have magnitude `1e-30 <= abs(step) < 1e31`; prefix reference values and round maxima have magnitude below `1e31`. Signs follow d3's absolute-value rules. Zero steps, missing/nonfinite inputs and undefined d3 answers publish CSS NaN and error 2. Values outside declared bounds or the supported magnitude flag error 1. Dependent generated text stays empty on errors. The author elements, output names/associations and native reset survive; no computation elements are added.

For changing inputs, use a plain variable such as `--step: var(--resolution)` and pass `inputs: { '#digits': { min: .001, max: 1, target: { min: 0, max: 1000 } } }` for the call's id. The outer bounds describe the step; optional `target` bounds describe the prefix reference or round maximum. Literal inputs infer their own bounds. These are scalar arithmetic calls, with zero layout and font readers. The shared decimal-exponent correction also passes 364 boundary/adjacent-double probes in each engine.

`probes/dcss/precision/check.mjs` answers all 147 distinct recorded d3 questions exactly in Chrome and WebKit: fixed 10/10, prefix 129/129 and round 8/8. Each helper also passes 695 seeded/boundary cases and nine native input, formatting, numeric reuse, error and reset states per engine. `composition-check.mjs` checks seven nested outputs, including a layout quantile feeding precision and fixed text.

`node probes/dcss/precision/demo.mjs` builds [a complete native form](out/precision-demo/index.html). Three radio choices change the observations; their layout median becomes a precision input, and its integer result becomes another output's format setting. The page shows the authored markup beside the working form, without a fixed figure height or runtime script. `CHECK=1` checks eight desktop/mobile/change/reset states in each engine, comparing all three printed results with d3 and checking ordinary flow and horizontal overflow.

`probes/dcss/precision/cost.mjs` measures a complete native form with one shared precision helper, its printed digit count, formatted values and numeric reuse. Two fresh-page rounds give 50 measured updates per cell, after five warmups per round. At 30 formatted values, median / p95 milliseconds are:

| Precision helper | Chrome | WebKit |
|---|---:|---:|
| Fixed | 9.9 / 11.3 | 14 / 15 |
| Prefix | 9.9 / 11.6 | 14 / 15 |
| Round | 9.8 / 11.7 | 14 / 16 |

At one formatted value the medians are 0.7 ms in Chrome and 1 ms in WebKit. These measure complete forced style/layout updates, not frame rate or a comparison with another lowering. `SAVED_ONLY=1` verifies all 36 records without opening browsers. The 64 threshold/quantize timing rounds remain unchanged. The subsequent normal-flow correction replaces the 112 quantile/median and quantile-scale rounds, as documented above; these 36 precision-only pages remain unchanged.

### Measure the complete composition

`probes/dcss/composition-cost.mjs` measures a three-item layout sum, a two-stop linear scale, and 1, 10 or 30 SI outputs. Each output reuses the scaled number with a different literal multiplier. Arithmetic, variable-font and glyph-font versions compile the same authored semantic HTML; forms, native controls, labels, output ids and associations are retained. All three versions use the existing layout sum and arithmetic scale. The formatter's decimal-error tables are the implementation choice being compared.

Run once per engine; the font provider uses the existing `LOOKUP_COMPILER` option:

```sh
ENGINES=Chrome node probes/dcss/composition-cost.mjs
ENGINES=WebKit node probes/dcss/composition-cost.mjs
node probes/dcss/composition-cost-summary.mjs
```

The probe takes the shared benchmark lock without waiting. `N=1,10,30` selects output counts, `WAYS=arithmetic,variable,glyph` selects implementations, and `ROUNDS=2` selects fresh-page rounds with rotated implementation order. Every round has five warmups and 25 measured updates for each pattern: one datum changing, then all three. The timed interval includes input mutations and forced style/layout through the complete chain. Pixel comparisons, numeric assertions and native-control/reset checks run outside that interval. Initial and final sampled outputs are compared with d3; every output's readiness/error is checked. The probe measures update costs, not paint or frame rate.

Cold time includes navigation, embedded-font readiness and first layout, with two observations per configuration. Warm medians and p95 values combine 50 samples per update pattern; individual rounds remain in the result. Generated pages, authored fragments, contracts and measurements live under `out/compiled-cost/`. Matching completed rounds are reused; `FORCE=1` replaces them. These measurements qualify the stated workloads and do not fit a general cost model or automatically enable font selection.

The summary reads both engines' completed reports, requires matching probe/page fingerprints, and passes each complete workload's median costs through `pipeline/contract.mjs`. It also compares the authored form's structure with each compiled form: controls, collection, labels, ids, associations and leaf outputs survive after private font spans are excluded. `--semantics-only` runs that structure comparison without requiring timings or opening a browser. The generated `comparison.json` retains each engine's median, p95, cold observations and the selector's reason.

`probes/si-rom/mathfont.mjs` adds a shared candidate using the existing optional `compileMath` frontend. It compiles 83 integer powers to ten exact correction fields, and shares ten font-load guards across all queries. Pass its `await buildMathfont()` result as `fontRom`; the same experimental/wrapper permissions apply. Private flow containers surround the form, and all readers remain outside leaf outputs. This controlled prototype takes the surrounding `contentFont` and output `slotHeight` explicitly (defaults match this fixture); arbitrary page fonts and layouts remain unqualified. `WAYS=mathfont` checks or times only that implementation, with `MATHFONT_COMPILER` pointing to the existing module. Include `mathfont` in the summary's `WAYS` to compare it with the saved baselines.

Adding this provider preserves the existing arithmetic and font HTML/CSS. The cache now hashes the unchanged verification/measurement protocol separately from provider preparation. All 36 earlier rounds were retained after a byte-for-byte protocol and emitted-page audit; raw observations were unchanged. The audit is saved in `out/compiled-cost/protocol-migration.json`.

Measured 2026-10-25 in Chrome 155.0.8059.86 and WebKit 26.4. All three inputs changing; warm median / p95 in ms, 50 samples per cell:

| Outputs | Formatter implementation | Chrome | WebKit |
|---:|---|---:|---:|
| 1 | Arithmetic | 18.3 / 20.8 | 18.0 / 19.0 |
| 1 | Variable fonts | 32.9 / 36.5 | 36.0 / 37.0 |
| 1 | Glyph fonts | 33.5 / 46.3 | 37.0 / 38.0 |
| 1 | Shared mathfont | 30.8 / 34.6 | 34.0 / 36.0 |
| 10 | Arithmetic | 152.8 / 156.5 | 175.0 / 181.0 |
| 10 | Variable fonts | 313.0 / 319.9 | 365.0 / 372.0 |
| 10 | Glyph fonts | 350.7 / 428.9 | 374.0 / 384.0 |
| 10 | Shared mathfont | 298.9 / 309.8 | 343.0 / 353.0 |
| 30 | Arithmetic | 455.1 / 468.3 | 515.0 / 532.0 |
| 30 | Variable fonts | 935.5 / 963.7 | 1088.0 / 1121.0 |
| 30 | Glyph fonts | 1084.0 / 1236.4 | 1112.0 / 1159.0 |
| 30 | Shared mathfont | 903.9 / 929.4 | 1021.0 / 1040.0 |

Changing one datum also updates every output because all depend on the sum. At 30 outputs, its arithmetic median is 454.9 / 510.0 ms (Chrome / WebKit), variable fonts 947.4 / 1095.0, and glyph fonts 964.9 / 1104.0. The selector retains arithmetic in all six paired workloads. The arithmetic fragment has 121 elements and one layout reader; either font fragment has 1,981 elements and 600 font readers sharing ten faces. Glyph fonts add 600 layout readers. The authored form's semantic structure passes the projection check in all nine emitted fragments.

Shared mathfont's 30-output fragment has 1,592 elements, 600 font readers and ten shared guards. Its one-input median is 908.2 / 1021.0 ms. Its two cold observations span 950.4–959.0 ms in Chrome and 2097.2–2098.4 ms in WebKit. The corrected flow containers preserve the example's original row positions and heights in both engines. All twelve authored-form projections pass when the shared candidate is included; arithmetic remains selected in all six workloads. An earlier inline-wrapper experiment is retained separately and is excluded from these qualified results.

At 30 outputs, the two cold arithmetic observations span 265.0–267.8 ms in Chrome and 621.7–698.9 ms in WebKit. Variable fonts span 958.0–964.4 / 2233.8–2240.1 ms; glyph fonts 1419.4–1426.7 / 2296.5–2316.3. These are the complete compiled-chain costs, including its reusable scaled input. The formatter-only workload below has different inputs and timings. This chain remains expensive; the cause of the extra composition cost has not been profiled.

### Experimental live-number fold composition

`probes/fold-rom/` adapts the optional lookup provider's `compileFold().numeric()` reader to a controlled DCSS fragment. It is separate from the production composition frontend and changes no default. The target is the existing d3 minimum of four integer observations in 0–63, followed by the existing linear scale, precision helper and fixed formatter. No GCD export or new public DCSS function is introduced.

The provider constructs one padded counter word from four live CSS properties; the driver never supplies an encoded list. The consumer validates original observations before passing safe integer digits to that encoder. NaN observations are skipped using the minimum's identity, all-missing input is undefined, and fractional/out-of-range input flags an error. The prototype accepts only declared style-time literal datum bindings. It refuses layout-derived and chained numeric sources: lookup's separate chained-reader probe reports a stale Chrome result, so its isolated one-reader qualification cannot establish those paths.

The reader is opt-in and experimental. Six generated flow helpers wrap the authored result region, with two layout reads, one data font reader and one 15,752-byte font. Provider measuring spans become private flow containers; author nodes, labels, output names and associations remain in the same semantic projection, and outputs remain leaves. A pending or failed font publishes no usable numeric result and suppresses dependent text while independent arithmetic continues. Generic encoded-reader adapters remain unavailable for selection until the bound input phase is qualified.

`probes/fold-rom/check.mjs` checks ten encoded-text contract states per engine; these establish flow and status only. `live-check.mjs` checks twenty live native/viewport/reset states per backend in Chrome and WebKit, all 4,096 minimum pairs, three font-delivery guards, strict source-phase refusals and the authored projection. Existing sheet rules for the replaced layout reduction are removed from both generated candidates, rather than left running underneath them.

Run with the optional provider's module path, using its numeric API (tested at provider commit `7b174a50`):

```sh
MATHFONT_FOLD=/path/to/lookup/fold.mjs node probes/fold-rom/live-check.mjs
MATHFONT_FOLD=/path/to/lookup/fold.mjs node probes/fold-rom/live-cost.mjs
MATHFONT_FOLD=/path/to/lookup/fold.mjs SAVED_ONLY=1 node probes/fold-rom/live-cost.mjs
```

The complete warm comparison includes original-input validation, live encoding, shaping/readiness/readback, scale, precision, formatted text and forced style/layout. Paint, build-time font generation and download are excluded. Every timed result is checked. Two balanced fresh-page rounds provide 50 samples per cell under the shared benchmark lock. Measured 2026-10-25, median / p95 milliseconds:

| Changed inputs | Chrome arithmetic | Chrome font fold | WebKit arithmetic | WebKit font fold |
|---|---:|---:|---:|---:|
| One | 6.2 / 6.9 | 13.5 / 15.7 | 13 / 14 | 14 / 15 |
| All four | 6.0 / 6.9 | 13.3 / 15.4 | 14 / 14 | 14 / 15 |

The selector retains arithmetic in both workloads. These are complete-fragment timings, not isolated fold costs. Eight saved records replay without browsers; all 400 measured outputs agree with their numeric and precision/status models. Cold navigation/font-ready observations were 20.2–23.1 ms arithmetic versus 43.6–46.2 ms font in Chrome, and 36–43 versus 52–54 ms in WebKit. An earlier run retaining inactive legacy reduction callbacks is kept separately and excluded. Existing SI and cumulative-sum measurements were not rerun or replaced; d3 recorded-call coverage does not increase.

### Bisect

`.dcss-bisect-left` and `.dcss-bisect-right` return d3's zero-based insertion index. `.dcss-bisect` aliases the right variant. The figure's `--value` is the query; lists of up to 1,024 items hold sorted whole-number keys within ±2^24. Optional `--lo` and `--hi` restrict the search to `[lo, hi)` (defaults 0 and the list length); use whole bounds with `0 <= lo <= hi <= length`.

```html
<figure class="dcss-bisect-left" style="--value: 2">
  <ol>
    <li style="--value: 1">1</li>
    <li style="--value: 2">2</li>
    <li style="--value: 2">2</li>
    <li style="--value: 4">4</li>
  </ol>
  <output></output> <!-- 1; the right variant returns 3 -->
</figure>
```

For a reusable number, replace `<output>` with `<div><span>...</span></div>`: its children get `--dcss-bisect-left` or `--dcss-bisect-right` (also `--dcss-bisect` for right), inherited by their descendants in the same frame. A missing or invalid key inside the search bounds sets `--dcss-err: 1`; a missing query sets 2, and the empty output prints nothing. Sorted numeric lists are required; callbacks, coercion and arbitrary array-like objects are not supported.

A query's presence is captured in a non-inherited flag before its value reaches descendants. Otherwise, an invalid query expression inside another computation inherits the parent's valid-query flag and incorrectly returns zero. `probes/dcss/discrete/inherited-check.mjs` checks 20 nested cases per engine: missing and unresolved queries, unknown values, both compiled scale lowerings and raw bisect readers. Chrome and WebKit pass; the other computation's result stays independent.

This shares the sorted-box geometry with `.arrays-sort` and the list/result reader with the reductions. Scalar comparisons give matching entries a one-pixel width; layout sums that prefix and one container read returns its count. It uses no runtime script or per-entry numeric readback. `probes/dcss/bisect-check.mjs` compares every recorded call it supports (25 left, 25 right), 1,030 seeded/boundary answers, native query/data changes, nesting and error flags in Chrome and WebKit.

### Numeric bisectors

`.dcss-bisector-left` and `.dcss-bisector-right` use the same figure/list/holder structure as bisect, with the query in the figure's own `--value`. A child of the holder receives `--dcss-bisector-left` or `--dcss-bisector-right`. Bind each boxed datum's numeric `value` to its item's `--value`; bind a boxed query's numeric `value` to the figure too. This represents the numeric boxed-value comparator/accessor behavior from d3's tests.

The list holds 0–64 integer keys within ±2^24. The query is finite. Optional integer `--lo`/`--hi` must satisfy `0 <= lo <= hi <= length`; the searched slice must be ascending. Bounds default to 0 and the list length. Invalid bounds or keys inside the search slice give error 1; missing/NaN query gives error 2. Either error suppresses the numeric result. New nested calls own their query and bounds; captured results survive descendant size containers.

`probes/dcss/bisector/check.mjs` proves 98/153 original calls in Chrome and WebKit. Its retained source recorder binds callbacks to exact raw arguments before projecting boxed values. It accepts an original call only when every matching source owner is supported; test and native source hashes guard that ownership record. Factories, center, sparse arrays, unsupported comparators and unordered search slices remain uncovered.

### Hierarchies

`.dcss-treemap-slice`, `.dcss-treemap-dice`, `.dcss-treemap-slice-dice` and `.dcss-partition`: a figure of the size the page gives it, holding a nested list, each leaf `<li>` saying its value as `--value`. Every `<li>` is laid out at its node's rectangle, as d3.treemap().tile(...) or d3.partition() places it over the figure, after hierarchy.sum(); draw on the `<li>`s. A partition keeps the top band for the root, as d3 does: wrap the list in one `<li>` to draw it.

```html
<figure class="dcss-partition" style="width: 640px; height: 240px">
  <ul>
    <li>Citrus <ul><li style="--value: 30">Orange</li> <li style="--value: 20">Lemon</li></ul></li>
    <li style="--value: 40">Apples</li>
  </ul>
</figure>
```

Slice, dice and partition sum the leaves themselves: a leaf is as long as its value, an inner node as long as its children together, and each line shrinks to fit in proportion. That takes a total from 64 to 2^31 px over the figure's width (2.2 million at 960 px; under 64 the layout is narrower than the figure). Slice-dice turns each level a quarter, where a node is as long as its longest child, not their sum: there every inner `<li>` says its subtree's sum as `--value` too. A box is within 2/64 px a level of d3's to totals of 50,000; near a million WebKit is 0.3 px off, Chrome 0.02. A line drifts with its length (WebKit 0.29 px at 1,000 siblings); a partition takes 12 levels. `probes/dcss/hierarchy.html` shows a treemap and a partition, changed by a checkbox.

### Axes

d3's axis, as a list: `.dcss-axis-bottom` (or `-top`, `-left`, `-right`) with d3.ticks's `--start`, `--stop` and `--count` (10 if not set), and an `<li>` a tick. It draws as d3.axisBottom(scaleLinear([start, stop])).ticks(count) does, at the list's width (left and right: its height), labels in d3's tickFormat. 16 `<li>`s hold any 10-tick axis; the `<li>`s past the last tick are hidden for up to 64 ticks.

```html
<ol class="dcss-axis-bottom" style="--start: 0; --stop: 87; --count: 10">
  <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
  <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
</ol>
```

Each `<li>` gets `--dcss-tick`, its value, and `--dcss-tick-at`, its place from 0 to 1; the list gets `--dcss-tick-step`, `--dcss-tick-increment` and `--dcss-tick-count`. `.dcss-ticks` is the same list without the drawing (a grid: `.grid > li { left: calc(var(--dcss-tick-at) * 100%) }`); `.dcss-nice` with the same three gets `--dcss-nice-start` and `--dcss-nice-stop`. Set the range on an ancestor to share it, in a rule when state changes it (`.chart:has(#zoom:checked) { --stop: 870 }`): an inline style beats any rule.

### Scales

`.dcss-scale-linear` on any element is d3.scaleLinear: `--domain-0`, `--domain-1`, `--range-0`, `--range-1` and `--value` in (set on it or inherited; `--clamp: 1` is d3's clamp), `--dcss-scale-linear` (the scale of `--value`) and `--dcss-scale-linear-invert` out, for the element and everything inside it. A call inside it reads the answer as its own input and keeps every digit:

```html
<div class="dcss-scale-linear" style="--domain-0: 0; --domain-1: 100; --range-0: 32; --range-1: 212; --value: 21">
  21 °C is <output class="dcss-format-fixed" style="--value: var(--dcss-scale-linear); --precision: 1"></output> °F   <!-- 69.8 -->
</div>
```

A polylinear scale takes up to 8 stops, `--domain-0` to `--domain-7` and `--range-0` to `--range-7`, with `--stops` (2 if not set); `--round: 1` is d3's rangeRound. `.dcss-scale-pow` (with `--exponent`, 1 if not set) and `.dcss-scale-sqrt` are d3.scalePow and scaleSqrt, the same inputs, answers `--dcss-scale-pow` and `--dcss-scale-sqrt` (and `-invert`). `.dcss-scale-log` is d3.scaleLog's map and invert, answers `--dcss-scale-log` and `-invert`; a negative domain works as in d3. Its ticks are `.dcss-ticks-log` and its nice `.dcss-nice-log`, each with `--start`, `--stop`, `--count` and `--base` (10 if not set). A label is a `.dcss-format-fixed` or `.dcss-format-si` with the class `.dcss-ticks-log-format` inside a `.dcss-ticks-log`. It prints only where d3's log tickFormat does, and `--trim: 1` is d3's `~`. A linear, pow or sqrt scale's ticks, nice and tickFormat are the calls above on its domain's two ends: `.dcss-ticks` with `--start` and `--stop`, and `.dcss-nice`. Its tickFormat is a `.dcss-format-fixed` whose `--precision` is the list's `--dcss-tick-precision` (d3's precisionFixed of the tick step; for `%`, 2 less).

It is checked against every question d3's own linear, pow, sqrt and log tests ask a scale, each with the scale's state (`probes/dcss/scale/scale-check.mjs`, `log-label/check.mjs`). Every one the CSS can take is answered exactly in Chrome and WebKit: linear 170 of 214, pow 147 of 187, sqrt 2 of 2, log 654 of 709 (ticks, nice and supported fixed, SI and general labels). Log's other 55 include functions for a specifier (28), invalid domains or inputs, nonnumeric ranges and a custom interpolator. The rest are ranges of colours or dates, inputs that aren't numbers, custom interpolators and tickFormat specifiers format doesn't print. Seeded: 3,000 linear scales (1,000 polylinear) exact in both, and 1,500 pow scales exact in WebKit, 1,499 in Chrome (one a last-bit difference in Chrome's pow()), and 1,485 log scales exact in both. Of 1,499 seeded log ticks, nice and labels, 1,481 are exact in both; 12 base-e tick sets and 6 nice are a last bit off, because the engines' `exp(-10)` is not V8's. `.dcss-nice` repeats d3's rounds 4 times: all of d3's calls settle within that; 2.4% of random ranges need more.

`.dcss-scale-band.dcss-scale-linear` on a `<figure>` is d3's bar chart: d3.scaleBand over the `<li>`s across and d3.scaleLinear([0, d3.max]) up, a bar an `<li>` with its `--value`. The figure's content box is the plot and its padding the margins (d3's `marginLeft` and so on); give it a width and a height. `--padding` (or `--padding-inner` and `--padding-outer`, the outer at least half the inner) and `--align` are d3's, 0, 0 and 0.5 if not set. Each bar is its `<li>`'s `::before`, steelblue unless the page colours it; the `<li>`'s text is its label, under the plot. The element after the list gets `--dcss-max`, for an axis:

```html
<figure class="dcss-scale-band dcss-scale-linear" style="--padding: 0.1; width: 600px; height: 340px; padding: 30px 0 30px 40px">
  <ul><li style="--value: 0.08167">A</li> <li style="--value: 0.01492">B</li> <li style="--value: 0.02782">C</li></ul>
  <div><ol class="dcss-axis-left" style="--start: 0; --stop: var(--dcss-max)"><li></li> <!-- 16 in all --></ol></div>
</figure>
```

Each bar is within 1/32 px of d3's in x, width, y and height, and the axis's ticks at d3's places (`probes/dcss/bar-check.mjs`, Chrome and WebKit). The max is read from layout as a logarithm: any value from 2^-64 to 2^64, to about 1/100,000 of itself (0.127019 for 0.12702). It is exact when it has 4 significant digits or fewer (10, 1000, 0.3), so a max that is a tick keeps it. `probes/dcss/bar.html` is d3's letter-frequency chart.

### Numeric color constructors

`.dcss-rgb`, `.dcss-hsl`, `.dcss-lab`, `.dcss-hcl`, `.dcss-lch` and `.dcss-gray` publish d3's raw numeric coordinates and opacity. These are constructor calls; string parsing, conversion between spaces and object methods remain unsupported.

```html
<span class="dcss-rgb" style="--r: 70; --g: 130; --b: 180">
  <span style="display: inline-block; width: 1em; height: 1em;
    background: rgb(var(--dcss-rgb-r) var(--dcss-rgb-g) var(--dcss-rgb-b)
                    / var(--dcss-rgb-opacity))"></span>
</span>
```

Inputs are the coordinate names (`--r`, `--g`, `--b`; `--h`, `--s`, `--l`; `--l`, `--a`, `--b`; or `--h`, `--c`, `--l`) and optional `--opacity`, default 1. Outputs prefix every field with `--dcss-<class>-`, such as `--dcss-hsl-s`. Lch publishes Hcl coordinates `h`, `c`, `l`; gray publishes Lab coordinates `l`, `a: 0`, `b: 0`. Each input is finite within ±2^24. Values are preserved without clamping, including opacity outside [0,1]. A complete call has ready 1/error 0; missing/non-numeric coordinates give ready 0/error 1, and valid sibling components remain available.

`probes/dcss/color/check.mjs` proves 103 original calls in Chrome and WebKit: rgb 30/67, hsl 40/94, lab 11/43, hcl 14/61, lch 4/6 and gray 4/4. It compares every coordinate and opacity, and checks native changes/reset, missing nested arguments and wrong-answer detection.

### Identity scale

`.dcss-scale-identity` publishes the finite query `--value` unchanged as both `--dcss-scale-identity` and `--dcss-scale-identity-invert`. Domain and range do not affect these numeric results, as in d3:

```html
<span class="dcss-scale-identity" style="--value: 12">
  <span style="display: inline-block; width: calc(var(--dcss-scale-identity) * 1px)"></span>
</span>
```

The child is 12px wide. A finite result has ready 1 and error 0; a missing/NaN query has ready 0 and error 1. Getters, ticks, tick formatting and string/object coercions are unsupported. `probes/dcss/scale-extra/check.mjs` compares 11/86 original calls exactly in Chrome and WebKit, with native changes/reset, missing values and reuse across an intervening size container. The other 75 calls remain uncovered. The proof checks d3's source behavior under different domains; finite identity results do not depend on the scale instance's configuration.

### Ease

Every easing d3-ease exports, as `.dcss-ease-<name>` on any element: `quad-in`, `quad-out`, `quad-in-out`, and the same for `cubic`, `poly`, `sin`, `exp`, `circle`, `bounce`, `back` and `elastic`, plus `linear`; the short names (`.dcss-ease-quad`, `.dcss-ease-bounce`, …) are d3's aliases. `--value` is t; the answer is `--dcss-ease-<name>`. d3's parameters are properties: `--exponent` (poly, 3), `--overshoot` (back, 1.70158), `--amplitude` and `--period` (elastic, 1 and 0.3).

```html
<span class="dcss-ease-cubic-in-out" style="--value: 0.25">
  <output class="dcss-format-fixed" style="--value: var(--dcss-ease-cubic-in-out); --precision: 4"></output>   <!-- 0.0625 -->
</span>
```

Every call d3-ease's own tests make (413) and every function on a grid of t with default and seeded parameters (5,665) is within 1e-12 of d3 in Chrome and WebKit; d3's tests ask 1e-6 (`probes/dcss/ease/ease-check.mjs`).

### Format

d3.format's types `f`, `%` and `s` on one element, an `<output>` most often: `.dcss-format-fixed`, `.dcss-format-percent` or `.dcss-format-si`, the number as `--value`, d3's specifier fields as numbers. It prints into its `::after` the text d3.format prints.

```html
<output class="dcss-format-fixed" style="--value: 1234.5; --precision: 2; --comma: 1"></output>   <!-- 1,234.50 -->
<output class="dcss-format-percent" style="--value: 0.234; --precision: 1"></output>             <!-- 23.4% -->
<output class="dcss-format-si" style="--value: 999.5; --precision: 3"></output>                   <!-- 1.00k -->
<output class="dcss-format-si" style="--value: 1234; --precision: 3; --trim: 1"></output>         <!-- 1.23k -->
```

| Field | d3 | Default |
|---|---|---|
| `--precision` | `.2` | 6; decimal places for f/%, significant digits for s |
| `--comma` | `,` | 0 |
| `--sign` | `+` (1), `-` (0) | 0 |
| `--symbol` | `$` (1) | 0 |
| `--trim` (SI) | `~` (1) | 0 |

Fixed and percent round as d3 does, by toFixed: the exact value of the number, ties up, so 4.35 at one decimal is 4.3 (4.35 is a hair under it). The minus is d3's U+2212, hidden when a negative rounds to zero unless `--sign: 1`. With `$` a percentage has no `%`, as in d3. The number, times 10 to the precision, must be under 2^53 (16 digits in all); past it nothing prints and `--dcss-err` is 1. `--value` can be another call's answer, `var(--dcss-scale-linear)`, and keeps every digit on the way (an unregistered property is carried as its calc() text). The recorder retains 142 finite calls from d3-format's tests for these specifiers; 139 are within the supported bounds and three have magnitudes outside them. `probes/dcss/format/format-check.mjs` compares the printed text with d3, including seeded values, decimal halfway cases and SI prefix boundaries. Before the SI extension, a fixed-format number cost 0.29 ms (Chrome) and 0.43 ms (WebKit) with 30 changing together (`probes/dcss/format/format-cost.mjs`). The earlier measurement on gamut.fyi's 30 numbers under a slider was 0.33 and 1.2 ms (a frame 45 to 55 ms, 112 to 147 ms, 2026-10-24).

SI chooses its prefix after rounding, so `.3s` changes 999.5 to `1.00k`. It uses the same digit printer and unround parts, with decimal-scaling error terms. Supported: 1–15 significant digits, zero or `1e-30 <= abs(value) < 1e31`. Below `1e-24`, d3 rounds a second time; the reduced precision must stay positive (`precision + floor(log10(abs(value))) + 24 > 0`). Beyond these limits it prints nothing and sets `--dcss-err: 1`. SI has no runtime script and does not invoke layout for this scalar arithmetic. Formatting prints text; the original number remains available to other CSS consumers. All 139 supported recorded calls, 1,567 seeded SI values, 944 prefix boundaries, 1,165 SI halfway cases and five rejected inputs pass in Chrome and WebKit. SI now compares the input with the exact decimal midpoint before the next decade to determine the exponent carry. It performs one full coefficient round, using d3's reduced precision below yocto. The four decimal-error table reads select integer pieces split at build time, stored in unround parts before the rounding calculations reuse them. A trace isolated repeated expansion of those table expressions as the main SI style cost. `probes/si-carry-check.mjs` checks that carry against d3-format's own decimal-parts helper at the midpoint and neighboring doubles, across all 15 supported precisions and decades -30 through 30: 5,364 cases per engine.

The same `probes/dcss/format/format-cost.mjs 30` workload was run against the two-round sheet, one-round sheet, and then the stored-table version, each in fresh contexts, with `--precision: 3`, five warmups and 25 measured updates. The first two columns are a paired run; the last is the subsequent measurement after storing the table reads. Median forced style/layout milliseconds per update of 30 outputs:

| Engine / input | Two rounds | One coefficient round | Stored table reads |
|---|---:|---:|---:|
| Chrome, ordinary values | 336.7 | 286.7 | 80.4 |
| WebKit, ordinary values | 616 | 527 | 129 |
| Chrome, prefix transitions | 343.4 | 281.8 | 81.8 |
| WebKit, prefix transitions | 611 | 530 | 127 |

Splitting the table constants into integer pieces at build time removes another runtime conversion. A paired format-only measurement (`probes/si-rom/cost.mjs`, 30 outputs, precision 3, five warmups and 25 measured updates) reduced the median from 78.5 to 63.9 ms in Chrome and from 126 to 106 ms in WebKit. The markup remains one `<output>`, and the generated sheet is 753,201 bytes. All 7,359 formatter cases still pass, each written as exact binary values and as decimal strings, in both engines; all 5,364 carry cases also pass.

The [font-table experiment](probes/si-rom/README.md) compares complete SI formatting through both font encodings with this arithmetic version. It keeps the font compiler optional and records exact reads, printed text, native controls, loading and reset behavior. Its readers stay outside a leaf `<output>`: WebKit removed readers nested inside an output when the form reset.

The earlier two-round measurement was 330.6 ms in Chrome and 609 ms in WebKit for ordinary values (one SI output: 10.7 and 20 ms). These are update-cost measurements, not frame-rate or initial-load measurements. SI remains too expensive for smooth continuous updates at 30 changing outputs.

### General number labels

`.dcss-format-general` prints d3's general-number format, with 12 significant digits and trailing zero removal by default. `--precision` accepts 1–15 significant digits, and `--trim: 0` retains zeros. Sign, currency and grouping use the same fields as fixed formatting.

```html
<output class="dcss-format-general" style="--value: 2.718281828459045"></output>
```

This prints `2.71828182846`. Only results that use ordinary decimal notation are supported: the rounded decimal exponent must be at least -6 and below the significant precision. Scientific notation is refused with error 1 and no text. Missing/NaN input gives ready 0/error 1; finite supported input gives ready 1/error 0. Nested calls own their value and readiness.

For log labels, combine this with `.dcss-ticks-log-format` under the existing `.dcss-ticks-log` parent. `probes/dcss/log-label/check.mjs` proves 106 additional original log-label calls, including base 2, base e, base 16 and sign-only formatting. These cases are disjoint from the retained fixed, percent and SI label proof. Unsupported calls stay in the denominator.

### One call, runtime and compiled branches

Comparisons, extrema, identity scale, numeric color constructors, bisectors, shares, general log labels, numeric ranges and fixed UTC intervals work with the same authored calls through `compileComposition`. Compilation retains the runtime kernels and emits their required CSS, input bindings, result addresses and status contracts. It preserves author nodes, controls and associations. Outputs remain leaves; ordinary containers can hold nested computations.

```js
import {compileComposition} from './pipeline/compile.mjs';
const page = compileComposition(authoredHTML, {css: authorCSS});
// Save page.html and page.css; page.contract describes the same calls and results.
```

Color channels have separate result bounds and readiness. Every share and total has its own item address. Collection inputs are checked where each datum is evaluated; a scalar on an item can supply that item's value. Collection kernels retain their own missing-value rules, including extrema skipping NaN.

`node probes/dcss/paired-check.mjs` runs the same 2,672 original d3 questions through both branches in Chrome and WebKit. Complete source-matched proofs are reused; changed inputs are checked again. The same checkers retain numeric-presence, native/reset, nested/container and wrong-answer guards. `compiler-paired/check.mjs` adds 25 share, field, flow and input-node states per branch and engine. Manifests remain JSON-serializable and identify actual emitted DOM locations.

The report shows compiler qualification beside runtime coverage. These are two branches of each feature; a question counts once. The paired result covers 61 exports and does not imply that every older runtime-only case has a compiler proof. General formatting also retains its 139 fixed/percent/SI and 210 precision/trim regression questions through compilation.

### Numeric ranges and UTC intervals

`.dcss-range` computes up to 64 values in authored list slots. Set `--start`, `--stop` and nonzero `--step`; all three use the signed 1/64 grid within ±1024. Each direct list item exposes `--dcss-range` and `--dcss-range-ready`; unused slots have readiness 0. Invalid inputs, more than 64 results or too few authored slots set error 1. The compiler preserves each item and its result address.

```html
<figure class="dcss-range" style="--start:0;--stop:5;--step:1">
  <ol><li></li><li></li><li></li><li></li><li></li></ol>
</figure>
```

For UTC arithmetic, use `.dcss-utc-day-floor` (or `ceil`, `round`, `offset`, `count`); `hour`, `minute` and `second` use the same suffixes. The result is `--dcss-utc-day`, `--dcss-utc-hour`, `--dcss-utc-minute` or `--dcss-utc-second`. Set numeric epoch milliseconds in `--value`; offsets also take `--step` (default 1), while counts take `--start` and `--stop`. Fractional epoch milliseconds truncate toward zero. Inputs and timestamp outputs stay within ±8×10¹² milliseconds; invalid or wider results set error 1 and hide the number. These calls compute fixed UTC intervals; date parsing, local calendar behavior and interval collections remain unsupported. `unixDay` shares the day arithmetic for these methods.

The same original questions pass directly and after compilation: range 41/76, utcDay 59/62, unixDay 59/62, utcHour 40/41 and utcMinute 18/19 and timeSecond 19/20. Exact grid boundaries, timestamp truncation and rounding, native reset, nested scopes, invalid inputs and composed result reuse are checked separately and add no coverage counts.

### UTC weekdays and Gregorian calendars

Week intervals use `.dcss-utc-sunday-floor` through `.dcss-utc-saturday-floor`, with `ceil`, `round`, `offset` and `count` suffixes too. Floors align to the named weekday, including before the Unix epoch. Results are `--dcss-utc-sunday` through `--dcss-utc-saturday`. Numeric input and timestamp results are bounded to ±8×10¹⁵ milliseconds; invalid or wider results set error 1. These calls answer all 155 original weekday questions through both branches.

Gregorian month and year intervals use `.dcss-utc-month-floor` and `.dcss-utc-year-floor`, with the same five suffixes. Results are `--dcss-utc-month` and `--dcss-utc-year`. Their CSS circuit derives the calendar from numeric epochs within ±8×10¹³ milliseconds, including year zero, first-century dates, leap years and century rules. Month/year offsets preserve the original day and time and overflow as Date setters do; they do not clamp to the destination month's last day. Midpoint ties round upward.

For year floor, ceil, round and offset, `--every` selects an integer period from 1 to 10,000 (default 1), aligned to year zero. Year counts require `--every:1`. Offsets accept steps within ±10,000 and round them down. Timestamp results outside the supported interval are errors. The compiler retains the same circuit and numeric addresses. Calendar calls pass 51/52 original month questions and 25/27 year questions; interval collections and date string parsing remain unsupported.

### Five-circle packing and numeric color objects

`.dcss-pack-five` takes five changing radii, `--r0` through `--r4`, each from 0.25 to 32. It computes d3's front-chain placement and enclosing-circle translation in CSS. The fifteen result addresses are `--dcss-pack-x0`, `--dcss-pack-y0`, `--dcss-pack-r0` through index 4, available at the call and its descendants. Coordinate comparisons use a 1e-6 tolerance. Invalid or missing radii hide the results with error 1. The compiler preserves the same circuit and record addresses.

```html
<div class="dcss-pack-five"
     style="--r0:10;--r1:14;--r2:22;--r3:8;--r4:2"></div>
```

This answers 200/203 original `packSiblings` questions through both branches. The other recorded calls use a larger collection or radii outside this five-circle boundary. Native radius changes, reset, fifteen extra tuples and coordinate reuse are checked separately.

Numeric object conversion uses `.dcss-convert-rgb`, `-hsl`, `-lab`, `-hcl` or `-lch`, together with a source class such as `.dcss-from-lab`. Set `--from` to 1 for RGB, 2 for HSL, 3 for Lab or 4 for Hcl. `--from-0`, `--from-1`, `--from-2` hold that source's constructor coordinates; `--from-opacity` defaults to 1. Result names are `--dcss-convert-<target>-<field>`. The source class and numeric tag must agree.

```html
<div class="dcss-convert-hcl dcss-from-lab"
     style="--from:3;--from-0:50;--from-1:4;--from-2:-5"></div>
```

Object copies and Lab/Hcl polar conversions accept finite coordinates within ±1024. RGB conversions take channels from 0 to 255; HSL conversion uses saturation and lightness from 0 to 1. Hue inputs remain within ±1024. The original constructor components and opacity are preserved by copies. Missing fields report errors while independent usable fields remain reusable; the compiler describes each field's status separately.

The additional original questions are RGB 5, HSL 5, Lab 6, Hcl 10 and Lch 1. Their exact identities are disjoint from the 103 direct-constructor questions. The coverage ledger merges those proof parts and rejects duplicate identities. Numeric presence, native reset, nesting, partial fields and field reuse pass through both branches; color-string parsing remains unsupported.

### Pacific intervals, numeric date text and Arabic numerals

`.dcss-local-day-{floor,ceil,round,offset,count}` and `.dcss-local-month-{floor,ceil,round,offset,count}` compute America/Los_Angeles dates under the US Pacific daylight-saving rule used from 2007 through 2037. This is an explicit timezone choice. Inputs and timestamp results use integer epoch milliseconds and must remain between 1167609600000 and 2145916800000 epoch milliseconds; a boundary operation whose result falls outside reports an error. Use `--value`, `--start`/`--stop` for count, and `--step` for offset (default 1, rounded down within ±240). Results are `--dcss-local-day` or `--dcss-local-month` on the call and descendants. Counts have separate integer bounds. Both branches answer 64/77 day and 62/64 month questions. Offset probes cover both transitions in each of the 31 years, including exact instants, spring gaps and autumn folds. Other zones, earlier historical rules, interval collections and configured periods remain unsupported.

The complete numeric date-parser family consumes text as `--length` and `--c0` onward, each a live ASCII character code. It accepts at most 24 raw ASCII characters and 38 fixed English d3 format configurations. CSS validates the complete vector and computes the timestamp; it does not delegate parsing to script. Civil dates are bounded to years 100 through 9999; integer epoch inputs and outputs are bounded to years −9999 through 19999. Local calls use the explicit `America/Los_Angeles` rule. Other locales and arbitrary format configurations are unsupported.

```html
<!-- The complete text "432", parsed as UTC milliseconds on 1900-01-01. -->
<div class="dcss-date-parse-23"
     style="--length:3;--c0:52;--c1:51;--c2:50"></div>
```

`dateParseClass(format, local)` in `date-parse-family.mjs` selects the class from `DATE_PARSE_SPECS`; the default is UTC, and passing `true` for `local` selects Pacific time. The reusable output is `--dcss-date-parse`; missing, fractional or invalid character codes hide it with error 1. `date-parse-family/check.mjs` retains all 192 original UTC/local identities across all 226 source factory contexts in both branches. It also checks native null states, mutation/reset, domain refusal and downstream numeric reuse. Browser-local timezones are unsupported.

`.dcss-format-locale.dcss-locale-arabic` prints Arabic digits, decimal and grouping separators using the shared decimal arithmetic. The qualified specifier is `$,.2f`; set `--value` and use `data-dcss-locale-prefix`/`data-dcss-locale-suffix` for the static currency affixes. The compiler preserves this configuration and the two-digit default. Invalid inputs and scaled magnitudes beyond the shared formatter's limit report errors. Twenty-two original locale contexts pass in both branches; they contribute only two frozen `[call,args]` identities to the broad report because the recorder omits factory context. Arbitrary locales and grouping patterns remain unsupported.

### Calendar fields, color text and identity ticks

`.dcss-parse-calendar-*` adds fixed-width ISO weeks, Sunday/Monday weeks and quarters to the complete ASCII-vector parser. It uses the same `--length`, `--c0` onward and reusable `--dcss-date-parse` output. UTC ISO forms accept input years 1900–2099. The local forms explicitly use America/Los_Angeles rules for input years 1990–2037, including the pre-2007 last-Sunday-in-October boundary. Week/day fields are one or two digits as the format requires; ISO weeks are 1–53, quarters 1–4, and the explicit one-digit quarter-month field is 1–9. Named fields, arbitrary whitespace and older local history remain unsupported. The additional source-owned identities are UTC 21 and local 42; earlier parser results remain separate proof parts.

The qualified UTC classes are `isoWYear`, `isoYear` and `isoYear2` after the `.dcss-parse-calendar-` prefix. Local classes are `localIsoWYear`, `localIsoWYear2`, `localIsoYear2`, `weekSunday`, `weekSundayDefault`, `weekMonday`, `weekMondayDefault`, `quarter` and `quarterMonth`. They correspond to the recorded numeric ISO/week/year and year/quarter formats. The same character input changes and reset recompute both runtime and compiled results.

`.dcss-parse-color-complete` reads a complete 0–64-character ASCII vector in `--length` and `--c0` onward. It accepts CSS names, hex and legacy RGB/RGBA/HSL/HSLA. It publishes `--dcss-color-kind` and the reusable channel fields; native null and NaN fields remain absent rather than becoming zeros. Fractional, missing or out-of-range character codes report errors.

For constructors, add `.dcss-color-input` with `.dcss-rgb`, `-hsl`, `-lab`, `-hcl`, `-lch` or `-gray`. Set `--arg-count`, then each argument's `--arg-N-type` and `--arg-N-value`; numeric strings instead use `--arg-N-length` and `--arg-N-char-M`. Argument indices start at zero. Type codes are 1 for numbers, 2 for null, 3 for undefined, 4 for NaN and 5 for ASCII numeric strings. Use `.dcss-color-coerce-*` to turn parser fields into a named constructor, or `.dcss-convert-*` for an existing numeric object. `.dcss-convert-cubehelix` takes `--r`, `--g`, `--b` (0–255) and `--opacity`.

RGB conversion to HSL, Lab, Hcl or Lch is qualified for channels 0–255. Direct RGB and HSL copies retain their parsed component bounds; arbitrary out-of-gamut conversion is unsupported.

The source-owned renderer carries all 351 original constructor calls in four bounded profiles: typed arguments, numeric strings, complete CSS color text and object conversion. Numeric strings are at most 16 characters with a five-digit mantissa and exponent magnitude at most 9; raw numeric coordinates are within ±1024. These calls expose components only: formatting and methods are not part of this API. Before the family split, the complete generated stylesheet was 53,262,190 bytes, or 1,783,886 bytes at gzip level 9; before this family expansion it was 15,203,845 and 659,099 bytes respectively. These sizes do not measure update speed or a single compiled page.

`.dcss-identity-ticks` uses live `--start`, `--stop` and `--source-count` (default 10); `--identity-count` can override the count. Endpoints stay within ±1024, their span is 0.001–2048, and the count is an integer 1–256. Author up to 512 direct `<li>` output slots for a tick array. `--dcss-tick-count` gives the complete length; each active item exposes `--dcss-tick`, with a 1e-6 numeric comparison bound. Too few slots report an error; inactive items hide their numeric result.

For default tick labels, put an `<output class="dcss-format-fixed dcss-identity-tick-format">` inside the identity host and bind `--value` to the value to format. The host computes `--dcss-tick-precision`; the marker supplies that precision and default grouping. Labels follow changes to domain/count and errors from their input host. A host without `<li>` slots is a valid precision/count producer. Compiler records identify every item, its readiness/error scope, and separate integer count/precision summary fields. The 62 additional identity questions comprise 11 complete tick arrays and 51 rendered labels; earlier 11 finite mapping questions remain separate.

### Variance and deviation

`.dcss-variance` and `.dcss-deviation` take up to 16 source-owned raw values and the recorded accessor recipes. They compute the sample variance (dividing by n − 1) and its square root with CSS Welford state. With fewer than two valid observations, their result is absent, matching native `undefined`; inputs are not clamped. Nonfinite intermediate arithmetic reports an error. `--dcss-variance` and `--dcss-deviation` remain reusable by descendants. `variance-family/check.mjs` retains all 59 source calls (30 variance, 29 deviation) through both branches, including value/index/array and undefined-context accessor recipes, with a 1e-9 numeric tolerance.

Set `--length` and each zero-based `--type-N`/`--value-N`. Type codes are 0 number, 1 null, 2 undefined, 3 NaN, 4 string and 5 object. `--accessor` defaults to 0 (identity); 1 reads `.value` through `--field-type-N`/`--field-value-N`, 2 uses the one-based index, and 3 returns undefined. Identity and field access accept only numeric or nullish values; arbitrary string conversion and callback code are unsupported.

### Typed aggregates

`families/aggregate.css` supplies `.dcss-aggregate-sum`, `.dcss-aggregate-count`, `.dcss-aggregate-mean`, `.dcss-aggregate-cumsum`, `.dcss-fsum` and `.dcss-fcumsum`. They take raw typed values on the call element and expose `--dcss-<operation>` to descendants in both runtime and compiler delivery. Existing list-based `.dcss-sum`, `.dcss-count`, `.dcss-mean` and `.dcss-cumsum` retain their layout contracts.

`--dcss-input-length` is an integer 0–20; `--dcss-accessor` is an integer 0–4. Each `--dcss-input-N-type` and field type is an integer 0–5: 0 number, 1 null, 2 undefined, 3 NaN, 4 string and 5 object. Numeric types require an actual finite `--dcss-input-N-value` (or field value) within ±Number.MAX_VALUE/64. There is no caller-supplied presence flag. Accessor 0 uses the datum, 1 reads `.value`, 2 returns the one-based index, 3 returns undefined, and 4 uses the recorded count accessor's numeric field. Arbitrary callback code is unsupported.

Strings use length 1–4 and ASCII character codes 0–127. Numeric strings are one or two unsigned digits, optionally preceded by one space. Strings with a character outside the possible numeric spelling are skipped; other unsupported number-shaped strings, including scientific and radix notation, are refused. Missing, fractional, malformed or overflowing transport sets `--dcss-err: 1`. A valid empty mean has no value while its call remains ready without an error.

Cumulative calls require one direct `<ol class="arrays-aggregate-results">` with one `<li>` for each literal input slot. Each item exposes its own `--dcss-cumsum` or `--dcss-fcumsum` to descendants. Exact sums retain binary64 residuals and tie correction; the typed circuit is arithmetic and remains performance-unqualified until measured against an eligible alternative.

### Typed order statistics

`families/order.css` supplies `.dcss-order-median`, `.dcss-order-quantile`, `.dcss-order-quantile-sorted`, `.dcss-order-median-index`, `.dcss-order-quantile-index` and `.dcss-order-mode`. Runtime and compiler use the same typed circuit. Existing list-based median and quantile calls retain their layout implementations.

Set `--length` to an integer 0–16 (0–8 for index operations). Each zero-based slot has `--type-N`: 0 finite number, 1 null, 2 undefined, 3 NaN, 4 ASCII string or 5 object. Numbers require `--value-N`; strings use `--length-N` and `--char-xNxJ` character codes. Strings have at most 16 characters; numeric coercion supports unsigned digits. Accessor 0 reads the datum, 1 reads `.value` using `--field-type-N` and `--field-value-N`, 2 returns the one-based index, and 3 returns undefined. Arbitrary callbacks are unsupported.

Quantile calls require a raw `--order-p-type`: 0 finite number supplied as `--order-p-number`, 1 null, 2 undefined, 3 NaN, or 4 a nonnumeric ASCII string of 1–4 characters supplied with `--order-p-length` and `--order-p-char-J`. Null computes probability zero and ignores any numeric payload. Number-shaped strings are refused. Median and mode ignore probability inputs; nested calls root their own inputs. Missing, malformed, fractional metadata and out-of-capacity vectors report `--dcss-err:1`.

Results are `--dcss-order-<operation>` with hyphenated names; mode publishes `--dcss-order-mode-value`, `--dcss-order-type`, string length and character fields. `--dcss-ready` describes input validity, while `--dcss-order-present` describes result availability. Valid empty index calls return the present sentinel −1. Valid empty value calls have no result. Compiler records preserve these separate statuses for descendant consumers. This arithmetic implementation is correct only within its declared contract and remains performance-unqualified.

### Typed extrema and comparison

`families/extrema.css` supplies `min`, `max`, `extent`, `minIndex`, `maxIndex`,
`least`, `greatest`, `leastIndex`, `greatestIndex`, `scan`, `ascending` and
`descending` under `.dcss-extrema-<name>`. The same calls work directly and through
`compileComposition`. All 385 recorded identities, including 389 source contexts,
are checked in both branches in Chrome and WebKit.

```html
<link rel="stylesheet" href="dcss-array.css">
<link rel="stylesheet" href="families/extrema.css">
<figure class="dcss-extrema-min"
  style="--extrema-size:2; --extrema-0-type:0; --extrema-0-number:5;
         --extrema-1-type:0; --extrema-1-number:2">
  <div style="width:calc(var(--dcss-extrema-number) * 10px)"></div>
</figure>
```

The input has 0–10 slots. A slot's `--extrema-i-type` is 0 for a finite number,
1 for ASCII text, 2 for null, 3 for undefined, 4 for NaN, or 5 for an object.
Numbers use `--extrema-i-number`; text uses `--extrema-i-length` and `-c0`, `-c1`,
`-c2`, with at most three ASCII characters. Two strings compare lexically; mixed
string/number comparisons cover empty text and unsigned strings of up to three
decimal digits; other numeric spellings are outside this contract. Numeric data is transported in exact
binary limbs rather than rounded registered numbers.

`--extrema-mode` selects the source-owned recipe: 0 natural order, 1 `.value`,
2 callback index plus one, 3 undefined context, 4 identity, 5 `.name`, 6 `.v`,
7 numeric subtraction, or 8 subtraction of `.value` fields. `--extrema-direction:1`
reverses the least/greatest comparator. Scalar comparison uses two slots.
The selected object's comparison field uses `--extrema-i-field-*`; its preserved
`name`, `value`, `v` and `index` payloads use `--extrema-i-object-<key>-*` with the
same typed encoding. Absent object fields are explicitly type 3. Arbitrary
callbacks, locale-sensitive name comparison beyond lowercase ASCII, signed-zero
identity, longer strings and larger vectors are unsupported.

Results expose `--dcss-extrema-type`, `-number`, `-length`, `-c0` through `-c2`,
and `-index`. Object results also retain `-object-<key>-*`; extent supplies
`-min-*` and `-max-*`. `--dcss-ready:1; --dcss-err:0` means the call is valid.
`--dcss-extrema-field-ready:0` retains native undefined/NaN without making it an
input error. Read type and payload only when field-ready is 1: absence means NaN
for scalar comparisons and undefined for value or scan results. Numeric fields are absent for nonnumeric results; the compiler
keeps their individual readiness. Missing inputs and malformed bounds report an
error. Tests include exact large/subnormal/decimal values, nested missing inputs,
a native checkbox, form reset and a descendant using the actual result.

### Seeded LCG sequences and further Pacific intervals

`.dcss-random-lcg` takes a finite `--seed` from 0 inclusive to 1 exclusive. A direct `<ol>` or `<ul>` contains 1–199 authored `<li>` sample slots. Slot 1 is the first draw; slot 2 is the second, and so on. CSS evaluates d3-random 3.0.1's 32-bit LCG from the live seed using universal affine jump coefficients. JavaScript emits the coefficients independently of seed values. The sequence is addressed by authored position; automatic state advancement, unseeded draws and integer seed coercion are outside this contract.

Each slot exposes `--dcss-random-lcg`, plus exact integer `--dcss-random-lcg-low` and `--dcss-random-lcg-high` fields from 0 through 65535. Together the limbs encode the complete 32-bit state. The fractional value has an absolute error bound of 1/4294967296. Invalid or missing seeds and more than 199 slots hide numeric results and set error status. Compilation preserves each slot and field address, field precision, and downstream reuse. `probes/dcss/lcg-wave/check.mjs` verifies all 200 frozen original questions across 311 exact source-owned invocations, including all 112 contexts sharing one recorder key. Both limbs are checked exactly; the fraction is compared before numeric registration. Seed changes/reset, missing nested seeds, capacity, field reuse and wrong-output detection pass in both branches and both engines.

`.dcss-local-hour-{floor,ceil,round,offset}` and `.dcss-local-minute-{floor,ceil,round,offset}` use the existing explicit Pacific 2007–2037 epoch bounds. Input is `--value`; offset also takes `--step` (default 1, rounded down within ±10000). Their hour and minute boundaries coincide with UTC boundaries in this timezone, including both DST transitions; offsets are elapsed time. Results are `--dcss-local-hour` and `--dcss-local-minute`. Both branches answer 40/41 hour and 18/19 minute originals. Configured collections and count remain unsupported.

`.dcss-local-{sunday,monday,tuesday,wednesday,thursday,friday,saturday}-{floor,ceil,round,offset,count}` supplies all five scalar weekday operations. Input is an integer epoch in `--value`; offset adds `--step`, rounded down within ±1000. Count takes `--start` and `--stop`. Results use `--dcss-local-sunday` and the corresponding weekday names.

These weekday calls use captured IANA America/Los_Angeles transitions, including historical second offsets, followed by the file's recurring Pacific rules after 2037. Input and timestamp output must fit years −9999 through 19999. Spring gaps choose the forward instant; autumn folds choose the earlier instant. The complete frozen weekday family has 155 questions. The checks retain 371 independent historical, DST, negative-year and future states alongside the original floor boundary tests.

### English date formatting

`dateFormatClass(specifier, local)` from `date-format.mjs` chooses one of 41 static English formats; unsupported configurations are refused. The generated `.dcss-date-format-*` and `.dcss-local-date-format-*` classes print from live `--value` epoch milliseconds. Local formatting uses the same explicit Pacific timezone data. These are static format configurations; JavaScript does not compute their data outputs.

The formatter includes names, padding, ISO weeks/years, epoch milliseconds/seconds, and timezone offsets. Its numeric fields, including `--dcss-date-year`, remain reusable by descendants. Integer epochs must fit years −9999 through 19999; invalid inputs hide text and publish an error. `date-format-wave/check.mjs` checks all 107 frozen questions in every one of their 276 source-owned contexts, including changing input/reset and actual numeric-field reuse. Other locales and arbitrary format configurations remain unsupported.

### Geographic points and getters

The `.dcss-geo-*` calls cover Identity, Equirectangular, Rotation, Stereographic, Mercator, Transverse Mercator and Distance. Point calls take `--x` and `--y`; `-invert` selects the inverse. Projection settings include scale, translation, reflection, angle, center and rotation. Outputs are `--dcss-geo-x` and `--dcss-geo-y`; distance returns `--dcss-geo-distance` in radians.

Point inputs/results fit ±1e6; scale fits .001 through 10000. Configured scalar getters use `-config` and allow scale/translation through 1e12. Mercator `-extent` calls expose clipping-rectangle metadata: kind 0 means null with absent corners, kind 1 means four reusable corner fields. This does not clip geographic shapes. Polygon/line streams and shape fitting remain unsupported. `geo-point/check.mjs` checks all 93 frozen questions across 299 source contexts, with numeric presence/status, native changes/reset, nested missing inputs and downstream reuse.

The Mercator `-fit-extent` classes compute scale and translation from 1–64 raw MultiPoint coordinates and four target rectangle corners. Set `--length`, `--longitude-1`/`--latitude-1` through the active slots, and `--extent-x0`/`--extent-y0`/`--extent-x1`/`--extent-y1`. Projection settings remain live. Outputs use the same scale/x/y fields; prepared native fit answers are never inputs.

Fitting is qualified for finite, unclipped points and positive target dimensions. Recorded fit outputs use an explicit 0.001 absolute tolerance; the largest measured difference is 0.000469 at multi-million values. Ordinary points retain 1e-6 and distance retains 1e-12. Missing active slots, excess capacity and nonfinite projected results publish errors. Inactive authored points are ignored, and the 64th active point participates in the bounds.

### Legacy color function strings

`.dcss-parse-color-function` reads a complete live vector of 1–64 ASCII codes in `--length` and `--c0` through `--c63`. It parses legacy comma-form RGB/RGBA and HSL/HSLA in CSS, including signed integers, decimal/exponent percentages, alpha and outer whitespace. Numeric tokens have a five-digit mantissa, at most five fractional digits and exponent magnitude at most 9. Source RGB components and alpha have magnitude at most 1024.

`--dcss-color-kind` is 0 for a native null result, 1 for RGB and 2 for HSL. HSL fields are `--dcss-color-h`, `--dcss-color-s` and `--dcss-color-l`. The RGB conversion fields are `--dcss-color-r`, `--dcss-color-g`, `--dcss-color-b` and `--dcss-color-opacity`, each with compiler readiness/error addresses. Nonpositive alpha preserves opacity and makes RGB fields absent, matching native NaNs. Missing characters, invalid codes and values outside these numeric bounds publish an error. Qualified malformed RGB syntax returns kind 0 with successful parser status.

`color-function-wave/check.mjs` checks the complete 53-question recorded RGB/RGBA string family across color, rgb, hsl, lab and hcl recipes, including null and transparent records. Constructor recipes consume actual parsed fields. Newer space-separated color syntax remains unsupported.

[The coverage report](coverage/d3.html) retains unsupported recorded d3 calls in its broad denominator. The current total is 4,417/7,049 recorded calls (62.7%). The complete recorded extrema family adds 227 previously unsupported calls; all 385 of its original identities pass in runtime and compiler. The earlier color, date-parser and variance/deviation qualifications remain intact; older runtime-only results remain separate. Seeded tests and composed operations such as shares do not raise those scores.

The easing check's 413/413 finite numeric cases use a different case set from the broad recorder, which also includes coercion and configured functions. `coverage/d3-accounting-check.mjs` verifies exact retained input/configuration/answer identities: 317 of 415 broad easing calls transfer from the saved proof, while 98 remain unreconciled. The qualified 413/413 numeric result is shown separately for each engine. This corrects the previous count-based estimate of 377/415; no saved browser results changed, and unreconciled calls are not reported as wrong answers.

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

#### d3's axis and d3-array's ticks, tickIncrement, tickStep and nice: a range's ticks as d3 picks them, drawn and labelled as d3.axisBottom draws them

`.dcss-axis-bottom` (`-top`, `-left`, `-right`) or `.dcss-ticks` (not drawn) with `--start`, `--stop`, `--count`, an `<li>` a tick: each `<li>` gets `--dcss-tick` and `--dcss-tick-at`, the list `--dcss-tick-step`, `--dcss-tick-increment`, `--dcss-tick-count`. `.dcss-nice` with the same three gets `--dcss-nice-start` and `--dcss-nice-stop`.

Same frame: yes: calc(), no layout. Equal to d3's answer on all 254 calls d3-array's tests make with finite numbers (`d3-check.mjs`); places within 1/32 px of d3's axis and labels the same pixels as d3's text (`probes/axis/check.mjs`). Cost: Chrome 0.42 ms a .dcss-ticks of 16, 1.17 a drawn axis, 0.84 a .dcss-nice, WebKit 0.74, 1.62 and 1.51 ms.

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

These run on dcss-store.css's stored cells (`[data-store]`), read by `[data-store-read]` and `[data-store-read-3]` readers that name the cells by `--store-of`.

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
- `sheets/`: a loan, a gradebook, an invoice and a plate, as spreadsheets on dcss-store.css.
- `ports/`: Observable Plot's test plots drawn on dcss-array.css, each over Plot's own snapshot.
- `coverage/coverage.html`: the Array API standard's functions in CSS, checked against NumPy.
- `chain-rows.html`: a for loop laid out as table rows, the board inlined.

## Build

- `node libraries/arrays/build.mjs` writes `dcss-array.css`, `families/*.css`, `families.json`, `dcss-array-all.css`, `arrays-preload.html` and this file's primitives (from `primitives.mjs`). It refuses a property registered twice with different types.
- `node libraries/arrays/check.mjs` checks every primitive frame by frame against a model over 60 frames, the numbers moving, in Chrome and WebKit (`ENGINES=Firefox` runs Firefox). `CHECKS=61,62` runs only those checks; `MUTATE=1` lists the reads whose model barely moves.
- `node libraries/arrays/quirks/run.mjs` runs QUIRKS.md's reftests in the three engines. `node libraries/arrays/sheets/check.mjs loan`, `node libraries/arrays/pipeline/check.mjs` and `node libraries/arrays/probes/compile-check.mjs` check the sheets, the compiled programs and `formula.mjs`.
- `node libraries/arrays/probes/engines.mjs &` keeps one headless Chrome and one WebKit running for the checks to connect to; `node libraries/arrays/probes/engines.mjs stop` ends them.
- `node libraries/arrays/probes/shrink.mjs <seed> <formula> [engine]` finds the smallest case behind a compile-check miss; `node libraries/arrays/probes/shoot.mjs 26,27` screenshots demo.html's cards into `out/shots/`.
- `node libraries/arrays/lut.mjs --dump` decodes the embedded fonts; `node libraries/arrays/lut.mjs <name> '<f of k>'` prints the `@font-face` of another table.
- `formula.mjs`: `compile(f)` takes `{c: 12}`, `{css: 'var(--x)', v}`, `{array: [leaves]}`, `{op: 'add' | 'max' | 'min' | 'sub' | 'absdiff', of: [a, b]}`, `{op: 'scale', k, of: [a]}` and `{op: 'apply', css: 'min($v, 40)', js: (v) => Math.min(v, 40), of: [a]}`, and returns `{html, stages, hops, result}`, the result in `#out`.


The standalone entry and the pipeline share the planner in `pipeline/formula-cover.mjs`. The pipeline's
`.mean()` and `.extent()` are compound formulas: the planner chooses their boxes, arithmetic and readers.
`{array: [leaves], agg: 'max'}` gives a nonnegative maximum; without `agg`, an array gives its sum.

```js
items(40, { score: [0, 1001] }).mean('score').compile({ form: 'auto' });
items(40, { score: [0, 1001] }).extent('score').compile({ form: 'sheet' });
```

`auto` still compares layout with calc(). Supported whole-number recipes use the shared cover in the layout forms.
Older recipes, ROM maps, fractional inputs, reused aggregates, unsupported expressions and values beyond its precision budget keep
their existing implementation. `node libraries/arrays/pipeline/formula-check.mjs` checks both entry paths and these
bounds in Chrome, WebKit and Firefox.

For the corpus's 40-row score examples, CSS plus HTML in the inline form changed as follows. These are output sizes,
not execution times; `auto` selected calc() for both examples and its output stayed identical.

| Example | Before | After | Layout readers before / after |
|---|---:|---:|---:|
| Mean | 5,611 bytes | 5,596 bytes | 2 / 1 |
| Extent | 5,748 bytes | 7,944 bytes | 2 / 2 |

## License

MIT, see the repository's LICENSE. The pages in `ports/` draw Observable Plot's test plots: `LICENSE-THIRD-PARTY` has Plot's ISC notice.

## Credits

The ports draw [Observable Plot](https://github.com/observablehq/plot)'s test plots and compare against its snapshots. The coverage follows the [Array API Standard](https://data-apis.org/array-api/) 2025.12 and checks against [NumPy](https://numpy.org).
