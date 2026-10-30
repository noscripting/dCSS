# dcss.css: tutorial

You build a sales summary for six months: a table of the months, their total and monthly average written as formulas, the average in a sentence and as a bar, and a switch between years that updates every number.

## Before you start

You need Chrome or Safari, Node.js, and from this folder `dcss.css`, the `families` folder and `mathml.mjs`, with a new file, `sales.html`, saved next to them. After each step, build the page and open `built.html`:

```sh
node mathml.mjs sales.html built.html
```

With `--watch` at the end, it builds again each time you save `sales.html`. The build works out the stylesheet's part once. The built page has no script: the browser does the arithmetic again each time a number changes. An answer the build can work out from numbers written in the page, in a format the page writes too, is written as text, so it shows with no CSS, in a feed and when copied; one that reads a number the page sets in CSS is printed by CSS.

## 1. The months as a table

The months are an ordinary table. `data-dcss-series="sales"` names its rows a series, and each row marks its number's cell with `data-dcss-value`. A cell that says `var(--jan)` takes its number from `--jan`, which the page sets in CSS, and the build makes the cell print it. `data-dcss-count="months"` names the number of rows, which step 2 uses.

`data-dcss-scope` marks the section where the numbers and the formulas live. Everything the formulas work out is read inside it.

```html
<!doctype html>
<meta charset="utf-8">
<title>Sales</title>
<link rel="stylesheet" href="dcss.css">
<style>
  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; }
  .sales { --jan: 120; --feb: 95; --mar: 140; --apr: 80; --may: 160; --jun: 110; }
</style>

<section class="sales" data-dcss-scope>
  <table data-dcss-series="sales" data-dcss-count="months">
    <thead><tr><th>Month</th><th>Sales</th></tr></thead>
    <tbody>
      <tr><th>January</th><td data-dcss-value="var(--jan)"></td></tr>
      <tr><th>February</th><td data-dcss-value="var(--feb)"></td></tr>
      <tr><th>March</th><td data-dcss-value="var(--mar)"></td></tr>
      <tr><th>April</th><td data-dcss-value="var(--apr)"></td></tr>
      <tr><th>May</th><td data-dcss-value="var(--may)"></td></tr>
      <tr><th>June</th><td data-dcss-value="var(--jun)"></td></tr>
    </tbody>
  </table>
</section>
```

You see the table with the six months and their numbers.

## 2. Total and average

A formula is Content MathML, the markup MathML uses for meaning. `<eq/>` with a name alone on its left defines that name. The total adds `sales_i`, month *i*, for *i* from 1 to `months`. The average is `<mean/>` of the series. The build draws each formula and prints its answer after it; `dcss-format-fixed` with `--precision` sets the decimals. Add both after the table, inside the section:

```html
  <math class="dcss-format-fixed" style="--precision: 0">
    <apply><eq/><ci>total</ci>
      <apply><sum/><bvar><ci>i</ci></bvar><lowlimit><cn>1</cn></lowlimit><uplimit><ci>months</ci></uplimit>
        <apply><csymbol cd="ambiguous">subscript</csymbol><ci>sales</ci><ci>i</ci></apply>
      </apply>
    </apply>
  </math>
  <math class="dcss-format-fixed" style="--precision: 1">
    <apply><eq/><ci>average</ci><apply><mean/><ci>sales</ci></apply></apply>
  </math>
```

You see total = 705 and average = 117.5, each beside its formula.

## 3. The average in a sentence and a bar

A named answer can be shown anywhere in the section. An empty `<output data-dcss-result="average">` prints it (a dash while there is no answer; words you write inside it, such as `not yet`, show instead, and with no CSS), and your own CSS reads it as `var(--average)`, here a bar's width; `--average-ready` is 1 while there is an answer and 0 when there is none. Add a rule to the `<style>`:

```css
  .bar { height: 12px; width: calc(var(--average) * 2px); background: teal; }
```

And these after the formulas:

```html
  <p>The monthly average is <output class="dcss-format-fixed" style="--precision: 1" data-dcss-result="average"></output>.</p>
  <div class="bar"></div>
```

You see "The monthly average is 117.5." and a bar 235 pixels wide.

## 4. Switch the year

The numbers are custom properties, so a selector can change them. Radio buttons in a form, a `:has()` rule per year, and a reset button that brings back the first year: every number follows, the table's cells included.

2027 has only January and February so far. Setting the other months to `initial` leaves them empty. The average skips a missing month, as d3's mean does. The total names every month by its number, so it has no answer while one is missing, and an element marked `data-dcss-error="total"` shows in its place. Here is the whole page:

```html
<!doctype html>
<meta charset="utf-8">
<title>Sales</title>
<link rel="stylesheet" href="dcss.css">
<style>
  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; }
  .sales { --jan: 120; --feb: 95; --mar: 140; --apr: 80; --may: 160; --jun: 110; }
  .sales:has(#y2026:checked) { --jan: 130; --feb: 145; --mar: 90; --apr: 175; --may: 160; --jun: 120; }
  .sales:has(#y2027:checked) { --jan: 150; --feb: 135; --mar: initial; --apr: initial; --may: initial; --jun: initial; }
  .bar { height: 12px; width: calc(var(--average) * 2px); background: teal; }
</style>

<form class="sales" data-dcss-scope>
  <p>
    <label><input type="radio" name="year" id="y2025" checked> 2025</label>
    <label><input type="radio" name="year" id="y2026"> 2026</label>
    <label><input type="radio" name="year" id="y2027"> 2027</label>
    <input type="reset" value="Back to 2025">
  </p>
  <table data-dcss-series="sales" data-dcss-count="months">
    <thead><tr><th>Month</th><th>Sales</th></tr></thead>
    <tbody>
      <tr><th>January</th><td data-dcss-value="var(--jan)"></td></tr>
      <tr><th>February</th><td data-dcss-value="var(--feb)"></td></tr>
      <tr><th>March</th><td data-dcss-value="var(--mar)"></td></tr>
      <tr><th>April</th><td data-dcss-value="var(--apr)"></td></tr>
      <tr><th>May</th><td data-dcss-value="var(--may)"></td></tr>
      <tr><th>June</th><td data-dcss-value="var(--jun)"></td></tr>
    </tbody>
  </table>
  <math class="dcss-format-fixed" style="--precision: 0">
    <apply><eq/><ci>total</ci>
      <apply><sum/><bvar><ci>i</ci></bvar><lowlimit><cn>1</cn></lowlimit><uplimit><ci>months</ci></uplimit>
        <apply><csymbol cd="ambiguous">subscript</csymbol><ci>sales</ci><ci>i</ci></apply>
      </apply>
    </apply>
  </math>
  <p data-dcss-error="total">The total waits for every month.</p>
  <math class="dcss-format-fixed" style="--precision: 1">
    <apply><eq/><ci>average</ci><apply><mean/><ci>sales</ci></apply></apply>
  </math>
  <p>The monthly average is <output class="dcss-format-fixed" style="--precision: 1" data-dcss-result="average"></output>.</p>
  <div class="bar"></div>
</form>
```

Pick 2026 and the page shows total = 820 and an average of 136.7. Pick 2027: the table shows two months, the average is 142.5, and "The total waits for every month." takes the total's place. The reset button brings back 2025.

A total of the months there are, as d3's `sum` adds, is d3's own symbol applied to the series: `<apply><csymbol definitionURL="https://d3js.org/d3-array/summarize#sum">sum</csymbol><ci>sales</ci></apply>`, 285 for 2027. With `#count` in place of `#sum` it counts them, 2; `#variance` and `#deviation` give d3's variance and standard deviation, `#quantile` with a `<cn>` after the series, `<cn>0.9</cn>`, its 90th percentile, and `#mode` the value it holds most often. A total that skips months should say so beside it: with those two formulas named `sold` and `known`, `<output data-dcss-result="sold"></output> across <output data-dcss-result="known"></output> of <output data-dcss-result="months"></output> months` reads "285 across 2 of 6 months", `months` being the table's `data-dcss-count`.

## Next

- The best month: `best` defined as d3's `maxIndex` of the series (`<csymbol definitionURL="https://d3js.org/d3-array/summarize#maxIndex">maxIndex</csymbol>`), and `<span data-dcss-label="best">no month yet</span>` prints that row's header, May, or its own text while no month is set.
- A table can hold a series a column, one a year: `<th scope="col" data-dcss-series="y2026">2026</th>` in the header row.
- Screen readers: the build's answers are no live regions (`aria-live="off"`), so a change of year announces nothing by itself. For one sentence read out when the year changes, put `aria-live="polite" aria-atomic="true"` on it: the answers inside it become its text. VoiceOver and NVDA haven't been tried on it yet.
- An axis across the range is a call that lays the data out: [README.md](README.md), section Using two calls together, with an example.
- Reading an answer from a test script: the printed number is generated content (an output's text stays empty) and `--value` is a `calc()`, so register a number and give it the answer, `@property --read { syntax: "<number>"; inherits: false; initial-value: 0; }` and `output { --read: var(--value); }`. `getComputedStyle(output).getPropertyValue('--read')` then gives the answer to six digits, not the whole double.
- [SPEC.md](SPEC.md): what the build and each call are required to do, and the result in each browser.
