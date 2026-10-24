# styles-array.css: tutorial

You build a leaderboard that keeps its players in score order by itself, and moves a player up the moment their score passes another's.

## Before you start

You need Chrome, Safari or Firefox, and `styles-array.css` from this folder saved next to a new file, `leaderboard.html`. Open that file in the browser after each step and reload it to see the change. No server and no script are needed.

## 1. Sort the players by score

A `.arrays-sort` grid orders its entries, the `<i>` elements inside it, by the whole number each one sets as `--arrays-key`, smallest first. To put the highest score first, the key is 1000 minus the score.

Each entry holds a `.arrays-where`, and the inner `<u>` of it is the row you see. That `<u>` gets `--arrays-place`, the entry's place in the sort: 1 for the smallest key. The row uses it to stand at its place, 32 px a place. The players are written in no particular order:

```html
<!doctype html>
<meta charset="utf-8">
<title>Leaderboard</title>
<link rel="stylesheet" href="styles-array.css">
<style>
  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; }
  .board { position: relative; width: 360px; height: 128px; }
  .board i { --arrays-key: calc(1000 - round(var(--score))); }
  .row { position: absolute; top: calc((var(--arrays-place) - 1) * 32px); left: 0;
    width: 360px; height: 28px; display: flex; align-items: center; gap: 8px; }
</style>

<div class="board">
  <div class="arrays-sort">
    <i style="--score: 310"><b class="arrays-where"><u><u class="row"><span>Grace</span></u></u></b></i>
    <i style="--score: 250"><b class="arrays-where"><u><u class="row"><span>Alan</span></u></u></b></i>
    <i style="--score: 400"><b class="arrays-where"><u><u class="row"><span>Ada</span></u></u></b></i>
    <i style="--score: 130"><b class="arrays-where"><u><u class="row"><span>Edsger</span></u></u></b></i>
  </div>
</div>
```

You see four names from the highest score down: Ada, Grace, Alan, Edsger. The entries themselves draw nothing; everything you see is inside the rows.

## 2. Show each place and score

Counters print numbers. Add these rules to the `<style>`: each row starts a counter at its place and one at its score, and prints them before and after the name.

```css
  .row { counter-reset: place var(--arrays-place) score round(var(--score)); }
  .row::before { content: counter(place); width: 1em; }
  .row span { width: 4em; }
  .row::after { content: counter(score); }
```

You see a numbered list: 1 Ada 400, 2 Grace 310, 3 Alan 250, 4 Edsger 130.

## 3. Draw the bars

A bar is a box as wide as the score. Put `<b class="bar"></b>` after each name, inside the row:

```html
    <i style="--score: 310"><b class="arrays-where"><u><u class="row"><span>Grace</span><b class="bar"></b></u></u></b></i>
```

and give it a size and a color:

```css
  .bar { height: 20px; width: calc(var(--score) * 0.4px); background: #4a7bd0; }
```

You see a bar chart, longest bar on top, each score printed at the end of its bar.

## 4. Let a score change

Register `--score` as a number, so that it can be animated, and give Edsger a score that climbs from 120 to 460 and back. Add these rules, and a transition so a row glides to its new place:

```css
  @property --score { syntax: '<number>'; inherits: true; initial-value: 0; }
  @keyframes climb { from { --score: 120; } to { --score: 460; } }
  .row { transition: top 0.4s; }
  .climber { animation: climb 4s ease-in-out infinite alternate; }
```

Then replace Edsger's `style="--score: 130"` with `class="climber"`. The whole page is now:

```html
<!doctype html>
<meta charset="utf-8">
<title>Leaderboard</title>
<link rel="stylesheet" href="styles-array.css">
<style>
  @property --score { syntax: '<number>'; inherits: true; initial-value: 0; }
  @keyframes climb { from { --score: 120; } to { --score: 460; } }
  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; }
  .board { position: relative; width: 360px; height: 128px; }
  .board i { --arrays-key: calc(1000 - round(var(--score))); }
  .row { position: absolute; top: calc((var(--arrays-place) - 1) * 32px); left: 0;
    width: 360px; height: 28px; display: flex; align-items: center; gap: 8px; }
  .row { counter-reset: place var(--arrays-place) score round(var(--score)); }
  .row::before { content: counter(place); width: 1em; }
  .row span { width: 4em; }
  .row::after { content: counter(score); }
  .bar { height: 20px; width: calc(var(--score) * 0.4px); background: #4a7bd0; }
  .row { transition: top 0.4s; }
  .climber { animation: climb 4s ease-in-out infinite alternate; }
</style>

<div class="board">
  <div class="arrays-sort">
    <i style="--score: 310"><b class="arrays-where"><u><u class="row"><span>Grace</span><b class="bar"></b></u></u></b></i>
    <i style="--score: 250"><b class="arrays-where"><u><u class="row"><span>Alan</span><b class="bar"></b></u></u></b></i>
    <i style="--score: 400"><b class="arrays-where"><u><u class="row"><span>Ada</span><b class="bar"></b></u></u></b></i>
    <i class="climber"><b class="arrays-where"><u><u class="row"><span>Edsger</span><b class="bar"></b></u></u></b></i>
  </div>
</div>
```

You see Edsger's bar grow. As his score passes 250, 310 and 400, he moves up one place at a time and the others step down, until he leads with 460; then he falls back to last. The places change in the same frame as the score, and no script runs.

## Next

- The README's [Reference](README.md#reference) lists every primitive: indexed reads, sums, bins, keyed maps, packing, formulas and text.
- [SPEC.md](SPEC.md) states what each one guarantees and its result in Chrome, WebKit and Firefox.
