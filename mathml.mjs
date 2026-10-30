// node libraries/dcss/mathml.mjs <page.html>: a page whose formulas are written in Content MathML, each compiled to a
// calc() the page computes, on stdout; exits 1 with file:line and the reason on a formula it can't take.
// Content MathML (MathML 4, chapter 4) says what a formula means; Chrome and Safari draw none of it and CSS can't read a
// <cn>'s text, so a page can't compute on it: this build writes each formula as the calc() of d3's own operations, and
// keeps the formula, as Presentation MathML with the author's Content MathML as its annotation, for readers.
//   <math><apply><median/><apply><mean/><cn>4</cn><cn>1.5</cn></apply><ci>jan</ci></apply></math>
// becomes a figure with the formula as its caption and an <output> whose --value is d3.median([d3.mean([4, 1.5]),
// jan]) to the bit, jan read from --jan on an ancestor (unset: no answer, --dcss-err 1). Only a <math> whose one element
// child is an <apply> of an operator it takes, or a <piecewise>, is compiled; the rest of the page is copied byte for byte, so the build
// run on its own output changes nothing.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const manifest = JSON.parse(readFileSync(new URL('families.json', import.meta.url), 'utf8')), families = manifest.families;
// the family sheets a page's dcss- classes need, in families.json's order (as runtime.mjs picks them, read from the
// published families.json alone, so this file runs from the package with nothing else); dcss-extras.css when the page
// uses its lists, loops or sheets
const owners = { ...manifest.operations.owned, ...manifest.operations.styling };
function stylesheetsFor(html) {
  const names = new Set([...html.matchAll(/\.(dcss-[\w-]+)/g)].map((m) => m[1])), extras = /\.(?:list|pager|sheet|loop-(?:flow|core|cell|measure|in))(?![\w-])/.test(html);
  let usesExtras = extras;
  for (const m of html.matchAll(/\bclass\s*=\s*(?:(['"])([^'"]*)\1|([^\s>]+))/g)) for (const c of (m[2] ?? m[3]).split(/\s+/)) {
    if (c.startsWith('dcss-')) names.add(c);
    if (/^(list|pager|sheet|loop-(?:flow|core|cell|measure|in(?:-[23])?))$/.test(c)) usesExtras = true; }
  const picked = new Set(Object.entries(families).filter(([, f]) => f.classes.some((c) => names.has(c))).map(([k]) => k));
  for (const c of names) if (owners[c]?.family) picked.add(owners[c].family);
  for (let more = true; more;) { more = false; for (const k of [...picked]) for (const d of families[k].dependencies) if (!picked.has(d)) { picked.add(d); more = true; } }
  return [...manifest.order.filter((k) => picked.has(k)).map((k) => families[k].file), ...(usesExtras ? [manifest.extras.file] : [])];
}
const manifestOwners = Object.fromEntries(Object.values(families).map((f) => [f.file, f.classes]));

// --- reading the page as the HTML parser does: comments, raw-text elements, tags with lower-case names, references
const RAW = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript', 'template']);
// start tags that close an open <p> (the HTML standard's list, "in body")
const CLOSES_P = new Set(['address', 'article', 'aside', 'blockquote', 'center', 'details', 'dialog', 'dir', 'div', 'dl', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'menu', 'nav', 'ol',
  'p', 'pre', 'search', 'section', 'table', 'ul', 'li', 'dd', 'dt', 'plaintext', 'listing', 'xmp']);
// HTML start tags that break out of MathML (the parser closes the <math>): a formula holding one isn't a formula
const BREAKS = new Set(['b', 'big', 'blockquote', 'body', 'br', 'center', 'code', 'dd', 'div', 'dl', 'dt', 'em', 'embed', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'head', 'hr', 'i', 'img', 'li', 'listing', 'menu', 'meta', 'nobr', 'ol', 'p', 'pre', 'ruby', 's', 'small', 'span',
  'strong', 'strike', 'sub', 'sup', 'table', 'tt', 'u', 'ul', 'var']);
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', minus: '−', InvisibleTimes: '⁢', ApplyFunction: '⁡', af: '⁡' };
const decode = (s, where) => s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);?/gi, (m, r) => {
  if (r[0] === '#') return String.fromCodePoint(r[1] === 'x' || r[1] === 'X' ? parseInt(r.slice(2), 16) : +r.slice(1));
  if (r in NAMED) return NAMED[r];
  throw refusal(where, `the character reference ${m} is one this build doesn't know: write the character itself`);
});
class Refusal extends Error {}
const refusal = (at, why) => Object.assign(new Refusal(why), { at });
const attrRe = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const readAttrs = (s, at) => { const out = {}; for (const m of s.matchAll(attrRe)) { const k = m[1].toLowerCase(); if (!(k in out)) out[k] = decode(m[2] ?? m[3] ?? m[4] ?? '', at); } return out; };
// one tag at i (s[i] === '<'): { name, end, close, self, attrs, length } or null for text
const tagAt = (s, i) => {
  const m = /^<(\/?)([a-zA-Z][^\s/>]*)((?:\s+(?:[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)|\s*\/(?!>))*)\s*(\/?)>/.exec(s.slice(i, i + 4096));
  return m && { name: m[2].toLowerCase(), close: !!m[1], self: !!m[4], rawAttrs: m[3], length: m[0].length };
};

// --- the <math> subtree, as foreign content: elements, text, self-closing tags honoured
function parseMath(src, start) {
  const root = { name: 'math', attrs: {}, children: [], start }, stack = [root];
  const open = tagAt(src, start); root.attrs = readAttrs(open.rawAttrs, start); root.openEnd = start + open.length;
  let i = root.openEnd;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) break;
    if (lt > i) stack.at(-1).children.push({ text: decode(src.slice(i, lt), i), start: i, end: lt });
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e < 0 ? src.length : e + 3; continue; }
    if (src.startsWith('<![CDATA[', lt)) { const e = src.indexOf(']]>', lt); stack.at(-1).children.push({ text: src.slice(lt + 9, e), start: lt, end: e + 3 }); i = e + 3; continue; }
    const t = tagAt(src, lt);
    if (!t) { stack.at(-1).children.push({ text: '<', start: lt, end: lt + 1 }); i = lt + 1; continue; }
    if (t.close) {
      const k = stack.map((n) => n.name).lastIndexOf(t.name);
      if (k < 0) throw refusal(lt, `</${t.name}> closes nothing open in this formula`);
      if (k !== stack.length - 1) throw refusal(lt, `<${stack.at(-1).name}> is not closed before </${t.name}>`);
      const done = stack.pop(); done.end = lt + t.length; i = done.end;
      if (done === root) return root;
      continue;
    }
    if (BREAKS.has(t.name) || (t.name === 'font' && /\b(color|face|size)\s*=/i.test(t.rawAttrs))) throw refusal(lt, `<${t.name}> is HTML: the browser would close the formula there`);
    const el = { name: t.name, attrs: readAttrs(t.rawAttrs, lt), children: [], start: lt };
    stack.at(-1).children.push(el);
    if (t.self) el.end = lt + t.length; else stack.push(el);
    i = lt + t.length;
  }
  throw refusal(start, 'this <math> is never closed');
}
const elements = (n) => n.children.filter((c) => c.name);
const textOf = (n) => n.children.map((c) => (c.name ? textOf(c) : c.text)).join('');
const blank = (n) => n.children.every((c) => c.name || !c.text.trim());

// --- numbers: each <cn> as the double JavaScript reads from its text, what d3 would be given, and its magnitude as
// Presentation MathML (the sign apart)
const MAX = 2 ** 53;
// Chrome clamps a number token, written or brought by var(), to a 32-bit float's largest (1e40 reads 3.4028234663852886e38;
// a value inside a calculation stays a double): measured 2026-10-29, Chrome 155; WebKit doesn't
const FMAX = 3.4028234663852886e38;
function number(cn) {
  const type = cn.attrs.type ?? 'real', base = cn.attrs.base;
  if (base !== undefined && base.trim() !== '10') throw refusal(cn.start, `<cn base="${base}">: this build reads numbers in base 10 only`);
  for (const k of Object.keys(cn.attrs)) if (!['type', 'base', 'id', 'xref', 'class', 'style', 'href', 'encoding'].includes(k)) throw refusal(cn.start, `<cn ${k}="…">: an attribute this build doesn't take`);
  const parts = []; let cur = '';
  for (const c of cn.children) { if (c.name === 'sep') { parts.push(cur); cur = ''; } else if (c.name) throw refusal(c.start, `<${c.name}> inside a <cn>: a number is text`); else cur += c.text; }
  parts.push(cur); const p = parts.map((x) => x.trim());
  const bad = () => refusal(cn.start, `<cn${type === 'real' ? '' : ` type="${type}"`}>${p.join('<sep/>')}</cn> is not a number this build reads`);
  const digits = (t) => t.replace(/^[+-]/, '');
  let x, mag;
  if (['real', 'integer', 'double'].includes(type)) {
    if (p.length !== 1) throw bad();
    if (type === 'real' && /^[+-]?(\d+\.?\d*|\.\d+)[eE][+-]?\d+$/.test(p[0])) throw refusal(cn.start, `<cn>${p[0]}</cn>: MathML's real number is plain decimal; a number with an exponent is <cn type="double">${p[0]}</cn>`);
    if (type === 'integer' ? !/^[+-]?\d+$/.test(p[0]) : !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(p[0]) || (type !== 'double' && /[eE]/.test(p[0]))) throw bad();
    x = Number(p[0]); mag = `<mn>${digits(p[0])}</mn>`;
  } else if (type === 'e-notation') {
    if (p.length !== 2 || !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(p[0]) || !/^[+-]?\d+$/.test(p[1])) throw bad();
    const e = Number(p[1]); x = Number(`${p[0]}e${p[1]}`);
    mag = `<mn>${digits(p[0])}</mn><mo>×</mo><msup><mn>10</mn>${e < 0 ? `<mrow><mo>−</mo><mn>${-e}</mn></mrow>` : `<mn>${e}</mn>`}</msup>`;
  } else if (type === 'rational') {
    if (p.length !== 2 || !/^[+-]?\d+$/.test(p[0]) || !/^[+-]?\d+$/.test(p[1]) || /^[+-]?0+$/.test(p[1])) throw bad();
    const [n, d] = p.map(Number);
    if (Math.abs(n) > MAX || Math.abs(d) > MAX) throw refusal(cn.start, `<cn type="rational">${p.join('<sep/>')}</cn>: a numerator or denominator past 2^53 isn't one double`);
    x = n / d; mag = `<mfrac><mn>${digits(p[0])}</mn><mn>${digits(p[1])}</mn></mfrac>`;
  } else throw refusal(cn.start, `<cn type="${type}">: this build reads integer, real, double, e-notation and rational numbers`);
  if (!Number.isFinite(x)) throw refusal(cn.start, `<cn>${p.join('<sep/>')}</cn> is past the largest double`);
  if (Math.abs(x) >= FMAX) throw refusal(cn.start, `<cn>${p.join('<sep/>')}</cn>: Chrome reads a number from 3.4e38 up as 3.4e38 (a 32-bit float's largest), so the page would compute with another number`);
  return { x, neg: x < 0 || Object.is(x, -0), mag };
}

// --- the operators: Content MathML's elements and their OpenMath symbols (MathML 4, appendix E; F.8.3 for s_data1)
const CALLS = { brackets: 'id', quotient: 'quotient', rem: 'rem', median: 'median', mean: 'mean', min: 'min', max: 'max', plus: 'sum',
  minus: 'minus', times: 'times', divide: 'divide', power: 'power', root: 'root', abs: 'abs', floor: 'floor', ceiling: 'ceiling' };
const SYMBOLS = { s_data1: ['median', 'mean'], minmax1: ['min', 'max'], arith1: ['plus', 'minus', 'unary_minus', 'times', 'divide', 'power', 'root', 'abs'], rounding1: ['floor', 'ceiling'] };
// how many arguments each takes, past the statistics' lists
const ARITY = { brackets: [1, 1], quotient: [2, 2], rem: [2, 2], minus: [1, 2], divide: [2, 2], power: [2, 2], root: [1, 1], abs: [1, 1], floor: [1, 1], ceiling: [1, 1], times: [2, Infinity], plus: [2, Infinity] };
// CSS's exp(), log() and trigonometric functions don't give the double nearest the true value: of 4,000 each (2026-10-30)
// sin() misses 3,046 in Chrome and 172 in WebKit, tan() 1,895 and 3,612, exp() 6 in both
const INEXACT = "CSS's exp(), log() and trigonometric functions don't give the double nearest the true value (sin(): 3,046 of 4,000 off in Chrome, tan(): 3,612 in WebKit)";
// exp, ln, log and the trigonometric and hyperbolic functions of numbers the build knows: computed when the page is built
// and written in as the double nearest the true value, rounded once (IEEE 754's recommended functions; log's base 10
// unless a <logbase> says, sec x as 1 / cos x and so on, each composition rounded once too). JavaScript's Math gives
// that double for exp, log, log10, log2, sin, cos, tan, asin, acos and cbrt in Chrome (200,000 of 200,000, 2026-10-30;
// probes/dcss/exact-check.mjs), not Node's (exp 993 of 20,000 off) nor Safari's (sin 842).
// The true value is computed in BigInt fixed point, Q bits past an argument's own binary exponent, then rounded.
const Q = 640n, QMAX = Q + 2000n;
const ONEM = 1n << QMAX, atanhInv = (k) => { let s = 0n, t = ONEM / k, n = 1n; while (t) { s += t / n; t /= k * k; n += 2n; } return s; };
const atanInv = (k) => { let s = 0n, t = ONEM / k, n = 1n, sg = 1n; while (t) { s += sg * t / n; t /= k * k; n += 2n; sg = -sg; } return s; };
const LN2M = 2n * atanhInv(3n), PIM = 4n * (4n * atanInv(5n) - atanInv(239n)), LN10M = 3n * LN2M + 2n * atanhInv(9n); // ln 10 = 3 ln 2 + 2 atanh(1/9)
const bitsOf = (x) => { const b = new DataView(new ArrayBuffer(8)); b.setFloat64(0, x); const hi = b.getUint32(0), lo = b.getUint32(4), ex = (hi >>> 20) & 0x7ff, m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  return { neg: hi >>> 31 === 1, mant: ex ? m | (1n << 52n) : m, e: BigInt(ex ? ex - 1075 : -1074) }; }; // |x| = mant · 2^e
const fixed64 = new Map(), at = (P) => { if (fixed64.has(P)) return fixed64.get(P);
  const ONE = 1n << P, sh = QMAX - P, LN2 = LN2M >> sh, PI = PIM >> sh, LN10 = LN10M >> sh;
  const mul = (a, b) => { const p = a * b; return p >= 0n ? p >> P : -((-p) >> P); }, div = (a, b) => (a << P) / b;
  const isqrt = (n) => { if (n < 2n) return n; let x = 1n << BigInt((n.toString(2).length + 1) >> 1); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } };
  const sqrt = (a) => isqrt(a << P), inv = (a) => div(ONE, a);
  const fix = (x) => { const { neg, mant, e } = bitsOf(x), s = P + e, v = s >= 0n ? mant << s : mant >> -s; return neg ? -v : v; };
  const exk = (X) => { let k = X / LN2; if (X < 0n) k -= 1n; const r = X - k * LN2; let s = ONE, t = ONE, n = 1n; while (t) { t = mul(t, r) / n; s += t; n++; } return [s, k]; }; // s · 2^k
  const ex = (X) => { const [s, k] = exk(X); return k >= 0n ? s << k : s >> -k; };
  const ln = (X) => { const k = BigInt(X.toString(2).length) - 1n - P, y = k >= 0n ? X >> k : X << -k, z = div(y - ONE, y + ONE), z2 = mul(z, z); let s = 0n, t = z, n = 1n; while (t) { s += t / n; t = mul(t, z2); n += 2n; } return 2n * s + k * LN2; };
  const sin = (X) => { const tp = 2n * PI; let r = X % tp; if (r > PI) r -= tp; if (r < -PI) r += tp; let s = 0n, t = r, n = 1n; while (t) { s += t; t = -mul(mul(t, r), r) / ((n + 1n) * (n + 2n)); n += 2n; } return s; };
  const cos = (X) => sin(X + PI / 2n);
  const atan = (X) => { const neg = X < 0n; let x = neg ? -X : X, add = 0n; if (x > ONE) { x = inv(x); add = PI / 2n; }
    let h = 0n; while (x > ONE >> 4n) { x = div(x, ONE + sqrt(ONE + mul(x, x))); h++; } // atan x = 2 atan(x / (1 + √(1 + x²)))
    const x2 = mul(x, x); let s = 0n, t = x, n = 1n, sg = 1n; while (t) { s += sg * t / n; t = mul(t, x2); n += 2n; sg = -sg; } s <<= h; const r = add ? add - s : s; return neg ? -r : r; };
  const asin = (X) => (X === ONE || X === -ONE ? (X > 0n ? PI : -PI) / 2n : atan(div(X, sqrt(ONE - mul(X, X)))));
  const sinh = (X) => (ex(X) - ex(-X)) / 2n, cosh = (X) => (ex(X) + ex(-X)) / 2n;
  const r = { P, ONE, fix, mul, div, inv, sqrt, exk, ex, ln, sin, cos, atan, asin, sinh, cosh, LN2, LN10, PI }; fixed64.set(P, r); return r; };
export const exactAt = (P) => at(P); // for probes/dcss/exact-check.mjs
// v / 2^P · 2^k as the nearest double (ties to even; subnormals; past the largest, Infinity). v is within 2^64 units of
// the true value (each series stops at a term of 0 units, a few hundred steps truncating): one that close to halfway
// between two doubles can't be rounded from it, and is NaN, refused (none in exact-check's 120,000)
const nearest = (v, P, k = 0n) => { if (v === 0n) return 0; const neg = v < 0n; if (neg) v = -v;
  const bits = BigInt(v.toString(2).length), e = bits - 1n - P + k; if (e > 1023n) return neg ? -Infinity : Infinity;
  let sh = bits - 53n; if (e < -1022n) sh += -1022n - e;
  let m = sh > 0n ? v >> sh : v << -sh; if (sh <= 64n) return NaN;
  { const rem = v - (m << sh), half = 1n << (sh - 1n), gap = rem - half; if ((gap < 0n ? -gap : gap) <= 1n << 64n) return NaN; if (rem > half) m += 1n; }
  const q = sh - P + k, y = q > 900n ? Number(m) * 2 ** 900 * 2 ** Number(q - 900n) : q < -900n ? Number(m) * 2 ** -900 * 2 ** Number(q + 900n) : Number(m) * 2 ** Number(q); return neg ? -y : y; };
// a true value from BigInt steps (f gets the context and x fixed; it returns null where the function has no value), at
// the precision the argument's size asks for (exp's argument is never tiny or huge where the answer is finite)
// Each value is computed twice, at P and P + 192 bits, and taken only where both round to the same double (Ziv's way: an
// error the 2^64 bound misses, from a reduction or a division that amplifies one, shrinks by 2^192 in the second)
const twice = (P, g) => { const a = g(at(P)), b = g(at(P + 192n)); return Object.is(a, b) ? a : NaN; };
// The precision starts at Q bits past the argument's own exponent and grows until the value itself has Q bits (sech of
// a large x is far smaller than x); a value of exactly 0 is taken only at x = 0 (the odd functions, -0 kept) or ±1 (ln 1,
// arccos 1); a 0 anywhere else is a value smaller than the precision, which grows for it, refused past QMAX
const trueOf = (f, wide = true) => (x, b) => { if (!Number.isFinite(x) || (b !== undefined && !Number.isFinite(b))) return NaN;
  const e = x === 0 ? 0n : (({ mant, e }) => BigInt(mant.toString(2).length) - 1n + e)(bitsOf(x)), of = (c) => f(c, c.fix(x), b === undefined ? undefined : c.fix(b));
  let P = Q + (wide ? (e < 0n ? -e : e) : 16n);
  for (;;) { const v = of(at(P)); if (v === null) return NaN; if (v === 0n && (x === 0 || Math.abs(x) === 1)) return x === 0 ? x : 0;
    const got = v === 0n ? 0n : BigInt((v < 0n ? -v : v).toString(2).length); if (got >= Q) break; P += Q - got + 64n; if (P > QMAX - 256n) return NaN; }
  return twice(P, (c) => { const v = of(c); return v === null || v === 0n ? NaN : nearest(v, c.P); }); };
const pos = (X) => X > 0n, unit = (c, X) => X >= -c.ONE && X <= c.ONE, nz = (X) => X !== 0n;
export const MATHFN = {
  exp: (x) => { if (Number.isNaN(x)) return NaN; if (x > 710) return Infinity; if (x < -746) return 0; return twice(Q + 16n, (c) => { const [s, k] = c.exk(c.fix(x)); return nearest(s, c.P, k); }); },
  ln: trueOf((c, X) => (pos(X) ? c.ln(X) : null)),
  log: trueOf((c, X, B) => (pos(X) && pos(B) && B !== c.ONE ? (B === 10n * c.ONE ? c.div(c.ln(X), c.LN10) : B === 2n * c.ONE ? c.div(c.ln(X), c.LN2) : c.div(c.ln(X), c.ln(B))) : null)),
  sin: trueOf((c, X) => c.sin(X)), cos: trueOf((c, X) => c.cos(X)), tan: trueOf((c, X) => c.div(c.sin(X), c.cos(X))),
  sec: trueOf((c, X) => c.inv(c.cos(X))), csc: trueOf((c, X) => (nz(X) ? c.inv(c.sin(X)) : null)), cot: trueOf((c, X) => (nz(X) ? c.div(c.cos(X), c.sin(X)) : null)),
  arcsin: trueOf((c, X) => (unit(c, X) ? c.asin(X) : null)), arccos: trueOf((c, X) => (unit(c, X) ? c.PI / 2n - c.asin(X) : null)), arctan: trueOf((c, X) => c.atan(X)),
  arcsec: trueOf((c, X) => (unit(c, X) && X !== c.ONE && X !== -c.ONE ? null : c.PI / 2n - c.asin(c.inv(X)))), arccsc: trueOf((c, X) => (unit(c, X) && X !== c.ONE && X !== -c.ONE ? null : c.asin(c.inv(X)))),
  arccot: trueOf((c, X) => (nz(X) ? c.atan(c.inv(X)) : null)),
  sinh: trueOf((c, X) => c.sinh(X)), cosh: trueOf((c, X) => c.cosh(X)), tanh: trueOf((c, X) => c.div(c.sinh(X), c.cosh(X))),
  sech: trueOf((c, X) => c.inv(c.cosh(X))), csch: trueOf((c, X) => (nz(X) ? c.inv(c.sinh(X)) : null)), coth: trueOf((c, X) => (nz(X) ? c.div(c.cosh(X), c.sinh(X)) : null)),
  arcsinh: trueOf((c, X) => (X < 0n ? -1n : 1n) * c.ln((X < 0n ? -X : X) + c.sqrt(c.mul(X, X) + c.ONE))),
  arccosh: trueOf((c, X) => (X >= c.ONE ? c.ln(X + c.sqrt(c.mul(X, X) - c.ONE)) : null)),
  arctanh: trueOf((c, X) => (X > -c.ONE && X < c.ONE ? c.ln(c.div(c.ONE + X, c.ONE - X)) / 2n : null)),
  arcsech: trueOf((c, X) => (X > 0n && X <= c.ONE ? (({ ONE }, Y) => c.ln(Y + c.sqrt(c.mul(Y, Y) - ONE)))(c, c.inv(X)) : null)),
  arccsch: trueOf((c, X) => (nz(X) ? ((Y) => (Y < 0n ? -1n : 1n) * c.ln((Y < 0n ? -Y : Y) + c.sqrt(c.mul(Y, Y) + c.ONE)))(c.inv(X)) : null)),
  arccoth: trueOf((c, X) => (X > c.ONE || X < -c.ONE ? ((Y) => c.ln(c.div(c.ONE + Y, c.ONE - Y)) / 2n)(c.inv(X)) : null)),
  cbrt: trueOf((c, X) => (X === 0n ? 0n : (X < 0n ? -1n : 1n) * c.ex(c.ln(X < 0n ? -X : X) / 3n))),
};
// the n-th root of a number the build knows, odd ones of negatives (an operator, <root/>, not one of the functions above)
export const rootOf = (x, n) => (x === 0 ? x : x < 0 ? (n % 2 ? -rootOf(-x, n) : NaN) : trueOf((c, X) => c.ex(c.ln(X) / BigInt(n)))(x));
const WHY = {
  factorial: 'CSS has no factorial, and d3 none',
  sum: '<sum/> binds a variable over limits; a list of numbers is added with <plus/>',
  variance: "MathML doesn't say it divides by n - 1, as d3 and dcss do", sdev: "MathML doesn't say it divides by n - 1, as d3 and dcss do",
  mode: 'dcss has no mode', moment: 'dcss has no moment', card: "a set's size drops repeated values, which d3.count counts",
};
const QUALIFIERS = new Set(['bvar', 'condition', 'domainofapplication', 'lowlimit', 'uplimit', 'degree', 'momentabout', 'interval']);
// a <ci> name dcss reads or writes itself: the formula would read that, not the page's value
const RESERVED = /^(value|dcss-.*)$/;

// relations (MathML 4, 4.3.5.10): an equation with a name alone on one side, or LaTeXML's := , defines that name: the
// page prints the other side's value, and every later formula on the page that names it computes that side in its place
// (a formula's answer reaches only what is inside it, so the build carries it); an inequality, or a chain of them,
// prints true or false as JavaScript's <, <=, > and >= decide on the two doubles, and nothing when a side has no answer.
// An equation between two formulas shows each side's value and no verdict: whether it holds depends on the digits
// compared (JavaScript's 0.1 + 0.2 === 0.3 is false, and so is (a + b)² === a² + 2ab + b² for about half of inputs), and a
// review (2026-10-29, four readers) split four ways on a verdict; two values never claim anything wrong
const RELS = { lt: '<', leq: '≤', gt: '>', geq: '≥' };
let DEFS = new Map(), LATER = new Map(); // the page's definitions before the formula being compiled, and after it
const isAssign = (h) => h?.name === 'csymbol' && h.attrs.cd === 'latexml' && textOf(h).trim() === 'assign';
const subName = (a) => a?.name === 'apply' && elements(a)[0]?.name === 'csymbol' && elements(a)[0].attrs.cd === 'ambiguous' && textOf(elements(a)[0]).trim() === 'subscript';
const loneName = (a) => (a?.name === 'ci' && !elements(a).length ? textOf(a).trim().normalize('NFKC') : subName(a) && elements(a).length === 3 && ['ci', 'cn'].includes(elements(a)[2].name) ? `${textOf(elements(a)[1]).trim()}_${textOf(elements(a)[2]).trim()}`.normalize('NFKC') : null);
// what a formula defines: [name, the side that defines it], or null
function definition(top) {
  const [head, ...args] = elements(top);
  if (!(head?.name === 'eq' || isAssign(head)) || args.length !== 2) return null;
  const l = loneName(args[0]), r = isAssign(head) ? null : loneName(args[1]);
  return l ? [l, args[1], args[0]] : r ? [r, args[0], args[1]] : null;
}
function compile(math) {
  if ('cdgroup' in math.attrs) throw refusal(math.start, 'a cdgroup could rename the symbols');
  const top = elements(math)[0], [head, ...args] = elements(top), assign = isAssign(head), def = definition(top);
  let out;
  if ((head?.name === 'eq' || assign) && !def) {
    if (assign) throw refusal(top.start, ':= with no name alone on its left');
    if (args.length < 2) throw refusal(top.start, 'an equation of one side');
    const sides = args.map((a) => asNode(item(a))), each = sides.map((n) => emit(n));
    out = { kind: 'sides', root: { op: 'eq', call: 'relation', items: sides.map((node) => ({ node })) }, sides: each, value: each.map((e) => e.value).join(''), decls: each.flatMap((e) => e.decls), ints: [...new Set(each.flatMap((e) => e.ints))], compares: each.reduce((c, e) => c + e.compares, 0) };
  } else if (head?.name === 'eq' || assign) {
    const [name, side, nameAt] = def, mentions = (n) => loneName(n) === name || elements(n).some(mentions);
    if (mentions(side)) throw refusal(side.start, `${name} is defined in terms of itself`);
    const nameItem = item(nameAt, true), sideNode = asNode(item(side));
    out = { kind: 'define', name, root: { op: assign ? 'assign' : 'eq', call: 'relation', items: [nameItem, { node: sideNode }] }, ...emit(sideNode) };
  } else if (head?.name in RELS || head?.name === 'and') {
    const pairs = [], chain = (h, as, at) => { if (!(h?.name in RELS)) throw refusal(at, `<and/> of <${h?.name}/>: this build takes an <and/> of inequalities (<lt/>, <leq/>, <gt/>, <geq/>)`);
      if (as.length < 2) throw refusal(at, `<${h.name}/> of ${as.length} argument: an inequality compares two or more`);
      const its = as.map((a) => item(a)); for (let k = 0; k + 1 < its.length; k++) pairs.push([h.name, its[k], its[k + 1]]); return { op: h.name, call: 'relation', items: its }; };
    const shown = head.name === 'and' ? { op: 'and', call: 'relation', items: args.map((a) => { if (a.name !== 'apply') throw refusal(a.start, 'an <and/> of something not a relation'); const [h, ...as] = elements(a); return { node: chain(h, as, a.start) }; }) } : chain(head, args, top.start);
    out = { kind: 'truth', root: shown, ...emitTruth(pairs) };
  } else { const root = top.name === 'piecewise' ? piecewise(top) : call(top); out = { kind: 'value', root, ...emit(root) }; }
  if (out.compares > MAX_COMPARES) throw refusal(math.start, `this formula's medians compare ${out.compares.toLocaleString('en-US')} pairs of values the page sets, past the ${MAX_COMPARES.toLocaleString('en-US')} this build writes: give a long list as a .dcss-median call (README, Writing a call)`);
  if (out.decls.join('').length + out.value.length > 1048576) throw refusal(math.start, `this formula's calc() would be ${Math.round((out.decls.join('').length + out.value.length) / 1024)} KB of style: definitions used inside each other grow it; past 1 MB this build refuses`);
  return out;
}
// an item as a node: a number or a name alone becomes the identity of it
const asNode = (x) => x.node ?? { op: 'id', call: 'id', items: [x] };
// one <apply>: its call and its items, each a number ({ x }), a name ({ ci }) or another <apply> ({ node })
function call(apply) {
  const kids = elements(apply), head = kids[0];
  if (!head) throw refusal(apply.start, 'an empty <apply>');
  const ix = indexForm(head, kids); if (ix) return indexed(ix, apply);
  if (head.name === 'apply') throw refusal(head.start, 'a nested <apply> as the operator: one operator applied to numbers');
  let op, args = kids.slice(1), degree = 2;
  if (head.name === 'csymbol' && head.attrs.cd === 'ambiguous' && textOf(head).trim() === 'superscript') op = 'power'; // LaTeXML's x^2, read as a power
  else if (head.name === 'csymbol' && head.attrs.cd === 'ambiguous' && textOf(head).trim() === 'subscript') throw refusal(head.start, 'a subscript as the operator (an indexed function): this build has no definition for it');
  else if (head.name === 'ci') throw refusal(head.start, `<ci>${textOf(head).trim()}</ci> as the operator (a function the page names): this build has no definition for it`);
  else if (head.name === 'csymbol' && head.attrs.cd === 'latexml' && textOf(head).trim() === 'delimited-[]') { // LaTeXML's [x]: brackets as grouping
    if (args.length !== 1) throw refusal(head.start, `LaTeXML's [ ] around ${args.length} things: [a, b] is an interval or a commutator, not a number`);
    op = 'brackets';
  } else if (head.name === 'csymbol' && head.attrs.cd === 'transc1' && textOf(head).trim() in MATHFN) { // OpenMath's log takes its base first
    const name = textOf(head).trim(); if (name === 'log' && args.length !== 2) throw refusal(apply.start, `transc1 log of ${args.length} arguments: it takes the base and a number`);
    return folded(name, head.start, name === 'log' ? [args[1], { name: 'logbase', start: args[0].start, children: [args[0]] }] : args, apply);
  } else if (head.name === 'csymbol') {
    const cd = head.attrs.cd, name = textOf(head).trim();
    if (!SYMBOLS[cd]?.includes(name)) throw refusal(head.start, `<csymbol cd="${cd}">${name}</csymbol> is not an operator this build takes (s_data1 median and mean, minmax1 min and max, arith1 plus, minus, unary_minus, times, divide, power, root and abs, rounding1 floor and ceiling)`);
    op = name === 'unary_minus' ? 'minus' : name;
    if (cd === 'arith1' && name === 'unary_minus' && args.length !== 1) throw refusal(head.start, 'arith1 unary_minus takes one argument');
    if (cd === 'arith1' && name === 'root') { // arith1's root is root(x, n): n the degree
      if (args.length !== 2 || args[1].name !== 'cn') throw refusal(head.start, 'arith1 root takes a number and its degree, a <cn>');
      degree = degreeOf(args[1]); args = [args[0]];
    }
    if (cd === 'minmax1') { // min and max are unary on a set (MathML 4, F.5.1): unwrap <apply><csymbol cd="set1">set</csymbol>…</apply>
      const set = args[0], sh = set && elements(set)[0];
      if (args.length !== 1 || set.name !== 'apply' || sh?.name !== 'csymbol' || sh.attrs.cd !== 'set1' || textOf(sh).trim() !== 'set') throw refusal(head.start, 'minmax1 min and max take one set1 set: <apply><csymbol cd="set1">set</csymbol>…</apply>');
      args = elements(set).slice(1);
    }
  } else {
    if (!blank(head) || elements(head).length) throw refusal(head.start, `<${head.name}> is an operator: write it empty, <${head.name}/>`);
    for (const k of ['definitionurl', 'encoding']) if (k in head.attrs) throw refusal(head.start, `<${head.name} ${k}="…">: the operator would mean another function`);
    if (head.name in MATHFN) return folded(head.name, head.start, args, apply);
    if (!(head.name in CALLS)) throw refusal(head.start, WHY[head.name] ?? `<${head.name}/> is not an operator this build takes (median, mean, min, max, plus, minus, times, divide, power, root, abs, floor and ceiling)`);
    op = head.name;
  }
  if (op === 'root') { const q = args.filter((a) => a.name === 'degree'); // <root/> with a <degree> qualifier (MathML 4, 4.3.3.2); none is a square root
    if (q.length > 1) throw refusal(q[1].start, 'two <degree>s');
    if (q.length) { const k = elements(q[0]); if (k.length !== 1 || k[0].name !== 'cn') throw refusal(q[0].start, '<degree> holds one <cn>, the root\'s degree'); degree = degreeOf(k[0]); args = args.filter((a) => a !== q[0]); } }
  for (const a of args) if (QUALIFIERS.has(a.name)) throw refusal(a.start, `<${a.name}>: qualifiers aren't taken, only numbers`);
  for (const a of args) if (!['cn', 'ci', 'apply', 'piecewise'].includes(a.name) && !constantOf(a)) throw refusal(a.start, `<${a.name}> as an argument: only <cn> numbers, <ci> names, π, e and another <apply>`);
  if (!args.length) throw refusal(apply.start, `${op} of nothing`);
  const [lo, hi] = ARITY[op] ?? [1, Infinity];
  if (args.length < lo || args.length > hi) throw refusal(apply.start, `${op} of ${args.length} argument${args.length === 1 ? '' : 's'}: it takes ${lo === hi ? lo : hi === Infinity ? `${lo} or more` : `${lo} or ${hi}`}`);
  if (args.length === 1 && args[0].name === 'ci' && !ARITY[op]) throw refusal(args[0].start, `one <ci> alone: MathML reads it as a data set (MathML 4, §4.3.5.13), not one value`);
  const items = args.map((a) => item(a));
  if (op === 'quotient' || op === 'rem') { const [a, b] = items.map(itemValue);
    if (a !== null && b !== null && !wholeArgs(a, b)) throw refusal(apply.start, `${op} of ${a} and ${b}: MathML's integer division takes whole numbers, within ±2^26 here, and a divisor that isn't 0`); }
  // e to a power is exp(x) (MathML 4: power of exponentiale), not Math.pow(Math.E, x), another double for 92 of 100 x
  if (op === 'power' && (items[0].konst === 'e' || (items[0].ci === 'e' && !items[0].def))) { const seen = new Set(), x = itemValue(items[1], seen);
    if (x !== null) return fixed('power', MATHFN.exp(x), items, apply.start, items[0].ci ? seen.add('e') : seen, items[0].ci && { op, call: CALLS[op], items }); }
  if (op === 'power' && (items[0].konst === 'e' || (items[0].ci === 'e' && !items[0].def))) throw refusal(args[0].start, 'e to a power is exp(x): CSS\'s exp() doesn\'t give JavaScript\'s Math.exp, and Math.pow(Math.E, x) is another double for 92 of 100 x; if e is a quantity of your own, define it in a formula before this one');
  // a root of a degree other than a power of 2: of a number the build knows, the double nearest the true root (∛64 is 4);
  // of a name the page sets, refused, as CSS has no such root and pow(x, 1/3) misses whole roots
  if (op === 'root' && degree & (degree - 1)) { const x = itemValue(items[0]);
    if (x === null) throw refusal(apply.start, `a root of degree ${degree} of a name the page sets: CSS has no such root, and pow(x, 1/${degree}) misses whole roots (the cube root of 64 comes out 3.9999999999999996, of -8 nothing); of a number the build knows it is computed when the page is built, and of a name, degrees 2, 4, 8 and so on are taken`);
    return Object.assign(fixed('root', rootOf(x, degree), items, apply.start), { degree }); }
  return { op, call: CALLS[op], items, degree, start: apply.start };
}
// one argument: a number ({ x }), a name ({ ci }, with the page's definition of it, { def }), or another <apply> ({ node })
function item(a, defining = false) {
  {
    const sub = a.name === 'apply' && elements(a)[0]?.name === 'csymbol' && elements(a)[0].attrs.cd === 'ambiguous' && textOf(elements(a)[0]).trim() === 'subscript';
    if (sub) { // LaTeXML's x_1: one name, x_1, read from --x_1 and drawn as a subscript
      const [, base, index, ...more] = elements(a);
      if (!base || !index || more.length || base.name !== 'ci' || !['ci', 'cn'].includes(index.name) || elements(base).length || elements(index).length) throw refusal(a.start, 'a subscript other than a name and one name or number (x_1, x_i): this build reads those as one name');
      const iv = index.name === 'ci' ? INDEX.get(textOf(index).trim().normalize('NFKC')) : undefined; // x_i inside a sum over i
      if (iv !== undefined && iv !== null) return named({ ci: `${textOf(base).trim()}_${iv}`.normalize('NFKC'), sub: [textOf(base).trim().normalize('NFKC'), String(iv), 'cn'] }, a, defining);
      const id = `${textOf(base).trim()}_${textOf(index).trim()}`.normalize('NFKC');
      if (!/^-?[_a-zA-Z\u0080-\u{10FFFF}][-_a-zA-Z0-9\u0080-\u{10FFFF}]*$/u.test(id)) throw refusal(a.start, `the subscripted name ${id} is no CSS identifier`);
      return named({ ci: id, sub: [textOf(base).trim().normalize('NFKC'), textOf(index).trim().normalize('NFKC'), index.name] }, a, defining);
    }
    if (a.name === 'apply') return { node: call(a) };
    if (a.name === 'piecewise') return { node: piecewise(a) };
    if (a.name === 'cn') return number(a);
    const k = constantOf(a); if (k) return k;
    if (elements(a).length) throw refusal(a.start, '<ci> with markup inside: a name is text');
    if ('type' in a.attrs) throw refusal(a.start, `<ci type="${a.attrs.type}"> names a collection or another kind of value`);
    const id = textOf(a).trim().normalize('NFKC'); // LaTeXML's mathematical italic 𝑥 is the page's x
    // a CSS identifier: letters past ASCII too (𝑚)
    if (!/^-?[_a-zA-Z\u0080-\u{10FFFF}][-_a-zA-Z0-9\u0080-\u{10FFFF}]*$/u.test(id)) throw refusal(a.start, `<ci>${id}</ci>: a name must be a CSS identifier`);
    if (RESERVED.test(id)) throw refusal(a.start, `<ci>${id}</ci>: --${id} is a name dcss itself reads or writes`);
    if (INDEX.has(id) && INDEX.get(id) !== null) { const v = INDEX.get(id); return { x: v, neg: v < 0, mag: `<mn>${Math.abs(v)}</mn>` }; } // a sum's index
    if ((id === 'π' || id === 'e') && !defining && !DEFS.has(id) && !LATER.has(id)) return { ci: id, fallback: String(id === 'π' ? Math.PI : Math.E) }; // π and e, or the page's --π and --e
    return named({ ci: id }, a, defining);
  }
}
// π and e as numbers: MathML 4's <pi/> and <exponentiale/> and OpenMath's nums1 symbols are Math.PI and Math.E written
// out, the same double a <cn> of their digits gives; LaTeXML's 𝜋 (a <ci>) where the page defines no π in a formula reads
// --π, falling back to Math.PI where the page sets none
const CONSTANTS = { pi: { x: Math.PI, neg: false, mag: '<mi>π</mi>', konst: 'pi' }, e: { x: Math.E, neg: false, mag: '<mi>e</mi>', konst: 'e' } };
function constantOf(a) {
  if ((a.name === 'pi' || a.name === 'exponentiale') && blank(a) && !elements(a).length) return CONSTANTS[a.name === 'pi' ? 'pi' : 'e'];
  if (a.name === 'csymbol' && a.attrs.cd === 'nums1' && ['pi', 'e'].includes(textOf(a).trim())) return CONSTANTS[textOf(a).trim()];
  return null;
}
// a sum or product over an index, i from lo to hi of a body: MathML 4's <sum/> with <bvar>, <lowlimit> and <uplimit>
// (or a closed <interval>), and LaTeXML's ∑ with i = lo below and hi above. Unrolled when the page is built, each term the
// body with i a number (x_i reads --x_3), and added as JavaScript's loop adds them, s = 0, s += term (a product from 1):
// so a term with no value leaves no answer. The bounds are whole numbers the build knows: written, or a name a formula
// above defines with numbers; one the page sets at run time, or an infinite one, stops the build
const MAX_TERMS = 1000;
let INDEX = new Map(); // an index being unrolled: its number, or null where the body is drawn as written
const isSym = (n, name) => n?.name === 'csymbol' && n.attrs.cd === 'ambiguous' && textOf(n).trim() === name;
function indexForm(head, kids) {
  const [, ...args] = kids;
  if (head.name === 'sum' || head.name === 'product') {
    const q = (k) => args.filter((a) => a.name === k), bv = q('bvar'), lo = q('lowlimit'), hi = q('uplimit'), iv = q('interval');
    for (const k of ['condition', 'domainofapplication']) if (q(k).length) throw refusal(q(k)[0].start, `<${k}>: a ${head.name} over a set or a condition isn't taken; give it <lowlimit> and <uplimit>`);
    const body = args.filter((a) => !['bvar', 'lowlimit', 'uplimit', 'interval'].includes(a.name));
    if (bv.length !== 1 || elements(bv[0]).length !== 1 || elements(bv[0])[0].name !== 'ci') throw refusal(head.start, `<${head.name}/> binds one <bvar><ci>i</ci></bvar>: its index`);
    let l, h;
    if (iv.length === 1 && !lo.length && !hi.length) { if ((iv[0].attrs.closure ?? 'closed') !== 'closed' || elements(iv[0]).length !== 2) throw refusal(iv[0].start, 'an <interval> of a sum is closed, its two ends'); [l, h] = elements(iv[0]); }
    else if (lo.length === 1 && hi.length === 1 && !iv.length && elements(lo[0]).length === 1 && elements(hi[0]).length === 1) { l = elements(lo[0])[0]; h = elements(hi[0])[0]; }
    else throw refusal(head.start, `<${head.name}/> takes its range as one <lowlimit> and one <uplimit>, or a closed <interval>`);
    if (body.length !== 1) throw refusal(head.start, `<${head.name}/> of ${body.length} terms: it takes one body, the term`);
    return { op: head.name, name: textOf(elements(bv[0])[0]).trim().normalize('NFKC'), lo: l, hi: h, body: body[0], at: head.start };
  }
  // LaTeXML's: (superscript (subscript <sum/> (eq i lo)) hi) applied to the body
  if (head.name !== 'apply') return null;
  const [sup, under, hi] = elements(head);
  if (!isSym(sup, 'superscript') || under?.name !== 'apply') return null;
  const [sub, op, cond] = elements(under);
  if (!isSym(sub, 'subscript') || !['sum', 'product'].includes(op?.name)) return null;
  if (!hi || elements(head).length !== 3 || cond?.name !== 'apply' || elements(under).length !== 3) throw refusal(head.start, `a ${op.name} with no range: this build adds over i = lo to hi`);
  const [eq, i, lo, ...more] = elements(cond);
  if (eq?.name !== 'eq' || i?.name !== 'ci' || !lo || more.length) throw refusal(cond.start, `a ${op.name} over ${eq?.name === 'in' ? 'a set' : 'a condition'}: this build adds over i = lo to hi`);
  if (kids.length !== 2) throw refusal(head.start, `a ${op.name} of ${kids.length - 1} terms: it takes one body, the term`);
  return { op: op.name, name: textOf(i).trim().normalize('NFKC'), lo, hi, body: kids[1], at: head.start };
}
const withIndex = (name, v, f) => { const was = INDEX.has(name) ? INDEX.get(name) : undefined; INDEX.set(name, v); try { return f(); } finally { if (was === undefined) INDEX.delete(name); else INDEX.set(name, was); } };
function indexed(ix, apply) {
  if (ix.hi.name === 'infinity') throw refusal(ix.hi.start, `an infinite ${ix.op}: it has no last term to add`);
  const bound = (el) => { const it = item(el), v = itemValue(it);
    if (v === null) throw refusal(el.start, `a ${ix.op}'s bound the page sets at run time: this build unrolls the ${ix.op} when the page is built, so a bound is a number, or a name a formula above defines with numbers`);
    if (!Number.isInteger(v)) throw refusal(el.start, `a ${ix.op}'s bound of ${v}: the index runs over whole numbers`);
    return [it, v]; };
  const [loItem, lo] = bound(ix.lo), hiLive = item(ix.hi);
  // a bound the page sets: min(n, 100), a ceiling the build knows beside it; the terms are written out to the ceiling, and
  // each counts while its i is at most the bound's value, as JavaScript's loop runs i <= Math.min(n, 100)
  if (itemValue(hiLive) === null) {
    const caps = hiLive.node?.op === 'min' && hiLive.node.items.length > 1 ? hiLive.node.items.map((x) => itemValue(x)).filter((v) => v !== null) : [];
    if (!caps.length || caps.some((v) => !Number.isFinite(v))) throw refusal(ix.hi.start, `a ${ix.op}'s bound the page sets at run time with no ceiling: write it min(n, 100), with the most terms it can take, and the build writes them out to 100`);
    const cap = Math.floor(Math.min(...caps));
    if (cap - lo + 1 > MAX_LIVE) throw refusal(ix.at, `a ${ix.op} of up to ${cap - lo + 1} terms to a bound the page sets, past the ${MAX_LIVE} this build writes out (each term takes seven registered steps)`);
    const display = withIndex(ix.name, null, () => item(ix.body)), terms = [];
    for (let v = lo; v <= cap; v++) terms.push(withIndex(ix.name, v, () => item(ix.body)));
    const call = ix.op === 'sum' ? 'isum' : 'iproduct';
    return { op: call, call, items: terms, display, index: ix.name, loItem, hiItem: hiLive, live: hiLive.node, lo, start: apply.start };
  }
  const [hiItem, hi] = bound(ix.hi);
  if (hi - lo + 1 > MAX_TERMS) throw refusal(ix.at, `a ${ix.op} of ${hi - lo + 1} terms, past the ${MAX_TERMS} this build writes out`);
  const display = withIndex(ix.name, null, () => item(ix.body)), terms = [];
  for (let v = lo; v <= hi; v++) terms.push(withIndex(ix.name, v, () => item(ix.body)));
  const call = ix.op === 'sum' ? 'isum' : 'iproduct';
  return { op: call, call, items: terms, display, index: ix.name, loItem, hiItem, start: apply.start };
}
function folded(name, at, args, apply) {
  const base = args.filter((a) => a.name === 'logbase'), rest = args.filter((a) => a.name !== 'logbase');
  if (base.length && (name !== 'log' || base.length > 1 || elements(base[0]).length !== 1)) throw refusal(base[0].start, '<logbase> belongs to <log/>, once, holding its base');
  if (rest.length !== 1) throw refusal(apply.start, `${name} of ${rest.length} arguments: it takes 1`);
  for (const a of rest) if (!['cn', 'ci', 'apply', 'piecewise'].includes(a.name) && !constantOf(a)) throw refusal(a.start, `<${a.name}> as an argument: only <cn> numbers, <ci> names, π, e and another <apply>`);
  const seen = new Set(), items = [item(rest[0]), ...(base.length ? [item(elements(base[0])[0])] : [])], [x, b] = items.map((i) => itemValue(i, seen));
  if (x === null || (base.length && b === null)) throw refusal(at, `${name} of a name the page sets: ${INEXACT}. Of numbers the build knows it is computed when the page is built`);
  return fixed(name, MATHFN[name](x, name === 'log' ? (base.length ? b : 10) : undefined), items, apply.start, seen);
}
// a value the build computed (the double nearest the true value): written in as a number, drawn as the formula it came from. Where it took 𝜋 or
// 𝑒 as Math.PI or Math.E, it holds while the page sets no --π or --e (unless); where it sets one, the page shows no
// answer, or, for 𝑒 to a power where --e is set, live: the power of the page's e
function fixed(op, v, items, start, seen, live) {
  if (!Number.isFinite(v)) throw refusal(start, `${op} here is ${v}: no number to show`);
  if (Math.abs(v) >= FMAX) throw refusal(start, `${op} here is ${v}: Chrome reads a number from 3.4e38 up as 3.4e38`);
  return { op, call: 'fixed', value: v, items, start, unless: seen?.size ? [...seen] : undefined, live };
}
// MathML 4's <piecewise> (4.3.10.5): the first <piece> whose condition holds gives the value, else <otherwise>, as
// JavaScript's if/else chain does; with none holding and no <otherwise>, no answer. A condition is a relation (<lt/>,
// <leq/>, <gt/>, <geq/>, <eq/>, <neq/>, a chain of one) or an <and/> or <or/> of them
const CONDS = { ...RELS, eq: '=', neq: '≠' };
function piecewise(el) {
  const items = [], conds = []; let otherwise = false;
  for (const k of elements(el)) {
    if (otherwise) throw refusal(k.start, `<${k.name}> after <otherwise>: <otherwise> comes last`);
    const [v, c, ...more] = elements(k);
    if (k.name === 'piece') { if (!v || !c || more.length) throw refusal(k.start, '<piece> holds a value and its condition'); items.push(item(v)); conds.push(condition(c)); }
    else if (k.name === 'otherwise') { if (!v || c) throw refusal(k.start, '<otherwise> holds one value'); items.push(item(v)); otherwise = true; }
    else throw refusal(k.start, `<${k.name}> in a <piecewise>: it holds <piece>s and one <otherwise>`);
  }
  if (!conds.length) throw refusal(el.start, 'a <piecewise> with no <piece>');
  return { op: 'piecewise', call: 'piecewise', items, conds, otherwise, start: el.start };
}
function condition(c) {
  if (c.name !== 'apply') throw refusal(c.start, `<${c.name}> as a condition: a condition is a relation, <apply><lt/>…</apply>, or an <and/> or <or/> of them`);
  const [h, ...as] = elements(c);
  if (h?.name === 'and' || h?.name === 'or') { if (as.length < 2) throw refusal(c.start, `<${h.name}/> of ${as.length}: it joins two or more conditions`); return { op: h.name, parts: as.map(condition) }; }
  if (!(h?.name in CONDS)) throw refusal(c.start, `<${h?.name ?? '?'}/> as a condition: this build takes <lt/>, <leq/>, <gt/>, <geq/>, <eq/>, <neq/>, <and/> and <or/>`);
  if (as.length < 2 || (h.name === 'neq' && as.length !== 2)) throw refusal(c.start, `<${h.name}/> of ${as.length}: a relation compares ${h.name === 'neq' ? 'two' : 'two or more'}`);
  return { op: h.name, items: as.map((a) => item(a)) };
}
// a name the page defines: the definition's side in its place; one it defines further down is refused
function named(x, a, defining) {
  if (defining) return x;
  if (DEFS.has(x.ci)) return { ...x, def: DEFS.get(x.ci) };
  if (LATER.has(x.ci)) throw refusal(a.start, `${x.ci} is defined further down the page (line ${LATER.get(x.ci)}): define it before the formulas that use it`);
  return x;
}
// a root's degree: 2 (sqrt), or a power of 2, where pow(x, 1/n) has an exact exponent; any other misses whole roots
// (pow(64, 1/3) is 3.9999999999999996, so a floor of it is 3; pow(-8, 1/3) is NaN where the cube root is -2)
function degreeOf(cn) { const { x } = number(cn); if (!Number.isInteger(x) || x < 2) throw refusal(cn.start, `a root of degree ${x}: this build takes whole degrees from 2`);
  return x; }

// --- what CSS computes: the formula as one calc(), d3's operations in d3's order, so the page's number is d3's double
// (read back to the bit in Chrome and WebKit: mathml-check.mjs). A sum adds left to right, each step fenced by
// min(…, infinity) (Chrome reassociates sums and products across plain parentheses: basicss/compile/number.mjs SCALE);
// a mean divides as IEEE does, by the division each engine does exactly (number.mjs cssDiv: Chrome's of numbers,
// WebKit's of lengths); min and max are CSS's own; a median ranks its items (each one's place among the others, equal
// ones in source order) and reads d3.quantile's value0 + (value1 - value0) * 0.5. Two numbers the build knows are
// compared at build time; the rest in CSS, on registered integer ranks, and an <apply> a median compares is kept as
// four registered integers (number.mjs splitDecl: a registered <number> keeps 6 digits through var() in Chrome).
// No 1/64 grid and no layout: the build sees every operand, so nothing has to be laid out to be summed or ordered.
const F = (x) => `min(${x}, infinity)`;
const W = 'abs(sign(3 / 10 - 0.3))'; // 1 in WebKit, whose division of numbers isn't IEEE's (number.mjs ENGINE_W)
// x where g is 1, -0 where it is 0 (both bounds -0, so adding the unchosen form keeps a chosen -0: x + -0 is x)
const sel = (g, x) => `clamp(-1 * (pow(2, 2000 * ${g}) - 1), ${x}, -1 * (1 - pow(2, 2000 * ${g})))`;
// Chrome divides numbers exactly and lengths as a · (1/b), WebKit the other way round (number.mjs cssDiv), and in Chrome a
// length anywhere under a division makes it a length's (a mean of means read 1 ulp off): so each declaration is written
// twice, every division a number's and every division a length's, and the engine's flag picks one whole form
const DIVIDE = { plain: (a, b) => `((${a}) / (${b}))`, length: (a, b) => `(((${a}) * 1px) / ((${b}) * 1px))` };
const either = (plain, length) => (plain === length ? plain : `${sel(`(1 - ${W})`, plain)} + ${sel(W, length)}`);
// a double as its exponent and three integers of 19 bits at most, scaled by two powers of 2 each way, so that no pow()
// passes a double's range for a value down to 2^-1074 (one pow(2, 17 - e) lost the values under 2^-1006: a median of
// 1e-310 read 0 in Chrome)
const half = (k) => `round(down, (${k}) / 2, 1)`, by2 = (x, k) => `(${x} * pow(2, ${half(k)}) * pow(2, ${k} - ${half(k)}))`;
const scaled = (n, v) => by2(v, `17 - var(${n}-e)`);
const SPLIT = { e: (n, v) => `round(down, log(max(abs(${v}), pow(2, -1074)), 2))`, a: (n, v) => `round(to-zero, ${scaled(n, v)})`,
  b: (n, v) => `round(to-zero, rem(${scaled(n, v)}, 1) * 524288)`, c: (n, v) => `calc(rem(${scaled(n, v)} * 524288, 1) * 524288)`,
  // and a fifth, 1 for -0 (an integer has no sign of zero; 1 / -0 is -Infinity), multiplied back in
  z: (n, v) => `(1 - abs(sign(${v}))) * max(0, -1 * sign(1 / ${v}))` };
const join = (n) => `(${by2(`(var(${n}-a) + var(${n}-b) / 524288 + var(${n}-c) / 274877906944)`, `var(${n}-e) - 17`)} * (1 - 2 * var(${n}-z)))`;
// d3's answer in JavaScript's doubles (JavaScript's Math where d3 has no call), when every number under it is written
// (null with a <ci> under it); CSS's pow() and sqrt() are Math.pow's and Math.sqrt's to the bit (sqrt 300 of 300; pow 50,000 of 50,000, random and
// compound-interest pairs, both engines on macOS, 2026-10-30; other systems' pow() not measured)
const D3 = {
  minus: (xs) => (xs.length === 1 ? -xs[0] : xs[0] - xs[1]), times: (xs) => xs.reduce((a, b) => a * b), divide: (xs) => xs[0] / xs[1],
  power: (xs) => Math.pow(xs[0], xs[1]), root: (xs, n) => (n.degree === 2 ? Math.sqrt(xs[0]) : Math.pow(xs[0], 1 / n.degree)),
  abs: (xs) => Math.abs(xs[0]), floor: (xs) => Math.floor(xs[0]), ceiling: (xs) => Math.ceil(xs[0]),
  // MathML 4.3.6.1: integer division, q and r with a = b·q + r, |r| < |b|, r of a's sign; whole numbers within ±2^26 (where
  // a / b can't round across a whole number), the divisor not 0; past them NaN, no answer
  quotient: ([a, b]) => (wholeArgs(a, b) ? Math.trunc(a / b) : NaN), rem: ([a, b]) => (wholeArgs(a, b) ? a % b : NaN),
  isum: (xs) => xs.reduce((s, x) => s + x, 0), iproduct: (xs) => xs.reduce((p, x) => p * x, 1),
  sum: (xs) => xs.reduce((s, x) => s + x, 0), mean: (xs) => xs.reduce((s, x) => s + x, 0) / xs.length,
  min: (xs) => Math.min(...xs), max: (xs) => Math.max(...xs), id: (xs) => xs[0],
  median: (xs) => { const s = [...xs].sort((a, b) => a - b), i0 = Math.floor((s.length - 1) / 2); return s.length % 2 ? s[i0] : s[i0] + (s[i0 + 1] - s[i0]) * 0.5; },
};
// a value the build knows, or null; given a set, a name with a fallback (LaTeXML's 𝜋 and 𝑒) is its fallback, noted in the set
const itemValue = (x, seen) => (x.node ? valueOf(x.node, seen) : x.def ? valueOf(x.def, seen) : x.ci ? (seen && x.fallback ? (seen.add(x.ci), +x.fallback) : null) : x.x);
const OPS = { lt: (a, b) => a < b, leq: (a, b) => a <= b, gt: (a, b) => a > b, geq: (a, b) => a >= b, eq: (a, b) => a === b, neq: (a, b) => a !== b };
const condValue = (c, seen) => { if (c.parts) { const vs = c.parts.map((q) => condValue(q, seen)); return vs.includes(null) ? null : c.op === 'and' ? vs.every(Boolean) : vs.some(Boolean); }
  const xs = c.items.map((x) => itemValue(x, seen)); return xs.includes(null) ? null : xs.slice(1).every((b, i) => OPS[c.op](xs[i], b)); };
const wholeArgs = (a, b) => Number.isInteger(a) && Number.isInteger(b) && Math.abs(a) <= 2 ** 26 && Math.abs(b) <= 2 ** 26 && b !== 0;
const valueOf = (node, seen) => { if (node.live) return null; if (node.call === 'fixed') { if (!node.unless) return node.value; if (!seen) return null; node.unless.forEach((n) => seen.add(n)); return node.value; }
  const xs = node.items.map((x) => itemValue(x, seen)); if (xs.includes(null)) return null;
  if (node.call !== 'piecewise') return D3[node.call](xs, node);
  for (let j = 0; j < node.conds.length; j++) { const t = condValue(node.conds[j], seen); if (t === null) return null; if (t) return xs[j]; }
  return node.otherwise ? xs.at(-1) : NaN; };
// a median of n values the page sets compares n · (n - 1) pairs: 2,048 is a median of 45 names, 93 KB of style, a change
// 0.1 ms of style work in Chrome and WebKit (2026-10-29)
const MAX_COMPARES = 2048;
// a sum or product to a bound the page sets writes each term to its ceiling in seven registered steps: 100 terms are
// 260 KB of style, and a change of the bound 4.2 ms of style and layout in Chrome, 9 in WebKit (360: 13.5 and 36; 2026-10-30)
const MAX_LIVE = 100;
// Chrome drops a calculation nested 100 levels deep, WebKit 101, a var() bringing its value's depth along
// (facts/calc-nesting-depth.mjs), and a fenced chain nests a level a step: a sum of 97 terms gave no answer. Past DEPTH
// levels a value goes through the registered split, exact, its finiteness kept as a guard (an infinite step there leaves
// no answer, as one at the top does)
const DEPTH = 64;
const depthOf = (s) => { let d = 0, m = 0; for (const ch of s) if (ch === '(') m = Math.max(m, ++d); else if (ch === ')') d--; return m; };
// the formula in one form of division: the answer's expression and the registered steps before it, as [name, expression]
// the CSS of formulas in one form of division: expr(node) is a node's expression; the registered steps it needs collect in
// decls, as [name, expression], and the names the page sets in names
function former(divide) {
  const decls = [], names = new Set(), f = { decls, names, compares: 0 }; let id = 0;
  const arg = (x) => (x.node ? expr(x.node) : x.def ? expr(x.def) : x.ci ? (x.fallback ? `var(--${x.ci}, ${x.fallback})` : (names.add(x.ci), `var(--${x.ci})`)) : Object.is(x.x, -0) ? '(-1 * 0)' : String(x.x));
  const keep = (x) => { if (depthOf(x) <= DEPTH) return x; const q = `--dcss-dcss-d${++id}`;
    for (const z of 'eabcz') decls.push([`${q}-${z}`, SPLIT[z](q, `clamp(-1 * pow(2, 1023), ${x}, pow(2, 1023))`)]);
    decls.push([`${q}-f`, `${x} * 0 + 1`]); return `(${join(q)} * (1 + 0 / var(${q}-f)))`; };
  const chain = (op, xs) => xs.reduce((a, b) => keep(F(`${a} ${op} ${b}`)));
  const build = (node) => {
    if (node.call === 'fixed' && node.unless) { // as a piecewise: the live power where --e is set, no answer where another is
      const others = node.unless.filter((n) => !(node.live && n === 'e')), conds = [...(node.live ? [{ set: ['e'] }] : []), ...(others.length ? [{ set: others }] : [])];
      return expr({ call: 'piecewise', conds, otherwise: true, items: [...(node.live ? [{ node: node.live }] : []), ...(others.length ? [{ x: NaN }] : []), { x: node.value }] }); }
    if (node.call === 'fixed') return Object.is(node.value, -0) ? '(-1 * 0)' : String(node.value);
    if (node.live) { // a sum or product to a bound the page sets (indexed): each term to the ceiling in four registered
      // integers with its finiteness, and whether it counts (i <= the bound, as an integer: an unset var() voids only its
      // own term); a term not counted adds 0 (a product's is to the power 0), even where the page sets none of its names
      const kept = [...names]; names.clear(); const k = ++id, xs = node.items.map(arg); names.clear(); kept.forEach((n) => names.add(n));
      const P = `--dcss-dcss-u${k}`, hi = expr(node.live);
      xs.forEach((x, j) => { const q = `${P}-v${j}`, c = `clamp(-1 * pow(2, 1023), ${x}, pow(2, 1023))`; for (const z of 'eabcz') decls.push([`${q}-${z}`, SPLIT[z](q, c)]);
        decls.push([`${P}-vf${j}`, `${x} * 0 + 1`], [`${P}-in${j}`, `clamp(0, round(down, ${hi}, 1) - ${node.lo + j - 1}, 1)`]); });
      decls.push([`${P}-hf`, `${hi} * 0 + 1`], [`${P}-ok`, `1 - min(1, ${[...xs.map((_, j) => `var(${P}-in${j}) * (1 - var(${P}-vf${j}))`), `1 - var(${P}-hf)`].join(' + ')})`]);
      const parts = xs.map((_, j) => (node.call === 'isum' ? `var(${P}-in${j}) * ${join(`${P}-v${j}`)}` : `pow(${join(`${P}-v${j}`)}, var(${P}-in${j}))`));
      return `(${chain(node.call === 'isum' ? '+' : '*', [node.call === 'isum' ? '0' : '1', ...parts])} * (1 + 0 / var(${P}-ok)))`;
    }
    // a number as JavaScript reads it: -0 kept (String(-0) is "0", and 1 / -0 is -Infinity); a name with a fallback (LaTeXML's
    // 𝜋) reads the page's value when it sets one, else the fallback, so an unset one is no missing name
    const k = ++id, xs = node.items.map(arg);
    if (node.call === 'id') return xs[0];
    if (node.call === 'piecewise') {
      // each condition's truth and its sides' finiteness, and each value in four registered integers with its own
      // finiteness: an unchosen piece that is NaN or infinite then adds exactly 0 (a registered integer's NaN is 0, and
      // the value is clamped to ±2^1023 before it is split); the chosen value comes back to the bit
      const P = `--dcss-dcss-w${k}`, m = node.conds.length, v = (n) => `var(${P}-${n})`;
      // a page's name set or not: 1 or, where it is unset, the registered integer's initial 0, one step per name (an unset
      // var() voids the whole declaration); a NaN one is caught by its side
      let sets = 0; const cond = (c) => { if (c.set) return { t: `max(${c.set.map((n) => { const q = `${P}-s${sets++}`; decls.push([q, `sign(abs(var(--${n})) + 1)`]); return `var(${q})`; }).join(', ')})`, sides: c.set.map((n) => `var(--${n}, 0)`) };
        if (c.parts) { const ps = c.parts.map(cond); return { t: `${c.op === 'and' ? 'min' : 'max'}(${ps.map((q) => q.t).join(', ')})`, sides: ps.flatMap((q) => q.sides) }; }
        const ss = c.items.map((x) => expr(asNode(x))), hs = ss.slice(1).map((b, i) => CHECK[c.op](ss[i], b));
        return { t: hs.length === 1 ? hs[0] : `min(${hs.join(', ')})`, sides: ss }; };
      node.conds.forEach((c, j) => { const { t, sides } = cond(c); decls.push([`${P}-t${j}`, t], [`${P}-cf${j}`, `${sides.map((x) => `${x} * 0`).join(' + ')} + 1`]); });
      xs.forEach((x, j) => { const q = `${P}-v${j}`, c = `clamp(-1 * pow(2, 1023), ${x}, pow(2, 1023))`; for (const z of 'eabcz') decls.push([`${q}-${z}`, SPLIT[z](q, c)]); decls.push([`${P}-vf${j}`, `${x} * 0 + 1`]); });
      const reached = (j) => (j ? Array.from({ length: j }, (_, i) => `(1 - ${v(`t${i}`)})`).join(' * ') : '1');
      const gate = (j) => (j < m ? `${v(`t${j}`)} * ${reached(j)}` : reached(m));
      const err = [...xs.map((_, j) => `${gate(j)} * (1 - ${v(`vf${j}`)})`), ...node.conds.map((_, j) => `${reached(j)} * (1 - ${v(`cf${j}`)})`), `(1 - (${xs.map((_, j) => gate(j)).join(' + ')}))`];
      decls.push([`${P}-ok`, `1 - min(1, ${err.join(' + ')})`]);
      // the chosen piece alone is not 0, so a sum of all of them is it, -0 aside: the chosen one's sign of zero is put back
      const zero = xs.map((_, j) => `${gate(j)} * var(${P}-v${j}-z)`).join(' + ');
      return `(${chain('+', xs.map((_, j) => `${gate(j)} * ${join(`${P}-v${j}`)}`))} * (1 - 2 * (${zero})) * (1 + 0 / ${v('ok')}))`;
    }
    // d3.sum and d3.mean add from 0, as a loop does: 0 + -0 is 0, so a sum of -0s is 0 (each term after is added exactly)
    const total = () => chain('+', ['0', ...xs]);
    if (node.call === 'sum' || node.call === 'isum') return total();
    if (node.call === 'quotient' || node.call === 'rem') {
      // rem() is JavaScript's % to the bit, -0 included, and floor(|a / b|) · sign(a / b) Math.trunc(a / b) (2,544 pairs, both
      // engines; WebKit's round(to-zero) gives 0 for -0.9, Math.trunc -0); past the whole numbers within ±2^26, no answer
      const [a, b] = xs, P = `--dcss-dcss-q${k}`, d = divide(a, b);
      decls.push([`${P}-ok`, `1 - min(1, abs(sign(rem(${a}, 1))) + abs(sign(rem(${b}, 1))) + max(0, sign(abs(${a}) - 67108864)) + max(0, sign(abs(${b}) - 67108864)) + 1 - abs(sign(${b})))`]);
      return `(${node.call === 'rem' ? `rem(${a}, ${b})` : `(round(down, abs(${d}), 1) * sign(${d}))`} * (1 + 0 / var(${P}-ok)))`;
    }
    if (node.call === 'iproduct') return chain('*', ['1', ...xs]); // as p = 1, p *= term
    if (node.call === 'mean') return divide(total(), xs.length);
    // a - b as a + -1 · b, the same IEEE double: WebKit's calc() gives -0 - 0 as 0 (JavaScript -0), and 1 / it would flip
    if (node.call === 'minus') return xs.length === 1 ? `(-1 * ${xs[0]})` : F(`${xs[0]} + (-1 * ${xs[1]})`);
    if (node.call === 'times') return chain('*', xs);
    if (node.call === 'divide') return divide(xs[0], xs[1]);
    if (node.call === 'power') return `pow(${xs[0]}, ${xs[1]})`;
    if (node.call === 'root') return node.degree === 2 ? `sqrt(${xs[0]})` : `pow(${xs[0]}, ${String(1 / node.degree)})`;
    if (node.call === 'abs') return `abs(${xs[0]})`;
    // a ceiling as -floor(-x): WebKit's round(up) gives 0 where Math.ceil(-0.5) is -0
    if (node.call === 'floor') return `round(down, ${xs[0]}, 1)`;
    if (node.call === 'ceiling') return `(-1 * round(down, -1 * ${xs[0]}, 1))`;
    if (node.call !== 'median') return `${node.call}(${xs.join(', ')})`;
    const n = xs.length; if (n === 1) return xs[0];
    const known = node.items.map((x) => (x.node ? valueOf(x.node) : x.def ? valueOf(x.def) : x.ci ? null : x.x));
    const live = known.includes(null); // with every value known the order is the build's, and nothing is compared in CSS
    const ref = xs.map((x, i) => { if (!live || !(node.items[i].node || node.items[i].def)) return x; const p = `--dcss-dcss-m${k}-${i}`; for (const q of 'eabcz') decls.push([`${p}-${q}`, SPLIT[q](p, x)]); return join(p); });
    // j goes before i when it is smaller, or equal and earlier
    const rank = xs.map((_, i) => { let c = 0; const terms = [];
      for (let j = 0; j < n; j++) if (j !== i) {
        if (known[i] !== null && known[j] !== null) c += (j < i ? known[j] <= known[i] : known[j] < known[i]) ? 1 : 0;
        else { f.compares++; terms.push(j < i ? `(1 - sign(max(0, ${ref[j]} - ${ref[i]})))` : `sign(max(0, ${ref[i]} - ${ref[j]}))`); } }
      if (!terms.length) return c;
      const r = `--dcss-dcss-r${k}-${i}`; decls.push([r, `calc(${[c, ...terms].join(' + ')})`]); return r; });
    const pick = (t) => { const hits = rank.map((r, i) => (typeof r === 'number' ? (r === t ? ref[i] : null) : `${ref[i]} * (1 - abs(sign(var(${r}) - ${t})))`)).filter(Boolean);
      return hits.length === 1 ? hits[0] : `(${hits.join(' + ')})`; };
    const i0 = Math.floor((n - 1) / 2);
    // every expression stands alone (a fenced sum, a function, a parenthesis), so what is written around it can't regroup it
    // d3.quantile's value0 + (value1 - value0) * (i - i0), its factor 0 for an odd count: -0 comes out 0, and an
    // infinite value1 makes it NaN (d3.median([1, 2, Infinity]) is NaN)
    return F(`${F(pick(i0))} + ${F(`${F(`${pick(i0 + 1)} + (-1 * ${pick(i0)})`)} * ${n % 2 ? 0 : 0.5}`)}`);
  };
  const expr = f.expr = (node) => keep(build(node));
  return f;
}
// a name the page doesn't set (or sets to no number) leaves no answer: --value fails with it, and so does a registered
// step that took it (its initial 0 would be a number): 0 / 0 then
// and so does one from 3.4e38 up, which Chrome reads as 3.4e38
const okDecl = (names) => ['--dcss-dcss-ok', `calc(${[...names].map((n) => `var(--${n}) * 0`).join(' + ')} + 1 - min(1, ${[...names].map((n) => `max(0, sign(abs(var(--${n})) - ${FMAX}) + 1)`).join(' + ')}))`];
// an answer that isn't finite (a power or product past the largest double) has none: x · 0 + 1 is then 0 in both engines
function form(root, divide) {
  const f = former(divide), value = f.expr(root);
  if (f.names.size) f.decls.push(okDecl(f.names));
  f.decls.push(['--dcss-dcss-fin', `calc(${value} * 0 + 1)`]);
  // times 1 + 0 / flag, not plus: a sum would turn -0 into 0
  return { value: `(${value}) * (1${f.names.size ? ' + 0 / var(--dcss-dcss-ok)' : ''} + 0 / var(--dcss-dcss-fin))`, decls: f.decls, compares: f.compares };
}
// each declaration in both forms of division, the engine's flag picking one. Chrome adds -0 and a clamp() over a px
// ratio as 0 (facts/calc-negative-zero.mjs), so there a formula with a division whose answer is -0 gives 0: the same
// text printed; 1 / it isn't taken further on the page
const both = (plain, length) => ({ value: `calc(${either(plain.value, length.value)})`, decls: plain.decls.map(([k, v], i) => `${k}: calc(${either(v, length.decls[i][1])});`),
  ints: plain.decls.map(([k]) => k), compares: plain.compares });
const emit = (root) => both(form(root, DIVIDE.plain), form(root, DIVIDE.length));
// inequalities: each pair's truth as JavaScript's operator gives it on the two doubles (the sign of a fenced difference,
// exact for finite doubles), the chain's the least of them; --dcss-dcss-fin is 0 when a side is NaN or infinite or
// a name is unset, and then nothing prints
// a condition's relations, the same tests and = and ≠ besides (JavaScript's === and !== on finite doubles)
const CHECK = { get lt() { return HOLDS.lt; }, get leq() { return HOLDS.leq; }, get gt() { return HOLDS.gt; }, get geq() { return HOLDS.geq; },
  eq: (a, b) => `(1 - abs(sign(${F(`${a} - ${b}`)})))`, neq: (a, b) => `abs(sign(${F(`${a} - ${b}`)}))` };
const HOLDS = { lt: (a, b) => `max(0, sign(${F(`${b} - ${a}`)}))`, gt: (a, b) => `max(0, sign(${F(`${a} - ${b}`)}))`,
  leq: (a, b) => `(1 - max(0, sign(${F(`${a} - ${b}`)})))`, geq: (a, b) => `(1 - max(0, sign(${F(`${b} - ${a}`)})))` };
function truthForm(pairs, divide) {
  const f = former(divide), sides = pairs.map(([op, a, b]) => [op, f.expr(asNode(a)), f.expr(asNode(b))]);
  const fin = `calc(${sides.flatMap(([, a, b]) => [`${a} * 0`, `${b} * 0`]).join(' + ')} + 1)`;
  const holds = sides.map(([op, a, b]) => HOLDS[op](a, b)), t = holds.length === 1 ? holds[0] : `min(${holds.join(', ')})`;
  if (f.names.size) f.decls.push(okDecl(f.names));
  f.decls.push(['--dcss-dcss-fin', fin], ['--dcss-dcss-t', t]);
  return { value: f.names.size ? 'var(--dcss-dcss-ok)' : '1', decls: f.decls, compares: f.compares };
}
const emitTruth = (pairs) => both(truthForm(pairs, DIVIDE.plain), truthForm(pairs, DIVIDE.length));

// --- what the page gets
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const FORMAT_SETTINGS = /^--(precision|comma|symbol|sign|trim|type|currency|locale|base|grouping|zero|fill|align|width|percent)$/;
const splitStyle = (s) => (s ?? '').split(';').map((d) => d.trim()).filter(Boolean).map((d) => { const k = d.indexOf(':'); return [d.slice(0, k).trim(), d.slice(k + 1).trim()]; });
function write({ kind, root, value, decls: own, ints, sides }, math, src) {
  const classes = (math.attrs.class ?? '').split(/\s+/).filter(Boolean), fmt = classes.filter((c) => c.startsWith('dcss-format-')), keep = classes.filter((c) => !c.startsWith('dcss-format-'));
  const decls = splitStyle(math.attrs.style), fmtDecls = decls.filter(([k]) => FORMAT_SETTINGS.test(k)), varDecls = decls.filter(([k]) => k.startsWith('--') && !FORMAT_SETTINGS.test(k)), mathDecls = decls.filter(([k]) => !k.startsWith('--'));
  const css = (ds) => ds.map(([k, v]) => `${k}: ${v}`).join('; ');
  // the formula, for readers: d3's calls in function notation, U+2061 after the name; sums, differences and products
  // infix; fractions, powers, roots and bars as MathML draws them; a negative as an operator; parentheses only where a
  // lower operator sits inside a higher one. Each argument is named for its call's intent; the search for a name stops
  // at an element with its own intent (MathML 4, 5.1), so an inner call's names are its own
  const PREC = { plus: 1, minus: 1, isum: 1, iproduct: 1, times: 2, power: 4 }; // the rest stand alone
  const prec = (x) => (x.node?.op === 'id' ? prec(x.node.items[0]) : x.node ? (x.node.op === 'minus' && x.node.items.length === 1 ? 3 : PREC[x.node.op] ?? 9) : x.neg ? 3 : 9);
  const pres = (node, arg = '') => {
    const { op, items } = node, ids = items.map((_, i) => `$a${i + 1}`).join(',');
    const draw = (x, a = '') => (x.node ? pres(x.node, a) : x.sub ? `<msub${a}><mi>${esc(x.sub[0])}</mi><${x.sub[2] === 'cn' ? 'mn' : 'mi'}>${esc(x.sub[1])}</${x.sub[2] === 'cn' ? 'mn' : 'mi'}></msub>` : x.ci ? `<mi${a}>${esc(x.ci)}</mi>`
        : !x.neg ? (x.mag.startsWith('<mn>') && x.mag.indexOf('<', 1) === x.mag.indexOf('</mn>') ? `<mn${a}>${x.mag.slice(4)}` : `<mrow${a}>${x.mag}</mrow>`)
        : `<mrow${a}><mo>−</mo>${x.mag}</mrow>`);
    const bare = (x) => (x.node?.op === 'id' ? x.node.items[0] : x), paren = (x, m, need) => (prec(x) < need ? `<mrow><mo>(</mo>${m}<mo>)</mo></mrow>` : m);
    const show = (i, need = 0) => { const x = bare(items[i]); return paren(x, draw(x, ` arg="a${i + 1}"`), need); };
    if (op === 'isum' || op === 'iproduct') { // the sign with its range under and over it, then the body as written
      const body = bare(node.display);
      return `<mrow${arg}><munderover><mo>${op === 'isum' ? '∑' : '∏'}</mo><mrow><mi>${esc(node.index)}</mi><mo>=</mo>${draw(bare(node.loItem))}</mrow>${draw(bare(node.hiItem))}</munderover>${paren(body, draw(body), 2)}</mrow>`; }
    const infix = (sign, need) => items.map((x, i) => show(i, prec(x) === 3 ? 4 : need(i))).join(`<mo>${esc(sign)}</mo>`);
    if (op === 'eq' || op === 'assign') return `<mrow${arg} intent="${op === 'eq' ? 'equals' : 'assign'}(${ids})">${items.map((_, i) => show(i)).join(`<mo>${op === 'eq' ? '=' : '≔'}</mo>`)}</mrow>`;
    if (op in RELS) return `<mrow${arg} intent="${{ lt: 'less-than', leq: 'less-than-or-equal', gt: 'greater-than', geq: 'greater-than-or-equal' }[op]}(${ids})">${infix(RELS[op], () => 0)}</mrow>`;
    if (op === 'and') return `<mrow${arg} intent="and(${ids})">${items.map((_, i) => show(i)).join('<mo>,</mo><mspace width="0.5em"/>')}</mrow>`;
    if (op === 'plus') return `<mrow${arg} intent="plus(${ids})">${infix('+', () => 2)}</mrow>`;
    if (op === 'times') return `<mrow${arg} intent="times(${ids})">${infix('×', () => 2)}</mrow>`;
    if (op === 'minus') return items.length === 1 ? `<mrow${arg} intent="minus(${ids})"><mo>−</mo>${show(0, 4)}</mrow>` : `<mrow${arg} intent="minus(${ids})">${infix('−', (i) => (i ? 2 : 1))}</mrow>`;
    if (op === 'divide') return `<mfrac${arg} intent="divide(${ids})">${show(0)}${show(1)}</mfrac>`;
    if (op === 'brackets') return `<mrow${arg} intent="$a1"><mo>[</mo>${show(0)}<mo>]</mo></mrow>`;
    if (op === 'neq') return `<mrow${arg}>${infix('≠', () => 0)}</mrow>`;
    if (op === 'piecewise') { // a brace, each piece a row, its value and "if" its condition, "otherwise" last
      const cond = (c) => (c.parts ? `<mrow>${c.parts.map(cond).join(`<mspace width="0.4em"/><mtext>${c.op}</mtext><mspace width="0.4em"/>`)}</mrow>` : pres({ op: c.op, items: c.items }));
      const rows = node.conds.map((c, i) => `<mtr><mtd>${show(i)}</mtd><mtd><mtext>if</mtext><mspace width="0.4em"/>${cond(c)}</mtd></mtr>`).join('')
        + (node.otherwise ? `<mtr><mtd>${show(items.length - 1)}</mtd><mtd><mtext>otherwise</mtext></mtd></mtr>` : '');
      return `<mrow${arg}><mo>{</mo><mtable>${rows}</mtable></mrow>`; }
    if (op === 'power') return `<msup${arg} intent="power(${ids})">${show(0, 5)}${show(1)}</msup>`;
    if (op === 'root') return node.degree === 2 ? `<msqrt${arg} intent="square-root(${ids})">${show(0)}</msqrt>` : `<mroot${arg} intent="root($a1,$a2)">${show(0)}<mn arg="a2">${node.degree}</mn></mroot>`;
    if (op === 'abs' || op === 'floor' || op === 'ceiling') { const [l, r] = { abs: ['|', '|'], floor: ['⌊', '⌋'], ceiling: ['⌈', '⌉'] }[op];
      return `<mrow${arg} intent="${op === 'abs' ? 'absolute-value' : op}(${ids})"><mo>${l}</mo>${show(0)}<mo>${r}</mo></mrow>`; }
    if (op === 'log' && items.length === 2) return `<mrow${arg} intent="log(${ids})"><msub><mi>log</mi>${show(1)}</msub><mo>⁡</mo><mrow><mo>(</mo>${show(0)}<mo>)</mo></mrow></mrow>`;
    return `<mrow${arg} intent="${op}(${ids})"><mi>${op}</mi><mo>⁡</mo><mrow><mo>(</mo>${items.map((_, i) => show(i)).join('<mo>,</mo>')}<mo>)</mo></mrow></mrow>`;
  };
  const mathAttrs = Object.entries(math.attrs).filter(([k]) => !['class', 'style'].includes(k)).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
    + (keep.length ? ` class="${esc(keep.join(' '))}"` : '') + (mathDecls.length ? ` style="${esc(css(mathDecls))}"` : '');
  const annotation = src.slice(elements(math)[0].start, elements(math)[0].end);
  // what the build writes past ASCII goes as character references, so a page with no charset declared still shows it
  const ascii = (t) => t.replace(/[^\x00-\x7f]/gu, (c) => `&#x${c.codePointAt(0).toString(16)};`);
  const caption = `<figcaption style="overflow-x: auto"><math${mathAttrs}><semantics>${ascii(pres(root))}<annotation-xml encoding="application/mathml-content+xml">${annotation}</annotation-xml></semantics></math></figcaption>`;
  // the answer prints through a formatter: the author's, or d3.format(",.6~f"), as the calls print their own (format-general,
  // d3.format(","), cost 80 ms a frame for 20 moving means in WebKit, fixed 17, the formula itself 3: 2026-10-29)
  const f = fmt.length ? fmt.join(' ') : 'dcss-format-fixed', st = fmt.length || fmtDecls.length ? css(fmtDecls) : '--precision: 6; --trim: 1; --comma: 1';
  // a relation's truth prints through a counter style: nothing, false or true
  const truth = kind === 'truth' ? '@counter-style dcss-dcss-truth { system: fixed 0; symbols: "" "false" "true"; } [data-dcss-truth]::after { content: counter(dcss-dcss-truth, dcss-dcss-truth); }' : '';
  const props = ints.length || truth ? `<style>${ints.map((n) => `@property ${n} { syntax: '<integer>'; inherits: false; initial-value: 0; }`).join(' ')}${truth ? ' ' + truth : ''}</style>` : '';
  const one = (v, d) => `<output class="${f}" style="${d.length ? d.join(' ') + ' ' : ''}--value: ${v}${st ? '; ' + st : ''}"></output>`;
  const answer = kind === 'sides' ? sides.map((e) => one(e.value, e.decls)).join('<span aria-hidden="true"> &#xb7; </span>') : kind === 'truth'
    ? `<output data-dcss-truth style="${own.join(' ')} counter-reset: dcss-dcss-truth calc(${value} * var(--dcss-dcss-fin) * (1 + var(--dcss-dcss-t))); --dcss-err: calc(1 - ${value} * var(--dcss-dcss-fin))"></output>`
    : `<output class="${f}" style="${own.length ? own.join(' ') + ' ' : ''}--value: ${value}${st ? '; ' + st : ''}"></output>`;
  return `<figure data-dcss-mathml${varDecls.length ? ` style="${esc(css(varDecls))}"` : ''}>${caption}${props}<div>${kind === 'value' || kind === 'define' ? '= ' : ''}${answer}</div></figure>`;
}

// --- the page: each <math> the parser would build, compiled when it is one <apply> of an operator
const lineOf = (src, at) => src.slice(0, at).split('\n').length;
export function toDcss(src, { file = 'page.html' } = {}) {
  const found = [], calls = new Set(); let i = 0, pOpen = null; // pOpen: the start of an open <p>, or null
  while (i < src.length) {
    const lt = src.indexOf('<', i); if (lt < 0) break;
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e < 0 ? src.length : e + 3; continue; }
    if (src[lt + 1] === '!' || src[lt + 1] === '?') { const e = src.indexOf('>', lt); i = e < 0 ? src.length : e + 1; continue; }
    const t = tagAt(src, lt);
    if (!t) { i = lt + 1; continue; }
    if (!t.close && RAW.has(t.name)) { const e = src.toLowerCase().indexOf(`</${t.name}`, lt + t.length); i = e < 0 ? src.length : e; continue; }
    if (t.close) { if (t.name === 'p') pOpen = null; i = lt + t.length; continue; }
    if (t.name === 'figure' && /\bdata-dcss-mathml\b/.test(t.rawAttrs)) { const e = src.toLowerCase().indexOf('</figure', lt); i = e < 0 ? src.length : e; continue; } // a formula this build wrote
    if (t.name === 'p') pOpen = { start: lt, end: lt + t.length };
    else if (CLOSES_P.has(t.name)) pOpen = null;
    if (t.name !== 'svg' && t.name !== 'math') { i = lt + t.length; continue; }
    if (t.name === 'svg') { const e = src.toLowerCase().indexOf('</svg', lt); i = e < 0 ? src.length : e; continue; }
    let math;
    try { math = parseMath(src, lt); } catch (e) { if (e instanceof Refusal) throw new Error(`${file}:${lineOf(src, e.at)}: ${e.message}`); throw e; }
    i = math.end;
    // LaTeXML's form: <semantics>, its Presentation MathML first and the Content MathML in an annotation-xml
    const sem = elements(math).length === 1 && elements(math)[0].name === 'semantics' ? elements(math)[0] : null;
    const content = sem && elements(sem).find((a) => a.name === 'annotation-xml' && /^(MathML-Content|application\/mathml-content\+xml)$/i.test(a.attrs.encoding ?? ''));
    if (content && elements(content).length === 1 && ['apply', 'piecewise'].includes(elements(content)[0].name)) math = { ...math, children: [elements(content)[0]] };
    const kids = elements(math);
    if (kids.length !== 1 || !['apply', 'piecewise'].includes(kids[0].name) || !blank(math)) {
      // a formula with Content MathML outside an annotation would draw nothing in Chrome and Safari
      const loose = (n) => elements(n).some((c) => c.name === 'annotation-xml' || c.name === 'annotation' ? false : ['apply', 'piecewise', 'cn', 'ci', 'csymbol', 'bind'].includes(c.name) || loose(c));
      if (loose(math)) throw new Error(`${file}:${lineOf(src, math.start)}: Content MathML outside an annotation draws nothing in Chrome and Safari; this build compiles a <math> whose one element is an <apply> or a <piecewise>`);
      continue;
    }
    let from = math.start, to = math.end;
    if (pOpen) { // a formula alone in a paragraph takes the paragraph's place; beside text the figure's list would close it
      const before = src.slice(pOpen.end, math.start), after = src.slice(math.end), close = /^\s*<\/p\s*>/i.exec(after), next = /^\s*<([a-z][a-z0-9]*)/i.exec(after);
      const alone = !before.trim() && (close || /^\s*$/.test(after) || (next && CLOSES_P.has(next[1].toLowerCase())));
      if (!alone) throw new Error(`${file}:${lineOf(src, math.start)}: a formula beside text in a paragraph: the call's list would close the paragraph; give the formula its own line`);
      from = pOpen.start; to = close ? math.end + close[0].length : math.end; pOpen = null;
    }
    found.push({ from, to, math });
  }
  // the page's definitions, in document order: each name once, and never one the page sets itself
  const defs = found.map((f) => definition(elements(f.math)[0])), where = new Map();
  defs.forEach((d, k) => { if (!d) return; const at = found[k].math.start, line = lineOf(src, at);
    if (where.has(d[0])) throw new Error(`${file}:${line}: ${d[0]} is defined twice (line ${where.get(d[0]).line} first)`);
    const outside = src.slice(0, found[0].from) + found.map((f, j) => src.slice(f.to, found[j + 1]?.from ?? src.length)).join('');
    if (new RegExp(`--${d[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`).test(outside)) throw new Error(`${file}:${line}: the page sets --${d[0]} itself, which this definition would hide from the formulas after it`);
    where.set(d[0], { k, line }); });
  const edits = found.map((f, k) => {
    DEFS = new Map(); LATER = new Map();
    for (const [name, w] of where) if (w.k < k) DEFS.set(name, null); else if (w.k > k) LATER.set(name, w.line);
    let compiled;
    try {
      for (const [name, w] of where) if (w.k < k) DEFS.set(name, found[w.k].compiled.root.items[1].node);
      compiled = f.compiled = compile(f.math);
    } catch (e) { if (e instanceof Refusal) throw new Error(`${file}:${lineOf(src, e.at)}: ${e.message}`); throw e; }
    const each = (n) => { calls.add(n.call); n.items.forEach((x) => x.node && each(x.node)); }; each(compiled.root);
    // the first figure brings the rule that puts each answer beside its formula, at no specificity, so a page's own wins
    return { from: f.from, to: f.to, html: (k ? '' : LAYOUT) + write(compiled, f.math, src) };
  });
  let out = '', at = 0;
  for (const e of edits) { out += src.slice(at, e.from) + e.html; at = e.to; }
  out += src.slice(at);
  return { ...links(out, edits.length), calls: [...calls], count: edits.length };
}

const LAYOUT = '<style>:where(figure[data-dcss-mathml]) { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 0.5em; }</style>';
// the sheets the compiled calls need, linked beside the page's link to dcss (dcss.css, or dcss-array.css as published),
// unless the page links them or their parts already; with no link to dcss at all, listed in `needs`
function links(html, count) {
  if (!count) return { html, needs: [] };
  const want = stylesheetsFor(html), core = /<link\b[^>]*\bhref\s*=\s*["']?([^"'\s>]*?)(dcss|dcss-array)\.css([?#][^"'\s>]*)?["']?[^>]*>/i.exec(html);
  const linked = (f) => new RegExp(`href\\s*=\\s*["']?[^"'\\s>]*${f.replace(/[.\/]/g, (c) => '\\' + c)}`, 'i').test(html);
  const parts = (f) => (manifestOwners[f] ?? []).every((c) => linked(`parts/${c}.css`));
  const missing = want.filter((f) => !linked(f) && !parts(f));
  if (!core) return { html, needs: missing };
  const add = missing.map((f) => `<link rel="stylesheet" href="${core[1]}${f}">`).join('');
  return { html: html.slice(0, core.index + core[0].length) + add + html.slice(core.index + core[0].length), needs: [] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // node mathml.mjs page.html [built.html]: the built page to the file, written only when the build succeeds, or to stdout
  const [file, to] = process.argv.slice(2);
  if (!file) { console.error('usage: node mathml.mjs <page.html> [built.html]  (with no second file, the page goes to stdout)'); process.exit(1); }
  try {
    const r = toDcss(readFileSync(file, 'utf8'), { file });
    if (r.needs.length) { console.error(`${file}: the page links no dcss sheet: link ${manifest.core.file} (it brings ${r.needs.join(', ')} beside it); nothing written`); process.exit(1); }
    if (to) writeFileSync(to, r.html); else process.stdout.write(r.html);
  } catch (e) { console.error(e.message); process.exit(1); }
}
