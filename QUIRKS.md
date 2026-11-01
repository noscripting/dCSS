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
- Engines: Chrome FAIL: ticks 100 to 600 compute but lay out 0 px wide, and an axis's labels beside them go blank · WebKit PASS · Firefox PASS
- Repro: `quirks/cq-counter-unhidden.html`
- Bug: none found
- Workaround: ticks past the last one are `visibility: hidden; position: absolute`, never `display: none`, so their counters exist from the first layout (`src/ticks.mjs`). A page printing `--dcss-tick` with its own `counter()` needs nothing more. A page's own message around an answer: show the answer by default and hide it in error; hiding it until `--dcss-ready` is 1 and then showing it leaves a mean's, min's or max's number blank in Chrome (README's error section; a review, 2026-10-29).
- Affects: A58

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
- Bug: [webkit.org/b/327680](https://bugs.webkit.org/show_bug.cgi?id=327680), fixed in WebKit's trunk 2026-10-22 (de90a27a2d), after 26.4
- Workaround: a reduction's reads animate the elements after its list (`scroll(nearest)`), not the figure, so the items are not restyled with them: 128 sum figures of 1,000 items cost 18.7 ms of render a frame at rest, 48.0 ms read on the figure (`probes/dcss/counters/race.mjs`, one run each beside other checks, 2026-11-01). Every other call still reads its list by its own scroll range: each such figure is restyled every frame with its items (128 figures of 1,000 items, 44 ms of style a frame at rest, 2026-10-31).
- Cost: an element's, not its animations': 128 sum figures at rest, 10.3 ms of render a frame with one scroll-driven animation an `<output>`, 10.2 with two, 10.9 with six, 10.3 with one on `view()`, 0.29 with none (`probes/dcss/counters/rest-cost.mjs`, 2026-11-01, one run each); Chrome 0.50 as built, 0.07 with none. A page of many figures pays it until Safari ships the fix.
- Affects: every reduction and every call read by scroll timelines, in pages of many calls

### Q14 Chrome, WebKit: under an ancestor's CSS `zoom` below 1.25 other than 1, reads leave the 1/64 px grid

- Feature: `zoom`
- Spec: [CSS Viewport 1 §5](https://drafts.csswg.org/css-viewport/#zoom-property)
- Engines: Chrome FAIL: zoom on the body at 0.5, 0.75, 0.8, 0.9 and 1.1, 2 or 3 of 24 lists 1/64 off; texts right · WebKit FAIL: 0.5 and 0.75 2 of 24; 0.8, 0.9 and 1.1 11 or 12 of 24 off by up to 2, and every text (185,505.90 for 185,506) · both right at 1.25, 1.5, 2, 2.5 and 3 · Firefox NOTRUN
- Repro: `probes/dcss/counters/font-size-check.mjs` (`ONLY=zoom`; `--stair`, the sheet from before the counters: 13 and 14 of 24 off at 0.8)
- Bug: none filed: a value in 64ths times 0.8 is off the 1/64 px layout grid in any engine; WebKit's text at a fractional zoomed size is wider than its glyphs
- Workaround: WebKit: refused (error 1) below 1.25 other than 1, by the root's font size (its `1em`, a registered length) against the element's `1rem`, which WebKit gives as 1/z of it (font-size-check `ONLY=zoom`: 0 wrong, 2026-11-01). Chrome: none in the sheet: neither engine has `zoom: reset` (an element inside zoom 0.8 lays out at 0.8, 2026-11-01), and Chrome shows the zoom to no value a rule can test (inside zoom 0.8, `100vw`, `100vh`, `1rem` and a container's `100cqw` across the zoom equal the root's; WebKit's are 1.25 times: scratchpad probe, 2026-11-01). Browser zoom is not this: device scale 0.9 to 3 reads right in both. A page that zooms keeps its figures outside the zoomed element.
- Affects: every read under an ancestor's CSS `zoom`

### Q15 WebKit: `counter()` inside a size container reads 0 for a counter set outside it, or on it

- Feature: `counter()`, `contain: style`, `container-type`
- Spec: [CSS Containment 2 §3.3](https://drafts.csswg.org/css-contain-2/#containment-style): style containment scopes the counters a subtree changes, not the ones it reads
- Engines: Chrome PASS · WebKit FAIL: a `.dcss-int` inside a `container-type: inline-size` card read 0 for a counter set to 1,234 outside the card, and 0 for 77 set on the card itself; one set inside the card (a child's `counter-reset`, a table's rows) read right · Firefox PASS
- Repro: `probes/dcss/counters/int-check.mjs` (the card cases); `facts/counter/counter-read-inside-containment.mjs`, at the repository's root
- Bug: none filed yet
- Workaround: in WebKit (where `-apple-pay-button-style` parses) a `.dcss-int` inside any size container (`@container (width >= 0px)`) that reads 0 gives error 1: it can't tell a counter at 0 from one it can't see. `contain: style` alone is not a container a query sees, so a reader under it still reads 0 with no error there. The lists' own counters are set inside the list and are not touched (a sum inside a card reads right in both engines, 2026-11-01)
- Affects: `.dcss-int` inside a page's container or `contain: style` box whose counter is set outside it

## Shared

- `calc()` computes in doubles in Chrome and WebKit, in 32-bit floats in Firefox
- A registered `<number>` read through `var()` keeps 6 significant digits in Chrome and Firefox
- `mod(A, B)` of a negative exact multiple of B is B in WebKit, not 0
- A registered `<integer>` from 1,000,000 reaches `var()` with 6 significant digits in Chrome, so a reduction's item travels as three integers of 6 digits at most
- Chrome lays a grid whose tracks add up past 2^25 px out 0 px wide, so a mean's list holds a 1 px `::before` to tell
- WebKit gives `-0 - 0` and `round(up, -0.5, 1)` as 0, and Chrome -0 plus a `clamp()` over a px ratio as 0, so the MathML build writes a - b as a + -1 · b and a ceiling as -floor(-x)
- Chrome reads a number token from 3.4e38 up as 3.4e38, so the MathML build refuses such a `<cn>` and a name set that large has no answer
- `tan(atan2(L, 1px))` is wrong in WebKit
- Firefox's `style()` never sees a value set by an animation
- Firefox 158 has no view timelines by default
