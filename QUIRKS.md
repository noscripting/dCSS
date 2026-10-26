# dcss-array.css: QUIRKS

The engine bugs dcss-array.css meets when it computes with layout, and what the sheet does about each.

Measured 2026-10-22, headless: Chrome 155.0.8059.86, WebKit 26.4, Firefox 158.0.

### Q1 WebKit: a balanced multicol keeps the height its tallest block had

- Feature: `multi-column`
- Spec: [CSS Multi-column Layout 1 §7.1](https://drafts.csswg.org/css-multicol-1/#cf)
- Engines: Chrome PASS · WebKit FAIL: 100 px tall for 20 after its 100 px block shrinks to 10 px · Firefox PASS
- Repro: `quirks/multicol-shrink.html`
- Bug: none found
- Workaround: `.arrays-columns` sits in an `.arrays-alternate` as two copies, shown in turn by `--arrays-parity` at each change, so every layout starts from a box that was `display: none`.
- Affects: A45

### Q2 WebKit: a shrink-to-fit box takes the width a vertical aspect-ratio box had in its last layout

- Feature: `aspect-ratio`
- Spec: [CSS Box Sizing 4 §4.2](https://drafts.csswg.org/css-sizing-4/#aspect-ratio-automatic)
- Engines: Chrome PASS · WebKit FAIL: 40 px wide for 70 after the box's content grows from 40 to 70 px · Firefox PASS
- Repro: `quirks/orthogonal-aspect-ratio.html`
- Bug: none found
- Workaround: `.arrays-turn` puts the vertical box in a `max-content` grid column and changes its `max-height` by `--arrays-tick` whenever an input under it changes.
- Affects: A49

### Q3 Firefox: `anchor-size()` keeps the size its anchor had when the box was laid out

- Feature: `anchor-positioning`
- Spec: [CSS Anchor Positioning 1 §5.1](https://drafts.csswg.org/css-anchor-position-1/#anchor-size-fn)
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: 20 px wide after its anchor grew from 20 to 60 px
- Repro: `quirks/anchor-size-follows.html`
- Bug: none found
- Workaround: the `.arrays-calc` boxes and the results they name sit in a container as wide as its content (`width: max-content`), so a changed result resizes the container and Firefox lays the boxes out again (check 69). Comparisons of `anchor-size()` in a box's `top`, and `anchor()` edges, followed their anchors on every frame of `probes/anchor-sort-check.mjs`, where an `anchor-size()` width was a frame stale once in 40. No way in the sheet alone (`probes/anchor-size-ways.mjs`, 2026-10-23): `position-anchor` with `anchor-size(width)` and `position-visibility` stay at 20 px; `anchor()` insets follow (60), but a product of two anchors' insets stays stale (60 for 180).
- Affects: A41

### Q4 Firefox: a tab skips the stop 0.5ch away in a font with no 0 glyph

- Feature: `tab-size`
- Spec: [CSS Text 3 §4.2](https://drafts.csswg.org/css-text-3/#tab-size-property)
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: the box after the tab at 32 px for 16, 1ch being 8 px
- Repro: `quirks/tab-no-zero.html`
- Bug: none found
- Workaround: the sheet's text fonts carry a 1 px `0` glyph, so 1ch is 1 px and every tab of `.arrays-divide` lands on its stop.
- Affects: A44

### Q5 Firefox: a size container reads `100cqh` as the viewport's height when its grid column is sized after the rows

- Feature: `container-queries`
- Spec: [CSS Conditional Rules 5 §7](https://drafts.csswg.org/css-conditional-5/#container-lengths)
- Engines: Chrome PASS · WebKit PASS · Firefox FAIL: 200 px, the viewport's height, for a 40 px container
- Repro: `quirks/cq-after-regrid.html`
- Bug: none found
- Workaround: a collapse over a hop's column goes in an `.arrays-hop`'s `<u>` (check 65): Firefox lays a collapse that is itself a grid item in that column out with the column from the frame before, but one inside a hop on time. The row that hop makes is still a frame late in Firefox (the rows sized again after the second column pass), so a collapse read by its row stays a Firefox failure. On `.arrays-array`, `contain: none`, `width: max-content` and `height: max-content`, alone or together, leave check 65 failing in Firefox (2026-10-23).
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
- Workaround: ticks past the last one are `visibility: hidden; position: absolute`, never `display: none`, so their counters exist from the first layout (`ticks.mjs`). A page printing `--dcss-tick` with its own `counter()` needs nothing more.
- Affects: A58

## Shared

- `calc()` computes in doubles in Chrome and WebKit, in 32-bit floats in Firefox
- A registered `<number>` read through `var()` keeps 6 significant digits in Chrome and Firefox
- `mod(A, B)` of a negative exact multiple of B is B in WebKit, not 0
- `tan(atan2(L, 1px))` is wrong in WebKit
- Firefox's `style()` never sees a value set by an animation
- Firefox 158 has no view timelines by default
