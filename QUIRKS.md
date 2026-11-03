# dcss.css: QUIRKS

The engine bugs dcss.css meets when it computes with layout, and what the sheet does about each. The reftest pages and scripts named below are in the noscript.ing repository ([github.com/noscripting/noscript.ing](https://github.com/noscripting/noscript.ing)), under `libraries/dcss/`.

Measured 2026-10-22, headless: Chrome 155.0.8059.86, WebKit 26.4, Firefox 158.0.

### Q1 WebKit: a balanced multicol keeps the height its tallest block had

- Feature: `multi-column`
- Spec: [CSS Multi-column Layout 1 §7.1](https://drafts.csswg.org/css-multicol-1/#cf)
- Engines: Chrome PASS · WebKit FAIL: 100 px tall for 20 after its 100 px block shrinks to 10 px · Firefox PASS
- Repro: `quirks/multicol-shrink.html`
- Bug: none found
- Workaround: `.dcss-columns` sits in an `.dcss-alternate` as two copies, shown in turn by `--dcss-parity` at each change, so every layout starts from a box that was `display: none`.
- Affects: A45

### Q2 WebKit: a shrink-to-fit box takes the width a vertical aspect-ratio box had in its last layout

- Feature: `aspect-ratio`
- Spec: [CSS Box Sizing 4 §4.2](https://drafts.csswg.org/css-sizing-4/#aspect-ratio-automatic)
- Engines: Chrome PASS · WebKit FAIL: 40 px wide for 70 after the box's content grows from 40 to 70 px · Firefox PASS
- Repro: `quirks/orthogonal-aspect-ratio.html`
- Bug: none found
- Workaround: `.dcss-turn` puts the vertical box in a `max-content` grid column and changes its `max-height` by `--dcss-turn-tick` whenever an input under it changes.
- Affects: A49

### Q3 Firefox: `anchor-size()` keeps the size its anchor had when the box was laid out

- Feature: `anchor-positioning`
- Spec: [CSS Anchor Positioning 1 §5.1](https://drafts.csswg.org/css-anchor-position-1/#anchor-size-fn)
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: 20 px wide after its anchor grew from 20 to 60 px
- Repro: `quirks/anchor-size-follows.html`
- Bug: none found
- Workaround: the `.dcss-calc` boxes and the results they name sit in a container as wide as its content (`width: max-content`), so a changed result resizes the container and Firefox lays the boxes out again (check 69). Comparisons of `anchor-size()` in a box's `top`, and `anchor()` edges, followed their anchors on every frame of `probes/anchor-sort-check.mjs`, where an `anchor-size()` width was a frame stale once in 40. No way in the sheet alone (`probes/anchor-size-ways.mjs`, 2026-10-23): `position-anchor` with `anchor-size(width)` and `position-visibility` stay at 20 px; `anchor()` insets follow (60), but a product of two anchors' insets stays stale (60 for 180).
- Affects: A41

### Q4 Firefox: a tab skips the stop 0.5ch away in a font with no 0 glyph

- Feature: `tab-size`
- Spec: [CSS Text 3 §4.2](https://drafts.csswg.org/css-text-3/#tab-size-property)
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: the box after the tab at 32 px for 16, 1ch being 8 px
- Repro: `quirks/tab-no-zero.html`
- Bug: none found
- Workaround: the sheet's text fonts carry a 1 px `0` glyph, so 1ch is 1 px and every tab of `.dcss-divide` lands on its stop.
- Affects: A44

### Q5 Firefox: a size container reads `100cqh` as the viewport's height when its grid column is sized after the rows

- Feature: `container-queries`
- Spec: [CSS Conditional Rules 5 §7](https://drafts.csswg.org/css-conditional-5/#container-lengths)
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: 200 px, the viewport's height, for a 40 px container
- Repro: `quirks/cq-after-regrid.html`
- Bug: none found
- Workaround: a collapse over a hop's column goes in an `.dcss-hop`'s `<u>` (check 65): Firefox lays a collapse that is itself a grid item in that column out with the column from the frame before, but one inside a hop on time. The row that hop makes is still a frame late in Firefox (the rows sized again after the second column pass), so a collapse read by its row stays a Firefox failure. On `.dcss-array`, `contain: none`, `width: max-content` and `height: max-content`, alone or together, leave check 65 failing in Firefox (2026-10-23).
- Affects: A47

### Q6 Chrome, WebKit: a percentage of a box millions of px wide is off by a fraction of a px

- Feature: none
- Spec: [CSS Values 4 §4.5](https://drafts.csswg.org/css-values-4/#percentages)
- Engines: Chrome FAIL: 100.125 px for 100 · WebKit FAIL: 100.125 px for 100 · Firefox PASS
- Repro: `quirks/percent-of-huge.html`
- Bug: none found
- Workaround: the stacked bars' second copy, which sits at the far corner of a size container whose size is the ranks' code (up to 2^24 px), is placed by `right: 0; bottom: 0` and its own width and height as negative margins, with no percentage; it read 1/8 px off from 800 items before (`pipeline/at-size.mjs`)
- Affects: A55, A57

### Q7 Chrome: one large quantize comparison expression is rejected

- Feature: none
- Spec: CSS Values 4 arithmetic; no general parser limit measured.
- Engines: Chrome FAIL: rejects the flat 56,771-character expression · WebKit PASS: accepts it · Firefox NOTRUN
- Repro: `out/discrete-expression/index.html`
- Bug: none found
- Workaround: `probes/dcss/discrete/expression-check.mjs` verifies seven registered partial counts, at most 9,091 characters each. The 100-boundary query returns 33 in both engines; full range replay through 1,025 buckets passes.
- Affects: A73

### Q8 Chrome, WebKit: inline-size containment interrupts nested prefix subgrids

- Feature: `subgrid`
- Spec: CSS Grid 2 track inheritance; measured interaction, no spec-conformance claim.
- Engines: Chrome FAIL: 175 px at every nested level · WebKit FAIL: the same · Firefox NOTRUN
- Repro: `out/cumsum-foundation/subgrid.html`
- Bug: none found
- Workaround: explicit inherited templates give correct nested prefixes and flow. Stored arithmetic is faster in the measured 64-output compiler workload. `probes/dcss/cumsum/foundation-check.mjs` retains the failing alternative; the static scan uses a separate source subgrid and simple read containers.
- Affects: A80

### Q9 Chrome, WebKit: symbolic sibling-index division changes rounding

- Feature: `sibling-index`
- Spec: CSS Values 4 arithmetic; measured difference from IEEE division.
- Engines: Chrome FAIL: direct sibling-index 3/17 differs from IEEE · WebKit FAIL: the same · Firefox NOTRUN
- Repro: `out/static/division.html`
- Bug: none found
- Workaround: capture the index as a registered integer, then use the existing engine-specific cssDiv helper. `probes/dcss/static/division-check.mjs` checks all 16 divisions exactly; `static/check.mjs` checks boundary neighbours through the complete sheet. Plain registered-number division still differs in WebKit.
- Affects: A81

### Q10 Chrome: a registered number rounds valid grid inputs

- Feature: `registered-custom-properties`
- Spec: CSS Properties and Values 1; registered-number transport measured against exact input values.
- Engines: Chrome FAIL: -9.046875 reads as -9.04688 and fails the grid check · WebKit PASS · Firefox NOTRUN
- Repro: `out/authored-cumsum/Chrome-8-raw.html`
- Bug: none found
- Workaround: validate the original input and transport it in two bounded integer parts. Saturate the transport before splitting: WebKit otherwise carries infinity into an unused product, making a width NaN. `probes/dcss/cumsum/authored-check.mjs` checks full-range grid values and native invalid suffixes on the uncompiled and both compiled paths.
- Affects: A81, A82

### Q11 Chrome: counter text stays empty on an item a style query shows again inside a container result

- Feature: `container-queries`
- Spec: [CSS Lists 3 §4](https://drafts.csswg.org/css-lists-3/#counter-functions), [CSS Conditional 5 §6.2](https://drafts.csswg.org/css-conditional-5/#style-container)
- Engines: Chrome FAIL: ticks 100 to 600 computed but laid out 0 px wide · WebKit PASS · Firefox PASS (measured on `.dcss-ticks`, which left dcss.css on 2026-11-02)
- Repro: `quirks/cq-counter-unhidden.html` at 02e5ae9bd, on the sheet of then; a list counted from a `.dcss-extent` answer and hidden by `@container style()` on a registered integer, built without the ticks, prints in Chrome (2026-11-02), so the page went with them
- Bug: none found
- Workaround: a page's own message around an answer: show the answer by default and hide it in error; hiding it until `--dcss-ready` is 1 and then showing it left a mean's, min's or max's number blank in Chrome (a review, 2026-10-29).
- Affects: none of the sheet's calls since 2026-11-02

### Q12 Chrome: a product whose factor holds the sheet's exact division rounds away from the IEEE double

- Feature: none
- Spec: [CSS Values 4 §10.10.1](https://drafts.csswg.org/css-values-4/#calc-simplification) lets an engine reorder a calculation; measured against IEEE doubles.
- Engines: Chrome FAIL: `low + (high - low) * f` is off d3's double in 29 of 200 quantile scale thresholds, where f, written in the same `calc()` with the exact division (`cssDiv`), equals it alone · WebKit PASS · Firefox FAIL: f alone is off in 135 of 200 (32-bit `calc()`)
- Repro: `quirks/calc-product-of-division.html`
- Bug: none found
- Workaround: f goes through a length, `(f * 1px) / 1px`, which rounds as d3 in all 200 and in 3,000 more (src/static.mjs, the quantile scale's thresholds).
- Affects: A123

### Q13 WebKit: every scroll-driven animation restyles its element in every frame, nothing moving

- Feature: `animation-timeline`
- Spec: [Scroll-driven Animations 1 §5.1](https://drafts.csswg.org/scroll-animations-1/#event-loop)
- Engines: Chrome PASS · WebKit FAIL: 2,000 boxes on `scroll(self x)` cost 3.6 ms of style a frame at rest, 0.0 paused · Firefox PASS
- Repro: `facts/scroll/self-scroll-idle.mjs`, at the repository's root
- Bug: https://bugs.webkit.org/show_bug.cgi?id=327680
- Upstream: fixed in WebKit's trunk, after the builds measured here: webkit.org/b/327680, “Scroll-driven animation invalidates style on every animation update even when its timing is unchanged” (filed 2026-10-15), is RESOLVED FIXED by 324449@main, 2026-10-22; its reporter measured that alone such an animation starts no rendering update on an idle page, but invalidates style in every update something else starts (here `requestAnimationFrame`, as `frames()` and the fact's page run): this entry. No Safari release was found that says it carries 324449@main; WebKit 26.4 is before it. Open beside it: [webkit.org/b/328203](https://bugs.webkit.org/show_bug.cgi?id=328203) (NEW, 2026-10-20), an anchor-positioned element resolved and laid out again on every style update, which its reporter found feeds this one where a page has both; whether a figure at rest pays it was not measured. Read and not this behaviour: webkit.org/b/304412 (fixed 2025-12-19, idle rendering updates under the threaded scroll-driven animations flag), webkit.org/b/302170 (fixed 2025-11-08, animations made by script), webkit.org/b/302156 (WONTFIX 2026-02-12, style updates while scrolling). Chrome and Firefox pass. Searched 2026-11-01, signed out: bugs.webkit.org summaries with “scroll-driven”, “scroll timeline”, “ScrollTimeline”, “animation-timeline” and “view timeline”; csswg-drafts issues with “scroll-driven idle”
- Workaround: a reduction's reads animate the elements after its list (`scroll(nearest)`), not the figure, so the items are not restyled with them: 128 sum figures of 1,000 items cost 18.7 ms of render a frame at rest, 48.0 ms read on the figure (`probes/dcss/counters/race.mjs`, one run each beside other checks, 2026-11-01). Every other call still reads its list by its own scroll range: each such figure is restyled every frame with its items (128 figures of 1,000 items, 44 ms of style a frame at rest, 2026-10-31).
- Cost: an element's, not its animations': 128 sum figures at rest, 10.3 ms of render a frame with one scroll-driven animation an `<output>`, 10.2 with two, 10.9 with six, 10.3 with one on `view()`, 0.29 with none (`probes/dcss/counters/rest-cost.mjs`, 2026-11-01, one run each); Chrome 0.50 as built, 0.07 with none. A page of many figures pays it until Safari ships the fix.
- Affects: every reduction and every call read by scroll timelines, in pages of many calls

### Q14 Chrome, WebKit, Firefox: under an ancestor's CSS `zoom` other than 1, reads go wrong

- Feature: `zoom`
- Spec: [CSS Viewport 1 §4](https://drafts.csswg.org/css-viewport/#zoom-property): zoom multiplies a length's used value; computed values stay unscaled (§4.1)
- Engines: one item's sum of 30 whole values from 1 to 16,777,000, zoom on the body, before the guard (scratchpad zoom/one.mjs, 2026-11-02): Chrome FAIL: 1.25 12 of 30 one low (each value whose 1.25 times isn't whole: 1 read 0), 0.8, 0.9, 1.05, 1.1 and 1.33 likewise, 2.25 to 3 every value past about 5,000 off by 4,096 or more; right at 0.5, 1.5, 1.75 and 2 · WebKit FAIL: 1.25 and 1.33 the same one low, 2.25 to 3 the largest clamped (16,000,000 read 13,421,770 at 2.5) · Firefox FAIL: from 1.1 (1 of 30) to 2.5 (30 of 30: 1 read 2), its layout past about 17.9M px clamped · means, mins and maxes alike; before 2026-11-01 lists in 64ths were 1/64 off at 0.5 to 1.1 in Chrome and WebKit. A median (a view-timeline read) the same: Chrome 13 of 30 wrong at 1.25 and 27 at 3, WebKit 14 at 1.25, Firefox 24 of 30 from 1.1
- Repro: `probes/dcss/counters/font-size-check.mjs` (`ONLY=zoom`); the 14 zooms from 0.5 to 3 in scratchpad zoom/fix3.mjs
- Bug: none found
- Upstream: none filed, and none found for either part: the lists off the grid in Chrome and WebKit (a value in 64ths times 0.8 is off the 1/64 px layout grid in any engine, and the spec sets no precision) and WebKit's text at a fractional zoomed size, wider than its glyphs. Searched 2026-11-01, signed out: bugs.webkit.org summaries with “zoom” in its CSS (140 reports) and Layout and Rendering (234) components; csswg-drafts and wpt issues on GitHub (“zoom rounding”, “zoom subpixel”, “zoom precision”) and the 7,220 csswg-drafts issues `notes/github-fetch.mjs` keeps, by titles naming zoom; web searches for a Chromium report (issues.chromium.org lists nothing to a reader without script, so Chromium's tracker itself was not searched). Neighbours, read: csswg-drafts #14260 (open, 2026-08-04), which font size a zoomed font is resolved at, where WebKit takes the zoomed used size and unscales the metrics, the likely seat of its wider text; csswg-drafts #13600 (open), rounding to device pixels; webkit.org/b/265869 (NEW, 2023-12-05), `1rem` inside zoom 0.5 laid out as 32 px on iOS. WebKit's failure leans on a WebKit bug: inside zoom 0.8 it reads `1rem` and `100vw` as 1.25 times the root's registered lengths, where the spec keeps both computed values unscaled and Chrome reads 1; of the same kind, a registered length inherited into a zoom, WebKit fails WPT's css/css-viewport/zoom/custom-property.html (Safari 27.2 FAIL, Chrome 156.0.8078.80 and Firefox 159.0 PASS, wpt.fyi stable, 2026-11-01) and webkit.org/b/296046 (NEW, 2025-07-16) is open. Not measured whether they share a cause; when WebKit reads 1 there, its lists are wrong with error 0 again, so `ONLY=zoom` is run on each new WebKit
- Workaround: a reduction (sum, count, length, mean, min, max, extent) fails at every zoom other than 1, in all three engines: its list is set in the lists' font at 9,999.3px, line-height normal (17,000,000px in Firefox). Chrome and WebKit lay that line out at the zoomed size, rounded to whole px (Chrome clamps it at 10,000 px), so its `1lh` is 9,999 at zoom 1 alone; Firefox clamps a font past about 17.9M px, so the list's `1em` (a registered length) reads under 16,900,000 from zoom 1.06. Where either shows, the list keeps no scroll range, its timelines go inactive and every answer is error 1 or 2 (src/reduce.mjs ZOOMED; 0 wrong of 150 at each of 14 zooms from 0.5 to 3 in each engine, 146 right at zoom 1, device scale 2 and 3 as at 1: scratchpad zoom/fix3.mjs, 2026-11-02). A line pushed past 2^24 px could not fail there: zoom clamped it into the reads (a sum of 1 read 14,913,100 at 2.25, error 0). WebKit: every other family failed below 1.25 too, by the root's font size (its `1em`, a registered length) against the element's `1rem`, which WebKit gives as 1/z of it. Not yet guarded: the families that read view timelines (median, quantile, bins, cumsum, rollup and the rest) in Chrome and Firefox, and in WebKit from 1.25. Browser zoom is not this: device scale 0.9 to 3 reads right in all three. A page that zooms keeps its figures outside the zoomed element. Sum, count, length, min, max and extent read no font (2026-11-02), so their lists are guarded without one: set at line-height 1, `1lh` is `1em` but where Chrome caps the font at 10,000 device px (every zoom above 1), and each list is a container 3.015625 px wide whose items' `100cqw` is that exactly at zoom 1 alone in WebKit and at whole zooms alone in Chrome; with fonts blocked, before it, sums read 1 off at 0.5 to 1.25 and a min 136,000 off at 3 in WebKit, error 0; with it 0 wrong of 72 lists at 9 zooms from 0.5 to 3, fonts blocked or not, all failed but at 1 in Chrome and WebKit (scratchpad laysum/zoomlay.mjs, zoomstack.mjs)
- Affects: every read under an ancestor's CSS `zoom`

### Q15 WebKit: `counter()` inside a size container reads 0 for a counter set outside it, or on it

- Feature: `counter()`, `contain: style`, `container-type`
- Spec: [CSS Containment 2 §3.3](https://drafts.csswg.org/css-contain-2/#containment-style): style containment scopes the counters a subtree changes, not the ones it reads
- Engines: Chrome PASS · WebKit FAIL: a `.dcss-int` inside a `container-type: inline-size` card read 0 for a counter set to 1,234 outside the card, and 0 for 77 set on the card itself; one set inside the card (a child's `counter-reset`, a table's rows) read right · Firefox PASS
- Repro: `probes/dcss/counters/int-check.mjs` (the card cases); `facts/counter/counter-read-inside-containment.mjs`, at the repository's root
- Bug: none filed yet
- Workaround: a sentinel counter, `dcss-dcss-seen`, reset to 1 on `html::before` and printed in the reader after the high bits as 256 px more, reads 0 in WebKit exactly where the page's counter is out of sight (`contain: style`, an inline-size or size container, nested, a counter set on the container) and 1 in Chrome and Firefox everywhere (a scratchpad probe, seen2.mjs, 2026-11-01); a reader that reads 0 with the sentinel at 0 gives error 1. A 0 set inside the box fails too, being indistinguishable; a page with no `html::before` (an SVG image) fails on every 0. Before it, an Apple-only `@supports` and `@container (width >= 0px)` caught size containers but not `contain: style`
- Affects: `.dcss-int` inside a page's container or `contain: style` box whose counter is set outside it: failed, never wrong

### Q16 Firefox: a list's 64ths and the summary's grid read off, with no sign of it

- Feature: `calc()`, grid layout
- Spec: [CSS Values 4 §10.12](https://drafts.csswg.org/css-values-4/#calc-range): an engine may compute in floats
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: min(1.5, 2.25, -7) read -7.09375, max 2.15625, median 1.49219; the summary's min of (3, 4, 5) 4 and of (100, 200, 300, 400) 101; the variance of (100, 200, 300, 400) 16,833.3 for 16,666.7; sums, counts, and whole lists' min, max and median right; a mean failed (error 1: the mean of 12, 40, 30 and of 1, 2, 3, 4; Firefox 159, 2026-11-02); a median or quantile between two items, failed until 2026-11-02, now answers (the median of 1, 2, 3, 4 2.5, the 0.3 quantile of 3, 1, 7, 20 2.8, error 0); `.dcss-format-fixed` fails on a value exactly halfway at its last digit (4.25 and 4.75 at `--precision: 1`, even written as the item's `--value`; 4.24, 4.26 print: the brainstormer's real/j.mjs, k.mjs), so a mean of star ratings over 4, 8 or 12 reviews often prints nothing
- Repro: a probe in the session's scratchpad (ff.mjs, 2026-11-01): each call on three lists, the answer and `--dcss-err` read back
- Bug: none filed: its layout is on a 1/60 px grid and its `calc()` keeps 32-bit floats (Shared, the first line)
- Workaround: failed (error 1) where calc() keeps 32-bit floats, `1 - ((16777216 + 1) - 16777216)` being 1 there and 0 in doubles: a min, max, extent, median, quantile or quantile scale of a list that may hold a fraction off `--decimals` (64ths; the median of 1.5, 2.25 and -7 error 1), and every summary, variance and deviation. A median, quantile or quantileSorted between two whole or `--decimals` items is worked out in whole numbers there instead (src/static.mjs, the order family's Firefox block): (k0 s + (k1 - k0) r') / (s 10^d), each part under 2^24, one division, which Firefox rounds correctly (a probe of 402 quotients of whole numbers under 2^24, plain and inside nested `calc()`: 0 off the rounded quotient; as lengths, (a px) / (b px) and a * (1 / b), 109 off; div.mjs, 2026-11-02); one-list/check.mjs 252 of 297 equal d3 and 45 failed, decimals-check.mjs 20 to the bit and 460 failed, none wrong. Firefox gives the same three lists' answers right or error 1 (ff.mjs, 2026-11-01). The precision helpers work out their answer with each exponent an input near a power of ten may have and fail only where those differ (precisionPrefix(1e-5, 1e-5) is 0 either way; precisionRound is 1 wherever |max| is under |step|), and the build gives a literal's own exponent (`--dcss-prec-s-lit`, `--dcss-prec-t-lit`: .01's -2, which Firefox reads as 0.0099999998, -3): precision/check.mjs seeded prefix 150 to 442 of 695, round 150 to 330, composition-check 0 to 6 of 7 (2026-11-02). A `.dcss-width-sum` or `.dcss-largest` leaf off the 1/60 px grid (an eighth) makes the nodes above it read `--dcss-ok` 0 there, as a negative leaf does (check.mjs 46: 21 of 25 readers failed, none wrong). The format family fails on a scaled value past 2^22 or within reach of a rounding tie (fixed, percent and general: 1.5 of the read float's spacing, scaled, plus the product's own rounding, since a value written as calc() of exact parts reads one float off for 585 of 8,381 format-check values, a decimal for none but one, a scratchpad probe, read-probe.mjs, 2026-11-02; SI: a few of its spacings), a value within 2^-20 of a power of ten only where the other decade's grid has such a tie (999.99997 and 1000 both print 1.00000k), an SI value only where 10^power is past a float's range (power over 38), and an |x| of 10^31 or more or not 0 and under 2^-100 (past 2^128 Firefox holds infinity, and 0 · infinity voided the bounds beside it: SI's 1e-40 and 1e39 printed with error 0; the bounds are their own registered integer now); a failed fixed call no longer takes the short path, where 1e-40 printed with error 1 (format-check.mjs: no call in any set printed wrong or with error 1, written exactly or as decimals, 2026-11-01; again 2026-11-02 with these narrower failures, and with `SPAN=1`, each case moved to the two ends of its float's span: 15,325 calls, none wrong). Most of what stays failed is the input's: the checks split each Firefox failure by its 32-bit float's span (probes/dcss/float32.mjs): input not a float32, a float32 whose span holds a double d3 prints otherwise (1.25 at 1 place, read for 1.2499999999999998 too), or answerable. Of format-check's 2,948 seeded calls 1,522 fail: 952, 420 and 150; of si-carry-check's 5,364, 5,290, 66 and 8 (each within a double of a decimal tie, so the float holds both sides); of the locales' 696, 179: 63, 64 and 52. The answerable ones left sit past 2^22 or within 1.5 spacings of a tie, which the calc() form's one-float misread needs. Under 2^-150 the value is read as ±0 before any rule sees it: SI and general give error 1 where the style attribute shows a negative exponent or 44 zeros in a row (SPEC.md A64), types f and % print d3's text. A `.dcss-int` fails on a counter of 2^24 or more in magnitude, its high line 4,096 px or taller (int-check.mjs: 20 of 68 right, 48 failed, none wrong; without the 32-bit flag 41 of the 48 read wrong with error 0, -16,777,219 as -16,777,220). A seeded probe of 898 counters around and past 2^24, both signs (a seeded probe, int-ff/probe.mjs, not tracked, 2026-11-01): the 488 under 2^24 right, the 410 at or past it failed; without the flag 355 of those 410 read wrong with error 0, every one that isn't a 32-bit float and 2 that are (1,487,969,408 read 1,487,969,344, its millions not a 32-bit float; -2^31), so the bound is kept at 2^24. A number is rounded to a 32-bit float as it is parsed there, so `.dcss-ascending` and `.dcss-descending` fail on an argument of 2^24 or more and two equal ones that are not whole (16777217 and 0 compared with error 0, 0.1 and 0.100000001 read equal), bisect fails on a key or query of 2^24 or more, `.dcss-lookup` matches a key and `--find` of 2^24 or more that are one 32-bit float by their text (a style query on the row, `@container style(--key: var(--find))`, which Firefox compares as written: an EAN-13 hit exact) or by a registered `<integer>`, which keeps a whole number exactly to 2^31 - 1 and holds 2147483647 past it (16777217 against 16777216 told apart, as are 8-digit SKUs), and fails on the rest (an EAN-13's miss within a float step, 2^18 to 2^20 there; one number written two ways), a reduction with `--find` fails on an item whose key is one float with a `--find` of 2^24 or more (probes/dcss/lookup/check.mjs, find/check.mjs, 2026-11-02: before, 16777217 found the row 16777216, 500 with error 0, and a sum by it read 500; a scratchpad probe, bigkey/parse.mjs, measured the parse: calc(40061234 - 40061233) 0, a registered `<integer>` 40061234, 4006123456789 as 2147483647; Firefox 158 has no `if()`), and the dates fail on a time or answer of 2^24 ms or more written whole, every month and year call so written (offset(-1, 0) read wrong with error 0 before) and a date format of such an epoch; 1609459260001 less 1609459260000 reads 0 there, 60 s apart 131,072, and calc() of a whole time's parts folds the same way (probes/dcss/dates-parse.mjs, 2026-11-02). Such a time is written in parts, `--value-hi` and `--value-lo` (hi × 10^6 + lo ms, |hi| ≤ 16,777,215, |lo| < 10^6), carried as days, seconds and ms, each under 2^24, the large terms added last: utcDay to timeSecond every original right (utcMinute 18, timeSecond 19, before 0), utcSunday 40 and the other weekdays 19 each (before 0), week edges 181 right (before 12), utcMonth 50 and utcYear 24 (before 0), calendar edges 133, utcFormat 134 of 138 (before 2), 14 of 16 printed at load (before 4), none wrong (the probes checks with ENGINES=Firefox, 2026-11-02). Still failed: a time past the parts' range (years 1438 to 2501: a first-century date, the years −2, 123, 10002), a count of 2^24 or more, and the whole number of a parts answer whose |hi| is 16 or more, which Firefox gives as no number. A literal sum in `calc()` is folded in floats too: `x - 16777216 + 0.5` tests x against 16,777,216, so the flags compare against a whole number. A solve (`.dcss-solve`, Newton's, a turning point, `.dcss-solve-every`) answers in 32-bit floats: x moves no closer than a float's step at the bracket's larger end, so its `--dcss-solve-width` is max(|from|, |to|) / 2^21 more there (4 such steps, src/root.mjs `GRID`) and the answer within it of where f, as Firefox works it out, changes sign; against the root in doubles rounded to a 32-bit float, Kepler's E at 52 and 24 levels is within 5.2 and 5.8 float steps, f's own rounding included, and Newton's within 2.9e-6, none outside the width and f's rounding over its slope (root/check.mjs, 211 of 219 answered, the 8 failures the others make; before 2026-11-02 every solve failed there)
- Affects: Firefox only; what it computes right still answers. Before any of it, Firefox parses each number the page writes to a 32-bit float: a key or item past 7 significant digits is that float there (a bisect-left of 6.0000001 or 6.000000000000001 over [1, 6, 6, 9] read 1 for d3's 3, error 0, and a list holding 6.0000001 answered as whole, where Chrome and WebKit fail on it; a scratchpad probe, f32key.mjs, 2026-11-02). Its arithmetic sees only the parsed number, and no digit count bounds the loss (2.675, four digits, is the float 2.67499995, which a float product rounds to 2.68 at 2 places, d3 2.67), so an answer that differs across the float's doubles is wrong there with error 0, a bug (rule 6), in any call not made to tell. The written text is still there: an unregistered `--value` keeps it, and in Firefox `@container style(--value: var(--f))`, `--f` a registered `<number>` of `var(--value)`, matches exactly when the text is the float's own 6-significant-digit serialization (15 of 29 texts matched, every one that equals it; 1.2499999999999998, 6.0000001, 1234567, 16777217 and 1e-46 did not; a change by script drops the match in one frame; a scratchpad probe, match.mjs, 2026-11-03), so a call whose value sits above its answer's element can tell a held text from one the float lost The discrete calls do: rounding keeps order, so only a tie between floats is in doubt; bisect and `.dcss-ascending`/`.dcss-descending` compare a tied pair's texts with `style(--value: var(--q))` (equal texts are equal numbers, else error 1), and medianIndex and quantileIndex fail on an item whose text its float doesn't hold (a scratchpad probe, q.mjs, 2026-11-03: of 98 calls on such numbers, 20 wrong with error 0 before, 0 after; `calc(2 + 0)` against `2` is a tie with two texts there, and fails).

### Q17 Chrome, Firefox: a counter style's text past a length prints its fallback, decimal digits that look right

- Feature: `@counter-style`
- Spec: [CSS Counter Styles 3 §3](https://drafts.csswg.org/css-counter-styles-3/#counter-style-system): a UA may cap a representation's length (at least 60), using the fallback past it
- Engines: Chrome FAIL: past 120 symbols (`dcss-tally` from 2,519,999 read 448 for 2,519,999) · Firefox FAIL: past 150 code points however few the symbols (`dcss-tally` from 318,999 read 384; `.dcss-int`'s one 24-bit line from 614,401 read 321) · WebKit PASS: none at 200,000
- Repro: `facts/at-counter-style/counter-style-length-cap.mjs`, at the repository's root; `probes/dcss/counters/int-check.mjs` (614,401 and its neighbours); a scratchpad probe, tally.mjs (2026-11-01)
- Bug: none filed: the spec allows the cap
- Workaround: every line is kept within both caps where it can be (`.dcss-int` prints 12 bits across and 19 down, at most 15 and 128 code points; a reduction's line is glyphs of 16,384 px, so 2^19 px is 32 code points, about 2.2M px 150); where it can't (`dcss-tally`, `dcss-tally4`, `dcss-kilo`) the style falls back to `dcss-dcss-tfall`, one thin space from no font of the library's, never a whole number of px (25.609 in Chrome, 25.633 in Firefox), and `.dcss-text` gives error 1 for a width that isn't whole. tally.mjs: Chrome 10 right and 3 failed of 13, Firefox 5 and 8, WebKit 13 of 13, none wrong. The reductions' lines (`dcss-dcss-bits`) fail in Firefox from 2^19 px, where it also reads them off
- Affects: `.dcss-text`, `.dcss-two`, `.dcss-int` and the reductions, in Chrome and Firefox past those lengths: failed, never wrong

### Q18 WebKit: an item whose box is made after load is left out of a counter already printed

- Feature: `counter-increment`, `counter()`
- Spec: [CSS Lists 3 §4](https://drafts.csswg.org/css-lists-3/#auto-numbering): a counter's value at an element is the sum of the increments before it in the tree
- Engines: Chrome PASS · Firefox PASS · WebKit FAIL: a sum of 82 read 82 after a 5 was appended and after a hidden 100 was shown, error 0, until the reader's own box is made again; a changed increment on an item there at load is seen
- Repro: `facts/counter-increment/counter-late-box-stale.mjs`, at the repository's root; `probes/dcss/counters/late-check.mjs`
- Bug: none filed yet
- Workaround: in every engine, a sum's, count's, length's and mean's two lines are both on the list's last item, and each item's `counter-increment` starts as 2^24 on both lines for 1 ms (`animation: … 1ms steps(1, end)`, no fill), which makes WebKit count an item put in, any number at once and anywhere, or replaced in one task, and fails on the answer (error 1) until it is counted, with nothing running at rest (`probes/dcss/counters/burst-check.mjs`: 28 of 28, 8 of 24 before); its cost is the load, once: 1.0 s against 0.23 s for 128 sums of 64 items, 7.6 to 11 s against 1.8 to 2.7 s for 32 of 3,000, and nothing at rest or while a value moves once loaded (20 ms a change at most for 96,000 items, 42 without; `probes/dcss/counters/again-cost.mjs`). Each item's style made again after load is the cost: a no-op keyframe (`opacity`) costs the same. What else was measured and missed: a transition from `@starting-style` on `counter-increment` (starts, no recount: 8 of 28); one on a registered property the increments read (28 of 28, but 24 s to load); held to after load by one animation on the list (11.7 to 16 s: the list's change restyles every item); an animation on the list alone, or each item's increment changed by its place mod 64 and mod 63 from the end, or a 0 s animation (8 of 28 each: WebKit recounts an item only when its own increment changes after it is put in, and only for the counters that changed). Each item's `display` set by its place mod 5 did it before 2026-11-01 and missed five put in at once in one place (113 read 88, error 0) and a replace. Making the readers again alone doesn't do it for an item put in before another: its content changed, its count stayed, and a line outside the remade items lost them. The bins' readers, in their own list, end their `content` in as many empty strings as the list's items mod 64, written by a `:has()` rule on the last item's place that sets the reader's `content` itself (set through a `var()` on the figure, WebKit made the reader again only for an item added after the last: `facts/counter/counter-reprint-by-content.mjs`), so an item put in or taken out anywhere is counted; 64 put in at once, or one taken out and one put in in the same task (the length unchanged), is missed. `.dcss-int`, which can't see the page's items, steps its lines' `content` every 0.1 s. An item is left out by its `hidden` attribute alone. At rest, WebKit (3 runs each): 128 sums 11.9 ms a frame, all of it their scroll reads (Q13; 0.3 with none) (`probes/dcss/counters/rest-cost.mjs`); bins, 64 values and 10 bins a figure, 20 figures 7.4 against 7.2, 128 figures 48.7 against 46; 128 `.dcss-int`s 3.3 to 4.3 against 0.3, and in Chrome 1.31 against 0.07 (2026-11-01, one run of 3 s: the step runs in every engine, since no CSS tells a stale print). The list's `display` stepped every 0.1 s instead cost 25.1 for the sums and 92 to 158 for 128 bin figures, and held bin-check's page of 462 figures to one frame in 3 s
A page whose script replaces an item counts it in WebKit by removing and putting back the reader (or the bin's list) after the replace, or by taking out and putting in a frame apart; nothing in CSS on dcss's own elements does (stepping the reader's content, display, position, float, counter-reset, or its pseudo-elements' display: 2026-11-01), only remaking the items' parent's box (facts/counter/counter-replace-parent-display.mjs), which is the page's own. For a bin, whose items are the call's own list, each item adds 2048 to every bin for 1 ms instead of its own 1 (`@keyframes { from { counter-increment: … 2048 } }`, `steps(1, end)`, WebKit alone), so while it waits each bin reads past 1,024 and fails: at load and after an append, a bin fails until the item is counted, then right, never 0 with error 0 (bin-check reads before the first frame: each bin right or failed); a replace is counted two frames later and reads the old count less the item meanwhile, error 0 (scratchpad once/big.mjs; with `none` in the keyframe, load read 1,740 of 4,609 right with error 0 before the first frame); the step ends with the first rendered frame, not by time: bin-check's page (462 figures) takes 77 s to its first two frames in headless WebKit 26.4, with or without the step, and a 10 s timer wait before them still reads 1,740, while a 6-item list reads right after a 1 s timer wait; until that first frame ends a bin fails (a tab not yet shown is not measured) (facts/counter-increment/counter-replace-increment-from-none.mjs, late-check.mjs).
- Affects: `.dcss-int` in WebKit, for an item put in where one was taken out in the same task, and a bin for 64 put in at once (error 0); `.dcss-int` up to 0.1 s late; a bin's replace a frame late

### Q19 Chrome, Firefox: printing stops scroll timelines

- Feature: `animation-timeline: scroll()`
- Spec: [Scroll-driven Animations 1 §2](https://drafts.csswg.org/scroll-animations-1/#scroll-timelines): a scroll timeline follows its scroller's scroll range; nothing is said of print
- Engines: Chrome FAIL: a scroll range of 82 px printed as the animation's unanimated value; view timelines print right · Firefox FAIL: scroll and view timelines alike · WebKit not run: Playwright prints only Chrome
- Repro: `facts/scroll/print-scroll-timeline.mjs`, at the repository's root; `probes/dcss/counters/print-check.mjs`
- Bug: none filed yet
- Workaround: every call that reads a scroll range (the reductions, the order family and its index reads, bins) gives error 1 under `@media print` (`--dcss-dcss-print`), so it prints nothing where it would print 0; the summary and the quantile scale read view timelines and print their answers in Chrome
- Affects: a printed page or PDF: `.dcss-sum`, `.dcss-count`, `.dcss-length`, `.dcss-mean`, `.dcss-min`, `.dcss-max`, `.dcss-extent`, `.dcss-median` and the order family, `.dcss-bin`: failed, never wrong

### Q20 WebKit: a view timeline's read just under 2^23 px loses half a pixel

- Feature: `view-timeline`, `animation-range`
- Spec: [Scroll-driven Animations 1 §3](https://drafts.csswg.org/scroll-animations-1/#view-timelines): a view timeline's progress follows its subject's position in the scroller, to the pixel the layout gives
- Engines: Chrome PASS · Firefox not run · WebKit FAIL: the quantile scale's column 3, which starts at 2^23 − 1 px less the gap between the largest value at most the query and the smallest above it, read 8,388,480 + 3968 for 3969; 52 of 1,329 calls off by one range, error 0
- Repro: `probes/dcss/one-list/scale-check.mjs` before 2026-11-01; `facts/view-timeline/view-timeline-window-width.mjs`, at the repository's root
- Bug: none filed yet
- Workaround: the quantile scale's layout stays under 2^22 px (2026-11-03, one unit one px): whole numbers from lo to lo + 4,194,303 (by default -131,072 to 4,063,231), and under 2^19 px where calc() keeps 32-bit floats (Firefox: lo + 524,287, by default to 393,215); a list past them, or with a fraction, gives error 1, a failure
- Affects: `.dcss-scale-quantile` in every engine: lists past those bounds failed, never wrong

### Q21 WebKit, Firefox: a shadow root's `@counter-style` rules don't name the styles its own elements print

- Feature: `@counter-style`, shadow DOM
- Spec: [CSS Shadow 1 §4.2](https://drafts.csswg.org/css-shadow-1/#shadow-names): a name defined by an at-rule in a shadow tree is found by that tree's own elements
- Engines: Chrome PASS · WebKit FAIL: a sum of (12, 40, 30) in a declarative shadow root, the sheets linked inside it and their `@property` and `@font-face` rules in the document, read 141, error 0 · Firefox FAIL: 127, error 0 (Chrome 155, WebKit 26.4, Firefox 159). With the sheets only inside the root no call answers in any engine (`@property` and `@font-face` there apply to nothing in Chrome either); with the sheets linked in the document too, 82 in all three
- Repro: `facts/at-counter-style/counter-style-in-shadow-root.mjs`, at the repository's root; a probe in the session's scratchpad (shadow/p.mjs, 2026-11-01): the sum and `--dcss-err` read inside the root, with none, some or all of the sheets' at-rules in the document
- Bug: none filed yet
- Workaround: none in the sheet yet: a page that puts dcss inside a shadow root links the same sheets in the document too (README, Installation)
- Affects: a call inside a shadow root whose document holds a family's `@property` and `@font-face` rules but not its `@counter-style` rules, which only a sheet split by hand gives: wrong with error 0 in WebKit and Firefox. With whole sheets linked in the document (none, store.css, dcss.css, families/array.css, both, all three), the sum reads 82, no answer, or error 1 in all three engines (shadow/q.mjs, 2026-11-01)

### Q22 WebKit: a reduction in a later column of a fixed-height multicol reads wrong, after a relayout and sometimes at load

- Feature: `multi-column`, `scroll()` timelines
- Spec: [CSS Multi-column Layout 1 §7.1](https://drafts.csswg.org/css-multicol-1/#cf): content is laid out in columns as it would be on pages, each box its own size
- Engines: Chrome PASS · WebKit FAIL: three `.dcss-count` figures of 3 items after 0, 600 and 1,200 characters of text in a `columns: 3; height: 200px` box read 3 on load and 6, 4, 4 after its width changed by 1 px and back, error 0; sums and means beside them right in that layout (WebKit 26.4); in the brainstormer's (cols/h.mjs: five calls after 0, 600 and 1,200 characters) sums 82, 20, -9, means 27.33, 1.26, 0.87 and counts 6, 3, 3, medians and maxes right; the figures stay at scroll 0, 0, so the origin snap doesn't change it · Firefox not run
- Repro: a probe in the session's scratchpad (cols/m.mjs, 2026-11-01); the brainstormer's cols/e.mjs to g.mjs (2026-11-02)
- Bug: none filed yet
- Since: not reproduced since 2026-11-02 (aa50ac577), when these calls moved their reads from the figure's scroll range to the list's own: 0 wrong of 252 reads in WebKit 26.4 (sum, mean, count, min, max, median and extent after 0, 600 and 1,200 characters, 12 fresh loads, each read at load and after the 1 px relayout), 0 of 126 on main (2026-11-03, scratchpad cols/m2.mjs); the brainstormer's 32 pages not rerun
- Workaround: none in the sheet, since an inline-block figure would change every page's layout (its margins stop collapsing and it sits in a line box). A page with a reduction inside columns gives the figure `display: inline-block; width: 100%` (or `vertical-align: top; width: stretch` with it), or `contain: size` with a height of its own: all 9 answers right after the relayout (cols/m.mjs). `contain: size` alone fixes them too, but the figure is then 1 px tall and its `overflow: hidden` clips what it shows. A height alone reads worse (sums -15, means 0.82); `display: flex`, `grid`, a full-width float, `contain: inline-size`, `contain: layout inline-size` don't help, nor (the brainstormer's f.mjs) `break-inside: avoid`, `contain: layout`, `contain: paint`, `display: flow-root`
- Affects (before 2026-11-02): sum, count, length and mean (and by the same reads min, max, extent, not run) inside a fixed-height multicol, in WebKit: wrong with error 0 after any relayout, and at a fresh load on 7 of 32 pages (Chrome 0 of 16; the brainstormer's cols/i.mjs to s2.mjs): the list's 0 px items are split into the next column, so the figure's scroll height goes from 2 to 64 or 93 px. CSS Fragmentation 4 §4.1 lets a UA split such a box; the bug is that one page lays out two ways. No rule on the list helps (break-*, flow-root, contain, a stacking context, `columns: 1`); a check that loads one such page in WebKit passes or fails by chance

### Q23 WebKit: a pseudo-element's container style query reads the element's parent on the first style pass

- Feature: `@container style()` on `::after`
- Spec: [CSS Conditional Rules 5 §container queries](https://drafts.csswg.org/css-conditional-5/#container-rule): a pseudo-element's query container is found from its originating element, which is a candidate for style queries
- Engines: Chrome PASS · WebKit FAIL: 14 of 16 `.dcss-date-format-*` outputs printed blank at load with error 0, their `::after` behind `@container style(--dcss-date-ok: 0)` taking the parent's 0, until any later style change (WebKit 26.4) · Firefox PASS
- Repro: probes/dcss/date-format-wave/load-check.mjs (no screenshot: a screenshot restyles); the brainstormer's fb.mjs and fc.mjs (P1237, 2026-11-02), a page with no dcss
- Bug: none filed yet
- Workaround: in the sheet: a 10 ms animation of a property of the output's own (`dcss-date-settle`, src/date-format.mjs) gives WebKit its second pass: 0 of 16 blank. The format family's `style(--dcss-fmt-short: 1)` on `::after` meets the same pass and takes the long path, the same text. Under `prefers-reduced-motion: reduce` it is `!important` in a cascade layer, so a page's `animation: none !important` reset (unlayered) can't take it away: 120 of 120 blank before, 0 after (a 40-release changelog, P1292)
- Affects: every date format at load in WebKit, before 2026-11-02

### Q24 WebKit: a moving scroll range reads off by its change times the read window's end over the range

- Feature: `animation-range` with px offsets on a `scroll()` timeline whose range changes
- Spec: [Scroll-driven Animations 1 §5.1](https://drafts.csswg.org/scroll-animations-1/#event-loop): timelines are updated once a frame, so a read between frames may give the frame before's range, but one range, its offsets resolved against it
- Engines: Chrome PASS (within 1 px, the frame before) · WebKit FAIL: a range R that moved d px since the frame before reads d x X / R off for a window ending X px from it (the window's px offsets placed by the old range, its 100% by the new): R from 131,072 to 131,172 over 1 s read 135 px off in a window of 2^24 px, 8.5 in one of 2^20, 2.1 in one of 2^18 and 1.0 in one ending 1,000 px past R (WebKit 26.4) · Firefox PASS (its reads from script trail by up to 13 units here, painted frames by 2 to 3, before and after)
- Repro: scratchpad mm/law.mjs (2026-11-02); `probes/dcss/reduce-check.mjs`, its animated lists
- Bug: none filed yet
- Workaround: in the sheet: each reduction axis is read whole in the smallest of four windows it fits, ending 8,192, 147,456, 524,288 and 999,999 px (lineReads' direct windows), and that read is put forward by the next window's: the two reads differ by d (X_i+1 - X_i) / R, so the frame's own range is read_i + X_i (read_i - read_i+1) / (X_i+1 - X_i), and at rest, or in Chrome and Firefox, the two are the same. The blog's moving max read 65 off on 9 of 30 painted frames, then 0 with 10 a frame behind (direct windows alone, the read X / R frames late: about 3 at R = 171,000 in the 524,288 window), now 0 and none behind; a 12-price ticker's painted max matched its own video frame in 0 of 93 frames, now 93 of 93 (2026-11-02, scratchpad lag/tp.mjs, by recordVideo). A view timeline beside it reads its box the frame before, as the window's px ends do, so a sum's or mean's marker read against the frame's own range mixed two frames: a sum of three moving values read 286.9 for 83.104, error 0, at each layout a script forced between frames, and in 47 of 73 reads after a frame's layout (WebKit 26.4, `probes/dcss/counters/transition-check.mjs` 78 of 112); the sum and the mean take the range the frame before instead, R / (1 + B) with B = d / R from the same two reads (lineReads' `old`), which matched the marker's read in every frame measured (18,901, 20,101 and 37,301 px; transition-check 112 of 112, the sum a frame behind and never mixed). A small range that jumps reads past its window's ends (89 px stepping by 1 read 0 against 8,192 px: a moving mean of 17, 36 and 36 read 0, error 0, in 8 of 74 frames); a direct window or the one after it held at either end is error 1 (lineReads' `clamped`), the inactive timeline of a range of 0 reading -1, the windows' initial value (scratchpad fracsum/pnt3.mjs, pnt4.mjs, 2026-11-03)
- Affects: any reduction whose values move, in WebKit, before 2026-11-02 (since the 64ths mode went, 23e73afca; that mode had divided the error by 64). Still: a read in the frame a value jumps (a loop back to its start) gives about the frame before's answer; a list from 524,288 to 999,999 px is read in the last window, which has none past it to put it forward (under 2 frames behind), and past 999,999 px by the split read's law (d x 2^24 / R off); a sum's x and y are small and read right in practice (30 of 30), though the same law applies. Before 2026-11-03, a sum or mean whose values moved, read by a script that forced a layout between frames or after a frame's layout (wrong, error 0), and a small list's range in the frame it jumps (a mean read 0); since, that frame is error 1

### Q25 Firefox: a scroll timeline's iterations read off from about 2^21 px into their window

- Feature: `animation-iteration-count` on a `scroll()` timeline with a px `animation-range`
- Spec: [Scroll-driven Animations 1 §4](https://drafts.csswg.org/scroll-animations-1/#named-range-animation-declaration): progress is the scroll offset's place in the range, each iteration an equal share of it
- Engines: Chrome PASS (within 1 px to 2^24) · Firefox FAIL: an iteration of 4,096 px read 1 px off 4,194,303 px into its window, 6.2 off 8,388,609 and 12.5 off 13,060,622, whatever the window's length (2^19 to 2^24 px), 0.08 px or less under 2,058,910 (Firefox 159) · WebKit not run; a laid-out sum's line (2026-11-02): to 2.1M px 600 of 600 right, from 2.48M to 4.16M px 7 of 300 one low, its second window's low part up to 0.66 px off (scratchpad s80/scan2.mjs).; under 2,031,616 px the low part reads within 0.13 px of a whole one (150 single items, scratchpad s80/scan3.mjs)
- Repro: scratchpad ffiter.mjs (2026-11-02): a scroller of R px, one animation of 4,096 px an iteration over N x 4,096 px from 0, read as margin-left and as a registered number
- Bug: none filed yet
- Workaround: a line's low part is read in three windows (lineReads), the first 2^21 px long, and in Firefox a sum's or mean's line from 2^21 - 65,536 = 2,031,616 px, inside the first window, is error 1 (reduce.mjs's ffLong; 4,161,536 px before 2026-11-02, when a laid-out sum of 2,586,461 read 2,586,460, error 0). A min, max or extent's stack is error 1 there from 2,031,616 px too (min(999999, 5) read 5.5 on a line of 2,131,061 px; failed from 999,999 px before 2026-11-02, when 1,851 of 1,920 seeded stacks from 999,999 px read right under the new bound and 69 past it failed, 0 wrong: scratchpad ffstack/p.mjs). Since 2026-11-02 a sum is laid out in two parts, each value's 16s across and the rest down, so its lines stay under 2^20 px for any sum to 2^24 and read whole: 600 of 600 sums from 2M to 16.7M right in Firefox (scratchpad ff24/scan.mjs), where they failed
- Affects: `.dcss-mean`, `.dcss-min`, `.dcss-max`, `.dcss-extent` in Firefox from 2,031,616 px: failed, never wrong

### Q26 Firefox: a moving answer read from script is as old as the last layout

- Feature: a reduction's answer whose items a CSS animation moves, read with `getComputedStyle`
- Spec: [Scroll-driven Animations 1 §5.1](https://drafts.csswg.org/scroll-animations-1/#event-loop): timelines are updated once a frame, so a read between frames gives the frame before's
- Engines: with nothing laying the page out between script reads 150 ms apart, a `.dcss-max` of 12 moving items read up to 3 units behind in Chrome, 0 in WebKit and up to 52 in Firefox, error 0, each Firefox read the answer at the read before; with a layout each frame (`offsetWidth` read in `requestAnimationFrame`, as a painted page lays out), 0 behind in all three (Firefox 159, 2026-11-02)
- Repro: `probes/dcss/moving-paint.mjs`
- Bug: none filed yet
- Workaround: none needed on a page that paints; a script that reads a moving answer reads it in `requestAnimationFrame`, or forces a layout first
- Affects: script reads of moving answers in Firefox, headless above all; what a page paints is the frame's answer

### Q27 Firefox: a grid's absolutely positioned item placed by a row line stays put when the row grows

- Feature: `position: absolute` with `grid-row` inside a grid whose row track grows from a child's size change alone
- Spec: [CSS Grid 2 §9.1](https://drafts.csswg.org/css-grid-2/#abspos-items): the item's containing block is the grid area its lines name, laid out with the grid
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: the order list's 1 px corner box, at `grid-column: 2; grid-row: 3`, kept its old place after a copy grew by script, so the figure's scroll height was 1 px short and the median of 82 and 5 read 43, error 0; 34 of 170 reads wrong (Firefox 159, 2026-11-03)
- Repro: `probes/dcss/one-list/grow-check.mjs` on a commit before 2026-11-03
- Bug: none filed yet
- Workaround: the corner is placed by its column line only, and `bottom: -1px` of the list (`top: 100%` read up to a pixel off past 5,000,000 px in Chrome and WebKit, one-list/domain-check.mjs): 170 of 170 right
- Affects: `.dcss-median`, `.dcss-quantile`, `.dcss-quantile-sorted` in Firefox, after an item changed, before 2026-11-03

### Q28 WebKit: an absolutely positioned grid keeps its shrink-to-fit width after its columns shrink

- Feature: a `display: grid; position: absolute` box with no width, `max-content` columns, its items' widths changed by script
- Spec: [CSS 2 §10.3.7](https://www.w3.org/TR/CSS2/visudet.html#abs-non-replaced-width): an absolutely positioned box with `width: auto` is shrink-to-fit, from its content as it is
- Engines: Chrome PASS · Firefox PASS · WebKit FAIL: after copies went 82, 83, 1000, 3, the order list's width stayed at the 1000's (the figure's scroll width 132,027, not 131,980) until something set its `min-width`, so the median of 3 and 50 read 49.5, error 0; 10 of 170 reads wrong (WebKit 26.4, 2026-11-03)
- Repro: `probes/dcss/one-list/grow-check.mjs` on a commit before 2026-11-03
- Bug: none filed yet
- Workaround: the list is `width: 0`, its columns overflowing it as its rows do, so its own width never sets the scroll range: 170 of 170 right
- Affects: `.dcss-median`, `.dcss-quantile`, `.dcss-quantile-sorted` in WebKit, after an item shrank, before 2026-11-03

### Q29 Firefox: scroll-driven reads stop on an output after a layout read inside `content-visibility: hidden`

- Feature: a call inside a `content-visibility: hidden` section, a script reading layout there (`getBoundingClientRect()` on its output), then the section shown
- Spec: [CSS Containment 2 §4](https://drafts.csswg.org/css-contain-2/#content-visibility): once shown, the contents are no longer skipped and render as usual; [Scroll-driven Animations §3](https://drafts.csswg.org/scroll-animations-1/#scroll-timelines): a timeline's progress follows its scroller
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: every scroll-driven read on the output stays at its initial 0 while the parts computed from them keep old values, for 120 frames and more; a max of [2450, 1899, 3200, 1275] read 53,941 and a min 26,428, error 0 (Firefox 159, 2026-11-03); setting the output's or the figure's `display` to none and back heals it, the list's padding or `animation-name` does not
- Repro: `probes/dcss/counters/stale-check.mjs`
- Bug: none filed yet
- Workaround: the two applied high reads (`--dcss-static-r-xr1f`, `-yr1f`) are never both under 32 (one is 0 on an all-negative list or at the stack's top; 21 lists, three engines), so a min, max or extent whose two high reads are both under 16 gives error 1 (src/reduce.mjs `stopped`): stale-check 21 of 21 error 1 there, 0 wrong; sum, count, length and mean gave error 1 already (their markers' reads)
- Affects: A251 (`.dcss-min`, `.dcss-max`, `.dcss-extent` in Firefox, after a hidden layout read, until the output is laid out again: error 1, a failure)

## Shared

- `calc()` computes in doubles in Chrome and WebKit, in 32-bit floats in Firefox
- A registered `<number>` read through `var()` keeps 6 significant digits in Chrome and Firefox
- `mod(A, B)` of a negative exact multiple of B is B in WebKit, not 0
- A registered `<integer>` from 1,000,000 reaches `var()` with 6 significant digits in Chrome, so a reduction's item travels as three integers of 6 digits at most
- Chrome lays a grid whose tracks add up past 2^25 px out 0 px wide, so a mean's list holds a 1 px `::before` to tell
- WebKit gives `-0 - 0` and `round(up, -0.5, 1)` as 0, and Chrome -0 plus a `clamp()` over a px ratio as 0, so the MathML build writes a - b as a + -1 · b and a ceiling as -floor(-x)
- Chrome reads a number token from 3.4e38 up as 3.4e38, so the MathML build fails such a `<cn>` and a name set that large has no answer
- `tan(atan2(L, 1px))` is wrong in WebKit
- Firefox's `style()` never sees a value set by an animation
- Firefox 159 has view timelines and `timeline-scope`, where 158 had neither
