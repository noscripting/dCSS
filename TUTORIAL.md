# dcss.css: tutorial

You build a sales summary for six months: a table of the months, their total and monthly average, the average as a bar, and a switch between two years that updates every number. No build and no script: one HTML file and the stylesheets.

## Before you start

You need Chrome or Safari, and from this folder `dcss.css` and the `families` folder, with a new file, `sales.html`, saved next to them. After each step, open `sales.html` in the browser.

## 1. The months as a table

The numbers live in CSS, one custom property a month, on the section that holds everything. A table cell prints one with `.dcss-format-fixed`: `--value` is the number, `--precision` its decimals.

```html
<!doctype html>
<meta charset="utf-8">
<title>Sales</title>
<link rel="stylesheet" href="dcss.css">
<link rel="stylesheet" href="families/format.css">
<style>
  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; }
  .sales { --jan: 120; --feb: 95; --mar: 140; --apr: 80; --may: 160; --jun: 110; }
</style>

<section class="sales">
  <table>
    <thead><tr><th>Month</th><th>Sales</th></tr></thead>
    <tbody>
      <tr><th>January</th><td><span class="dcss-format-fixed" style="--value: var(--jan); --precision: 0"></span></td></tr>
      <tr><th>February</th><td><span class="dcss-format-fixed" style="--value: var(--feb); --precision: 0"></span></td></tr>
      <tr><th>March</th><td><span class="dcss-format-fixed" style="--value: var(--mar); --precision: 0"></span></td></tr>
      <tr><th>April</th><td><span class="dcss-format-fixed" style="--value: var(--apr); --precision: 0"></span></td></tr>
      <tr><th>May</th><td><span class="dcss-format-fixed" style="--value: var(--may); --precision: 0"></span></td></tr>
      <tr><th>June</th><td><span class="dcss-format-fixed" style="--value: var(--jun); --precision: 0"></span></td></tr>
    </tbody>
  </table>
</section>
```

The table shows 120, 95, 140, 80, 160 and 110.

## 2. The total and the average

A call is a class on a `<figure>` around a list, one `--value` an item. `.dcss-mean` is in the array family, so add its sheet to the page's head, `<link rel="stylesheet" href="families/array.css">`, under the format one. It gives the list's sum as `--dcss-sum` and its mean as `--dcss-mean` to each element after the list. The list is laid out at its answer, its items reaching past the figure's edges, so the figure clips it (`overflow: clip`, no height: a fixed one would cut the sentence when it wraps on a narrow screen) and the screen reader skips it (`aria-hidden`). Add `families/array.css` beside the other links, and this after the table:

```html
<figure class="dcss-mean dcss-format-fixed" style="overflow: clip; margin: 0">
  <ul aria-hidden="true">
    <li style="--value: var(--jan)"></li> <li style="--value: var(--feb)"></li> <li style="--value: var(--mar)"></li>
    <li style="--value: var(--apr)"></li> <li style="--value: var(--may)"></li> <li style="--value: var(--jun)"></li>
  </ul>
  <p>Total <output style="--value: var(--dcss-sum); --precision: 0"></output>,
     average <output style="--value: var(--dcss-mean); --precision: 1"></output> a month.</p>
</figure>
```

It reads "Total 705, average 117.5 a month." Change `--mar` in the `<style>` and reload: the table, the total and the average all follow.

## 3. A bar and a switch between years

The average is a number in CSS, so it can size things: a bar `--dcss-mean` pixels wide. Two radio buttons pick the year, and `:has()` sets the months for the one that is checked. The whole page:

```html
<!doctype html>
<meta charset="utf-8">
<title>Sales</title>
<link rel="stylesheet" href="dcss.css">
<link rel="stylesheet" href="families/array.css">
<link rel="stylesheet" href="families/format.css">
<style>
  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; }
  .sales { --jan: 120; --feb: 95; --mar: 140; --apr: 80; --may: 160; --jun: 110; }
  .sales:has(#y2026:checked) { --jan: 130; --feb: 145; --mar: 90; --apr: 175; --may: 160; --jun: 120; }
  .summary { overflow: clip; margin: 0; }
  .bar { height: 12px; width: calc(var(--dcss-mean) * 1px); background: teal; }
</style>

<section class="sales">
  <p>
    <label><input type="radio" name="year" id="y2025" checked> 2025</label>
    <label><input type="radio" name="year" id="y2026"> 2026</label>
  </p>
  <table>
    <thead><tr><th>Month</th><th>Sales</th></tr></thead>
    <tbody>
      <tr><th>January</th><td><span class="dcss-format-fixed" style="--value: var(--jan); --precision: 0"></span></td></tr>
      <tr><th>February</th><td><span class="dcss-format-fixed" style="--value: var(--feb); --precision: 0"></span></td></tr>
      <tr><th>March</th><td><span class="dcss-format-fixed" style="--value: var(--mar); --precision: 0"></span></td></tr>
      <tr><th>April</th><td><span class="dcss-format-fixed" style="--value: var(--apr); --precision: 0"></span></td></tr>
      <tr><th>May</th><td><span class="dcss-format-fixed" style="--value: var(--may); --precision: 0"></span></td></tr>
      <tr><th>June</th><td><span class="dcss-format-fixed" style="--value: var(--jun); --precision: 0"></span></td></tr>
    </tbody>
  </table>
  <figure class="summary dcss-mean dcss-format-fixed">
    <ul aria-hidden="true">
      <li style="--value: var(--jan)"></li> <li style="--value: var(--feb)"></li> <li style="--value: var(--mar)"></li>
      <li style="--value: var(--apr)"></li> <li style="--value: var(--may)"></li> <li style="--value: var(--jun)"></li>
    </ul>
    <p>Total <output style="--value: var(--dcss-sum); --precision: 0"></output>,
       average <output style="--value: var(--dcss-mean); --precision: 1"></output> a month.</p>
    <div class="bar"></div>
  </figure>
</section>
```

In 2025 it reads total 705, average 117.5 and the bar is 117.5 pixels wide; pick 2026 and it reads 820 and 136.7, the bar 136.67 pixels. The page has no script: the browser works the sum out again each time a month changes.

## Next

- More calls on the same list: `.dcss-summarize` gives the median, extent, deviation and more at once ([README.md](README.md), Reference).
- A formula of your own over these numbers, solved or evaluated: [README.md](README.md), Solving your own formula.
- SPEC.md: what each call is required to do, and the result in each browser.
