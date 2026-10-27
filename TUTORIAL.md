# dcss-array.css: tutorial

You build a sales summary for six months: the total, the monthly average, the best month and an axis across the range, all worked out by the stylesheet, and a switch between two years that updates every number.

## Before you start

You need Chrome or Safari, and from this folder `dcss-array.css` and the `families` folder, saved next to a new file, `sales.html`. Open that file in the browser after each step and reload it to see the change. No script is involved at any point.

## 1. Total and average

Each calculation is an element whose class is d3's function name. `.dcss-sum` goes on a `<figure>`; the `<ul>` inside it is the data, one `<li>` per value, each saying its number as `--value`. The browser lays that list out, and the layout is the answer. Elements in the `<div>` after the list read it as `--dcss-sum`, and also `--dcss-mean` and `--dcss-count`, since one sum gives all three.

The months' numbers are set once, on `.sales`, so later steps can reuse them. `.dcss-format-fixed` prints a number the way d3.format does, with `--precision` decimals. The figure is one line tall and clips the rest: the list itself is drawn one pixel per unit, which you don't want to see. `aria-hidden` keeps a screen reader from announcing that drawing as six empty list items.

```html
<!doctype html>
<meta charset="utf-8">
<title>Sales</title>
<link rel="stylesheet" href="dcss-array.css">
<link rel="stylesheet" href="families/array.css">
<link rel="stylesheet" href="families/format.css">
<style>
  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; }
  .sales { --jan: 120; --feb: 95; --mar: 140; --apr: 80; --may: 160; --jun: 110; }
  figure { margin: 0; height: 1lh; overflow: clip; }
</style>

<section class="sales">
  <figure class="dcss-sum">
    <ul aria-hidden="true">
      <li style="--value: var(--jan)"></li> <li style="--value: var(--feb)"></li> <li style="--value: var(--mar)"></li>
      <li style="--value: var(--apr)"></li> <li style="--value: var(--may)"></li> <li style="--value: var(--jun)"></li>
    </ul>
    <div>
      Total <output class="dcss-format-fixed" style="--value: var(--dcss-sum); --precision: 0"></output>,
      average <output class="dcss-format-fixed" style="--value: var(--dcss-mean); --precision: 1"></output> a month
    </div>
  </figure>
</section>
```

You see "Total 705, average 117.5 a month".

## 2. The best month

`.dcss-max-index` takes the same list and gives the position of its largest value, counting from 0: May is 4. A `@counter-style` with the month names turns that position into a word. Add these two rules to the `<style>`:

```css
@counter-style month { system: fixed 0; symbols: Jan Feb Mar Apr May Jun; }
.month::after { counter-reset: m var(--dcss-max-index); content: counter(m, month); }
```

And this figure after the first one, inside `.sales`:

```html
  <figure class="dcss-max-index">
    <ul aria-hidden="true">
      <li style="--value: var(--jan)"></li> <li style="--value: var(--feb)"></li> <li style="--value: var(--mar)"></li>
      <li style="--value: var(--apr)"></li> <li style="--value: var(--may)"></li> <li style="--value: var(--jun)"></li>
    </ul>
    <div>Best month: <output class="month"></output></div>
  </figure>
```

You see a second line, "Best month: May".

## 3. An axis across the range

Three calls nest here, each reading the one around it. `.dcss-extent` gives the smallest and largest values as `--dcss-min` and `--dcss-max`. Inside it, `.dcss-nice` rounds that range out to whole steps, as d3's `nice` does. Inside that, `.dcss-axis-bottom` draws an axis over the rounded range, a tick and a label per `<li>`; give it more `<li>`s than ticks and the spare ones stay hidden.

Link `families/ticks.css` after the other two families, add `.axis { height: 40px; margin-top: 8px; }` to the `<style>`, and add this figure:

```html
  <figure class="dcss-extent axis">
    <ul aria-hidden="true">
      <li style="--value: var(--jan)"></li> <li style="--value: var(--feb)"></li> <li style="--value: var(--mar)"></li>
      <li style="--value: var(--apr)"></li> <li style="--value: var(--may)"></li> <li style="--value: var(--jun)"></li>
    </ul>
    <div>
      <div class="dcss-nice" style="--start: var(--dcss-min); --stop: var(--dcss-max); --count: 5">
        <ol class="dcss-axis-bottom" style="--start: var(--dcss-nice-start); --stop: var(--dcss-nice-stop); --count: 5; width: 300px; margin-left: 16px">
          <li></li> <li></li> <li></li> <li></li> <li></li> <li></li> <li></li> <li></li>
        </ol>
      </div>
    </div>
  </figure>
```

You see an axis from 80 to 160 with a label every 20. The left margin keeps the first label inside the figure, which clips anything past its edges.

## 4. Switch the year

The numbers are custom properties, so a selector can change them. Two radio buttons and one `:has()` rule give a second year, and every result follows it: no script, nothing to wire up. Here is the whole page:

```html
<!doctype html>
<meta charset="utf-8">
<title>Sales</title>
<link rel="stylesheet" href="dcss-array.css">
<link rel="stylesheet" href="families/array.css">
<link rel="stylesheet" href="families/format.css">
<link rel="stylesheet" href="families/ticks.css">
<style>
  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; }
  .sales { --jan: 120; --feb: 95; --mar: 140; --apr: 80; --may: 160; --jun: 110; }
  .sales:has(#y2026:checked) { --jan: 130; --feb: 145; --mar: 90; --apr: 175; --may: 160; --jun: 120; }
  figure { margin: 0; height: 1lh; overflow: clip; }
  @counter-style month { system: fixed 0; symbols: Jan Feb Mar Apr May Jun; }
  .axis { height: 40px; margin-top: 8px; }
  .month::after { counter-reset: m var(--dcss-max-index); content: counter(m, month); }
</style>

<section class="sales">
  <p>
    <label><input type="radio" name="year" id="y2025" checked> 2025</label>
    <label><input type="radio" name="year" id="y2026"> 2026</label>
  </p>
  <figure class="dcss-sum">
    <ul aria-hidden="true">
      <li style="--value: var(--jan)"></li> <li style="--value: var(--feb)"></li> <li style="--value: var(--mar)"></li>
      <li style="--value: var(--apr)"></li> <li style="--value: var(--may)"></li> <li style="--value: var(--jun)"></li>
    </ul>
    <div>
      Total <output class="dcss-format-fixed" style="--value: var(--dcss-sum); --precision: 0"></output>,
      average <output class="dcss-format-fixed" style="--value: var(--dcss-mean); --precision: 1"></output> a month
    </div>
  </figure>
  <figure class="dcss-max-index">
    <ul aria-hidden="true">
      <li style="--value: var(--jan)"></li> <li style="--value: var(--feb)"></li> <li style="--value: var(--mar)"></li>
      <li style="--value: var(--apr)"></li> <li style="--value: var(--may)"></li> <li style="--value: var(--jun)"></li>
    </ul>
    <div>Best month: <output class="month"></output></div>
  </figure>
  <figure class="dcss-extent axis">
    <ul aria-hidden="true">
      <li style="--value: var(--jan)"></li> <li style="--value: var(--feb)"></li> <li style="--value: var(--mar)"></li>
      <li style="--value: var(--apr)"></li> <li style="--value: var(--may)"></li> <li style="--value: var(--jun)"></li>
    </ul>
    <div>
      <div class="dcss-nice" style="--start: var(--dcss-min); --stop: var(--dcss-max); --count: 5">
        <ol class="dcss-axis-bottom" style="--start: var(--dcss-nice-start); --stop: var(--dcss-nice-stop); --count: 5; width: 300px; margin-left: 16px">
          <li></li> <li></li> <li></li> <li></li> <li></li> <li></li> <li></li> <li></li>
        </ol>
      </div>
    </div>
  </figure>
</section>
```

Pick 2026 and the page shows "Total 820, average 136.7 a month", "Best month: Apr" and an axis from 80 to 180. Pick 2025 again and the first numbers come back.

## Next

- [README.md](README.md), section Reference: every call, family by family, with the file each lives in.
- [SPEC.md](SPEC.md): what each call is required to do, and its result in each browser.
