# Changelog

All notable changes to dcss-array.css are written here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html): a class, an input, an output, a function or a file removed or changed in meaning is a major version.

## [Unreleased]

### Added

- One file per public class in `parts/` (`parts/dcss-median.css`), each its family's rules cut to that call, usable without `dcss-array.css`.
- One set of typed input names, `--length`, `--type-N` and `--value-N`, on order, aggregate and extrema calls; each family's own names still work.
- CSS functions where the browser has `@function`: every easing (`--dcss-ease-cubic-in-out(t)`) and two-stop linear, pow, sqrt and log scales (`--dcss-scale-linear(x, d0, d1, r0, r1)`).
- ISO date formats in the date parsers: `%Y-%m-%d`, `%Y-%m-%dT%H:%M:%SZ` and `%Y-%m-%dT%H:%M:%S.%LZ`.
- License headers (SPDX) on every sheet; `package.json` for npm.

### Changed

- The sheet's own names (its grids, readers and internal numbers, `arrays-*` before) are `dcss-*`; the 40 that a call also used have names of their own (`.dcss-width-sum`, `--dcss-array-length`; the list is `src/names.mjs`'s `RENAMED`).

- The list median, quantile, quantileSorted and quantile scale take 1/64 steps within ±131,072 and whole numbers up to 8,257,535 (was ±1024).
- Smaller sheets: `families/order.css` 12.6 to 1.8 MB, `color-text.css` 14.6 to 3.7 MB, `date-parse.css` 4.2 to 1.0 MB, `date-parse-local.css` 7.5 to 1.1 MB, `aggregate.css` 6.3 to 4.0 MB, with the same answers.

### Fixed

- medianIndex and quantileIndex return d3's index on ties and at p 0 and 1.
- An order call published other operations' results under their names.
- Pow and sqrt scales gave no value in WebKit (their answers passed WebKit's 65,535-token `var()` limit); log scales gave NaN in every engine for scales of fewer than 8 stops. Linear, pow and sqrt now equal d3 exactly; log is within 256 × 2^-52.
- Parts printed garbage for text without `dcss-array.css` (the axes and the reductions' default output); they carry the counter styles they print with.
- Fixed, percent and SI formats printed 0 for a missing or NaN value; they print nothing and set `--dcss-err: 1`.
