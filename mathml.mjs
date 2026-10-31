// node mathml.mjs <page.html> [built.html]: a page whose formulas are written in Content MathML, each compiled to a
// calc() the page computes, to built.html or stdout; exits 1 with file:line and the reason on a formula it can't take.
// Content MathML (MathML 4, chapter 4) says what a formula means; Chrome and Safari draw none of it and CSS can't read a
// <cn>'s text, so a page can't compute on it: this build writes each formula as the calc() of d3's own operations, and
// keeps the formula, as Presentation MathML with the author's Content MathML as its annotation, for readers.
//   <math><apply><median/><apply><mean/><cn>4</cn><cn>1.5</cn></apply><ci>jan</ci></apply></math>
// becomes a figure with the formula as its caption and an <output> whose --value is d3.median([d3.mean([4, 1.5]),
// jan]) to the bit, jan read from --jan on an ancestor (unset: no answer, --dcss-err 1). Only a <math> whose one element
// child is an <apply> of an operator it takes, or a <piecewise>, is compiled; the rest of the page is copied byte for byte, so the build
// run on its own output changes nothing.
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, watchFile, writeFileSync } from 'node:fs';
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
const TAG = /<(\/?)([a-zA-Z][^\s/>]*)((?:\s+(?:[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)|\s*\/(?!>))*)\s*(\/?)>/y;
const tagAt = (s, i) => {
  TAG.lastIndex = i; const m = TAG.exec(s); // the whole tag, however long (a built scope's start tag passes 40 KB)
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
  const type = cn.attrs.type === 'float' ? 'double' : cn.attrs.type ?? 'real', base = cn.attrs.base; // LaTeXML's float, a double
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
  minus: 'minus', times: 'times', divide: 'divide', power: 'power', root: 'root', abs: 'abs', floor: 'floor', ceiling: 'ceiling', factorial: 'factorial', gcd: 'gcd', lcm: 'lcm' };
const SYMBOLS = { s_data1: ['median', 'mean'], minmax1: ['min', 'max'], arith1: ['plus', 'minus', 'unary_minus', 'times', 'divide', 'power', 'root', 'abs', 'gcd', 'lcm'], rounding1: ['floor', 'ceiling'], integer1: ['factorial'] };
// how many arguments each takes, past the statistics' lists
const ARITY = { binomial: [2, 2], factorial: [1, 1], gcd: [2, Infinity], lcm: [2, Infinity], brackets: [1, 1], quotient: [2, 2], rem: [2, 2], minus: [1, 2], divide: [2, 2], power: [2, 2], root: [1, 1], abs: [1, 1], floor: [1, 1], ceiling: [1, 1], times: [2, Infinity], plus: [2, Infinity] };
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
// a double as the split's integers (e, a, b, c, z), as SPLIT computes them and join() reads them back
const splitInts = (v) => { if (v === 0) return { e: -1074, a: 0, b: 0, c: 0, z: Object.is(v, -0) ? 1 : 0 };
  const { mant, e } = bitsOf(v), E = Number(BigInt(mant.toString(2).length) - 1n + e), m = v * 2 ** (17 - E), a = Math.trunc(m), f = (m - a) * 524288, b = Math.trunc(f);
  return { e: E, a, b, c: (f - b) * 524288, z: 0 }; };
// exp of a name the page sets, computed in calc() to the double nearest the true value or no answer (EXPS below): the
// constants, from the same BigInt values. ln 2 / 64 in three parts, the first two of 36 bits so that k times them is
// exact for |k| < 2^17; 2^(j/64) for j = 0..63 as a double and the double nearest what it leaves; 1/n! for n = 3..8
export const EXPK = (() => { const c = at(1200n), dbl = (v) => nearest(v, c.P), keep36 = (v) => { const drop = BigInt(v.toString(2).length) - 36n; return (v >> drop) << drop; };
  const L = c.LN2 / 64n, L1 = keep36(L), L2 = keep36(L - L1);
  const halves = (a) => { const t = 134217729 * a, hi = t - (t - a); return [hi, a - hi]; };
  const T = Array.from({ length: 64 }, (_, j) => { const v = c.ex((c.LN2 * BigInt(j)) / 64n), h = dbl(v); return [h, dbl(v - c.fix(h)), ...halves(h)].map(splitInts); });
  const C = [3, 4, 5, 6, 7, 8].map((n) => { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return dbl(c.ONE / f); });
  return { L1: dbl(L1), L2: dbl(L2), L3: dbl(L - L1 - L2), INV: dbl((c.ONE << c.P) / L), T, C }; })();
// sin, cos, sec and csc of a name the page sets (TRIGK): π/512 in three 25-bit parts and the rest (k times each part is exact for
// |k| < 2^28), 512/π, and sin and cos of iπ/512 for i = 0..256 as pairs, as the split's integers
export const TRIGK = (() => { const c = at(1600n), dbl = (v) => nearest(v, c.P), pair = (v) => { const h = dbl(v); return [h, dbl(v - c.fix(h))]; };
  const keep = (v, n) => { const drop = BigInt(v.toString(2).length) - BigInt(n); return drop > 0n ? (v >> drop) << drop : v; };
  const Q = c.PI / 512n, P1 = keep(Q, 25), P2 = keep(Q - P1, 25), P3 = keep(Q - P1 - P2, 25);
  const S = [], C = []; for (let i = 0; i <= 256; i++) { const a = (c.PI * BigInt(i)) / 512n; S[i] = pair(c.sin(a)).map(splitInts); C[i] = pair(c.cos(a)).map(splitInts); }
  return { PP: [P1, P2, P3].map(dbl), P4: dbl(Q - P1 - P2 - P3), INV: dbl((c.ONE << c.P) / Q), S, C }; })();
// 1/6 as a pair: sinh's series takes x³/6 to 2^-104
export const SIXTH = (() => { const c = at(400n), h = nearest(c.ONE / 6n, c.P); return [h, nearest(c.ONE / 6n - c.fix(h), c.P)]; })();
// num/den and ln 2 as pairs, for the inverse hyperbolic functions' series and their ln
export const PAIROF = (num, den) => { const c = at(400n), v = (c.ONE * BigInt(num)) / BigInt(den), h = nearest(v, c.P); return [h, nearest(v - c.fix(h), c.P)]; };
export const LN2PAIR = (() => { const c = at(400n), h = nearest(c.LN2, c.P); return [h, nearest(c.LN2 - c.fix(h), c.P)]; })();
// tan and cot of a name the page sets (TANK): tan(iπ/512) for i = 0..128 as pairs, as the split's integers
export const TANK = (() => { const c = at(1600n), dbl = (v) => nearest(v, c.P), pair = (v) => { const h = dbl(v); return [h, dbl(v - c.fix(h))]; };
  return Array.from({ length: 129 }, (_, i) => { const a = (c.PI * BigInt(i)) / 512n; return pair(c.div(c.sin(a), c.cos(a))).map(splitInts); }); })();
// arctan of a name the page sets (ATANK): atan(j/256) for j = 0..256 as pairs, as the split's integers, and π/2 as a pair
export const ATANK = (() => { const c = at(1600n), dbl = (v) => nearest(v, c.P), pair = (v) => { const h = dbl(v); return [h, dbl(v - c.fix(h))]; };
  return { A: Array.from({ length: 257 }, (_, j) => pair(c.atan((c.ONE * BigInt(j)) / 256n)).map(splitInts)), PI2: pair(c.PI / 2n) }; })();
const PIPAIR = (() => { const c = at(1600n), h = nearest(c.PI, c.P); return [h, nearest(c.PI - c.fix(h), c.P)]; })(); // π as a pair
// 1/ln 10 and 1/ln 2 as pairs, for a live log10 and log2
// 1/ln b as a pair, for a live log to a base b the build knows (10 and 2 the usual ones)
export const logInv = (b) => { const c = at(1200n), dbl = (v) => nearest(v, c.P), v = (c.ONE << c.P) / c.ln(c.fix(b)), h = dbl(v); return [h, dbl(v - c.fix(h))]; };
export const LOGINV = { 10: logInv(10), 2: logInv(2) };
// 0! to 170!, exactly, and as the split's integers of each rounded once (the table a live factorial picks from)
const FACT = [1n]; for (let i = 1n; i <= 170n; i++) FACT.push(FACT.at(-1) * i);
export const FACTK = FACT.map((f) => splitInts(Number(f)));
// the n-th root of a number the build knows, odd ones of negatives (an operator, <root/>, not one of the functions above)
export const rootOf = (x, n) => (x === 0 ? x : x < 0 ? (n % 2 ? -rootOf(-x, n) : NaN) : trueOf((c, X) => c.ex(c.ln(X) / BigInt(n)))(x));
const WHY = {
  sum: '<sum/> binds a variable over limits; a list of numbers is added with <plus/>',
  variance: "MathML doesn't say whether it divides by n or n - 1; d3's, which divides by n - 1, is <csymbol definitionURL=\"https://d3js.org/d3-array/summarize#variance\">variance</csymbol>",
  sdev: "MathML doesn't say whether it divides by n or n - 1; d3's, which divides by n - 1, is <csymbol definitionURL=\"https://d3js.org/d3-array/summarize#deviation\">deviation</csymbol>",
  mode: "MathML doesn't say which value a tie gives; d3's, the first value to reach the count, is <csymbol definitionURL=\"https://d3js.org/d3-array/summarize#mode\">mode</csymbol>", moment: 'dcss has no moment', card: "a set's size drops repeated values, which d3.count counts",
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
// one build's state (toDcss starts a fresh one and puts the one before back, so two builds share nothing): the definitions
// the formula being compiled sees (defs: above it in its own data-dcss-scope or one around it; later: further down
// there; elsewhere: in a scope it isn't in, line by name) and the indexes of the sums being unrolled (index: a number,
// or null where the body is drawn as written)
let CX = { defs: new Map(), later: new Map(), elsewhere: new Map(), index: new Map(), series: new Map(), seriesElsewhere: new Map() };
const isAssign = (h) => h?.name === 'csymbol' && h.attrs.cd === 'latexml' && textOf(h).trim() === 'assign';
const subName = (a) => a?.name === 'apply' && elements(a)[0]?.name === 'csymbol' && elements(a)[0].attrs.cd === 'ambiguous' && textOf(elements(a)[0]).trim() === 'subscript';
// a word as a subscript, v_{\text{max}} (LaTeXML's <ci><mtext>) or T_{room} (its product of letters, none a sum's index):
// one name, v_max, T_room
const wordOf = (x) => (x?.name === 'ci' && elements(x).length === 1 && elements(x)[0].name === 'mtext' && /^[\p{L}\p{N}]+$/u.test(textOf(x).trim()) ? textOf(x).trim()
  : x?.name === 'apply' && elements(x)[0]?.name === 'times' && elements(x).length > 2 && elements(x).slice(1).every((c) => c.name === 'ci' && !elements(c).length && /^\p{L}$/u.test(textOf(c).trim().normalize('NFKC')) && !CX.index.has(textOf(c).trim().normalize('NFKC')))
    ? elements(x).slice(1).map((c) => textOf(c).trim().normalize('NFKC')).join('') : null);
// LaTeXML's \bar{x}, \overline{x}, \hat{p} and \tilde{y}, an <apply> of the mark: one name, the letter and its combining mark
// (x̄ is --x̄), as statistics writes a mean or an estimate
const ACCENT = { '¯': '\u0304', '^': '\u0302', '~': '\u0303', '˜': '\u0303' };
const accentOf = (a) => { const [h, x, ...more] = a?.name === 'apply' ? elements(a) : [];
  return h?.name === 'ci' && !elements(h).length && textOf(h).trim() in ACCENT && x?.name === 'ci' && !elements(x).length && !more.length ? [textOf(x).trim().normalize('NFKC'), textOf(h).trim()] : null; };
const loneName = (a) => { const acc = accentOf(a); if (acc) return acc[0] + ACCENT[acc[1]];
  if (a?.name === 'ci' && !elements(a).length) return textOf(a).trim().normalize('NFKC');
  const ix = subName(a) && elements(a).length === 3 ? elements(a)[2] : null, w = wordOf(ix);
  return ix && (w || ['ci', 'cn'].includes(ix.name)) ? `${textOf(elements(a)[1]).trim()}_${w ?? textOf(ix).trim()}`.normalize('NFKC') : null; };
// what a formula defines: [name, the side that defines it], or null
function definition(top) {
  const [head, ...args] = elements(top);
  if (!(head?.name === 'eq' || isAssign(head)) || args.length !== 2) return null;
  const l = loneName(args[0]), r = isAssign(head) ? null : loneName(args[1]);
  return l ? [l, args[1], args[0]] : r ? [r, args[0], args[1]] : null;
}
function compile(math) {
  if ('cdgroup' in math.attrs) throw refusal(math.start, 'a cdgroup could rename the symbols');
  // a product that is a condition in words (x < 0 \text{ or } x > 1, as LaTeXML reads it) is that condition
  const top0 = elements(math)[0], said = elements(top0)[0]?.name === 'times' ? spoken(top0) : top0, h0 = elements(said)[0]?.name;
  const top = h0 in CONDS || h0 in LOGIC || h0 in MEMBER || h0 === 'factorof' ? said : top0, [head, ...args] = elements(top), assign = isAssign(head), def = definition(top);
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
  } else if (head?.name in RELS || head?.name === 'neq' || head?.name in LOGIC || head?.name in MEMBER || head?.name === 'factorof') {
    // a relation other than =, x ∈ a set, or <and/>, <or/>, <xor/>, <not/> or <implies/> of them (= among them: JavaScript's ===)
    if (head.name in RELS && args.length < 2) throw refusal(top.start, `<${head.name}/> of ${args.length} argument: an inequality compares two or more`);
    const c = condition(top), shown = (q) => (q.chain ? { op: 'chain', call: 'relation', ...q.chain } : q.parts ? { op: q.op, call: 'relation', items: q.parts.map((p) => ({ node: shown(p) })) } : { op: q.op, call: 'relation', items: q.items, of: q.of, closure: q.closure });
    out = { kind: 'truth', root: shown(c), ...emitTruth(c) };
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
  // LaTeXML's log_b x and f^n x as an <apply> of a sub- or superscripted function: log to base b; (f x)^n for a whole n
  // from 2 (sin² x); f^{-1} x the inverse function (sin^{-1} x is arcsin x)
  if (head.name === 'apply') { const [h0, f, n, ...more] = elements(head), fn = f && f.name in MATHFN ? f.name : null;
    if (h0?.name === 'csymbol' && h0.attrs.cd === 'ambiguous' && fn && n && !more.length) { const scr = textOf(h0).trim();
      if (scr === 'subscript' && fn === 'log') return folded('log', f.start, [...kids.slice(1), { name: 'logbase', start: n.start, children: [n] }], apply);
      const neg1 = n.name === 'apply' && elements(n).length === 2 && elements(n)[0].name === 'minus' && elements(n)[1].name === 'cn' && number(elements(n)[1]).x === 1;
      if (scr === 'superscript' && (neg1 || (n.name === 'cn' && number(n).x === -1)) && `arc${fn}` in MATHFN) return folded(`arc${fn}`, f.start, kids.slice(1), apply);
      if (scr === 'superscript' && n.name === 'cn' && Number.isInteger(number(n).x) && number(n).x >= 2) return { op: 'power', call: CALLS.power, items: [{ node: folded(fn, f.start, kids.slice(1), apply) }, item(n)], start: apply.start }; } }
  // LaTeXML's \begin{cases}: value, condition, value, condition…, a last value with "otherwise" (or none), as <piecewise>
  if (head.name === 'csymbol' && head.attrs.cd === 'latexml' && textOf(head).trim() === 'cases') { const xs = kids.slice(1), parts = [];
    for (let i = 0; i < xs.length; i += 2) { const v = xs[i], c = xs[i + 1];
      if (!c || (c.name === 'ci' && /^(otherwise|else)[.,;]?$/i.test(textOf(c).trim()))) parts.push({ name: 'otherwise', start: v.start, children: [v] }); else parts.push({ name: 'piece', start: v.start, children: [v, c] }); }
    return piecewise({ name: 'piecewise', start: head.start, children: parts }); }
  if (head.name === 'apply') throw refusal(head.start, 'a nested <apply> as the operator: one operator applied to numbers');
  let op, args = kids.slice(1), degree = 2;
  if (head.name === 'csymbol' && head.attrs.cd === 'ambiguous' && textOf(head).trim() === 'superscript') op = 'power'; // LaTeXML's x^2, read as a power
  else if (head.name === 'csymbol' && head.attrs.cd === 'ambiguous' && textOf(head).trim() === 'subscript') throw refusal(head.start, 'a subscript as the operator (an indexed function): this build has no definition for it');
  else if (head.name === 'ci' && ['⋅', '·', '×', '∗'].includes(textOf(head).trim())) op = 'times'; // LaTeXML's \cdot, a <ci> it doesn't name
  else if (head.name === 'ci') throw refusal(head.start, `<ci>${textOf(head).trim()}</ci> as the operator (a function the page names): this build has no definition for it`);
  else if (head.name === 'csymbol' && head.attrs.cd === 'latexml' && textOf(head).trim() === 'delimited-[]') { // LaTeXML's [x]: brackets as grouping
    if (args.length !== 1) throw refusal(head.start, `LaTeXML's [ ] around ${args.length} things: [a, b] is an interval or a commutator, not a number`);
    op = 'brackets';
  } else if (head.name === 'csymbol' && ['latexml', 'combinat1', 'dlmf'].includes(head.attrs.cd) && textOf(head).trim() === 'binomial') { op = 'binomial'; // \binom{n}{k}
  } else if (head.name === 'csymbol' && head.attrs.cd === 'latexml' && textOf(head).trim() === 'percent') { op = 'percent';
  } else if (head.name === 'csymbol' && head.attrs.cd === 'latexml' && textOf(head).trim() === 'modulo') { op = 'rem'; // \bmod, as MathML's rem: the sign of the first
  } else if (head.name === 'csymbol' && head.attrs.cd === 'transc1' && textOf(head).trim() in MATHFN) { // OpenMath's log takes its base first
    const name = textOf(head).trim(); if (name === 'log' && args.length !== 2) throw refusal(apply.start, `transc1 log of ${args.length} arguments: it takes the base and a number`);
    return folded(name, head.start, name === 'log' ? [args[1], { name: 'logbase', start: args[0].start, children: [args[0]] }] : args, apply);
  } else if (head.name === 'csymbol' && 'definitionurl' in head.attrs) { // d3's own functions, by their documented definitions (MathML 4, 4.2.3.2)
    const url = head.attrs.definitionurl.trim(), fn = D3SYMBOL.exec(url)?.[1], name = textOf(head).trim();
    if (!fn) throw refusal(head.start, `<csymbol definitionURL="${url}">: this build takes d3's sum, count, maxIndex, minIndex, variance, deviation, quantile and mode of a series, https://d3js.org/d3-array/summarize#sum, #count, #maxIndex, #minIndex, #variance, #deviation, #quantile and #mode`);
    if (name !== fn) throw refusal(head.start, `<csymbol definitionURL="${url}">${name}</csymbol>: the symbol's text is its function's name, ${fn}`);
    // d3's quantile takes the series and p: a number written in the page, or a formula the page sets
    const want = fn === 'quantile' ? 2 : 1, nm = args.length === want && args[0].name === 'ci' ? letterOf(args[0]) : null, q = nm && CX.series.get(nm);
    if (!q) throw refusal(apply.start, nm && CX.seriesElsewhere.has(nm) ? `${nm} is a series of another data-dcss-scope (line ${CX.seriesElsewhere.get(nm)}): a formula reads the series of its own scope and the scopes around it`
      : fn === 'quantile' ? "d3's quantile takes a series and p: a <ci> naming a list or table marked data-dcss-series, then p (0.9 for the 90th percentile)" : `d3's ${fn} takes one series, a <ci> naming a list or table marked data-dcss-series (for names or numbers, <plus/> adds them)`);
    if (fn === 'quantile') { const pi = item(args[1]); return seriesStat(fn, q, apply, itemValue(pi), pi); }
    return seriesStat(fn, q, apply);
  } else if (head.name === 'csymbol') {
    const cd = head.attrs.cd, name = textOf(head).trim();
    if (cd === 'latexml' && name === 'expectation') throw refusal(head.start, "LaTeXML's ⟨…⟩, which it reads from a < before a > in one formula: 2x + 1 < 0 \\text{ or } x > 1 comes out as 2x + 1 ⟨0 or x⟩ 1; put each relation in parentheses, (2x + 1 < 0) \\text{ or } (x > 1), or write the second as 1 < x");
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
    if (head.name === 'selector') { // MathML 4's <selector/> (4.3.7.3): item i of a list, here slot i of a series, as sales_i reads it
      const [list, ix, ...more] = args; if (!list || !ix || more.length || list.name !== 'ci') throw refusal(head.start, '<selector/> takes a series and one index: <apply><selector/><ci>sales</ci><ci>i</ci></apply>');
      const nm = letterOf(list), q = CX.series.get(nm); if (!q) throw refusal(list.start, CX.seriesElsewhere.has(nm) ? `${nm} is a series of another data-dcss-scope (line ${CX.seriesElsewhere.get(nm)}): a formula reads the series of its own scope and the scopes around it` : `<selector/> of ${nm}: no series of that name in this data-dcss-scope or one around it`);
      const k = ix.name === 'cn' ? number(ix).x : ix.name === 'ci' ? CX.index.get(letterOf(ix)) : undefined;
      if (k === null) return { op: 'id', call: 'id', items: [{ ci: `${nm}_${letterOf(ix)}`, sub: [nm, letterOf(ix), 'ci'] }] }; // the body drawn as written
      if (k === undefined) throw refusal(ix.start, `<selector/> of ${nm}: its index is a number or a sum's index`);
      return { op: 'id', call: 'id', items: [slotItem(q, k, apply.start, [nm, String(k), 'cn'])] }; }
    if (!(head.name in CALLS)) throw refusal(head.start, WHY[head.name] ?? `<${head.name}/> is not an operator this build takes (median, mean, min, max, plus, minus, times, divide, power, root, abs, floor and ceiling)`);
    op = head.name;
  }
  // LaTeXML's 30^\circ, a superscript of <compose/> (it reads ∘ as composition): degrees, x · (π / 180) as MDN's degToRad
  // writes it; and its 10\%: x / 100. Each drawn as written
  const synth = (name, at, kids = []) => ({ name, attrs: {}, start: at, children: kids });
  if (op === 'power' && args.length === 2 && args[1].name === 'compose') {
    const at = args[1].start, rad = synth('apply', at, [synth('divide', at), synth('pi', at), synth('cn', at, [{ text: '180' }])]);
    return { op: 'times', call: CALLS.times, items: [item(args[0]), item(rad)], shown: 'degrees', start: apply.start }; }
  if (op === 'percent') { if (args.length !== 1) throw refusal(apply.start, `LaTeXML's percent of ${args.length} things: 10\\% is one number`);
    return { op: 'divide', call: CALLS.divide, items: [item(args[0]), item(synth('cn', apply.start, [{ text: '100' }]))], shown: 'percent', start: apply.start }; }
  if (op === 'root') { const q = args.filter((a) => a.name === 'degree'); // <root/> with a <degree> qualifier (MathML 4, 4.3.3.2); none is a square root
    if (q.length > 1) throw refusal(q[1].start, 'two <degree>s');
    if (q.length) { const k = elements(q[0]); if (k.length !== 1 || k[0].name !== 'cn') throw refusal(q[0].start, '<degree> holds one <cn>, the root\'s degree'); degree = degreeOf(k[0]); args = args.filter((a) => a !== q[0]); } }
  for (const a of args) if (QUALIFIERS.has(a.name)) throw refusal(a.start, `<${a.name}>: qualifiers aren't taken, only numbers`);
  for (const a of args) if (!['cn', 'ci', 'apply', 'piecewise'].includes(a.name) && !constantOf(a)) throw a.name === 'share' ? refusal(a.start, SHARE) : refusal(a.start, `<${a.name}> as an argument: only <cn> numbers, <ci> names, π, e and another <apply>`);
  if (!args.length) throw refusal(apply.start, `${op} of nothing`);
  const [lo, hi] = ARITY[op] ?? [1, Infinity];
  if (args.length < lo || args.length > hi) throw refusal(apply.start, `${op} of ${args.length} argument${args.length === 1 ? '' : 's'}: it takes ${lo === hi ? lo : hi === Infinity ? `${lo} or more` : `${lo} or ${hi}`}`);
  if (args.length === 1 && args[0].name === 'ci' && !ARITY[op]) { const nm = letterOf(args[0]), q = CX.series.get(nm);
    if (q) return seriesStat(op, q, apply);
    if (CX.seriesElsewhere.has(nm)) throw refusal(args[0].start, `${nm} is a series of another data-dcss-scope (line ${CX.seriesElsewhere.get(nm)}): a formula reads the series of its own scope and the scopes around it`);
    throw refusal(args[0].start, `one <ci> alone: MathML reads it as a data set (MathML 4, §4.3.5.13), not one value; a page's list or table marked data-dcss-series is one`); }
  const items = args.map((a) => item(a));
  // n! of a whole n from 0 to 170 (past it, n! passes the largest double): the true value, rounded once; of a number the
  // build knows, written in, of a name the page sets, picked from the 171 on the page; gcd and lcm of whole numbers the
  // build knows, as MathML's (gcd(0, 0) is 0, the lcm of any with 0 is 0); of names the page sets, on the page (liveGcd)
  if (op === 'factorial') { const n = itemValue(items[0]);
    if (n === null) return { op, call: 'factorial', items, start: apply.start };
    if (!Number.isInteger(n) || n < 0) throw refusal(apply.start, `factorial of ${n}: MathML's factorial takes whole numbers from 0`);
    return fixed('factorial', n > 170 ? Infinity : Number(FACT[n]), items, apply.start); } // Number() of a BigInt rounds once, to nearest
  // C(n, k) of whole n ≥ 0 and k (0 where k is past n or below 0): of numbers the build knows, the double nearest it; of
  // names the page sets, n! / (k! (n − k)!) from the factorial table rounded to a whole number, exact while it is below
  // 2^50 (the three roundings move it less than a millionth), no answer above it or for n past 170
  if (op === 'binomial') { const [n, k] = items.map((x) => itemValue(x));
    if (n === null || k === null) return { op, call: 'binomial', items, start: apply.start };
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k) || n < 0) throw refusal(apply.start, `binomial of ${n} and ${k}: this build takes whole n from 0 and whole k`);
    if (k < 0 || k > n) return fixed('binomial', 0, items, apply.start);
    let c = 1n; for (let i = 1n, kk = BigInt(Math.min(k, n - k)); i <= kk; i++) c = (c * (BigInt(n) - kk + i)) / i;
    return fixed('binomial', Number(c), items, apply.start); }
  if (op === 'gcd' || op === 'lcm') { const vs = items.map((x) => itemValue(x));
    if (!vs.every((v) => v === null || Number.isSafeInteger(v))) throw refusal(apply.start, `${op} of ${vs.find((v) => v !== null && !Number.isSafeInteger(v))}: MathML's ${op} takes whole numbers, here within ±2^53`);
    if (vs.includes(null)) return { op, call: op, items, start: apply.start };
    const g = (a, b) => (b ? g(b, a % b) : a), big = vs.map((v) => BigInt(Math.abs(v)));
    const r = op === 'gcd' ? big.reduce(g) : big.reduce((a, b) => (a === 0n || b === 0n ? 0n : (a / g(a, b)) * b));
    return fixed(op, Number(r), items, apply.start); }
  if (op === 'quotient' || op === 'rem') { const [a, b] = items.map(itemValue);
    if (a !== null && b !== null && !wholeArgs(a, b)) throw refusal(apply.start, `${op} of ${a} and ${b}: MathML's integer division takes whole numbers, within ±2^26 here, and a divisor that isn't 0`); }
  // e to a power is exp(x) (MathML 4: power of exponentiale), not Math.pow(Math.E, x), another double for 92 of 100 x
  if (op === 'power' && (items[0].konst === 'e' || (items[0].ci === 'e' && !items[0].def))) { const seen = new Set(), x = itemValue(items[1], seen);
    if (x !== null) return fixed('power', MATHFN.exp(x), items, apply.start, items[0].ci ? seen.add('e') : seen, items[0].ci && { op, call: CALLS[op], items }); }
  // e to a power the page sets: exp computed on the page; LaTeXML's 𝑒 is the page's --e where it sets one (Math.pow then)
  if (op === 'power' && (items[0].konst === 'e' || (items[0].ci === 'e' && !items[0].def))) return { op, call: items[0].konst ? 'exp' : 'eset', items, start: apply.start };
  // a root of a degree other than a power of 2: of a number the build knows, the double nearest the true root (∛64 is 4),
  // and of a name the page sets the same double computed on the page (liveRoot), for degrees up to 1,000
  if (op === 'root' && degree & (degree - 1)) { const x = itemValue(items[0]);
    if (x === null && degree > 1000) throw refusal(apply.start, `a root of degree ${degree} of a name the page sets: degrees from 3 to 1,000 are computed on the page (y^n is a pair squared once a bit of n); of a number the build knows it is computed when the page is built`);
    if (x === null) return { op, call: 'nroot', items, degree, start: apply.start };
    return Object.assign(fixed('root', rootOf(x, degree), items, apply.start), { degree }); }
  return { op, call: CALLS[op], items, degree, start: apply.start };
}
// d3's mean, min, max and median of an array, undefined and NaN skipped (d3-array's own loops: mean.js, min.js, max.js,
// and median.js's quantile at 0.5, which takes the larger of the lower half and the smaller of the upper half)
const d3min = (vs) => { let m; for (const v of vs) if (v != null && (m > v || (m === undefined && v >= v))) m = v; return m; };
const d3max = (vs) => { let m; for (const v of vs) if (v != null && (m < v || (m === undefined && v >= v))) m = v; return m; };
const D3SERIES = { min: d3min, max: d3max,
  sum: (vs) => { let s = 0; for (let v of vs) if ((v = +v)) s += v; return s; },
  count: (vs) => { let n = 0; for (let v of vs) if (v != null && (v = +v) >= v) ++n; return n; },
  maxIndex: (vs) => { let m, k = -1, i = -1; for (const v of vs) { ++i; if (v != null && (m < v || (m === undefined && v >= v))) { m = v; k = i; } } return k; },
  minIndex: (vs) => { let m, k = -1, i = -1; for (const v of vs) { ++i; if (v != null && (m > v || (m === undefined && v >= v))) { m = v; k = i; } } return k; },
  mean: (vs) => { let n = 0, s = 0; for (let v of vs) if (v != null && (v = +v) >= v) { n++; s += v; } return n ? s / n : undefined; },
  median: (vs) => { const xs = vs.filter((v) => v != null && v >= v), n = xs.length; if (!n) return undefined; if (n < 2) return d3min(xs);
    const sorted = [...xs].sort((a, b) => a - b), i0 = Math.floor((n - 1) / 2), v0 = d3max(sorted.slice(0, i0 + 1)), v1 = d3min(sorted.slice(i0 + 1));
    return v0 + (v1 - v0) * ((n - 1) * 0.5 - i0); },
  // variance.js: Welford's running mean, the sum of squares divided by n - 1, none under two values; deviation.js its root
  variance: (vs) => { let count = 0, delta, mean = 0, sum = 0; for (let v of vs) if (v != null && (v = +v) >= v) { delta = v - mean; mean += delta / ++count; sum += delta * (v - mean); } return count > 1 ? sum / (count - 1) : undefined; },
  deviation: (vs) => { const v = D3SERIES.variance(vs); return v ? Math.sqrt(v) : v; },
  // quantile.js: the min at p <= 0 or under two values, the max at p >= 1; else the values ranked i0 = floor((n - 1) · p)
  // and i0 + 1, v0 + (v1 - v0) · ((n - 1) · p - i0)
  quantile: (vs, p) => { const xs = vs.filter((v) => v != null && (v = +v) >= v).map(Number), n = xs.length; if (!n || Number.isNaN(p)) return undefined;
    if (p <= 0 || n < 2) return d3min(xs); if (p >= 1) return d3max(xs);
    const i = (n - 1) * p, i0 = Math.floor(i), sorted = [...xs].sort((a, b) => a - b), v0 = d3max(sorted.slice(0, i0 + 1)), v1 = d3min(sorted.slice(i0 + 1));
    return v0 + (v1 - v0) * (i - i0); },
  // mode.js: each value's count in an InternMap, a Map (its keys' zeros +0), the first value to reach the most
  mode: (vs) => { const counts = new Map(); for (const v of vs) if (v != null && v >= v) counts.set(v, (counts.get(v) || 0) + 1); let m, c = 0; for (const [v, k] of counts) if (k > c) { c = k; m = v; } return m; } };
const D3SYMBOL = /^https:\/\/d3js\.org\/d3-array\/summarize#(sum|count|maxIndex|minIndex|variance|deviation|quantile|mode)$/;
const MEDIAN_SLOTS = 45; // a median of a series ranks n · (n − 1) pairs: 45 slots are 1,980, within MAX_COMPARES
// mean, min, max or median of a series: d3's answer, its missing slots skipped. Of written slots only it is d3's when the
// page is built (none present: no answer, as d3 has none); with slots the page sets, computed in calc() (former's series)
function seriesStat(op, q, apply, p, pItem) {
  if (!['mean', 'min', 'max', 'median', 'sum', 'count', 'maxIndex', 'minIndex', 'variance', 'deviation', 'quantile', 'mode'].includes(op)) throw refusal(apply.start, `${op} of the series ${q.name}: mean, min, max, median and d3's sum, count, variance, deviation, quantile and mode take a series (<csymbol definitionURL="https://d3js.org/d3-array/summarize#sum">sum</csymbol>)`);
  const pLive = op === 'quantile' && p === null ? pItem : undefined; // a p the page sets
  if (op === 'quantile' && !pLive && (p <= 0 || p >= 1)) op = p <= 0 ? 'min' : 'max'; // d3's quantile at p <= 0 is its min, at p >= 1 its max
  if (['median', 'quantile', 'mode'].includes(op) && q.slots.length > MEDIAN_SLOTS) throw refusal(apply.start, `the ${op} of the series ${q.name}, ${q.slots.length} slots: past the ${MEDIAN_SLOTS} this build ${op === 'mode' ? 'compares' : 'ranks'} (2,048 comparisons)`);
  const items = [{ ci: q.name }, ...(pItem ? [pItem] : [])];
  const indexOf = op.endsWith('Index') ? q : undefined; // a label reader prints the row header at that index
  if (pLive || q.slots.some((x) => x.kind === 'live')) return { op, call: 'series', series: q, items, start: apply.start, indexOf, p, pLive };
  const v = D3SERIES[op](q.slots.map((x) => (x.kind === 'literal' ? x.x : undefined)), p);
  return v === undefined ? { op, call: 'fixed', value: NaN, items, start: apply.start } : Object.assign(fixed(op, v, items, apply.start), { indexOf });
}
// a series' slot k (from 1), read as sales_k or as sales_i in a sum over i: a written one is its number, a missing one is
// refused (the sum would have no value), one the page sets reads its scope's split, no answer while it is missing
function slotItem(q, k, at, sub) {
  if (!Number.isInteger(k) || k < 1 || k > q.slots.length) throw refusal(at, `${q.name}_${k}: the series ${q.name} has ${q.slots.length} slot${q.slots.length === 1 ? '' : 's'} (line ${q.line}), numbered from 1`);
  const x = q.slots[k - 1];
  if (x.kind === 'missing') throw refusal(at, `${q.name}_${k} is missing (line ${x.line}): a formula that names a slot needs its value`);
  return x.kind === 'literal' ? { x: x.x, neg: x.x < 0 || Object.is(x.x, -0), mag: `<mn>${x.text.replace(/^-/, '')}</mn>`, sub } : { slot: x.store, sub };
}
// one argument: a number ({ x }), a name ({ ci }, with the page's definition of it, { def }), or another <apply> ({ node })
const SHARE = "<share/>, a term shared from elsewhere in the formula: this build reads one only in a chain of relations, LaTeXML's 0 < x ≤ 1";
function item(a, defining = false) {
  {
    const sub = a.name === 'apply' && elements(a)[0]?.name === 'csymbol' && elements(a)[0].attrs.cd === 'ambiguous' && textOf(elements(a)[0]).trim() === 'subscript';
    if (sub) { // LaTeXML's x_1: one name, x_1, read from --x_1 and drawn as a subscript
      const [, base, ix, ...more] = elements(a), w = wordOf(ix), index = w ? { name: 'ci', attrs: {}, start: ix.start, children: [{ text: w }] } : ix;
      if (!base || !index || more.length || base.name !== 'ci' || !['ci', 'cn'].includes(index.name) || elements(base).length || elements(index).length) throw refusal(a.start, 'a subscript other than a name and one name or number (x_1, x_i): this build reads those as one name');
      const iv = index.name === 'ci' ? CX.index.get(textOf(index).trim().normalize('NFKC')) : undefined; // x_i inside a sum over i
      const q = CX.series.get(letterOf(base)); // a series' slot: sales_3, or sales_i in a sum over i
      if (q && iv !== null) { const k = iv !== undefined ? iv : index.name === 'cn' ? number(index).x : NaN;
        if (Number.isNaN(k)) throw refusal(a.start, `${q.name}_${letterOf(index)}: a slot of the series ${q.name} is read by a number or a sum's index`);
        return slotItem(q, k, a.start, [letterOf(base), String(k), 'cn']); }
      if (!q && CX.seriesElsewhere.has(letterOf(base))) throw refusal(a.start, `${letterOf(base)} is a series of another data-dcss-scope (line ${CX.seriesElsewhere.get(letterOf(base))}): a formula reads the series of its own scope and the scopes around it`);
      if (iv !== undefined && iv !== null) return named({ ci: `${letterOf(base)}_${iv}`, sub: [letterOf(base), String(iv), 'cn'] }, a, defining);
      const id = `${letterOf(base)}_${letterOf(index)}`;
      if (!/^-?[_a-zA-Z\u0080-\u{10FFFF}][-_a-zA-Z0-9\u0080-\u{10FFFF}]*$/u.test(id)) throw refusal(a.start, `the subscripted name ${id} is no CSS identifier`);
      return named({ ci: id, sub: [letterOf(base), letterOf(index), index.name] }, a, defining);
    }
    const acc = accentOf(a);
    if (acc) { const id = acc[0] + ACCENT[acc[1]];
      if (!/^[_a-zA-Z\u0080-\u{10FFFF}][-_a-zA-Z0-9\u0080-\u{10FFFF}]*$/u.test(id)) throw refusal(a.start, `the name ${id} is no CSS identifier`);
      return named({ ci: id, acc }, a, defining); }
    if (a.name === 'apply') return { node: call(a) };
    if (a.name === 'piecewise') return { node: piecewise(a) };
    if (a.name === 'share') throw refusal(a.start, SHARE);
    if (a.name === 'cn') return number(a);
    const k = constantOf(a); if (k) return k;
    if (WORD(a)) throw refusal(a.start, `<ci><mtext>${WORD(a)}</mtext></ci>: a word inside the formula, LaTeX's \\text{…}, which LaTeXML reads as a factor; this build takes if, when or for before a condition, and or or between two, and otherwise`);
    if (elements(a).length) throw refusal(a.start, '<ci> with markup inside: a name is text');
    if ('type' in a.attrs) throw refusal(a.start, `<ci type="${a.attrs.type}"> names a collection or another kind of value`);
    const id = letterOf(a); // LaTeXML's mathematical italic 𝑥 is the page's x
    // a CSS identifier: letters past ASCII too (𝑚)
    if (!/^-?[_a-zA-Z\u0080-\u{10FFFF}][-_a-zA-Z0-9\u0080-\u{10FFFF}]*$/u.test(id)) throw refusal(a.start, `<ci>${id}</ci>: a name must be a CSS identifier`);
    if (RESERVED.test(id)) throw refusal(a.start, `<ci>${id}</ci>: --${id} is a name dcss itself reads or writes`);
    if (CX.index.has(id) && CX.index.get(id) !== null) { const v = CX.index.get(id); return { x: v, neg: v < 0, mag: `<mn>${Math.abs(v)}</mn>` }; } // a sum's index
    if (CX.series.has(id) || CX.seriesElsewhere.has(id)) throw refusal(a.start, CX.series.has(id) ? `${id} is a series: mean, min, max, median and d3's sum and count take it whole (<csymbol definitionURL="https://d3js.org/d3-array/summarize#sum">sum</csymbol> adds its present slots), and ${id}_i in a sum over i reads its slots` : `${id} is a series of another data-dcss-scope (line ${CX.seriesElsewhere.get(id)}): a formula reads the series of its own scope and the scopes around it`);
    if ((id === 'π' || id === 'e') && !defining && !CX.defs.has(id) && !CX.later.has(id) && !CX.elsewhere.has(id)) return { ci: id, fallback: String(id === 'π' ? Math.PI : Math.E) }; // π and e, or the page's --π and --e
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
  const [sub, op0, cond] = elements(under), op = op0?.name === 'csymbol' && op0.attrs.cd === 'latexml' && textOf(op0).trim() === 'product' ? { ...op0, name: 'product' } : op0;
  if (!isSym(sub, 'subscript') || !['sum', 'product'].includes(op?.name)) return null;
  if (!hi || elements(head).length !== 3 || cond?.name !== 'apply' || elements(under).length !== 3) throw refusal(head.start, `a ${op.name} with no range: this build adds over i = lo to hi`);
  const [eq, i, lo, ...more] = elements(cond);
  if (eq?.name !== 'eq' || i?.name !== 'ci' || !lo || more.length) throw refusal(cond.start, `a ${op.name} over ${eq?.name === 'in' ? 'a set' : 'a condition'}: this build adds over i = lo to hi`);
  if (kids.length !== 2) throw refusal(head.start, `a ${op.name} of ${kids.length - 1} terms: it takes one body, the term`);
  return { op: op.name, name: textOf(i).trim().normalize('NFKC'), lo, hi, body: kids[1], at: head.start };
}
const withIndex = (name, v, f) => { const I = CX.index, was = I.has(name) ? I.get(name) : undefined; I.set(name, v); try { return f(); } finally { if (was === undefined) I.delete(name); else I.set(name, was); } };
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
  if (name === 'exp' && (x === null || seen.size)) return { op: 'exp', call: 'exp', items, start: apply.start }; // computed in calc(), exactly
  if (['sin', 'cos', 'sec', 'csc'].includes(name) && (x === null || seen.size)) return { op: name, call: 'trig', items, start: apply.start }; // computed in calc()
  if (name === 'arctan' && (x === null || seen.size)) return { op: name, call: 'atan', items, start: apply.start };
  if (name === 'arccot' && (x === null || seen.size)) return { op: name, call: 'acot', items, start: apply.start };
  if ((name === 'tan' || name === 'cot') && (x === null || seen.size)) return { op: name, call: 'tan', items, start: apply.start };
  if ((name === 'arcsin' || name === 'arccos') && (x === null || seen.size)) return { op: name, call: 'asin', items, start: apply.start };
  if ((name === 'arcsec' || name === 'arccsc') && (x === null || seen.size)) return { op: name, call: 'asec', items, start: apply.start };
  if (['sinh', 'cosh', 'tanh'].includes(name) && (x === null || seen.size)) return { op: name, call: 'hyp', items, start: apply.start };
  if (['sech', 'csch', 'coth'].includes(name) && (x === null || seen.size)) return { op: name, call: 'rhyp', items, start: apply.start };
  if (['arcsinh', 'arccosh', 'arctanh'].includes(name) && (x === null || seen.size)) return { op: name, call: 'ahyp', items, start: apply.start };
  if (['arcsech', 'arccsch', 'arccoth'].includes(name) && (x === null || seen.size)) return { op: name, call: 'rahyp', items, start: apply.start };
  const lb = name === 'ln' ? 'e' : name === 'log' ? (base.length ? b : 10) : null; // ln, and log to a base the build knows: computed in calc()
  if ((name === 'ln' || name === 'log') && (x === null || seen.size) && (lb === 'e' || (Number.isFinite(lb) && lb > 0 && lb !== 1))) return { op: name, call: 'log', base: lb, items, start: apply.start };
  // every function of a name is computed on the page; a log's base is a number the build knows, its 1/ln b a pair
  if (base.length && b === null) throw refusal(at, `log to a base the page sets: its base is a number written in the page (10, 2, 3…), its 1/ln b worked out when the page is built, since ${INEXACT}`);
  if (x === null) throw refusal(at, name === 'log' ? `log to base ${lb} has no value` : `${name} of a name the page sets: ${INEXACT}`);
  return fixed(name, MATHFN[name](x, name === 'log' ? (base.length ? b : 10) : undefined), items, apply.start, seen);
}
// a value the build computed (the double nearest the true value): written in as a number, drawn as the formula it came from. Where it took 𝜋 or
// 𝑒 as Math.PI or Math.E, it holds while the page sets no --π or --e (unless); where it sets one, the page shows no
// answer, or, for 𝑒 to a power where --e is set, live: the power of the page's e
function fixed(op, v, items, start, seen, live) {
  if (!Number.isFinite(v)) throw refusal(start, `${op} here is ${v}: no number to show`);
  return { op, call: 'fixed', value: v, items, start, unless: seen?.size ? [...seen] : undefined, live };
}
// MathML 4's <piecewise> (4.3.10.5): the first <piece> whose condition holds gives the value, else <otherwise>, as
// JavaScript's if/else chain does; with none holding and no <otherwise>, no answer. A condition is a relation (<lt/>,
// <leq/>, <gt/>, <geq/>, <eq/>, <neq/>, a chain of one) or MathML's logic of them (condition())
const CONDS = { ...RELS, eq: '=', neq: '≠' };
// a name's text: LaTeXML's mathematical italic 𝑥 is x (NFKC), and its italic-ϕ (\phi, against \varphi's φ) is ϕ
const letterOf = (el) => textOf(el).trim().normalize('NFKC').replace(/^italic-(.)$/u, '$1');
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
// MathML's logic (4.3.5.9) on conditions: <and/>, <or/> and <xor/> of two or more, <not/> of one, <implies/> of two
// the drawing's intent names: the concept names of MathML's intent core list (w3c/mathml-docs, _data/core.yml) where it
// has the concept; count, quantile and d3's deviation (n - 1, which the list's standard-deviation doesn't say) keep theirs
const TRIG = ['sine', 'cosine', 'tangent', 'secant', 'cosecant', 'cotangent'], TRIGOF = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'];
const CORE = { eq: 'equals', assign: 'defined-as', lt: 'less-than', leq: 'less-than-or-equal-to', gt: 'greater-than', geq: 'greater-than-or-equal-to',
  neq: 'not-equal-to', divide: 'divided-by', abs: 'absolute-value', binomial: 'binomial-coefficient', rem: 'remainder', exp: 'exponential',
  ln: 'natural-logarithm', log: 'logarithm', equivalent: 'if-and-only-if', factorof: 'divides', gcd: 'greatest-common-divisor', lcm: 'least-common-multiple', in: 'element-of', notin: 'not-member-of',
  ...Object.fromEntries(TRIGOF.flatMap((f, i) => [[f, TRIG[i]], [`arc${f}`, `arc${TRIG[i]}`], [`${f}h`, `hyperbolic-${TRIG[i]}`], [`arc${f}h`, `arc-hyperbolic-${TRIG[i]}`]])) };
const coreName = (op) => CORE[op] ?? op;
const LOGIC = { and: [2, Infinity], or: [2, Infinity], xor: [2, Infinity], not: [1, 1], implies: [2, 2], equivalent: [2, 2] };
// a word LaTeX's \text{…} puts in a formula, which LaTeXML reads as a factor: a leading if, when or for is dropped
const LEAD = new Set(['if', 'when', 'for']), WORD = (e) => (e?.name === 'ci' && elements(e).length === 1 && elements(e)[0].name === 'mtext' ? textOf(e).trim().toLowerCase() : null);
const ap = (head, kids, at) => ({ name: 'apply', attrs: {}, start: at, children: [{ name: head, attrs: {}, start: at, children: [] }, ...kids] });
const prod = (fs, at) => (fs.length === 1 ? fs[0] : ap('times', fs, at));
function stripLead(c) { if (c?.name !== 'apply') return c; const [h, a, ...rest] = elements(c);
  if (h?.name === 'times' && LEAD.has(WORD(a)) && rest.length) return prod(rest, c.start);
  if (!a || !(h.name in CONDS || h.name in MEMBER || h.name === 'and' || h.name === 'or')) return c;
  const b = stripLead(a); return b === a ? c : { ...c, children: [h, b, ...rest] }; }
// LaTeX's words in a condition, as LaTeXML reads them: \text{if } x > 0 a product led by the word; x > 0 \text{ or }
// x < -5 a chain whose middle term is the product 0 · or · x (\lor: or(0, x)); x < 0 \text{ or } x > 1 the product
// x · ⟨0 · or · x⟩ · 1, its < and > taken for angle brackets; (x < 0) \text{ or } (x > 1) a product of the relations
// and the word. Read back as the relations with the words between them, and binding before or, as in English and
// in logic; anything else as it is
function spoken(c0) {
  const c = stripLead(c0), at = c.start, rel = (a) => (a?.name === 'apply' && elements(a)[0]?.name in CONDS ? elements(a)[0].name : null);
  const toks = [], angled = (h) => h?.name === 'csymbol' && h.attrs.cd === 'latexml' && textOf(h).trim() === 'expectation';
  const term = (t) => { const [h, ...as] = t.name === 'apply' ? elements(t) : [];
    if (h?.name === 'times') as.forEach(factor);
    else if ((h?.name === 'and' || h?.name === 'or') && as.length === 2) { term(as[0]); toks.push({ join: h.name }); term(as[1]); }
    else factor(t); };
  const factor = (f) => { const w = WORD(f), [h, ...as] = f.name === 'apply' ? elements(f) : [];
    if (w === 'and' || w === 'or') toks.push({ join: w });
    else if (angled(h) && as.length === 1) { toks.push({ op: 'lt' }); term(as[0]); toks.push({ op: 'gt' }); }
    else toks.push(rel(f) || h?.name in MEMBER ? { cond: f } : { factor: f }); };
  const chainOf = (r) => elements(r).slice(1).forEach((t, i) => { if (i) toks.push({ op: rel(r) }); term(t); });
  if (rel(c)) chainOf(c);
  else if (c?.name === 'apply' && elements(c)[0]?.name === 'and' && elements(c).slice(1).every(rel) && elements(c).slice(2).every((r) => elements(r)[1]?.name === 'share')) {
    const [r0, ...rs] = elements(c).slice(1); chainOf(r0); for (const r of rs) elements(r).slice(2).forEach((t) => { toks.push({ op: rel(r) }); term(t); }); }
  else if (c?.name === 'apply' && elements(c)[0]?.name === 'times') elements(c).slice(1).forEach(factor);
  else return c;
  if (!toks.some((t) => t.join)) return c;
  // consecutive factors are one term; each stretch between words a relation (or a chain of them) or a whole condition
  const segs = [[]], joins = [];
  for (const t of toks) { const g = segs.at(-1);
    if (t.join) { joins.push(t.join); segs.push([]); } else if (t.factor && g.at(-1)?.fs) g.at(-1).fs.push(t.factor); else g.push(t.factor ? { fs: [t.factor] } : t); }
  const share = { name: 'share', attrs: {}, start: at, children: [] }, conds = [];
  for (const g of segs) {
    if (g.length === 1 && g[0].cond) { conds.push(g[0].cond); continue; }
    if (g.length < 3 || g.length % 2 === 0 || g.some((t, i) => (i % 2 ? !t.op : !t.fs))) return c;
    const terms = g.filter((t, i) => i % 2 === 0).map((t) => prod(t.fs, at)), ops = g.filter((t, i) => i % 2).map((t) => t.op);
    conds.push(new Set(ops).size === 1 ? ap(ops[0], terms, at) : ap('and', ops.map((op, i) => ap(op, [i ? share : terms[0], terms[i + 1]], at)), at)); }
  const groups = [[conds[0]]]; joins.forEach((w, i) => (w === 'and' ? groups.at(-1) : groups[groups.push([]) - 1]).push(conds[i + 1]));
  const ands = groups.map((g) => (g.length === 1 ? g[0] : ap('and', g, at)));
  return ands.length === 1 ? ands[0] : ap('or', ands, at);
}
function condition(c) {
  c = spoken(c);
  if (c.name !== 'apply') throw refusal(c.start, `<${c.name}> as a condition: a condition is a relation, <apply><lt/>…</apply>, or an <and/>, <or/>, <xor/>, <not/> or <implies/> of them`);
  const [h, ...as] = elements(c);
  if (h?.name in LOGIC) { const [lo, hi] = LOGIC[h.name]; if (as.length < lo || as.length > hi) throw refusal(c.start, `<${h.name}/> of ${as.length}: it takes ${lo === hi ? (lo === 1 ? 'one condition' : 'two conditions') : 'two or more conditions'}`);
    // LaTeXML's chain, 0 < x ≤ 1: an <and/> of relations, each after the first opening with a <share/> of the term before
    // it (its href names an id the Content MathML alone doesn't carry); read as that term, drawn as one chain
    const rel = (a) => a?.name === 'apply' && elements(a)[0]?.name in CONDS && elements(a).length > 2, shared = (a) => rel(a) && elements(a)[1].name === 'share';
    const linked = as.map((a, i) => (h.name === 'and' && i && shared(a) && rel(as[i - 1]) ? { ...a, children: a.children.map((k) => (k === elements(a)[1] ? elements(as[i - 1]).at(-1) : k)) } : a));
    const parts = linked.map(condition), chain = h.name === 'and' && rel(as[0]) && as.slice(1).every(shared);
    return { op: h.name, parts, ...(chain && { chain: { items: [...parts[0].items, ...parts.slice(1).flatMap((q) => q.items.slice(1))], ops: parts.flatMap((q) => q.items.slice(1).map(() => q.op)) } }) }; }
  if (h?.name in MEMBER) return membership(c, h.name, as);
  // a ∣ b (MathML's <factorof/>): b is a whole multiple of a, as JavaScript's a === 0 ? b === 0 : b % a === 0 on whole
  // numbers; numbers the build knows that aren't whole within ±2^53 stop the build, names the page sets give no answer
  if (h?.name === 'factorof') { if (as.length !== 2) throw refusal(c.start, `<factorof/> of ${as.length}: it takes two, a ∣ b`);
    const items = as.map((a) => item(a)), bad = items.map((x) => itemValue(x)).find((v) => v !== null && !Number.isSafeInteger(v));
    if (bad !== undefined) throw refusal(c.start, `factorof of ${bad}: a ∣ b takes whole numbers, here within ±2^53`);
    return { op: 'factorof', divides: true, items }; }
  if (!(h?.name in CONDS)) throw refusal(c.start, `<${h?.name ?? '?'}/> as a condition: this build takes <lt/>, <leq/>, <gt/>, <geq/>, <eq/>, <neq/>, <in/>, <notin/>, <factorof/>, <and/>, <or/>, <xor/>, <not/>, <implies/> and <equivalent/>`);
  if (as.length < 2 || (h.name === 'neq' && as.length !== 2)) throw refusal(c.start, `<${h.name}/> of ${as.length}: a relation compares ${h.name === 'neq' ? 'two' : 'two or more'}`);
  return { op: h.name, items: as.map((a) => item(a)) };
}
// x ∈ a set, MathML's <in/> (<notin/> its negation): an <interval>, closed unless its closure says (MathML's default), an end
// ±<infinity/> bounding nothing that way; or a number set, <integers/>, <naturalnumbers/> (with 0, as MathML defines them)
// and <reals/>, or LaTeX's ℤ, ℕ and ℝ through LaTeXML. ℚ is refused: every double is a rational number
const MEMBER = { in: '∈', notin: '∉' }, NUMSETS = { integers: 'Z', naturalnumbers: 'N', reals: 'R', 'ℤ': 'Z', 'ℕ': 'N', 'ℝ': 'R' };
const CLOSURE = { closed: ['leq', 'leq'], open: ['lt', 'lt'], 'open-closed': ['lt', 'leq'], 'closed-open': ['leq', 'lt'] };
function membership(c, op, as) {
  if (as.length !== 2) throw refusal(c.start, `<${op}/> of ${as.length}: it takes a value and a set`);
  const [x, s] = as, set = s.name === 'ci' && !elements(s).length ? textOf(s).trim() : s.name;
  if (s.name === 'interval') {
    const closure = s.attrs.closure ?? 'closed', ends = elements(s);
    if (!(closure in CLOSURE)) throw refusal(s.start, `<interval closure="${closure}">: MathML's closures are closed, open, open-closed and closed-open`);
    if (ends.length !== 2) throw refusal(s.start, `an <interval> of ${ends.length}: it has two ends`);
    const end = (e, i) => { const [m, inf, ...more] = e.name === 'apply' ? elements(e) : [], neg = m?.name === 'minus' && inf?.name === 'infinity' && !more.length;
      if (e.name !== 'infinity' && !neg) return item(e);
      if (neg !== !i) throw refusal(e.start, `an interval ${i ? 'up to −∞' : 'from +∞'}: it holds no number`);
      return { inf: neg ? -1 : 1 }; };
    return { op, of: 'interval', closure, items: [item(x), ...ends.map(end)] };
  }
  if (set in NUMSETS) return { op, of: NUMSETS[set], items: [item(x)] };
  throw refusal(s.start, set === 'rationals' || set === 'ℚ' ? `x ∈ ℚ: every double is a rational number, so the page can't tell √2 from 1.4142135623730951`
    : `${s.name === 'ci' ? `<ci>${set}</ci>` : `<${set}>`} as a set: this build takes an <interval> and the integers, the natural numbers and the reals (ℤ, ℕ, ℝ)`);
}
// a name the page defines: the definition's side in its place; one it defines further down, or in a data-dcss-scope the
// formula isn't in, is refused (values flow down: a formula sees its own scope's definitions and those around it)
function named(x, a, defining) {
  if (defining) return x;
  if (CX.defs.has(x.ci)) { const d = CX.defs.get(x.ci); return d?.result ? { ...x, result: d.result } : { ...x, def: d }; }
  if (CX.later.has(x.ci)) throw refusal(a.start, `${x.ci} is defined further down the page (line ${CX.later.get(x.ci)}): define it before the formulas that use it`);
  if (CX.elsewhere.has(x.ci)) throw refusal(a.start, `${x.ci} is defined in another data-dcss-scope (line ${CX.elsewhere.get(x.ci)}): a formula reads the definitions of its own scope and the scopes around it`);
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
// a scope's result: its five parts and v, 1 while it has an answer, on the scope's element, inherited by what is inside it
const ANSWER = ['e', 'a', 'b', 'c', 'z', 'v'], readAnswer = (A) => `calc(${join(A)} * (1 + 0 / var(${A}-v)))`;
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
  min: (xs) => d3min(xs), max: (xs) => d3max(xs), id: (xs) => xs[0], // d3's: the first of equal values, so min(0, -0) is 0
  median: (xs) => { const s = [...xs].sort((a, b) => a - b), i0 = Math.floor((s.length - 1) / 2); return s.length % 2 ? s[i0] : s[i0] + (s[i0 + 1] - s[i0]) * 0.5; },
};
// a value the build knows, or null; given a set, a name with a fallback (LaTeXML's 𝜋 and 𝑒) is its fallback, noted in the set
const itemValue = (x, seen) => (x.node ? valueOf(x.node, seen) : x.def ? valueOf(x.def, seen) : x.slot || x.result ? null : x.ci ? (seen && x.fallback ? (seen.add(x.ci), +x.fallback) : null) : x.x);
const OPS = { lt: (a, b) => a < b, leq: (a, b) => a <= b, gt: (a, b) => a > b, geq: (a, b) => a >= b, eq: (a, b) => a === b, neq: (a, b) => a !== b };
const LOGICJS = { and: (vs) => vs.every(Boolean), or: (vs) => vs.some(Boolean), xor: (vs) => vs.filter(Boolean).length % 2 === 1, not: ([v]) => !v, implies: ([a, b]) => !a || b, equivalent: ([a, b]) => a === b };
const LOGICCSS = { and: (ts) => `min(${ts.join(', ')})`, or: (ts) => `max(${ts.join(', ')})`, xor: (ts) => `mod(${ts.join(' + ')}, 2)`, not: ([t]) => `(1 - ${t})`, implies: ([a, b]) => `max(1 - ${a}, ${b})`, equivalent: ([a, b]) => `(1 - abs(${a} - ${b}))` };
const condValue = (c, seen) => { if (c.parts) { const vs = c.parts.map((q) => condValue(q, seen)); return vs.includes(null) ? null : LOGICJS[c.op](vs); }
  const xs = c.items.map((x) => (x.inf ? x.inf * Infinity : itemValue(x, seen))); if (xs.includes(null)) return null;
  if (c.divides) { const [a, b] = xs; return a === 0 ? b === 0 : b % a === 0; }
  if (c.of) { const [x, lo, hi] = xs, [a, b] = CLOSURE[c.closure] ?? [];
    const v = c.of === 'Z' ? Number.isInteger(x) : c.of === 'N' ? Number.isInteger(x) && x >= 0 : c.of === 'R' ? Number.isFinite(x) : OPS[a](lo, x) && OPS[b](x, hi);
    return c.op === 'notin' ? !v : v; }
  return xs.slice(1).every((b, i) => OPS[c.op](xs[i], b)); };
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
  const arg = (x) => (x.node ? expr(x.node) : x.def ? expr(x.def) : x.result ? `(${join(x.result)} * (1 + 0 / var(${x.result}-v)))` : x.slot ? `(${join(x.slot)} * (1 + 0 / var(${x.slot}-g)))` : x.ci ? (x.fallback ? `var(--${x.ci}, ${x.fallback})` : (names.add(x.ci), `var(--${x.ci})`)) : Object.is(x.x, -0) ? '(-1 * 0)' : String(x.x));
  const keep = (x) => { if (depthOf(x) <= DEPTH) return x; const q = `--dcss-dcss-d${++id}`;
    for (const z of 'eabcz') decls.push([`${q}-${z}`, SPLIT[z](q, `clamp(-1 * (pow(2, 1023) * (2 - pow(2, -52))), ${x}, (pow(2, 1023) * (2 - pow(2, -52))))`)]);
    decls.push([`${q}-f`, `${x} * 0 + 1`]); return `(${join(q)} * (1 + 0 / var(${q}-f)))`; };
  const chain = (op, xs) => xs.reduce((a, b) => keep(F(`${a} ${op} ${b}`)));
  // exp of a value the page sets, to the double nearest the true value (a model of these steps in JavaScript matched the
  // BigInt exp on 200,000 arguments, its error at most 2^-76.4; probes/dcss/exact-check.mjs): k = round(x · 64 / ln 2),
  // x = k (ln 2 / 64) + r by three exact parts, e^x = 2^(k div 64) · T(k mod 64) · e^r, e^r − 1 to degree 8 with r² exact
  // (Dekker), assembled as a double-double z (TwoSum, TwoProduct, each step fenced: exact in both engines, 5,000 of 5,000
  // each); the answer is z's high part unless its low part is within 2^-72 of half an ulp, too near halfway to round from,
  // and then there is none, as outside -708 ≤ x ≤ 709. A value used more than once is a macro, an unregistered custom
  // property: the same tokens compute the same double each time; each stage's results go through the split, so no
  // declaration brings past 65,535 tokens (WebKit's most through one var())
  // the steps both live functions build from: macros, stores through the split, fenced IEEE operations, the error-free
  // transformations (TwoSum, FastTwoSum, Veltkamp's halves, Dekker's TwoProduct) and pairs (double-doubles) added and multiplied
  const kit = (P0) => { const k = ++id, P = P0 ?? `--dcss-dcss-x${k}`, named = new Set();
    const mac = (n, v) => { if (named.has(n)) throw new Error(`macro ${n} twice`); named.add(n); decls.push([`--dcss-dcss-y${k}-${n}`, `(${v})`]); return `var(--dcss-dcss-y${k}-${n})`; };
    // a stored step's −0 flag is 0: no step of these functions passes a sign of zero on (sin's answer takes x's). Its
    // finiteness flag is checked only on an answer (checked): every step between is bounded, and a NaN or infinite x is
    // caught by the function's own domain flag, so a fifth reading of each step's expression would buy nothing
    const store = (n, v, checked) => { const q = `${P}-${n}`; for (const z of 'eabc') decls.push([`${q}-${z}`, SPLIT[z](q, `clamp(-1 * pow(2, 1023), ${v}, pow(2, 1023))`)]); decls.push([`${q}-z`, '0'], [`${q}-f`, checked ? `${v} * 0 + 1` : '1']); return join(q); };
    const add = (a, b) => F(`${a} + ${b}`), sub = (a, b) => F(`${a} + (-1 * ${b})`), mul = (a, b) => F(`${a} * ${b}`), num = (v) => (Object.is(v, -0) ? '(-1 * 0)' : String(v));
    const twoSum = (n, a, b) => { const s = mac(`${n}s`, add(a, b)), bb = mac(`${n}b`, sub(s, a)); return [s, add(sub(a, sub(s, bb)), sub(b, bb))]; };
    const fast = (n, a, b) => { const s = mac(`${n}s`, add(a, b)); return [s, sub(b, sub(s, a))]; };
    const halves = (n, a) => { const t = mac(`${n}t`, mul('134217729', a)), hi = mac(`${n}h`, sub(t, sub(t, a))); return [hi, mac(`${n}l`, sub(a, hi))]; };
    const twoProd = (n, a, b) => { const p = mac(`${n}p`, mul(a, b)), [ah, al] = halves(`${n}a`, a), [bh, bl] = a === b ? [ah, al] : halves(`${n}c`, b);
      return [p, add(add(add(sub(mul(ah, bh), p), mul(ah, bl)), mul(al, bh)), mul(al, bl))]; };
    const ddAdd = (n, [ah, al], [bh, bl]) => { const [s, e] = twoSum(`${n}a`, ah, bh); const [h, l] = fast(`${n}b`, s, add(e, add(al, bl))); return [h, mac(`${n}l`, l)]; };
    const ddMul = (n, [ah, al], [bh, bl]) => { const [p, e] = twoProd(`${n}m`, ah, bh); const [h, l] = fast(`${n}b`, p, add(e, add(mul(ah, bl), mul(al, bh)))); return [h, mac(`${n}l`, l)]; };
    // a table's value at an index the page computes: its split integers picked by registered indicators
    const pickers = (n, idx, lo, hi) => { for (let j = lo; j <= hi; j++) decls.push([`${P}-${n}${j}`, `max(0, 1 - abs(${idx} + ${-j}))`]);
      return (name, rows) => { const q = `${P}-${name}`; for (const z of 'eabcz') decls.push([`${q}-${z}`, rows.map((t, j) => (t && t[z] ? `var(${P}-${n}${j}) * ${t[z]}` : '')).filter(Boolean).join(' + ') || '0']); return mac(name, join(q)); }; };
    return { k, P, mac, store, add, sub, mul, num, twoSum, fast, halves, twoProd, ddAdd, ddMul, pickers }; };
  const expCore = (xe, often) => { const { P, mac, store, add, sub, mul, num, twoSum, fast, halves } = kit(); // often: z is read many times
    const { L1, L2, L3, INV, T, C } = EXPK, K = `var(${P}-K)`;
    const x = mac('x', xe);
    decls.push([`${P}-d`, `(1 - sign(max(0, -708 + (-1 * ${x})))) * (1 - sign(max(0, ${x} + -709)))`], [`${P}-K`, `round(${x} * ${num(INV)}, 1)`], [`${P}-E`, `round(down, ${K} / 64, 1)`], [`${P}-J`, `${K} + -64 * var(${P}-E)`]);
    // stage 1: r = rh + rl, rh cut to 26 bits so that rh² is exact
    const [s1, e1] = twoSum('r', mac('ra', sub(x, `(${K} * ${num(L1)})`)), `(-1 * ${K} * ${num(L2)})`), [rh, r2] = halves('h', s1);
    const RH = store('rh', rh), RL = store('rl', add(r2, sub(e1, `(${K} * ${num(L3)})`)));
    // stage 2: e^r − 1 = s + pl0, rh + rh²/2 exactly as a pair, the rest in doubles (rd = rh + rl in the polynomial)
    const rd = mac('rd', add(RH, RL)), poly = C.slice(0, -1).reduceRight((acc, c) => add(num(c), mul(rd, acc)), num(C.at(-1)));
    const [s, e] = fast('s', RH, mul(mul(RH, RH), '0.5')), S = store('s', s);
    const PL0 = store('p0', add(e, add(RL, add(mul(RH, RL), add(mul(mul(RL, RL), '0.5'), mul(mul(mul(rd, rd), rd), poly))))));
    // stage 3: z = T (1 + p); T, its low part and its two halves picked from 64 as the split's integers
    const [ph, pl0] = fast('p', S, PL0), pl = mac('pl', pl0);
    for (let j = 0; j < 64; j++) decls.push([`${P}-I${j}`, `max(0, 1 - abs(var(${P}-J) + ${-j}))`]); // J = j, registered once
    const tab = (i) => { const q = `${P}-T${i}`; for (const z of 'eabcz') decls.push([`${q}-${z}`, T.map((t, j) => (t[i][z] ? `var(${P}-I${j}) * ${t[i][z]}` : '')).filter(Boolean).join(' + ') || '0']); return mac(`T${i}`, join(q)); };
    const [Th, Tl, Thh, Thl] = [0, 1, 2, 3].map(tab), [phh, phl] = halves('g', ph), m = mac('m', mul(Th, ph));
    const me = add(add(add(sub(mul(Thh, phh), m), mul(Thh, phl)), mul(Thl, phh)), mul(Thl, phl));
    const [yh, yt] = fast('y', Th, m), lo = add(yt, add(me, add(Tl, add(mul(Th, pl), mul(Tl, ph))))), YH = often ? store('yh', yh) : yh, LO = often ? store('lo', lo) : mac('lo', lo); // stored, z is short
    const [zh, zl0] = fast('z', YH, LO), zl = mac('zl', zl0);
    decls.push([`${P}-pf`, `var(${P}-d) * var(${P}-rh-f) * var(${P}-rl-f) * var(${P}-s-f) * var(${P}-p0-f)${often ? ` * var(${P}-yh-f) * var(${P}-lo-f)` : ''}`]); // the pair is fine
    return { P, zh, zl }; };
  const liveExp = (xe) => { const { P, zh, zl } = expCore(xe, true); // stored stage-3 inputs: 40.9k tokens against 42.8k
    // halfway, on zl's side: zh is in [0.99, 2), so half an ulp is 2^-54 below 1 and 2^-53 from 1 up, but 2^-54 again at
    // zh = 1 with zl below it (the doubles under 1 are twice as close); |zl| must be 2^-72 short of it
    const above = `(1 - sign(max(0, 1 + (-1 * ${zh}))))`, atOneDown = `(1 - abs(sign(${zh} + -1))) * sign(max(0, -1 * ${zl}))`;
    decls.push([`${P}-ok`, `var(${P}-pf) * sign(max(0, pow(2, -54) * (1 + ${above} * (1 - ${atOneDown})) + (-1 * abs(${zl})) + ${-(2 ** -72)}))`]);
    return `(${zh} * pow(2, var(${P}-E)) * (1 + 0 / var(${P}-ok)))`; };
  // ln, log10 or log2 of a value the page sets, to the double nearest the true value (probes/dcss/log-check.mjs runs these
  // steps in JavaScript and in the engines): y0 = CSS's log(x), any platform's, as a guess; δ = x · e^(−y0) − 1 from the
  // exact exp's pair (2^-76 of it); ln x = y0 + δ − δ²/2. Within 2^-10 of 1, where that leaves too little of ln x, the
  // series of u = x − 1 (exact) instead: u − u²/2 (a pair) + u³/3 − … . Both are computed, each from clamped inputs so
  // neither turns the other to NaN, and one is picked; times 1/ln 10 or 1/ln 2 as a pair; no answer for x not above
  // 2^-1022 or past e^708 (where the guess passes 708: exp's argument would be clamped and the pair wrong; a formula's
  // value gets there, a name's can't, from 3.4e38 up refused), or where the pair is too near halfway (on zl's side, 2^-73
  // of ln x or 2^-70 near 1)
  const liveLog = (xe, base) => { const { P, mac, store, add, sub, mul, num, fast, twoProd, ddMul } = kit();
    const x = mac('x', xe), y0 = mac('y0', `log(max(${x}, ${2 ** -1022}))`), ge = (a, b) => `(1 - sign(max(0, ${b} + (-1 * ${a}))))`, two = (e) => `pow(2, ${e})`;
    decls.push([`${P}-d`, `${ge(x, num(2 ** -1022))} * (${x} * 0 + 1) * ${ge(709, `(-1 * ${y0})`)} * ${ge(708, y0)}`], [`${P}-near`, `(1 - sign(max(0, abs(${x} + -1) + ${-(2 ** -10)})))`]);
    // near 1: the series
    const u = mac('u', `clamp(${-(2 ** -10)}, ${x} + -1, ${2 ** -10})`), [sq, sqe] = twoProd('q', u, u);
    const t = [8, 7, 6, 5, 4, 3].reduce((acc, n) => add(num((n % 2 ? 1 : -1) / n), mul(u, acc)), num(1 / 9)), [h, e] = fast('a', u, `(-0.5 * ${sq})`);
    const [ah, al] = fast('b', h, add(e, add(`(-0.5 * ${sqe})`, mul(mul(mul(u, u), u), t))));
    // elsewhere: the guess and one exp
    const ex = expCore(`clamp(-708, -1 * ${y0}, 709)`, true), EZH = ex.zh, EZL = ex.zl;
    const xs = mac('xs', `(${x} * ${two(`var(${ex.P}-E)`)})`), [p, pe] = twoProd('r', xs, EZH);
    const dl = store('dl', add(sub(p, '1'), add(pe, mul(xs, EZL)))), [bh, bl] = fast('c', y0, sub(dl, mul(mul(dl, dl), '0.5')));
    // picked, stored, scaled to the base
    const near = `var(${P}-near)`, pickd = (a, b) => `(${sel(near, a)} + ${sel(`(1 - ${near})`, b)})`;
    let y = [store('yh', pickd(ah, bh)), store('yl', pickd(al, bl))];
    if (base !== 'e') { const m = ddMul('m', y, logInv(base).map(num)); y = [store('wh', m[0]), store('wl', m[1])]; }
    const [zh0, zl0] = fast('z', y[0], y[1]), zh = mac('zh', store('zh', zh0, true)), zl = mac('zl', zl0);
    // halfway on zl's side: zh's exponent from CSS's log2, corrected by two comparisons; half an ulp is 2^(ez − 53), half that
    // at a power of 2 with zl toward 0; ln 1 = 0 is exact
    const az = `abs(${zh})`; decls.push([`${P}-z0`, `round(down, log(max(${az}, ${2 ** -1074}), 2), 1)`]);
    const sc = `(${az} * ${two(`(-1 * var(${P}-z0))`)})`; decls.push([`${P}-ez`, `var(${P}-z0) + ${ge(sc, 2)} + (-1 * (1 - ${ge(sc, 1)}))`]);
    const atPow2 = `(1 - abs(sign(${az} + (-1 * ${two(`var(${P}-ez)`)}))))`, toward0 = `abs(sign(${zl})) * (1 - abs(sign(sign(${zl}) + sign(${zh}))))`;
    const half = `(${two(`(var(${P}-ez) + -53)`)} / (1 + ${atPow2} * ${toward0}))`, B = `(${near} * ${num(2 ** -70)} + (1 - ${near}) * ${num(2 ** -73)} / max(abs(${y0}), ${2 ** -10}))`;
    const one = `(1 - abs(sign(${x} + -1)))`;
    decls.push([`${P}-ok`, `var(${P}-d) * max(${one}, (1 - ${near} * 0) * var(${P}-yh-f) * var(${P}-yl-f) * var(${P}-zh-f) * (${near} + (1 - ${near}) * var(${ex.P}-pf)) * sign(max(0, ${half} + (-1 * abs(${zl})) + (-1 * ${B} * ${az}))))`]);
    return `(${zh} * (1 + 0 / var(${P}-ok)))`; };
  // sin or cos of a value the page sets, to the double nearest the true value (probes/dcss/trig-check.mjs runs these steps
  // in JavaScript and in the engines): k = round(x · 512/π) (a macro: k may pass 10^6, which var() would round), r = x −
  // k π/512 by four exact parts, j = k mod 1024 (cos: k + 256), S and C = sin and cos of jπ/512 from the 257 of a quarter
  // turn, turned by the quadrant; sin(a + r) = S + C r − S r²/2 − C r³/6 + S r⁴/24 + C r⁵/120 − S r⁶/720 − C r⁷/5040, the
  // first three as pairs. The halfway test leaves 2^-73 |y| + 2^-50 |r|³ (measured: 2^-75 relative, 2^-78.4 absolute where
  // |r| is 2^-8.4) + 2^-50 |k P4| + 2^-100 |r| for the reduction, so sin(29π) answers. No answer past |x| = 2^20. sin(±0) is ±0, kept by the stored answer's zero flag
  const liveTrig = (xe, fn) => { const K = kit(), { P, mac, store, add, sub, mul, num, twoSum, fast, twoProd } = K, { PP, P4, INV, S: TS, C: TC } = TRIGK, off = fn === 'cos' || fn === 'sec' ? 256 : 0;
    const x = mac('x', xe), k = mac('k', `round(${x} * ${num(INV)}, 1)`), ge = (a, b) => `(1 - sign(max(0, ${b} + (-1 * ${a}))))`, two = (e) => `pow(2, ${e})`;
    decls.push([`${P}-d`, `${ge(num(2 ** 20), `abs(${x})`)} * (${x} * 0 + 1)`], [`${P}-j`, `${k} + ${off} + -1024 * round(down, (${k} + ${off}) / 1024, 1)`]);
    decls.push([`${P}-q`, `round(down, var(${P}-j) / 256, 1)`], [`${P}-i`, `var(${P}-j) + -256 * var(${P}-q)`]);
    for (let n = 0; n < 4; n++) decls.push([`${P}-Q${n}`, `max(0, 1 - abs(var(${P}-q) + ${-n}))`]);
    for (let n = 0; n <= 256; n++) decls.push([`${P}-I${n}`, `max(0, 1 - abs(var(${P}-i) + ${-n}))`]);
    // the table's values at i, then S and C by the quadrant: (s, c), (c, −s), (−s, −c), (−c, s); each a sum where one term is not 0
    const part = (tab, h, z) => tab.map((t, n) => (t[h][z] ? `var(${P}-I${n}) * ${t[h][z]}` : '')).filter(Boolean).join(' + ') || '0';
    for (const h of [0, 1]) for (const z of 'eabc') { decls.push([`${P}-s${h}${z}`, part(TS, h, z)], [`${P}-c${h}${z}`, part(TC, h, z)]); }
    const even = `(var(${P}-Q0) + var(${P}-Q2))`, odd = `(var(${P}-Q1) + var(${P}-Q3))`, sA = `(var(${P}-Q0) + -1 * var(${P}-Q2))`, sB = `(var(${P}-Q1) + -1 * var(${P}-Q3))`;
    const turned = (n, h, first, second, sign2) => { const q = `${P}-${n}`;
      decls.push([`${q}-e`, `${even} * var(${P}-${first}${h}e) + ${odd} * var(${P}-${second}${h}e)`], [`${q}-z`, '0']);
      for (const z of 'abc') decls.push([`${q}-${z}`, `${sA} * var(${P}-${first}${h}${z}) + ${sign2} * ${sB} * var(${P}-${second}${h}${z})`]);
      return mac(n, join(q)); };
    const Sh = turned('Sh', 0, 's', 'c', 1), Sl = turned('Sl', 1, 's', 'c', 1), Ch = turned('Ch', 0, 'c', 's', -1), Cl = turned('Cl', 1, 'c', 's', -1);
    // r = rh + rl
    const [s1, e1] = twoSum('a', sub(x, `(${k} * ${num(PP[0])})`), `(-1 * ${k} * ${num(PP[1])})`), [s2, e2] = twoSum('b', s1, `(-1 * ${k} * ${num(PP[2])})`);
    const [rh0, rl0] = fast('c', s2, add(add(e1, e2), `(-1 * ${k} * ${num(P4)})`)), RH = store('rh', rh0), RL = store('rl', rl0);
    // S + C r − S r²/2 as pairs, the rest in doubles
    const [p1, e3] = twoProd('m', Ch, RH), [sq, sqe] = twoProd('q', RH, RH), h2 = mac('h2', `(${sq} * 0.5)`), [p2, e4] = twoProd('n', Sh, h2);
    const r2 = mac('r2', mul(RH, RH)), r3 = mac('r3', mul(r2, RH)), div = (a, n) => `(${a} * ${num(1 / n)})`;
    const small = [mul(Ch, RL), mul(Cl, RH), `(-1 * ${add(mul(Sh, add(`(${sqe} * 0.5)`, mul(RH, RL))), mul(Sl, h2))})`, `(-1 * ${div(mul(Ch, r3), 6)})`,
      div(mul(Sh, mul(r2, r2)), 24), div(mul(Ch, mul(r3, r2)), 120), `(-1 * ${div(mul(Sh, mul(r3, r3)), 720)})`, `(-1 * ${div(mul(Ch, mul(mul(r3, r2), r2)), 5040)})`].reduce(add);
    // stored before they are summed: each is read several times below
    const P1 = store('p1', p1), P2 = store('p2', p2), EE = store('ee', sub(e3, e4)), SM = store('sm', small);
    const [a1, b1] = twoSum('s', Sh, P1), [a2, b2] = twoSum('t', a1, `(-1 * ${P2})`), [zh0, zl0] = fast('z', a2, add(add(b1, b2), add(Sl, add(EE, SM))));
    // the margin for a value y of sin or cos: 2^-73 |y|, the tail's rounding (2^-50 |r|³), and the reduction's own error (the
    // last part's rounding times k, and its sum's rounding, which scales with r: the TwoSums' errors are 2^-53 of what they round)
    const Btrig = (ay) => `(${num(2 ** -73)} * ${ay} + ${num(2 ** -50)} * abs(${RH}) * abs(${RH}) * abs(${RH}) + ${num(2 ** -50)} * abs(${k}) * ${num(Math.abs(P4))} + ${num(2 ** -100)} * abs(${RH}))`;
    const flags = `var(${P}-d) * var(${P}-rh-f) * var(${P}-rl-f) * var(${P}-sm-f) * var(${P}-ee-f)`;
    if (fn === 'sin' || fn === 'cos') return answer(K, x, zh0, zl0, Btrig, flags, fn === 'sin');
    // sec and csc: 1 / the pair (cos's or sin's), by one corrected division; the relative error is the pair's, so the margin
    // is |q| (Btrig(|y|) / |y| + 2^-100); sec(x) of a cos and csc(0), infinite, leave no answer
    const YH = store('yh', zh0), YL = store('yl', zl0), q0 = mac('q0', `(1 / ${YH})`), [m, me] = twoProd('w', q0, YH);
    const [qh, ql] = fast('v', q0, store('rq', `(${sub(sub(sub('1', m), me), mul(q0, YL))} / ${YH})`));
    return answer(K, x, qh, ql, (az) => `(${az} * (${Btrig(`abs(${YH})`)} / max(abs(${YH}), ${2 ** -1074}) + ${num(2 ** -100)}))`, flags, false); };
  // arctan of a pair t from 0 to 1 (TH, TL, stored): c = j/256 nearest t, u = (t − c)/(1 + t c) as a pair (a guess,
  // corrected by TwoProduct), atan t = A_j + u − u³/3 + … to u¹¹; the pair stored, and u's high part for the margin
  const atanOf = (K, TH, TL) => { const { P, mac, store, add, sub, mul, num, fast, twoProd, ddAdd } = K, { A } = ATANK;
    decls.push([`${P}-j`, `round(${TH} * 256, 1)`]);
    const c = `(var(${P}-j) / 256)`, nh = mac('nh', sub(TH, c)), [p2, pe2] = twoProd('k', TH, c), [dh, dl0] = fast('l', '1', p2), dl = mac('dl', add(dl0, add(pe2, mul(TL, c))));
    const [n1, n2] = fast('n', nh, TL), N1 = store('n1', n1), N2 = store('n2', n2), DH = store('dh', dh), DL = store('dl', dl); // stored: each is read often below
    const u0 = mac('u0', `(${N1} / ${DH})`), [m, me] = twoProd('m', u0, DH);
    const REM = store('rem', add(sub(sub(N1, m), me), sub(N2, mul(u0, DL)))), [uh, ul] = fast('o', u0, `(${REM} / ${DH})`), UH = store('uh', uh), UL = store('ul', ul);
    const u2 = mac('u2', mul(UH, UH)), poly = [9, 7, 5, 3].reduce((acc, n) => add(num((n % 4 === 1 ? 1 : -1) / n), mul(u2, acc)), num(-1 / 11)), tail = mul(mul(UH, u2), poly);
    for (let n = 0; n <= 256; n++) decls.push([`${P}-I${n}`, `max(0, 1 - abs(var(${P}-j) + ${-n}))`]);
    const tab = (h) => { const q = `${P}-A${h}`; for (const z of 'eabc') decls.push([`${q}-${z}`, A.map((t, n) => (t[h][z] ? `var(${P}-I${n}) * ${t[h][z]}` : '')).filter(Boolean).join(' + ') || '0']); decls.push([`${q}-z`, '0']); return mac(`A${h}`, join(q)); };
    const sr = fast('t', UH, add(UL, tail)), y1 = ddAdd('s', [tab(0), tab(1)], [store('sh', sr[0]), store('sl', sr[1])]);
    return { Y: [store('yh', y1[0]), store('yl', y1[1])], UH, flags: ['n1', 'n2', 'dh', 'dl', 'rem', 'uh', 'ul', 'sh', 'sl', 'yh'].map((n) => `var(${P}-${n}-f)`).join(' * ') }; };
  // the answer from a pair (zh0, zl0): stored, with x's sign of zero where x is ±0 (keepZero); ok where the pair is clear of
  // halfway on zl's side by B, or is exactly 0
  const answer = (K, x, zh0, zl0, B, flags, keepZero, force = '0') => { const { P, mac, store } = K, ge = (u, v) => `(1 - sign(max(0, ${v} + (-1 * ${u}))))`, two = (e) => `pow(2, ${e})`;
    const ZH = store('zh', zh0, true); if (keepZero) decls.push([`${P}-zh-z`, `(1 - abs(sign(${x}))) * max(0, -1 * sign(1 / ${x}))`]);
    const zh = mac('zh', ZH), zl = mac('zl', zl0), az = `abs(${zh})`;
    decls.push([`${P}-z0`, `round(down, log(max(${az}, ${2 ** -1074}), 2), 1)`]);
    const sc = `(${az} * ${two(`(-1 * var(${P}-z0))`)})`; decls.push([`${P}-ez`, `var(${P}-z0) + ${ge(sc, 2)} + (-1 * (1 - ${ge(sc, 1)}))`]);
    const atPow2 = `(1 - abs(sign(${az} + (-1 * ${two(`var(${P}-ez)`)}))))`, toward0 = `abs(sign(${zl})) * (1 - abs(sign(sign(${zl}) + sign(${zh}))))`;
    const half = `(${two(`(var(${P}-ez) + -53)`)} / (1 + ${atPow2} * ${toward0}))`;
    decls.push([`${P}-ok`, `${flags} * var(${P}-zh-f) * max(${force}, 1 - abs(sign(${zh})), sign(max(0, ${half} + (-1 * abs(${zl})) + (-1 * ${B(az)}))))`]);
    return `(${zh} * (1 + 0 / var(${P}-ok)))`; };
  // arctan of a value the page sets, to the double nearest the true value (probes/dcss/atan-check.mjs runs these steps in
  // JavaScript and in the engines): t = |x|, or 1/|x| past 1 as a pair (CSS's division as a guess, corrected by TwoProduct, so
  // WebKit's inexact division can't matter); then atanOf; past 1, π/2 − it; then x's sign. The halfway test leaves
  // 2^-76 |y| + 2^-50 |u|³ (the tail's rounding, where A_j and u nearly cancel: measured 2^-80.6 absolute). An infinite x is
  // 2^996's (π/2); ±0 is ±0. arccot is atan(1/x), the same two branches the other way round: atan t past 1, π/2 − it
  // below; none for 0 (MathML's arccot as OpenMath's, atan(1/x)) or past 2^996, where TwoProduct's split of x (134217729 x)
  // would pass the largest double and 1/x lose its low part
  const liveAtan = (xe, fn) => { const K = kit(), { P, mac, store, mul, sub, num, fast, twoProd, ddAdd } = K, { PI2 } = ATANK, cot = fn === 'arccot';
    const x = mac('x', xe), a = mac('a', `abs(${x})`), two = (e) => `pow(2, ${e})`;
    decls.push([`${P}-d`, cot ? `sign(abs(${x}) + 1) * abs(sign(${x})) * (1 - sign(max(0, ${a} + (-1 * ${two(996)}))))` : `sign(abs(${x}) + 1)`], [`${P}-inv`, `sign(max(0, ${a} + -1))`]);
    const inv = `var(${P}-inv)`, pickd = (u, v) => `(${sel(inv, u)} + ${sel(`(1 - ${inv})`, v)})`;
    // 1/|x| for |x| past 1, from |x| held to [1, 2^996] so that neither branch is NaN
    const a1 = mac('a1', `clamp(1, ${a}, ${two(996)})`), q0 = mac('q0', `(1 / ${a1})`), [p, pe] = twoProd('i', a1, q0), [ih, il] = fast('j', q0, mul(q0, sub(sub('1', p), pe)));
    const TH = store('th', pickd(ih, `min(${a}, 1)`)), TL = store('tl', pickd(il, '0')), { Y, UH, flags } = atanOf(K, TH, TL);
    const y2 = ddAdd('v', PI2.map(num), [`(-1 * ${Y[0]})`, `(-1 * ${Y[1]})`]), [zh0, zl0] = cot ? fast('z', pickd(Y[0], y2[0]), pickd(Y[1], y2[1])) : fast('z', pickd(y2[0], Y[0]), pickd(y2[1], Y[1])), sg = `sign(${x})`;
    return answer(K, x, `(${zh0} * ${sg})`, `(${zl0} * ${sg})`, (az) => `(${num(2 ** -76)} * ${az} + ${num(2 ** -50)} * abs(${UH}) * abs(${UH}) * abs(${UH}))`, `var(${P}-d) * var(${P}-th-f) * var(${P}-tl-f) * ${flags}`, !cot); };
  // arcsin or arccos of a value the page sets (probes/dcss/asin-check.mjs): a = |x|, s = √(1 − x²) as a pair (1 − x² by
  // TwoProduct, the root corrected once), t = min(a, s) / max(a, s) as a pair, atanOf; arcsin(|x|) = atan t or π/2 − it,
  // arccos(|x|) the other of the two (so neither cancels near 1), then x's sign for arcsin, π − it for arccos below 0.
  // No answer past |x| = 1; arcsin(±0) is ±0, arccos(1) is 0
  const liveAsin = (xe, fn) => { const K = kit(), { P, mac, store, add, sub, mul, num, twoSum, fast, twoProd, ddAdd } = K, { PI2 } = ATANK;
    const x = mac('x', xe), a = mac('a', `min(abs(${x}), 1)`);
    decls.push([`${P}-d`, `(1 - sign(max(0, abs(${x}) + -1))) * (${x} * 0 + 1)`]);
    const [sq, sqe] = twoProd('q', a, a), [w0, w1] = twoSum('w', '1', `(-1 * ${sq})`), [wh, wl] = fast('v', w0, sub(w1, sqe)), WH = store('wh', wh), WL = store('wl', wl);
    const s0 = mac('s0', `sqrt(${WH})`), [p, pe] = twoProd('r', s0, s0), RS = store('rs', `(${add(sub(sub(WH, p), pe), WL)} / (2 * max(${s0}, ${2 ** -600})))`), [sh0, sl0] = fast('s', s0, RS);
    const SH = store('sh0', sh0), SL = store('sl0', sl0);
    decls.push([`${P}-inv`, `sign(max(0, ${a} + (-1 * ${SH})))`]); const inv = `var(${P}-inv)`, pickd = (u, v) => `(${sel(inv, u)} + ${sel(`(1 - ${inv})`, v)})`;
    // t = num / den: (s, a) where a passes s, else (a, s); den held from 0 where both are 0 (x = 0)
    const NH = store('nh0', pickd(SH, a)), NL = store('nl0', pickd(SL, '0')), DH = store('dh0', `max(${pickd(a, SH)}, ${2 ** -1000})`), DL = store('dl0', pickd('0', SL)); // stored: read often
    const q0 = mac('t0', `(${NH} / ${DH})`), [m, me] = twoProd('g', q0, DH), RT = store('rt', `(${add(sub(sub(NH, m), me), sub(NL, mul(q0, DL)))} / ${DH})`), [th, tl] = fast('h', q0, RT);
    const { Y, UH, flags } = atanOf(K, store('th', th), store('tl', tl)), comp = ddAdd('c', PI2.map(num), [`(-1 * ${Y[0]})`, `(-1 * ${Y[1]})`]);
    const first = fn === 'arcsin' ? (h) => pickd(comp[h], Y[h]) : (h) => pickd(Y[h], comp[h]);
    let r = [store('rh', first(0)), store('rl', first(1))];
    if (fn === 'arccos') { const neg = `sign(max(0, -1 * ${x}))`, pi = PIPAIR.map(num), back = ddAdd('b', pi, [`(-1 * ${r[0]})`, `(-1 * ${r[1]})`]);
      r = [`(${sel(neg, back[0])} + ${sel(`(1 - ${neg})`, r[0])})`, `(${sel(neg, back[1])} + ${sel(`(1 - ${neg})`, r[1])})`]; }
    const [zh0, zl0] = fast('z', r[0], r[1]), sg = fn === 'arcsin' ? `sign(${x})` : '1';
    return answer(K, x, `(${zh0} * ${sg})`, `(${zl0} * ${sg})`, (az) => `(${num(2 ** -76)} * ${az} + ${num(2 ** -50)} * abs(${UH}) * abs(${UH}) * abs(${UH}))`,
      `var(${P}-d) * var(${P}-wh-f) * var(${P}-rs-f) * var(${P}-sh0-f) * var(${P}-dh0-f) * var(${P}-rt-f) * var(${P}-th-f) * var(${P}-rh-f) * ${flags}`, fn === 'arcsin'); };
  // arcsec or arccsc of a value the page sets (probes/dcss/asin-check.mjs): a = |x|; t = √(a² − 1) as a pair below √2 (a² − 1
  // by TwoProduct, exact, the root corrected once), else 1 over it, q / √(1 − q²) with q = 1/a as a pair (no cancellation
  // there, and q² lost past 2^500 changes nothing); atanOf. Below √2 arcsec(a) is atan t and arccsc(a) π/2 − it, above the
  // other way round, so neither cancels; then π − it for arcsec below 0, x's sign for arccsc. No answer for |x| below 1;
  // past 2^996 (TwoProduct's split of a, 134217729 a, would pass the largest double) arccsc has none and arcsec is 2^996's
  const liveAsec = (xe, fn) => { const K = kit(), { P, mac, store, add, sub, mul, num, twoSum, fast, twoProd, ddAdd } = K, { PI2 } = ATANK, two = (e) => `pow(2, ${e})`;
    const x = mac('x', xe), a = mac('a', `abs(${x})`);
    decls.push([`${P}-d`, `(1 - sign(max(0, 1 + (-1 * ${a})))) * (${x} * 0 + 1)${fn === 'arccsc' ? ` * (1 - sign(max(0, ${a} + (-1 * ${two(996)}))))` : ''}`], [`${P}-inv`, `sign(max(0, ${num(Math.SQRT2)} + (-1 * ${a})))`]);
    const inv = `var(${P}-inv)`, pickd = (u, v) => `(${sel(inv, u)} + ${sel(`(1 - ${inv})`, v)})`;
    const root = (n, wh, wl) => { const WH = store(`${n}wH`, wh), WL = store(`${n}wL`, wl), s0 = mac(`${n}0`, `sqrt(${WH})`), [p, pe] = twoProd(`${n}p`, s0, s0);
      return fast(`${n}s`, s0, store(`${n}r`, `(${add(sub(sub(WH, p), pe), WL)} / (2 * max(${s0}, ${2 ** -600})))`)); };
    // below √2: u = √(a² − 1), a held to [1, 1.5]
    const a1 = mac('a1', `clamp(1, ${a}, 1.5)`), [sq, sqe] = twoProd('q', a1, a1), [w0, w1] = twoSum('w', sq, '-1'), [uh, ul] = root('U', ...fast('v', w0, add(w1, sqe)));
    // above: q = 1/a, a held to [1, 2^996]; s = √(1 − q²); 1/u = q / s
    const a2 = mac('a2', `clamp(1, ${a}, ${two(996)})`), q0 = mac('q0', `(1 / ${a2})`), [p, pe] = twoProd('i', a2, q0), [qh0, ql0] = fast('j', q0, mul(q0, sub(sub('1', p), pe)));
    const QH = store('qh', qh0), QL = store('ql', ql0), [r2, r2e] = twoProd('kk', QH, QH), [y0, y1] = twoSum('y', '1', `(-1 * ${r2})`);
    const [sh, sl] = root('S', ...fast('z', y0, sub(sub(y1, r2e), mul('2', mul(QH, QL))))), SH = store('SH', sh), SL = store('SL', sl);
    const t0 = mac('t0', `(${QH} / ${SH})`), [m, me] = twoProd('g', t0, SH), [vh, vl] = fast('h', t0, store('rt', `(${add(sub(sub(QH, m), me), sub(QL, mul(t0, SL)))} / ${SH})`));
    const { Y, UH, flags } = atanOf(K, store('th', pickd(uh, vh)), store('tl', pickd(ul, vl))), comp = ddAdd('c', PI2.map(num), [`(-1 * ${Y[0]})`, `(-1 * ${Y[1]})`]);
    const first = fn === 'arcsec' ? (h) => pickd(Y[h], comp[h]) : (h) => pickd(comp[h], Y[h]);
    let r = [store('rh', first(0)), store('rl', first(1))];
    if (fn === 'arcsec') { const neg = `sign(max(0, -1 * ${x}))`, pi = PIPAIR.map(num), back = ddAdd('b', pi, [`(-1 * ${r[0]})`, `(-1 * ${r[1]})`]);
      r = [`(${sel(neg, back[0])} + ${sel(`(1 - ${neg})`, r[0])})`, `(${sel(neg, back[1])} + ${sel(`(1 - ${neg})`, r[1])})`]; }
    const [zh0, zl0] = fast('fo', r[0], r[1]), sg = fn === 'arccsc' ? `sign(${x})` : '1';
    return answer(K, x, `(${zh0} * ${sg})`, `(${zl0} * ${sg})`, (az) => `(${num(2 ** -76)} * ${az} + ${num(2 ** -50)} * abs(${UH}) * abs(${UH}) * abs(${UH}))`,
      `var(${P}-d) * var(${P}-qh-f) * var(${P}-SH-f) * var(${P}-rt-f) * var(${P}-th-f) * var(${P}-rh-f) * ${flags}`, false); };
  // tan or cot of a value the page sets (probes/dcss/tan-check.mjs): sin's reduction, k mod 512 (tan's period is π); within
  // π/4 of π/2, tan x = −1/tan(x − π/2), so T = tan(j'π/512) for |j'| ≤ 128 from a table of 129, with j's sign; t = tan r as a
  // pair (r + r³/3 + 2r⁵/15 + 17r⁷/315 + 62r⁹/2835); n = T + t and d = 1 − T t as pairs; tan = n/d, or −d/n on that branch,
  // cot the other way round, by one corrected division. The halfway test leaves |y| (2^-74 + (2^-49 |r|³ + 2^-49 |k P4| +
  // 2^-99 |r|) / min(|n|, |d|)): t's tail and the reduction's error, carried through n and d. tan(±0) is ±0; cot(0) none
  const liveTan = (xe, fn) => { const K = kit(), { P, mac, store, add, sub, mul, num, twoSum, fast, twoProd, ddAdd, ddMul } = K, { PP, P4, INV } = TRIGK;
    const x = mac('x', xe), k = mac('k', `round(${x} * ${num(INV)}, 1)`), ge = (a, b) => `(1 - sign(max(0, ${b} + (-1 * ${a}))))`;
    decls.push([`${P}-d`, `${ge(num(2 ** 20), `abs(${x})`)} * (${x} * 0 + 1)`], [`${P}-j`, `${k} + -512 * round(down, ${k} / 512, 1)`]);
    decls.push([`${P}-jj`, `var(${P}-j) + 128 + -256 * round(down, (var(${P}-j) + 128) / 256, 1) + -128`], [`${P}-fl`, `round(down, (var(${P}-j) + 128 + -512 * round(down, (var(${P}-j) + 128) / 512, 1)) / 256, 1)`]);
    decls.push([`${P}-aj`, `abs(var(${P}-jj))`]); for (let n = 0; n <= 128; n++) decls.push([`${P}-I${n}`, `max(0, 1 - abs(var(${P}-aj) + ${-n}))`]);
    const tab = (h) => { const q = `${P}-T${h}`; for (const z of 'eabc') decls.push([`${q}-${z}`, TANK.map((t, n) => (t[h][z] ? `var(${P}-I${n}) * ${t[h][z]}` : '')).filter(Boolean).join(' + ') || '0']); decls.push([`${q}-z`, '0']); return mac(`T${h}`, `(sign(var(${P}-jj)) * ${join(q)})`); };
    const T = [tab(0), tab(1)];
    const [s1, e1] = twoSum('a', sub(x, `(${k} * ${num(PP[0])})`), `(-1 * ${k} * ${num(PP[1])})`), [s2, e2] = twoSum('b', s1, `(-1 * ${k} * ${num(PP[2])})`);
    const [rh0, rl0] = fast('c', s2, add(add(e1, e2), `(-1 * ${k} * ${num(P4)})`)), RH = store('rh', rh0), RL = store('rl', rl0);
    const r2 = mac('r2', mul(RH, RH)), poly = [17 / 315, 2 / 15, 1 / 3].reduce((acc, c) => add(num(c), mul(r2, acc)), num(62 / 2835)), tt = fast('t', RH, add(RL, mul(mul(RH, r2), poly)));
    const t = [store('th', tt[0]), store('tl', tt[1])], n0 = ddAdd('n', T, t), Tt0 = ddMul('p', T, t), Tt = [store('ph', Tt0[0]), store('pl', Tt0[1])], d0 = ddAdd('d', ['1', '0'], [`(-1 * ${Tt[0]})`, `(-1 * ${Tt[1]})`]);
    const N = [store('nh', n0[0]), store('nl', n0[1])], D = [store('dh', d0[0]), store('dl', d0[1])], flip = `var(${P}-fl)`, nd = fn === 'tan' ? `(1 - ${flip})` : flip;
    const pickd = (u, v) => `(${sel(nd, u)} + ${sel(`(1 - ${nd})`, v)})`, UH = store('uh', pickd(N[0], D[0])), UL = store('ul', pickd(N[1], D[1])), VH = store('vh', pickd(D[0], N[0])), VL = store('vl', pickd(D[1], N[1]));
    const q0 = mac('q0', `(${UH} / ${VH})`), [m, me] = twoProd('m', q0, VH), REM = store('rem', `(${add(sub(sub(UH, m), me), sub(UL, mul(q0, VL)))} / ${VH})`), [qh, ql] = fast('q', q0, REM), sg = `(1 - 2 * ${flip})`;
    const B = (az) => `(${az} * (${num(2 ** -74)} + (${num(2 ** -49)} * abs(${RH}) * abs(${RH}) * abs(${RH}) + ${num(2 ** -49)} * abs(${k}) * ${num(Math.abs(P4))} + ${num(2 ** -99)} * abs(${RH})) / max(min(abs(${N[0]}), abs(${D[0]})), ${2 ** -1000})))`;
    return answer(K, x, `(${qh} * ${sg})`, `(${ql} * ${sg})`, B, `var(${P}-d) * var(${P}-rh-f) * var(${P}-nh-f) * var(${P}-dh-f) * var(${P}-uh-f) * var(${P}-vh-f) * var(${P}-rem-f)`, fn === 'tan'); };
  // a root of whole degree n (3 to 1,000, not a power of 2) of a value the page sets, to the double nearest the true root
  // (probes/dcss/root-check.mjs runs these steps in JavaScript and in the engines): |x| times 2^(−n k), exact in two
  // factors, to a' within 2^±n/2 of 1; y0 = CSS's pow(a', 1/n) as a guess; y0^n as a pair by squaring; one Newton step,
  // δ = (a' − y0^n) y0 / (n y0^n). The halfway test leaves 2^-97 |y| + 2^-50 |δ| + n δ²/|y| (Newton's own error is
  // (n − 1) δ²/2|y|; the pair's error measured at most 2^-3.7 of it). The answer is ±(y0 + δ) 2^k; none for an even n of x
  // below 0 or for an x not finite; ±0 is ±0
  const liveRoot = (xe, n) => { const K = kit(), { P, mac, store, add, sub, mul, num, fast, twoProd } = K, two = (e) => `pow(2, ${e})`;
    const x = mac('x', xe), a = mac('a', `abs(${x})`), ge = (u, v) => `(1 - sign(max(0, ${v} + (-1 * ${u}))))`;
    decls.push([`${P}-d`, `(${x} * 0 + 1)${n % 2 ? '' : ` * ${ge(x, 0)}`}`], [`${P}-e0`, `round(down, log(max(${a}, ${2 ** -1074}), 2), 1)`],
      [`${P}-k`, `round(var(${P}-e0) / ${n}, 1)`], [`${P}-h`, `round(var(${P}-k) * ${-n / 2}, 1)`]);
    const a1 = store('a1', mul(mul(a, two(`var(${P}-h)`)), two(`(var(${P}-k) * ${-n} + (-1 * var(${P}-h)))`))), y0 = store('y0', `pow(${a1}, ${num(1 / n)})`);
    // y0^n: a pair squared, and times y0 where n's bit is 1 (a zero low part adds nothing, so its terms are left out)
    const times = (nm, [ah, al], [bh, bl]) => { const [p, e] = twoProd(`${nm}m`, ah, bh), cross = [bl !== '0' && mul(ah, bl), al !== '0' && mul(al, bh)].filter(Boolean);
      const [h, l] = fast(`${nm}b`, p, cross.length ? add(e, cross.reduce(add)) : e); return [store(`${nm}h`, h), store(`${nm}l`, l)]; };
    let pw = [y0, '0']; [...n.toString(2).slice(1)].forEach((bit, i) => { pw = times(`s${i}`, pw, pw); if (bit === '1') pw = times(`t${i}`, pw, [y0, '0']); });
    const r = mac('r', sub(sub(a1, pw[0]), pw[1])), D = store('dl', `(${mul(r, y0)} / ${mul(num(n), `max(${pw[0]}, ${2 ** -1000})`)})`);
    const [zh, zl] = fast('z', y0, D), sg = `(1 - 2 * sign(max(0, -1 * ${x})))`;
    const y = answer(K, x, `(${zh} * ${sg})`, `(${zl} * ${sg})`, (az) => `(${num(2 ** -97)} * ${az} + ${num(2 ** -50)} * abs(${D}) + ${n} * ${D} * ${D} / max(${az}, ${2 ** -1000}))`, `var(${P}-d)`, true);
    return `(${y} * ${two(`var(${P}-k)`)})`; };
  // sinh, cosh or tanh of a value the page sets, to the double nearest the true value (probes/dcss/hyp-check.mjs runs these
  // steps in JavaScript and in the engines): Z = e^|x| as expCore's pair, 2^E apart; G = 2^-2E / Z as a pair (one corrected
  // division); S = Z − G and C = Z + G: sinh is S 2^(E−1), cosh C 2^(E−1), tanh S / C (corrected). Below 2^-5, where S
  // cancels, sinh by its series to x¹¹ (x³/6 as a pair) and tanh = 2 sinh / C. The halfway test leaves 2^-73 (Z + G) +
  // 2^-100 |y|, 2^-75 |y| for the series, and tanh the two relative errors and 2^-73; the pairs' errors were measured at
  // most 2^-3.2 of it. Below 2^-27 sinh and tanh are x, taken as they are (half an ulp underflows near 2^-1022). No answer
  // past |x| = 709 for sinh and cosh (their true values are finite to 710.47); tanh takes min(|x|, 20), whose answer, ±1,
  // is every larger x's too. ±0 is ±0
  const liveHyp = (xe, fn) => { const K = kit(), { P, mac, store, add, sub, mul, num, twoSum, fast, twoProd, ddMul } = K, two = (e) => `pow(2, ${e})`;
    const x = mac('x', xe), a = mac('a', `abs(${x})`), lt = (u, v) => `sign(max(0, ${v} + (-1 * ${u})))`;
    const flat = fn === 'tanh' || fn === 'coth'; // 1 to the double from |x| 20 up: e^20 is enough
    decls.push([`${P}-d`, flat ? `sign(${a} + 1)` : `(${x} * 0 + 1) * (1 - ${lt(709, a)})`], [`${P}-sm`, lt(a, 2 ** -5)], [`${P}-ty`, lt(a, 2 ** -27)]);
    const sm = `var(${P}-sm)`, pick = (u, v) => `(${sel(sm, u)} + ${sel(`(1 - ${sm})`, v)})`;
    const ex = expCore(`min(${a}, ${flat ? 20 : 709})`, true), ZH = ex.zh, ZL = ex.zl, E = `var(${ex.P}-E)`;
    const q0 = mac('q0', `(1 / ${ZH})`), [m, me] = twoProd('w', q0, ZH), [rh, rl] = fast('v', q0, store('rq', `(${sub(sub(sub('1', m), me), mul(q0, ZL))} / ${ZH})`));
    const sc = mac('sc', two(`(-2 * ${E})`)), Gh = mac('gh', store('gh', mul(rh, sc))), Gl = mac('gl', store('gl', mul(rl, sc)));
    // sech, csch and coth: 1 / the pair (cosh's, sinh's or tanh's, before its power of 2), one corrected division; the
    // relative error is the pair's and 2^-100 more; none for csch and coth of |x| below 2^-1022 (1/x near the largest double)
    const inv = (hh, ll) => { const H = store('ih', hh), L = store('il', ll), r0 = mac('r0', `(1 / ${H})`), [m2, me2] = twoProd('r', r0, H);
      return fast('rq', r0, store('rr', `(${sub(sub(sub('1', m2), me2), mul(r0, L))} / ${H})`)); };
    if (fn === 'sech' || fn === 'csch' || fn === 'coth') decls.push([`${P}-dd`, fn === 'sech' ? '1' : `sign(max(0, ${a} + (-1 * ${2 ** -1022})))`]);
    const [s1, s2] = twoSum('s', ZH, `(-1 * ${Gh})`), [sh, sl] = fast('t', s1, add(s2, sub(ZL, Gl))), SH = store('sh', sh), SL = store('sl', sl);
    const [c1, c2] = twoSum('c', ZH, Gh), [ch, cl] = fast('u', c1, add(c2, add(ZL, Gl))), CH = store('ch', ch), CL = store('cl', cl);
    const sg = `(1 - 2 * sign(max(0, -1 * ${x})))`, flags = `var(${P}-d) * var(${ex.P}-pf)`, edge = `(${num(2 ** -73)} * (${ZH} + ${Gh}))`;
    if (fn === 'cosh') return `(${answer(K, x, CH, CL, (az) => `(${edge} + ${num(2 ** -100)} * ${az})`, flags, false)} * ${two(`(${E} + -1)`)})`;
    if (fn === 'sech') { const [qh, ql] = inv(CH, CL); return `(${answer(K, x, qh, ql, (az) => `(${az} * ${num(2 ** -73 + 2 ** -99)})`, `${flags} * var(${P}-dd)`, false)} * ${two(`(1 + -1 * ${E})`)})`; }
    // the series below 2^-5, from |x| held there so that it stays finite
    // (each pair stored: a TwoProduct reads its operands' halves, so a chain of them re-expands: 890k tokens unstored)
    const b = store('b', `min(${a}, ${2 ** -5})`), [th0, tl0] = twoProd('q', b, b), th = store('th', th0), tl = store('tl', tl0), [p, pe] = twoProd('p', b, th);
    const [k1, k2] = fast('k', p, add(pe, mul(b, tl))), c6 = ddMul('six', [store('k1', k1), store('k2', k2)], SIXTH.map(num)), C6H = store('c6h', c6[0]), C6L = store('c6l', c6[1]);
    const poly = add(num(1 / 120), mul(th, add(num(1 / 5040), mul(th, add(num(1 / 362880), mul(th, num(1 / 39916800)))))));
    const [u1, u2] = fast('m', b, C6H), [nh, nl] = fast('n', u1, add(u2, add(C6L, mul(mul(mul(b, th), th), poly)))), NH = store('nh', nh), NL = store('nl', nl);
    if (fn === 'sinh') return `(${answer(K, x, `(${pick(NH, SH)} * ${sg})`, `(${pick(NL, SL)} * ${sg})`, (az) => `(${sm} * ${num(2 ** -75)} * ${az} + (1 - ${sm}) * (${edge} + ${num(2 ** -100)} * ${az}))`, flags, true, `var(${P}-ty)`)} * (${sm} + (1 - ${sm}) * ${two(`(${E} + -1)`)}))`;
    if (fn === 'csch') { const [qh, ql] = inv(pick(NH, SH), pick(NL, SL));
      return `(${answer(K, x, `(${qh} * ${sg})`, `(${ql} * ${sg})`, (az) => `(${az} * (${sm} * ${num(2 ** -75)} + (1 - ${sm}) * (${edge} / max(abs(${SH}), ${2 ** -1000}) + ${num(2 ** -100)}) + ${num(2 ** -99)}))`, `${flags} * var(${P}-dd)`, false)} * (${sm} + (1 - ${sm}) * ${two(`(1 + -1 * ${E})`)}))`; }
    // tanh: the numerator (2 sinh's series, or S) over C, corrected once
    const UH = store('uh', pick(mul('2', NH), SH)), UL = store('ul', pick(mul('2', NL), SL)), d0 = mac('d0', `(${UH} / ${CH})`), [w, we] = twoProd('x', d0, CH);
    const [yh, yl] = fast('y', d0, store('yq', `(${add(sub(sub(UH, w), we), sub(UL, mul(d0, CL)))} / ${CH})`));
    if (fn === 'coth') { const [qh, ql] = inv(yh, yl);
      return answer(K, x, `(${qh} * ${sg})`, `(${ql} * ${sg})`, (az) => `(${az} * (${sm} * ${num(2 ** -75)} + (1 - ${sm}) * ${edge} / max(abs(${SH}), ${2 ** -1000}) + ${num(2 ** -73 + 2 ** -99)}))`, `${flags} * var(${P}-dd)`, false); }
    return answer(K, x, `(${yh} * ${sg})`, `(${yl} * ${sg})`, (az) => `(${az} * (${sm} * ${num(2 ** -75)} + (1 - ${sm}) * ${edge} / max(abs(${SH}), ${2 ** -1000}) + ${num(2 ** -73 + 2 ** -100)}))`, flags, true, `var(${P}-ty)`); };
  // the inverse hyperbolic functions' parts: an odd series b + c3 b³ (a pair) + b⁵ (c5 + c7 b² + …); √ of a pair, corrected
  // once; and ln of a pair w from 1 up: CSS's log(wh) as a guess y0, δ = w e^(−y0) − 1 from the exact exp's pair, ln w =
  // y0 + δ − δ²/2 (absolute error under 2^-73; none where y0 passes 708, exp's argument then clamped)
  const oddSeries = (K, nm, b, c3, cs) => { const { mac, store, add, mul, num, fast, twoProd, ddMul } = K;
    const [th0, tl0] = twoProd(`${nm}q`, b, b), th = store(`${nm}th`, th0), tl = store(`${nm}tl`, tl0), [p, pe] = twoProd(`${nm}p`, b, th), [k1, k2] = fast(`${nm}k`, p, add(pe, mul(b, tl)));
    const cc = ddMul(`${nm}c`, [store(`${nm}k1`, k1), store(`${nm}k2`, k2)], c3.map(num)), CH = store(`${nm}ch`, cc[0]), CL = store(`${nm}cl`, cc[1]);
    const poly = cs.slice(0, -1).reduceRight((acc, q) => add(num(q), mul(th, acc)), num(cs.at(-1))), [u1, u2] = fast(`${nm}u`, b, CH);
    const [nh, nl] = fast(`${nm}n`, u1, add(u2, add(CL, mul(mul(mul(b, th), th), poly)))); return [store(`${nm}nh`, nh), store(`${nm}nl`, nl)]; };
  const sqrtPair = (K, nm, qh, ql) => { const { mac, store, add, sub, fast, twoProd } = K, r0 = mac(`${nm}r`, `sqrt(${qh})`), [m, me] = twoProd(`${nm}m`, r0, r0);
    return fast(`${nm}s`, r0, store(`${nm}c`, `(${add(sub(sub(qh, m), me), ql)} / max(2 * ${r0}, ${2 ** -1000}))`)); };
  const lnFar = (K, wh, wl) => { const { P, mac, store, add, sub, mul, fast, twoProd } = K, ge = (u, v) => `(1 - sign(max(0, ${v} + (-1 * ${u}))))`;
    const y0 = mac('ly0', `log(max(${wh}, ${2 ** -1022}))`), ex = expCore(`clamp(-708, -1 * ${y0}, 709)`, true), sc = `pow(2, var(${ex.P}-E))`;
    const xs = mac('lxs', `(${wh} * ${sc})`), [p, pe] = twoProd('lr', xs, ex.zh), dl = store('ldl', add(sub(p, '1'), add(pe, add(mul(xs, ex.zl), mul(mac('lxl', `(${wl} * ${sc})`), ex.zh)))));
    return { pair: fast('lc', y0, sub(dl, mul(mul(dl, dl), '0.5'))), ok: `${ge(708, y0)} * var(${ex.P}-pf)` }; };
  // arcsinh, arccosh or arctanh of a value the page sets, to the double nearest the true value (probes/dcss/ahyp-check.mjs
  // runs these steps in JavaScript and in the engines). Near their zeros a series: arcsinh and arctanh below 2^-5 (odd, to
  // x¹⁵), arccosh within 2^-10 of 1 as √(2t) (1 − t/12 + 3t²/160 − …), t = x − 1; elsewhere ln of an exact pair w: x + √(x²
  // ± 1) (from 2^26, x ± 1/(4x) and ln 2 added), (1 + x)/(1 − x) halved. The halfway test leaves 2^-71 |y| for the odd series
  // (their x⁵ terms' roundings: measured 2^-2.8 of it), 2^-73 |y| for arccosh's, and 2^-73 (arctanh 2^-74) + 2^-100 |y| for
  // the ln; below 2^-27 arcsinh and arctanh take the pair as it is, x (half an ulp underflows near 2^-1022). No answer for
  // arccosh below 1, arctanh from 1, or where ln's guess passes 708 (x past about 1.5e307); ±0 is ±0
  const liveAhyp = (xe, fn) => { const K = kit(), { P, mac, store, add, sub, mul, num, twoSum, fast, twoProd, ddMul, ddAdd } = K;
    const x = mac('x', xe), a = mac('a', `abs(${x})`), lt = (u, v) => `sign(max(0, ${v} + (-1 * ${u})))`, sg = `(1 - 2 * sign(max(0, -1 * ${x})))`;
    const edge = fn === 'arccosh' ? [`(${x} + -1)`, 2 ** -10] : [a, 2 ** -5], top = fn === 'arccosh' ? x : a;
    decls.push([`${P}-d`, fn === 'arcsinh' ? `(${x} * 0 + 1)` : fn === 'arctanh' ? `(${x} * 0 + 1) * ${lt(a, 1)}` : `(${x} * 0 + 1) * (1 - ${lt(x, 1)})`],
      [`${P}-sm`, lt(edge[0], edge[1])], [`${P}-big`, lt(2 ** 26, top)], [`${P}-ty`, lt(a, 2 ** -27)]);
    const sm = `var(${P}-sm)`, big = `var(${P}-big)`, pick = (g, u, v) => `(${sel(g, u)} + ${sel(`(1 - ${g})`, v)})`;
    // near the zero
    let S, Bs;
    if (fn === 'arccosh') { const t = store('t', `clamp(0, ${x} + -1, ${2 ** -10})`), [rh, rl] = sqrtPair(K, 'q', mul('2', t), '0'), TW = PAIROF(1, 12), [gh, ge] = twoProd('g', t, num(TW[0])), [g1, g2] = fast('h', gh, add(ge, mul(t, num(TW[1]))));
      const rest = mul(mul(t, t), [3 / 160, -5 / 896, 35 / 18432, -63 / 90112].reduceRight((acc, q) => add(num(q), mul(t, acc)), num(231 / 851968))), G1 = store('g1', g1), [f1, f2] = twoSum('f', '1', `(-1 * ${G1})`);
      const [fh, fl] = fast('e', f1, add(f2, add(`(-1 * ${store('g2', g2)})`, mac('rest', rest)))); const Y = ddMul('y', [store('rh', rh), store('rl', rl)], [store('fh', fh), store('fl', fl)]); S = [store('zs', Y[0]), store('zt', Y[1])]; Bs = num(2 ** -73); }
    else { const b = store('b', `min(${a}, ${2 ** -5})`); S = fn === 'arcsinh' ? oddSeries(K, 's', b, PAIROF(-1, 6), [3 / 40, -5 / 112, 35 / 1152, -63 / 2816, 231 / 13312, -143 / 10240]) : oddSeries(K, 's', b, PAIROF(1, 3), [1 / 5, 1 / 7, 1 / 9, 1 / 11, 1 / 13, 1 / 15, 1 / 17]); Bs = num(2 ** -71); }
    // elsewhere: w, then its ln
    let w;
    if (fn === 'arctanh') { const m = mac('m', `clamp(${2 ** -5}, ${a}, ${1 - 2 ** -53})`), [nh, nl] = twoSum('n', '1', m), [dh, dl] = twoSum('o', '1', `(-1 * ${m})`);
      const DH = store('dh', dh), DL = store('dl', dl), NH = store('nh', nh), NL = store('nl', nl), q0 = mac('q0', `(${NH} / ${DH})`), [mm, me] = twoProd('w', q0, DH);
      w = fast('v', q0, store('wq', `(${add(sub(sub(NH, mm), me), sub(NL, mul(q0, DL)))} / ${DH})`)); }
    else { const m = mac('m', fn === 'arcsinh' ? `clamp(${2 ** -5}, ${a}, ${2 ** 26})` : `clamp(${1 + 2 ** -10}, ${x}, ${2 ** 26})`), [p, e] = twoProd('p', m, m), [s1, s2] = twoSum('c', p, fn === 'arcsinh' ? '1' : '-1');
      const [qh, ql] = fast('k', s1, add(s2, e)), [rh, rl] = sqrtPair(K, 'r', store('qh', qh), store('ql', ql)), [wh, we] = twoSum('u', m, store('sh', rh)), w0 = fast('v', wh, add(we, store('sl', rl)));
      const g = mac('g', `max(${top}, ${2 ** 26})`), gl = `(${fn === 'arcsinh' ? 1 : -1} / ${mul('4', g)})`; w = [pick(big, g, w0[0]), pick(big, gl, w0[1])]; }
    const ln = lnFar(K, store('wh', w[0]), store('wl', w[1]));
    let L = ln.pair;
    if (fn === 'arctanh') L = [mul(L[0], '0.5'), mul(L[1], '0.5')];
    else L = ddAdd('t2', [store('mh', L[0]), store('ml', L[1])], LN2PAIR.map((v) => `(${big} * ${num(v)})`));
    const LH = store('lh', L[0]), LL = store('ll', L[1]), sgn = fn === 'arccosh' ? '1' : sg;
    const B = (az) => `(${sm} * ${Bs} * ${az} + (1 - ${sm}) * (${num(fn === 'arctanh' ? 2 ** -74 : 2 ** -73)} + ${num(2 ** -100)} * ${az}))`;
    return answer(K, x, `(${pick(sm, S[0], LH)} * ${sgn})`, `(${pick(sm, S[1], LL)} * ${sgn})`, B, `var(${P}-d) * (${sm} + (1 - ${sm}) * ${ln.ok})`, fn !== 'arccosh', fn === 'arccosh' ? '0' : `var(${P}-ty)`); };
  // arcsech, arccsch or arccoth of a value the page sets (probes/dcss/ahyp-check.mjs): arccosh, arcsinh and arctanh of 1/x
  // without 1/x's rounding. Past 32, arccsch and arccoth are arcsinh's and arctanh's odd series of t = 1/x as a pair, t's
  // low part added through the derivative (1/√(1 + t²), 1/(1 − t²)); arcsech within 2^-11 of 1 is arccosh's series in
  // t = (1 − x)/x as a pair; elsewhere ln of an exact pair, (1 + √(1 ± x²))/x or (x + 1)/(x − 1) halved, and below 2^-26
  // ln 2 − ln x ± x²/4. The halfway test leaves what liveAhyp's does. No answer for x unset, arcsech outside (0, 1], arccoth
  // inside [−1, 1], |x| below 2^-1022, or arccsch and arccoth past 2^996 (TwoProduct's split of x)
  const liveRahyp = (xe, fn) => { const K = kit(), { P, mac, store, add, sub, mul, num, twoSum, fast, twoProd, ddMul, ddAdd } = K;
    const x = mac('x', xe), a = mac('a', `abs(${x})`), lt = (u, v) => `sign(max(0, ${v} + (-1 * ${u})))`, pick = (g, u, v) => `(${sel(g, u)} + ${sel(`(1 - ${g})`, v)})`;
    const top = fn === 'arcsech' ? x : a;
    decls.push([`${P}-d`, `(${x} * 0 + 1) * (1 - ${lt(top, 2 ** -1022)})${fn === 'arcsech' ? ` * (1 - ${lt(1, x)})` : ` * (1 - ${lt(2 ** 996, a)})`}${fn === 'arccoth' ? ` * ${lt(1, a)}` : ''}`],
      [`${P}-sm`, fn === 'arcsech' ? `(1 - ${lt(x, num(1 - 2 ** -11))})` : lt(32, a)]);
    let S, Bs;
    if (fn === 'arcsech') { // arccosh's series in t = (1 − x)/x
      const xc = mac('xc', `clamp(${1 - 2 ** -11}, ${x}, 1)`), n = mac('n1', `(1 + (-1 * ${xc}))`), t0 = mac('t0', `(${n} / ${xc})`), [tp, tpe] = twoProd('tp', t0, xc);
      const [th0, tl0] = fast('tf', t0, `(${sub(sub(n, tp), tpe)} / ${xc})`), TH = store('th', th0), TL = store('tl', tl0), TW = PAIROF(1, 12);
      const [rh, rl] = sqrtPair(K, 'q', mul('2', TH), mul('2', TL)), [gh, ge] = twoProd('g', TH, num(TW[0])), [g1, g2] = fast('h', gh, add(ge, add(mul(TH, num(TW[1])), mul(TL, num(TW[0])))));
      const rest = mul(mul(TH, TH), [3 / 160, -5 / 896, 35 / 18432, -63 / 90112].reduceRight((acc, q) => add(num(q), mul(TH, acc)), num(231 / 851968))), G1 = store('g1', g1), [f1, f2] = twoSum('f', '1', `(-1 * ${G1})`);
      const [fh, fl] = fast('e', f1, add(f2, add(`(-1 * ${store('g2', g2)})`, mac('rest', rest)))), Y = ddMul('y', [store('rh', rh), store('rl', rl)], [store('fh', fh), store('fl', fl)]);
      S = [store('zs', Y[0]), store('zt', Y[1])]; Bs = num(2 ** -73); }
    else { // the odd series of t = 1/x past 32
      const a1 = mac('a1', `clamp(32, ${a}, ${2 ** 996})`), q0 = mac('q0', `(1 / ${a1})`), [p, pe] = twoProd('i', a1, q0), [qh, ql] = fast('j', q0, mul(q0, sub(sub('1', p), pe)));
      const b = store('b', `min(${qh}, ${2 ** -5})`), QL = store('tq', ql), S0 = fn === 'arccsch' ? oddSeries(K, 's', b, PAIROF(-1, 6), [3 / 40, -5 / 112, 35 / 1152, -63 / 2816, 231 / 13312, -143 / 10240])
        : oddSeries(K, 's', b, PAIROF(1, 3), [1 / 5, 1 / 7, 1 / 9, 1 / 11, 1 / 13, 1 / 15, 1 / 17]);
      const Sf = fast('sf', S0[0], add(S0[1], fn === 'arccsch' ? `(${QL} / sqrt(1 + ${b} * ${b}))` : `(${QL} / (1 + (-1 * ${b} * ${b})))`)); S = [store('zs', Sf[0]), store('zt', Sf[1])]; Bs = num(2 ** -71); }
    // elsewhere: w, then its ln
    let W, tiny = '0', xs = '0';
    if (fn === 'arccoth') { const m = mac('m', `clamp(${1 + 2 ** -52}, ${a}, 32)`), [nh, nl] = twoSum('n', m, '1'), [dh, dl] = twoSum('o', m, '-1');
      const DH = store('dh', dh), DL = store('dl', dl), NH = store('nh', nh), NL = store('nl', nl), w0 = mac('w0', `(${NH} / ${DH})`), [mm, me] = twoProd('w', w0, DH);
      W = fast('v', w0, store('wq', `(${add(sub(sub(NH, mm), me), sub(NL, mul(w0, DL)))} / ${DH})`)); }
    else { decls.push([`${P}-ty`, lt(top, 2 ** -26)]); tiny = `var(${P}-ty)`; xs = mac('xs', `clamp(${2 ** -1022}, ${top}, ${2 ** -26})`);
      const m = mac('m', fn === 'arcsech' ? `clamp(${2 ** -26}, ${x}, ${1 - 2 ** -11})` : `clamp(${2 ** -26}, ${a}, 32)`), [p, e] = twoProd('p', m, m), [s1, s2] = twoSum('c', '1', fn === 'arccsch' ? p : `(-1 * ${p})`);
      const [qh, ql] = fast('k', s1, fn === 'arccsch' ? add(s2, e) : sub(s2, e)), [rh, rl] = sqrtPair(K, 'r', store('qh', qh), store('ql', ql)), [nh, ne] = twoSum('u', '1', store('sh', rh)), [nh1, nl1] = fast('nn', nh, add(ne, store('sl', rl)));
      const NH = store('nh', nh1), NL = store('nl', nl1), w0 = mac('w0', `(${NH} / ${m})`), [mm, me] = twoProd('w', w0, m), wm = fast('v', w0, store('wq', `(${add(sub(sub(NH, mm), me), NL)} / ${m})`));
      W = [pick(tiny, xs, wm[0]), pick(tiny, '0', wm[1])]; }
    const ln = lnFar(K, store('wh', W[0]), store('wl', W[1]));
    let L = ln.pair;
    if (fn === 'arccoth') L = [mul(L[0], '0.5'), mul(L[1], '0.5')];
    else { const MH = store('mh', L[0]), ML = store('ml', L[1]), T2 = ddAdd('t2', LN2PAIR.map(num), [`(-1 * ${MH})`, `(-1 * ${ML})`]), Tf = fast('tg', T2[0], add(T2[1], `(${fn === 'arccsch' ? 1 : -1} * ${xs} * ${xs} * 0.25)`));
      L = [pick(tiny, Tf[0], MH), pick(tiny, Tf[1], ML)]; }
    const LH = store('lh', L[0]), LL = store('ll', L[1]), sm = `var(${P}-sm)`, sgn = fn === 'arcsech' ? '1' : `(1 - 2 * sign(max(0, -1 * ${x})))`;
    const B = (az) => `(${sm} * ${Bs} * ${az} + (1 - ${sm}) * (${num(fn === 'arccoth' ? 2 ** -74 : 2 ** -73)} + ${num(2 ** -100)} * ${az}))`;
    return answer(K, x, `(${pick(sm, S[0], LH)} * ${sgn})`, `(${pick(sm, S[1], LL)} * ${sgn})`, B, `var(${P}-d) * (${sm} + (1 - ${sm}) * ${ln.ok})`, false); };
  // gcd or lcm of values the page sets (probes/dcss/gcd-check.mjs): Euclid's algorithm unrolled, r(k + 1) = rem(r(k − 1),
  // r(k)), 80 steps, past the 79 that two consecutive Fibonacci numbers below 2^53 take; the gcd is the last r before a 0.
  // CSS's rem() is exact on whole numbers to 2^53 (3,005 of 3,005 pairs in Chrome and WebKit, 2026-10-30); each r is
  // carried in three registered integers of 18 bits, so no step's text grows. lcm is a / gcd · b, rounded once as the
  // build's BigInt is, and between more than two arguments a whole number within 2^53 at each step. Arguments are |x|. No
  // answer for a value that is not a whole number within ±2^53, or a last r not 0
  const liveGcd = (xes, op) => { const { P, mac } = kit(), W = 2 ** 18, STEPS = 80, MAX = 2 ** 53 - 1, oks = [];
    let n = 0; const put = (v) => { const q = `${P}-r${n++}`, m = mac(`v${n}`, v);
      for (const j of [0, 1, 2]) decls.push([`${q}${j}`, `calc(round(down, ${m} / ${W ** (2 - j)}, 1) - round(down, ${m} / ${W ** (3 - j)}, 1) * ${W})`]);
      return `((var(${q}0) * ${W} + var(${q}1)) * ${W} + var(${q}2))`; };
    const whole = (x) => `(1 - abs(sign(rem(${x}, 1)))) * (1 - sign(max(0, abs(${x}) + ${-MAX})))`;
    const gcd2 = (A, B) => { const r = [A, B]; for (let k = 1; k < STEPS; k++) r.push(put(`rem(${r[k - 1]}, max(${r[k]}, 1)) * sign(${r[k]})`));
      oks.push(`(1 - sign(${r.at(-1)}))`); return put(r.slice(1).map((rk, k) => `${r[k]} * (1 - sign(${rk}))`).join(' + ')); };
    let acc = put(`abs(${xes[0]})`);
    xes.forEach((x, i) => { oks.push(whole(x)); if (!i) return; const b = put(`abs(${x})`), g = gcd2(acc, b);
      if (op === 'gcd') { acc = g; return; }
      const l = `(${divide(acc, `max(${g}, 1)`)} * ${b})`; if (i === xes.length - 1) { acc = l; return; }
      oks.push(`(1 - sign(max(0, ${l} + ${-MAX})))`); acc = put(l); });
    decls.push([`${P}-ok`, oks.join(' * ')]);
    return `(${acc} * (1 + 0 / var(${P}-ok)))`; };
  // n! of a value the page sets: picked from FACTK by round(n), an answer only for a whole n from 0 to 170
  const liveFactorial = (ne) => { const { P, mac, pickers } = kit(), n = mac('n', ne);
    decls.push([`${P}-n`, `round(${n}, 1)`], [`${P}-ok`, `(1 - abs(sign(${n} + (-1 * var(${P}-n))))) * (1 - sign(max(0, -1 * ${n}))) * (1 - sign(max(0, ${n} + -170)))`]);
    return `(${pickers('I', `var(${P}-n)`, 0, 170)('f', FACTK)} * (1 + 0 / var(${P}-ok)))`; };
  const liveBinomial = (ne, ke) => { const { P, mac, pickers } = kit(), n = mac('n', ne), k = mac('k', ke);
    decls.push([`${P}-n`, `round(${n}, 1)`], [`${P}-k`, `round(${k}, 1)`], [`${P}-m`, `var(${P}-n) + (-1 * var(${P}-k))`]);
    // each table read at its index held to 0..170, so that no read is 0 and the quotient stays finite where k is past n
    const f = (v, tag) => pickers(tag, `clamp(0, var(${P}-${v}), 170)`, 0, 170)(`f${tag}`, FACTK), q = mac('q', `round(${f('n', 'A')} / (${f('k', 'B')} * ${f('m', 'C')}), 1)`);
    const whole = (v, w) => `(1 - abs(sign(${v} + (-1 * var(${P}-${w})))))`, ge = (a, b) => `(1 - sign(max(0, ${b} + (-1 * ${a}))))`;
    // k past n or below 0 gives 0; otherwise an answer for whole n, k with n ≤ 170 and C(n, k) below 2^50
    const inside = `${ge(`var(${P}-k)`, 0)} * ${ge(`var(${P}-m)`, 0)}`;
    decls.push([`${P}-in`, inside], [`${P}-ok`, `${whole(n, 'n')} * ${whole(k, 'k')} * ${ge(`var(${P}-n)`, 0)} * (1 - ${inside} + ${inside} * ${ge(170, `var(${P}-n)`)} * ${ge(2 ** 50, q)})`]);
    return `(${q} * var(${P}-in) * (1 + 0 / var(${P}-ok)))`; };
  // mean, min, max or median of a series with slots the page sets, d3's way: each slot its value and p, 1 where present
  // (a written slot 1, a missing one 0, one the page sets its scope's flag), and no answer while a present slot is past
  // 3.4e38 or none is present. The mean adds p · v from 0 in order, divided by the count; min and max are CSS's over the
  // present values (a missing one held at ∓2^1023), with d3's sign of a zero: its first present zero's (CSS's min(0, -0) is
  // -0 wherever it stands); the median ranks the present slots (one before another when smaller, or equal and earlier),
  // picks ranks i0 = floor((c − 1) / 2) and i0 + 1 for the count c, and gives v0 + (v1 − v0) · 0.5 or · 0 (d3's
  // quantile), the one value itself when c is 1
  const series = (node) => {
    // d3's quantile at a p the page sets, as quantile.js: its min at p <= 0 (the value ranked 0, the first least in source
    // order, its sign of zero kept), its max at p >= 1 from the max's own steps (ranked last is the last greatest, and
    // d3.max keeps the first: max(-0, 0) is -0), else the interpolation; relations' fenced tests pick; a NaN p, no answer
    if (node.pLive) { const { mac } = kit(), p = mac('p', arg(node.pLive)), lo = HOLDS.leq(p, '0'), hi = HOLDS.geq(p, '1');
      const q = series({ ...node, pLive: undefined, p: `clamp(0, ${p}, 1)`, atMin: lo }), max = series({ ...node, op: 'max', pLive: undefined });
      return `(${sel(hi, max)} + ${sel(`(1 - ${hi})`, q)})`; }
    const K = kit(), { P, mac } = K, q = node.series, op = node.op;
    const sl = q.slots.map((x, i) => (x.kind === 'live' ? { v: mac(`v${i}`, join(x.store)), p: `var(${x.store}-p)`, bad: `(var(${x.store}-p) - var(${x.store}-g))`, z: `var(${x.store}-z)` }
      : x.kind === 'literal' ? { v: Object.is(x.x, -0) ? '(-1 * 0)' : String(x.x), p: '1', z: Object.is(x.x, -0) ? '1' : '0' } : { v: '0', p: '0', z: '0' }));
    const bads = sl.map((x) => x.bad).filter(Boolean);
    decls.push([`${P}-n`, sl.map((x) => x.p).join(' + ')], [`${P}-ok`, `${['sum', 'maxIndex', 'minIndex'].includes(op) ? '' : 'sign(var(' + P + '-n)) * '}(1 - min(1, ${bads.join(' + ') || '0'}))`]);
    const n = `var(${P}-n)`, guard = (x) => `(${x} * (1 + 0 / var(${P}-ok)))`;
    const total = () => chain('+', ['0', ...sl.filter((x) => x.p !== '0').map((x) => (x.p === '1' ? x.v : `(${x.p} * ${x.v})`))]);
    if (op === 'count') return n; // d3.count: every present value, past 3.4e38 or infinite too
    // the total in a macro: the answer's split reads it five times
    if (op === 'sum') return guard(F(mac('t', total()))); // d3.sum: 0 with none present
    if (op === 'mean') return guard(divide(mac('t', total()), n));
    // d3.variance: each present value, in order, moves the running mean by delta / count and adds delta · (value - mean) to
    // the sum, every operation IEEE's and fenced; a missing slot leaves both as they were (its step adds -0). Then sum /
    // (count - 1), none under two present values; d3.deviation is its square root (CSS's sqrt() is Math.sqrt's). Neither
    // the mean nor the sum is ever -0 (both start at 0, and 0 + -0 is 0), so the split's -0 flag of 0 loses nothing
    // In a scope, a series' steps are named by the scope and the series, so its variance and its deviation (or the same
    // one twice) share them: the first formula on the scope's element writes them, later ones read its last sum
    if (op === 'variance' || op === 'deviation') { let mean = '0', sum = '0', count = '0';
      const key = CX.scope ? `${CX.scope}-${q.name}` : null, W = key && `--dcss-w${key}`, last = sl.findLastIndex((x) => x.p !== '0');
      if (key) CX.welfordNow.add(key);
      if (key && CX.welford.has(key)) sum = last < 0 ? '0' : join(`${W}-s${last}`);
      else { const S = W ? kit(W) : K; sl.forEach((x, i) => { if (x.p === '0') return; count = x.p === '1' ? (count === '0' ? '1' : `${count} + 1`) : (count === '0' ? x.p : `${count} + ${x.p}`);
        const c = S.mac(`c${i}`, count); count = c; const d = S.mac(`d${i}`, F(`${x.v} + (-1 * ${mean})`)), step = (e) => (x.p === '1' ? e : sel(x.p, e));
        // each step's mean and sum stored through the split: as macros, each would hold the last one's text twice
        mean = S.store(`m${i}`, F(`${mean} + ${step(divide(d, x.p === '1' ? c : `max(${c}, 1)`))}`));
        sum = S.store(`s${i}`, F(`${sum} + ${step(F(`${d} * ${F(`${x.v} + (-1 * ${mean})`)}`))}`)); }); }
      const v = `(${divide(sum, `(${n} - 1)`)} * (1 + 0 / sign(max(0, ${n} - 1))))`;
      return guard(op === 'variance' ? v : `sqrt(${v})`); }
    // d3.mode: each present slot's count of present slots equal to it (±0 equal), registered integers; the first slot whose
    // count is the most holds the value that reached it first; + 0 makes its zero +0, as a Map's key is
    if (op === 'mode') {
      sl.forEach((x, i) => { if (x.p === '0') return decls.push([`${P}-k${i}`, '0']);
        const terms = sl.map((y, j) => { if (j === i || y.p === '0') return null; f.compares++; const c = `(1 - abs(sign(${x.v} - ${y.v})))`; return y.p === '1' ? c : `${y.p} * ${c}`; }).filter(Boolean);
        decls.push([`${P}-k${i}`, `${x.p === '1' ? '' : `${x.p} * `}(1${terms.map((t) => ` + ${t}`).join('')})`]); });
      decls.push([`${P}-top`, `max(${sl.map((_, i) => `var(${P}-k${i})`).join(', ') || '0'})`]);
      // w: 1 at the first slot whose count is the most; h: 1 while none before has been
      let before = '1'; const terms = sl.map((x, i) => { if (x.p === '0') return null;
        decls.push([`${P}-w${i}`, `${before} * (1 - abs(sign(var(${P}-k${i}) - var(${P}-top))))`], [`${P}-h${i}`, `${before} - var(${P}-w${i})`]); before = `var(${P}-h${i})`; return sel(`var(${P}-w${i})`, x.v); }).filter(Boolean);
      // every term but one -0, so the sum is that one in any order: flat, as the median's pick
      return guard(F(`${mac('m', terms.join(' + ') || '0')} + 0`)); }
    // d3.maxIndex and minIndex: the first present slot equal to the series' max (min), from 0; -1 with none present
    if (op === 'maxIndex' || op === 'minIndex') { const far = op === 'minIndex' ? 'pow(2, 1023)' : '(-1 * pow(2, 1023))';
      const mm = mac('m', `${op === 'minIndex' ? 'min' : 'max'}(${sl.map((x) => (x.p === '1' ? x.v : x.p === '0' ? far : `(${sel(x.p, x.v)} + ${sel(`(1 - ${x.p})`, far)})`)).join(', ')})`);
      // w: 1 at the first present slot equal to it; h: 1 while none before has been
      let before = '1'; const terms = sl.map((x, i) => { if (x.p === '0') return null;
        decls.push([`${P}-w${i}`, `${before} * ${x.p === '1' ? '' : `${x.p} * `}(1 - abs(sign(${x.v} - ${mm})))`], [`${P}-h${i}`, `${before} - var(${P}-w${i})`]); before = `var(${P}-h${i})`; return `${i} * var(${P}-w${i})`; }).filter(Boolean);
      return guard(`(${terms.join(' + ') || '0'} - (1 - sign(${n})))`); }
    if (op === 'min' || op === 'max') { const far = op === 'min' ? 'pow(2, 1023)' : '(-1 * pow(2, 1023))';
      const m = mac('m', `${op}(${sl.map((x) => (x.p === '1' ? x.v : x.p === '0' ? far : `(${sel(x.p, x.v)} + ${sel(`(1 - ${x.p})`, far)})`)).join(', ')})`);
      // the first present zero's sign of zero, where the answer is 0
      let before = '1'; const first = sl.map((x, i) => { const zero = x.p === '0' ? '0' : `${x.p === '1' ? '' : `${x.p} * `}(1 - abs(sign(${x.v})))`, f = `${before} * ${zero}`;
        decls.push([`${P}-r${i}`, `${before} * (1 - ${zero})`]); before = `var(${P}-r${i})`; return `${f} * ${x.z}`; });
      decls.push([`${P}-z`, first.join(' + ') || '0']);
      const isZero = `(1 - abs(sign(${m})))`;
      return guard(F(`${sel(`(1 - ${isZero})`, m)} + ${sel(isZero, `(0 * (1 - 2 * var(${P}-z)))`)}`)); }
    // the median: ranks among the present slots, registered integers
    sl.forEach((x, i) => { const terms = sl.map((y, j) => { if (j === i || y.p === '0') return null; f.compares++;
        const c = j < i ? `(1 - sign(max(0, ${y.v} - ${x.v})))` : `sign(max(0, ${x.v} - ${y.v}))`; return y.p === '1' ? c : `${y.p} * ${c}`; }).filter(Boolean);
      decls.push([`${P}-k${i}`, terms.join(' + ') || '0']); });
    // d3's quantile at p from 0 to 1, exclusive: i = (n − 1) · p and its floor i0, IEEE's product as JavaScript's; the
    // median is p = 0.5, its fraction 0.5 or 0
    const at = op === 'quantile' ? mac('i', F(`(${n} - 1) * ${node.p}`)) : null;
    decls.push([`${P}-i0`, at ? `round(down, ${at}, 1)` : `round(down, (${n} - 1) / 2, 1)`]);
    const pick = (t) => `(${sl.map((x, i) => (x.p === '0' ? null : sel(`${x.p === '1' ? '' : `${x.p} * `}(1 - abs(sign(var(${P}-k${i}) - ${t})))`, x.v))).filter(Boolean).join(' + ') || '0'})`;
    const v0 = mac('m0', pick(`var(${P}-i0)`)), v1 = mac('m1', pick(`(var(${P}-i0) + 1)`)), half = at ? F(`${at} + (-1 * var(${P}-i0))`) : `(1 - rem(${n}, 2)) * 0.5`, one = node.atMin ? `max(${node.atMin}, 1 - abs(sign(${n} - 1)))` : `(1 - abs(sign(${n} - 1)))`;
    return guard(F(`${sel(one, v0)} + ${sel(`(1 - ${one})`, F(`${F(v0)} + ${F(`${F(`${v1} + (-1 * ${v0})`)} * ${half}`)}`))}`)); };
  const build = (node) => {
    if (node.call === 'series') return series(node);
    if (node.call === 'binomial') return liveBinomial(arg(node.items[0]), arg(node.items[1]));
    if (node.call === 'factorial') return liveFactorial(arg(node.items[0]));
    if (node.call === 'exp') return liveExp(arg(node.items.at(-1)));
    if (node.call === 'log') return liveLog(arg(node.items[0]), node.base);
    if (node.call === 'trig') return liveTrig(arg(node.items[0]), node.op);
    if (node.call === 'atan' || node.call === 'acot') return liveAtan(arg(node.items[0]), node.op);
    if (node.call === 'tan') return liveTan(arg(node.items[0]), node.op);
    if (node.call === 'asin') return liveAsin(arg(node.items[0]), node.op);
    if (node.call === 'asec') return liveAsec(arg(node.items[0]), node.op);
    if (node.call === 'nroot') return liveRoot(arg(node.items[0]), node.degree);
    if (node.call === 'hyp' || node.call === 'rhyp') return liveHyp(arg(node.items[0]), node.op);
    if (node.call === 'ahyp') return liveAhyp(arg(node.items[0]), node.op);
    if (node.call === 'rahyp') return liveRahyp(arg(node.items[0]), node.op);
    if (node.call === 'gcd' || node.call === 'lcm') return liveGcd(node.items.map(arg), node.call);
    if (node.call === 'eset') return expr({ call: 'piecewise', conds: [{ set: ['e'] }], otherwise: true, items: [{ node: { call: 'power', items: node.items } }, { node: { call: 'exp', items: node.items.slice(1) } }] });
    if (node.call === 'fixed' && node.unless) { // as a piecewise: the live power where --e is set, no answer where another is
      const others = node.unless.filter((n) => !(node.live && n === 'e')), conds = [...(node.live ? [{ set: ['e'] }] : []), ...(others.length ? [{ set: others }] : [])];
      return expr({ call: 'piecewise', conds, otherwise: true, items: [...(node.live ? [{ node: node.live }] : []), ...(others.length ? [{ x: NaN }] : []), { x: node.value }] }); }
    // a value the build computed, written in; from 3.4e38 up as m · 2^e (Chrome reads such a number token as 3.4e38, a
    // product of two smaller ones keeps the double: facts/number-token-float-max.mjs)
    if (node.call === 'fixed') { const v = node.value; if (Number.isNaN(v)) return 'NaN'; if (Object.is(v, -0)) return '(-1 * 0)'; if (Math.abs(v) < FMAX) return String(v);
      const e = Number(BigInt(bitsOf(v).mant.toString(2).length) - 1n + bitsOf(v).e); return `(${v / 2 ** e} * pow(2, ${e}))`; }
    if (node.live) { // a sum or product to a bound the page sets (indexed): each term to the ceiling in four registered
      // integers with its finiteness, and whether it counts (i <= the bound, as an integer: an unset var() voids only its
      // own term); a term not counted adds 0 (a product's is to the power 0), even where the page sets none of its names
      const kept = [...names]; names.clear(); const k = ++id, xs = node.items.map(arg); names.clear(); kept.forEach((n) => names.add(n));
      const P = `--dcss-dcss-u${k}`, hi = expr(node.live);
      xs.forEach((x, j) => { const q = `${P}-v${j}`, c = `clamp(-1 * (pow(2, 1023) * (2 - pow(2, -52))), ${x}, (pow(2, 1023) * (2 - pow(2, -52))))`; for (const z of 'eabcz') decls.push([`${q}-${z}`, SPLIT[z](q, c)]);
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
        if (c.parts) { const ps = c.parts.map(cond); return { t: LOGICCSS[c.op](ps.map((q) => q.t)), sides: ps.flatMap((q) => q.sides) }; }
        if (c.divides) return dividesCss(c.items.map((x) => expr(asNode(x))));
        if (c.of) return memberCss(c, c.items.map((x) => (x.inf ? null : expr(asNode(x)))));
        const ss = c.items.map((x) => expr(asNode(x))), hs = ss.slice(1).map((b, i) => CHECK[c.op](ss[i], b));
        return { t: hs.length === 1 ? hs[0] : `min(${hs.join(', ')})`, sides: ss }; };
      node.conds.forEach((c, j) => { const { t, sides } = cond(c); decls.push([`${P}-t${j}`, t], [`${P}-cf${j}`, `${sides.map((x) => `${x} * 0`).join(' + ')} + 1`]); });
      xs.forEach((x, j) => { const q = `${P}-v${j}`, c = `clamp(-1 * (pow(2, 1023) * (2 - pow(2, -52))), ${x}, (pow(2, 1023) * (2 - pow(2, -52))))`; for (const z of 'eabcz') decls.push([`${q}-${z}`, SPLIT[z](q, c)]); decls.push([`${P}-vf${j}`, `${x} * 0 + 1`]); });
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
    // d3.min and d3.max keep the first of equal values, so of zeros the first one's sign; CSS's min(0, -0) is -0 wherever
    // it stands. Where the answer is 0, the first zero argument's sign of zero is put back
    if ((node.call === 'min' || node.call === 'max') && xs.length > 1) {
      // the flags in registered steps, each in its own form of division (a macro would carry both forms' text, and in
      // Chrome a length's division under a mean made it 1 ulp off), the arguments written in
      const { P } = kit(), m = `${node.call}(${xs.join(', ')})`, zero = (x) => `(1 - abs(sign(${x})))`;
      let before = '1'; const first = xs.map((x, i) => { const f = `${before} * ${zero(x)} * max(0, -1 * sign(1 / ${x}))`;
        decls.push([`${P}-r${i}`, `${before} * (1 - ${zero(x)})`]); before = `var(${P}-r${i})`; return f; });
      decls.push([`${P}-z`, first.join(' + ')], [`${P}-mz`, zero(m)]);
      return F(`${sel(`(1 - var(${P}-mz))`, m)} + ${sel(`var(${P}-mz)`, `(0 * (1 - 2 * var(${P}-z)))`)}`); } // fenced: a bare sum regroups
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
  ints: plain.decls.map(([k]) => k).filter((k) => !k.startsWith('--dcss-dcss-y')), compares: plain.compares }); // the y's are macros, unregistered
const emit = (root) => both(form(root, DIVIDE.plain), form(root, DIVIDE.length));
// inequalities: each pair's truth as JavaScript's operator gives it on the two doubles (the sign of a fenced difference,
// exact for finite doubles), the chain's the least of them; --dcss-dcss-fin is 0 when a side is NaN or infinite or
// a name is unset, and then nothing prints
// a condition's relations, the same tests and = and ≠ besides (JavaScript's === and !== on finite doubles)
const CHECK = { get lt() { return HOLDS.lt; }, get leq() { return HOLDS.leq; }, get gt() { return HOLDS.gt; }, get geq() { return HOLDS.geq; },
  eq: (a, b) => `(1 - abs(sign(${F(`${a} - ${b}`)})))`, neq: (a, b) => `abs(sign(${F(`${a} - ${b}`)}))` };
const HOLDS = { lt: (a, b) => `max(0, sign(${F(`${b} - ${a}`)}))`, gt: (a, b) => `max(0, sign(${F(`${a} - ${b}`)}))`,
  leq: (a, b) => `(1 - max(0, sign(${F(`${a} - ${b}`)})))`, geq: (a, b) => `(1 - max(0, sign(${F(`${b} - ${a}`)})))` };
// x ∈ a set as 0 or 1, from its items' CSS (null for an infinite end, which bounds nothing), and the sides whose
// finiteness it needs: ℤ as rem(x, 1) = 0 (exact for every double), ℕ that and x ≥ 0 (−0 in it, as JavaScript's
// -0 >= 0), ℝ any finite x; an interval its two relations
const memberCss = (c, [x, lo, hi]) => { const [a, b] = CLOSURE[c.closure] ?? [], whole = `(1 - abs(sign(rem(${x}, 1))))`;
  const t = c.of === 'Z' ? whole : c.of === 'N' ? `${whole} * (1 - max(0, sign(-1 * ${x})))` : c.of === 'R' ? '1'
    : `min(${lo === null ? '1' : CHECK[a](lo, x)}, ${hi === null ? '1' : CHECK[b](x, hi)})`;
  return { t: c.op === 'notin' ? `(1 - ${t})` : t, sides: [x, lo, hi].filter((v) => v != null) }; };
// a ∣ b as 0 or 1: b = 0 where a is 0, else rem(b, a) = 0 (CSS's rem() is exact on whole numbers below 2^53); a side
// that is infinite where a or b isn't a whole number within ±2^53, so there is no answer
const dividesCss = ([a, b]) => { const z = (x) => `(1 - abs(sign(${x})))`, whole = (x) => `(1 - abs(sign(rem(${x}, 1)))) * (1 - sign(max(0, abs(${x}) - ${2 ** 53 - 1})))`;
  return { t: `(${z(a)} * ${z(b)} + (1 - ${z(a)}) * ${z(`rem(${b}, ${a} + ${z(a)})`)})`, sides: [a, b, `(1 / (${whole(a)} * ${whole(b)}))`] }; };
function truthForm(c, divide) {
  const f = former(divide), all = [];
  const truth = (q) => { if (q.parts) return LOGICCSS[q.op](q.parts.map(truth));
    if (q.divides) { const { t, sides } = dividesCss(q.items.map((x) => f.expr(asNode(x)))); all.push(...sides); return t; }
    if (q.of) { const { t, sides } = memberCss(q, q.items.map((x) => (x.inf ? null : f.expr(asNode(x))))); all.push(...sides); return t; }
    const ss = q.items.map((x) => f.expr(asNode(x))), hs = ss.slice(1).map((b, i) => CHECK[q.op](ss[i], b)); all.push(...ss); return hs.length === 1 ? hs[0] : `min(${hs.join(', ')})`; };
  const t = truth(c), fin = `calc(${all.map((a) => `${a} * 0`).join(' + ')} + 1)`;
  if (f.names.size) f.decls.push(okDecl(f.names));
  f.decls.push(['--dcss-dcss-fin', fin], ['--dcss-dcss-t', t]);
  return { value: f.names.size ? 'var(--dcss-dcss-ok)' : '1', decls: f.decls, compares: f.compares };
}
const emitTruth = (c) => both(truthForm(c, DIVIDE.plain), truthForm(c, DIVIDE.length));

// --- what the page gets
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const FORMAT_SETTINGS = /^--(precision|comma|symbol|sign|trim|type|currency|locale|base|grouping|zero|fill|align|width|percent)$/;
const splitStyle = (s) => (s ?? '').split(';').map((d) => d.trim()).filter(Boolean).map((d) => { const k = d.indexOf(':'); return [d.slice(0, k).trim(), d.slice(k + 1).trim()]; });
// a live carrier's value, printed in it the way an answer prints: the carrier's own formatter, or d3.format(",.6~f"); a
// span, as the cell's own text would be (an <output> is a status region, announced on each change)
function printed(attrs, v) {
  const fmt = (attrs.class ?? '').split(/\s+/).filter((c) => c.startsWith('dcss-format-')), own = splitStyle(attrs.style).filter(([k]) => FORMAT_SETTINGS.test(k));
  return `<span class="${fmt.length ? fmt.join(' ') : 'dcss-format-fixed'}" style="--value: ${v}${fmt.length || own.length ? '' : '; --precision: 6; --trim: 1; --comma: 1'}"></span>`;
}
// an answer known when the page is built, written as text (with its double in <data value>): d3-format's ",.p~f", as
// dcss-format-fixed prints it, where the page writes its settings as numbers; a setting CSS gives, another format, or a
// value format.css prints nothing for (|v| · 10^p from 2^53 up) leaves it to the page's CSS
const d3trim = (s) => { let i0 = -1, i1; out: for (let i = 1; i < s.length; ++i) { switch (s[i]) { case '.': i0 = i1 = i; break; case '0': if (i0 === 0) i0 = i; i1 = i; break; default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break; } } return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s; };
const fixedOf = (classes, decls) => {
  const fmt = classes.filter((c) => c.startsWith('dcss-format-')), set = decls.filter(([k]) => FORMAT_SETTINGS.test(k));
  if (!fmt.length && !set.length) return { precision: 6, trim: 1, comma: 1 }; // the build's own default
  if (fmt.length !== 1 || fmt[0] !== 'dcss-format-fixed') return null;
  const o = { precision: 6, trim: 0, comma: 0 }; // format.css's
  for (const [k, v] of set) { const n = /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN; if (!(k.slice(2) in o) || Number.isNaN(n)) return null; o[k.slice(2)] = n; }
  o.precision = Math.min(20, Math.max(0, Math.round(o.precision)));
  return [0, 1].includes(o.trim) && [0, 1].includes(o.comma) ? o : null;
};
const fixedText = (v, { precision: p, trim, comma }) => {
  if (!Number.isFinite(v) || Math.abs(v) * 10 ** p >= 2 ** 53) return null;
  let t = Math.abs(v).toFixed(p); if (trim) t = d3trim(t);
  const neg = (v < 0 || 1 / v < 0) && +t !== 0, [i, f] = t.split('.');
  return (neg ? '\u2212' : '') + (comma ? i.replace(/\B(?=(\d{3})+$)/g, ',') : i) + (f !== undefined ? `.${f}` : '');
};
const asText = (v, text) => `<data value="${Object.is(v, -0) ? '-0' : String(v)}">${text}</data>`;
function write({ kind, root, value, decls: own, ints, sides }, math, src, inline = false, pAttrs = '', quiet = ' aria-live="off"') {
  const classes = (math.attrs.class ?? '').split(/\s+/).filter(Boolean), fmt = classes.filter((c) => c.startsWith('dcss-format-')), keep = classes.filter((c) => !c.startsWith('dcss-format-'));
  const decls = splitStyle(math.attrs.style), fmtDecls = decls.filter(([k]) => FORMAT_SETTINGS.test(k)), varDecls = decls.filter(([k]) => k.startsWith('--') && !FORMAT_SETTINGS.test(k)), mathDecls = decls.filter(([k]) => !k.startsWith('--'));
  const css = (ds) => ds.map(([k, v]) => `${k}: ${v}`).join('; ');
  // the formula, for readers: d3's calls in function notation, U+2061 after the name; sums, differences and products
  // infix; fractions, powers, roots and bars as MathML draws them; a negative as an operator; parentheses only where a
  // lower operator sits inside a higher one. Each argument is named for its call's intent; the search for a name stops
  // at an element with its own intent (MathML 4, 5.1), so an inner call's names are its own
  const PREC = { plus: 1, minus: 1, isum: 1, iproduct: 1, times: 2, power: 4 }; // the rest stand alone
  const prec = (x) => (x.node?.op === 'id' ? prec(x.node.items[0]) : x.node?.shown ? 4 : x.node ? (x.node.op === 'minus' && x.node.items.length === 1 ? 3 : PREC[x.node.op] ?? 9) : x.neg ? 3 : 9);
  const pres = (node, arg = '') => {
    const { op, items } = node, ids = items.map((_, i) => `$a${i + 1}`).join(',');
    const draw = (x, a = '') => (x.node ? pres(x.node, a) : x.acc ? `<mover${a} accent="true"><mi>${esc(x.acc[0])}</mi><mo>${{ '^': 'ˆ', '~': '˜' }[x.acc[1]] ?? x.acc[1]}</mo></mover>` : x.sub ? `<msub${a}><mi>${esc(x.sub[0])}</mi><${x.sub[2] === 'cn' ? 'mn' : 'mi'}>${esc(x.sub[1])}</${x.sub[2] === 'cn' ? 'mn' : 'mi'}></msub>` : x.ci ? `<mi${a}>${esc(x.ci)}</mi>`
        : !x.neg ? (x.mag.startsWith('<mn>') && x.mag.indexOf('<', 1) === x.mag.indexOf('</mn>') ? `<mn${a}>${x.mag.slice(4)}` : `<mrow${a}>${x.mag}</mrow>`)
        : `<mrow${a}><mo>−</mo>${x.mag}</mrow>`);
    const bare = (x) => (x.node?.op === 'id' ? x.node.items[0] : x), paren = (x, m, need) => (prec(x) < need ? `<mrow><mo>(</mo>${m}<mo>)</mo></mrow>` : m);
    const show = (i, need = 0) => { const x = bare(items[i]); return paren(x, draw(x, ` arg="a${i + 1}"`), need); };
    if (node.shown === 'degrees') return `<msup${arg}>${paren(bare(items[0]), draw(bare(items[0])), 5)}<mo>°</mo></msup>`;
    if (node.shown === 'percent') return `<mrow${arg}>${paren(bare(items[0]), draw(bare(items[0])), 5)}<mo>%</mo></mrow>`;
    if (op === 'isum' || op === 'iproduct') { // the sign with its range under and over it, then the body as written
      const body = bare(node.display);
      return `<mrow${arg}><munderover><mo>${op === 'isum' ? '∑' : '∏'}</mo><mrow><mi>${esc(node.index)}</mi><mo>=</mo>${draw(bare(node.loItem))}</mrow>${draw(bare(node.hiItem))}</munderover>${paren(body, draw(body), 2)}</mrow>`; }
    const infix = (sign, need) => items.map((x, i) => show(i, prec(x) === 3 ? 4 : need(i))).join(`<mo>${esc(sign)}</mo>`);
    if (op === 'eq' || op === 'assign') return `<mrow${arg} intent="${coreName(op)}(${ids})">${items.map((_, i) => show(i)).join(`<mo>${op === 'eq' ? '=' : '≔'}</mo>`)}</mrow>`;
    if (op in RELS) return `<mrow${arg} intent="${coreName(op)}(${ids})">${infix(RELS[op], () => 0)}</mrow>`;
    if (op === 'factorof') return `<mrow${arg} intent="divides(${ids})">${infix('∣', () => 0)}</mrow>`;
    const LOGICSIGN = { and: '∧', or: '∨', xor: '⊻', implies: '⇒', equivalent: '⟺' }, inLogic = (i) => { const x = bare(items[i]); return x.node?.op in LOGIC ? `<mrow><mo>(</mo>${draw(x, ` arg="a${i + 1}"`)}<mo>)</mo></mrow>` : show(i); };
    if (op === 'and' && !arg && !items.some((x) => x.node?.op in LOGIC)) return `<mrow${arg} intent="and(${ids})">${items.map((_, i) => show(i)).join('<mo>,</mo><mspace width="0.5em"/>')}</mrow>`;
    if (op in LOGICSIGN) return `<mrow${arg} intent="${coreName(op)}(${ids})">${items.map((_, i) => inLogic(i)).join(`<mo>${LOGICSIGN[op]}</mo>`)}</mrow>`;
    if (op === 'not') return `<mrow${arg} intent="not(${ids})"><mo>¬</mo>${inLogic(0)}</mrow>`;
    if (op === 'plus') return `<mrow${arg} intent="plus(${ids})">${infix('+', () => 2)}</mrow>`;
    if (op === 'times') return `<mrow${arg} intent="times(${ids})">${infix('×', () => 2)}</mrow>`;
    if (op === 'minus') return items.length === 1 ? `<mrow${arg} intent="minus(${ids})"><mo>−</mo>${show(0, 4)}</mrow>` : `<mrow${arg} intent="minus(${ids})">${infix('−', (i) => (i ? 2 : 1))}</mrow>`;
    if (op === 'divide') return `<mfrac${arg} intent="divided-by(${ids})">${show(0)}${show(1)}</mfrac>`;
    if (op === 'brackets') return `<mrow${arg} intent="$a1"><mo>[</mo>${show(0)}<mo>]</mo></mrow>`;
    if (op === 'neq') return `<mrow${arg} intent="not-equal-to(${ids})">${infix('≠', () => 0)}</mrow>`;
    if (op === 'chain') return `<mrow${arg}>${items.map((_, i) => (i ? `<mo>${esc(CONDS[node.ops[i - 1]])}</mo>` : '') + show(i)).join('')}</mrow>`; // 0 < x ≤ 1, read as written
    if (op in MEMBER) { // x ∈ [a, b) or x ∈ ℤ, the interval and the set with their intents
      const end = (i) => (items[i].inf ? `<mrow arg="a${i + 1}">${items[i].inf < 0 ? '<mo>−</mo>' : ''}<mi>∞</mi></mrow>` : show(i)), c = node.closure;
      const set = node.of === 'interval' ? `<mrow arg="s" intent="${c}-interval($a2,$a3)"><mo>${c.startsWith('open') ? '(' : '['}</mo>${end(1)}<mo>,</mo>${end(2)}<mo>${c.endsWith('open') ? ')' : ']'}</mo></mrow>`
        : `<mi arg="s" intent="${{ Z: 'set-of-integers', N: 'set-of-natural-numbers', R: 'set-of-reals' }[node.of]}">${{ Z: 'ℤ', N: 'ℕ', R: 'ℝ' }[node.of]}</mi>`;
      return `<mrow${arg} intent="${coreName(op)}($a1,$s)">${show(0)}<mo>${MEMBER[op]}</mo>${set}</mrow>`; }
    if (op === 'piecewise') { // a brace, each piece a row, its value and "if" its condition, "otherwise" last
      // a logic in words, a logic inside another in parentheses
      const sp = '<mspace width="0.4em"/>', cond = (c, inner) => { if (c.chain) return pres({ op: 'chain', ...c.chain }); if (!c.parts) return pres({ op: c.op, items: c.items, of: c.of, closure: c.closure });
        const m = c.op === 'not' ? `<mtext>not</mtext>${sp}${cond(c.parts[0], true)}` : c.parts.map((q) => cond(q, true)).join(`${sp}<mtext>${c.op === 'equivalent' ? 'if and only if' : c.op}</mtext>${sp}`);
        return inner ? `<mrow><mo>(</mo>${m}<mo>)</mo></mrow>` : `<mrow>${m}</mrow>`; };
      const rows = node.conds.map((c, i) => `<mtr><mtd>${show(i)}</mtd><mtd><mtext>if</mtext><mspace width="0.4em"/>${cond(c)}</mtd></mtr>`).join('')
        + (node.otherwise ? `<mtr><mtd>${show(items.length - 1)}</mtd><mtd><mtext>otherwise</mtext></mtd></mtr>` : '');
      return `<mrow${arg}><mo>{</mo><mtable>${rows}</mtable></mrow>`; }
    if (op === 'power') return `<msup${arg} intent="power(${ids})">${show(0, 5)}${show(1)}</msup>`;
    if (op === 'root') return node.degree === 2 ? `<msqrt${arg} intent="square-root-of(${ids})">${show(0)}</msqrt>` : `<mroot${arg} intent="root($a1,$a2)">${show(0)}<mn arg="a2">${node.degree}</mn></mroot>`;
    if (op === 'abs' || op === 'floor' || op === 'ceiling') { const [l, r] = { abs: ['|', '|'], floor: ['⌊', '⌋'], ceiling: ['⌈', '⌉'] }[op];
      return `<mrow${arg} intent="${coreName(op)}(${ids})"><mo>${l}</mo>${show(0)}<mo>${r}</mo></mrow>`; }
    if (op === 'binomial') return `<mrow${arg} intent="binomial-coefficient(${ids})"><mo>(</mo><mfrac linethickness="0">${show(0)}${show(1)}</mfrac><mo>)</mo></mrow>`;
    if (op === 'factorial') return `<mrow${arg} intent="factorial(${ids})">${show(0, 9)}<mo>!</mo></mrow>`;
    if (op === 'log' && items.length === 2) return `<mrow${arg} intent="logarithm(${ids})"><msub><mi>log</mi>${show(1)}</msub><mo>⁡</mo><mrow><mo>(</mo>${show(0)}<mo>)</mo></mrow></mrow>`;
    return `<mrow${arg} intent="${coreName(op)}(${ids})"><mi>${op}</mi><mo>⁡</mo><mrow><mo>(</mo>${items.map((_, i) => show(i)).join('<mo>,</mo>')}<mo>)</mo></mrow></mrow>`;
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
  const one = (v, d) => `<output${quiet} class="${f}" style="${d.length ? d.join(' ') + ' ' : ''}--value: ${v}${st ? '; ' + st : ''}"></output>`;
  const known = kind === 'value' ? valueOf(root) : kind === 'define' ? valueOf(root.items[1].node) : null, ff = known === null ? null : fixedOf(classes, decls), text = ff ? fixedText(known, ff) : null;
  const answer = kind === 'sides' ? sides.map((e) => one(e.value, e.decls)).join('<span aria-hidden="true"> &#xb7; </span>') : kind === 'truth'
    ? `<output${quiet} data-dcss-truth style="${own.join(' ')} counter-reset: dcss-dcss-truth calc(${value} * var(--dcss-dcss-fin) * (1 + var(--dcss-dcss-t))); --dcss-err: calc(1 - ${value} * var(--dcss-dcss-fin))"></output>`
    : `<output${quiet} class="${f}${text === null ? '' : ' dcss-text'}" style="${own.length ? own.join(' ') + ' ' : ''}--value: ${value}${st ? '; ' + st : ''}">${text === null ? NONE : asText(known, text)}</output>`;
  const lead = kind === 'value' || kind === 'define' ? '= ' : '';
  // in a sentence: phrasing elements only (a figure, a div or a caption would close the paragraph), the formula and its answer
  // the formula and its answer one run that doesn't wrap: a break fell between them, no-break spaces or not (the printed
  // number is generated text, and Chrome broke before it)
  if (inline) return `<span data-dcss-mathml style="white-space: nowrap${varDecls.length ? `; ${esc(css(varDecls))}` : ''}">${props}<math${mathAttrs}><semantics>${ascii(pres(root))}<annotation-xml encoding="application/mathml-content+xml">${annotation}</annotation-xml></semantics></math> ${lead}${answer}</span>`;
  // a paragraph the formula stood alone in gives the figure its attributes (id, class, lang…), its style before the formula's
  const pa = readAttrs(pAttrs, 0), pStyle = splitStyle(pa.style), rest = Object.entries(pa).filter(([k]) => k !== 'style').map(([k, v]) => ` ${k}="${esc(v)}"`).join(''), fs = [...pStyle, ...varDecls];
  return `<figure data-dcss-mathml${rest}${fs.length ? ` style="${esc(css(fs))}"` : ''}>${caption}${props}<div>${lead}${answer}</div></figure>`;
}

// --- the page: each <math> the parser would build, compiled when it is one <apply> of an operator
const lineOf = (src, at) => src.slice(0, at).split('\n').length;
// where </name closes, its name ending there (</textareax> doesn't close a textarea), case aside; -1 if nowhere
const closeAt = (src, name, from) => { const re = new RegExp(`</${name}(?=[\\s/>])`, 'ig'); re.lastIndex = from; const m = re.exec(src); return m ? m.index : -1; };
// a data-dcss-scope: an element whose end tag is required, so its extent is where that end tag is
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const OPTIONAL_END = new Set(['html', 'head', 'body', 'p', 'li', 'dt', 'dd', 'rt', 'rp', 'optgroup', 'option', 'colgroup', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th']);
function endOf(src, lt, t) {
  let depth = 1, i = lt + t.length;
  while (i < src.length) {
    const at = src.indexOf('<', i); if (at < 0) break;
    if (src.startsWith('<!--', at)) { const e = src.indexOf('-->', at + 4); i = e < 0 ? src.length : e + 3; continue; }
    const u = tagAt(src, at); if (!u) { i = at + 1; continue; }
    if (!u.close && RAW.has(u.name)) { const e = closeAt(src, u.name, at + u.length); i = e < 0 ? src.length : e; continue; }
    if (u.name === t.name && !u.self) { if (!u.close) depth++; else if (--depth === 0) return at + u.length; }
    i = at + u.length;
  }
  return -1;
}
// a series: data-dcss-series on an <ol> or <ul> (its own items) or a <table> (its body's rows, thead and tfoot left out),
// each item or row with one carrier marked data-dcss-value: a literal (the carrier's own text, a plain number), live
// (data-dcss-value="var(--jan)" on an empty carrier, which the build prints) or missing (empty, the attribute bare).
// data-dcss-count names its number of slots, missing ones counted; 0 to MAX_SLOTS slots
const MAX_SLOTS = 64, IDENT = /^-?[_a-zA-Z\u0080-\u{10FFFF}][-_a-zA-Z0-9\u0080-\u{10FFFF}]*$/u;
const ENDS_ITEM = new Set(['li', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot', 'table', 'ol', 'ul']); // a tag that ends an item's or a cell's text
// does a <data>'s text show its value? Its number (grouped by commas, points, spaces or apostrophes in threes, a point or a
// comma as the decimal mark, a minus, − or brackets for a negative, a %, k, M, B, G or T after it as its scale) is the
// value rounded to the digits it shows, at a tie either way (a % reads 12.5% as 0.125 or as 12.5 percent points)
const SCALE = { '%': 0.01, k: 1e3, K: 1e3, M: 1e6, B: 1e9, G: 1e9, T: 1e12 };
const shows = (text, value) => {
  const m = /([-\u2212(])?\s*(\d[\d.,' ]*\d|\d)\s*([%kKMBGT])?(?!\w)/.exec(text.replace(/&nbsp;|&#160;|&#x202f;|[\u00a0\u202f\u2009]/gi, ' ')); if (!m) return false;
  const neg = !!m[1], digits = m[2].replace(/[' ]/g, '');
  return (m[3] === '%' ? [0.01, 1] : [SCALE[m[3]] ?? 1]).some((scale) => [['.', ','], [',', '.']].some(([dec, group]) => { // 12.5% is 0.125, or 12.5 in points
    const [int, ...frac] = digits.split(dec); if (frac.length > 1 || frac.some((x) => x.includes(group))) return false;
    const groups = int.split(group); if (groups.length > 1 && (groups[0].length > 3 || groups.slice(1).some((g) => g.length !== 3))) return false; // 1,200 or 1.200, not 20.27
    const x = Number([groups.join(''), ...frac].join('.')), half = 0.5 * 10 ** -(frac[0]?.length ?? 0) * scale;
    return Number.isFinite(x) && Math.abs((neg ? -x : x) * scale - value) <= half * (1 + 1e-12) + Number.EPSILON * Math.abs(value); }));
};
// a carrier marked data-dcss-value at p (its tag u): a written number (its text, or a <data value>), var(--name) for one the
// page sets, or empty for a missing one
function carrierAt(src, p, u, end, no) {
  const i = p + u.length;
  // the carrier: its attribute, its own text, and the tag after that text, which must end it
  const v = (readAttrs(u.rawAttrs, p)['data-dcss-value'] ?? '').trim(), te = src.indexOf('<', i), text = src.slice(i, te < 0 ? end : te), next = te < 0 ? null : tagAt(src, te);
  const live = /^var\(\s*--([^\s)]+)\s*\)$/.exec(v), built = live && !text.trim() && (next?.name === 'span' || next?.name === 'output') && !next.close && /\bdcss-format-/.test(next.rawAttrs); // printed by a build already
  // HTML's <data value="1200">1,200</data>: the number in value, the text as the page shows it; the carrier itself, or
  // the one element in it
  const inner = !live && !v && !text.trim() && next && !next.close && next.name === 'data' ? next : null;
  const data = u.name === 'data' ? readAttrs(u.rawAttrs, p) : inner ? readAttrs(inner.rawAttrs, te) : null;
  if (inner) { const shut = closeAt(src, 'data', te + inner.length), after = shut < 0 ? -1 : src.indexOf('>', shut) + 1, te2 = after < 0 ? -1 : src.indexOf('<', after), next2 = te2 < 0 ? null : tagAt(src, te2);
    if (shut < 0 || src.slice(after, te2).trim() || !next2 || !((next2.close && next2.name === u.name) || ENDS_ITEM.has(next2.name))) throw no(p, `<${u.name} data-dcss-value> with more than one <data> inside: a carrier holds its number as its text or in one <data value>`); }
  if (!built && !data && (!next || !((next.close && next.name === u.name) || ENDS_ITEM.has(next.name)))) throw no(p, `<${u.name} data-dcss-value> with markup inside: a carrier's number is its own text, or a <data value="…">`);
  const shown = data ? (inner ? src.slice(te + inner.length, closeAt(src, 'data', te + inner.length)) : text).replace(/<[^>]*>/g, '').trim() : null; // what a reader sees
  let slot;
  if (live) { if (text.trim()) throw no(p, `<${u.name} data-dcss-value="${v}"> holds text: a live carrier is empty, and the build prints its value`);
    const nm = live[1].normalize('NFKC'); if (!IDENT.test(nm)) throw no(p, `data-dcss-value="${v}": --${nm} is no CSS custom property`);
    slot = { kind: 'live', name: nm, after: i, attrs: readAttrs(u.rawAttrs, p), built }; }
  else if (v) throw no(p, `data-dcss-value="${v}": a carrier's value is its own text, or var(--name) for one the page sets`);
  else if (data && !('value' in data)) throw no(p, `a <data> carrier with no value attribute: its number goes in value="…", as in <data value="1200">1,200</data>`);
  else if (data ? !data.value.trim() : !text.trim()) { if (data && /\d/.test(shown)) throw no(p, `<data value="">${shown}</data>: it shows a number and its value is empty (missing); a reader would see ${shown} and the page compute without it`); slot = { kind: 'missing' }; }
  else { const w = (data ? data.value : text).trim();
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(w)) throw no(p, `${JSON.stringify(w)} is not a plain number: a carrier's ${data ? 'value' : 'text'} is digits, a point and a leading minus, as in -1200.5${data ? '' : ' (or <data value="1200">1,200</data> to show it formatted)'}`);
    const x = Number(w); if (Math.abs(x) >= FMAX) throw no(p, `${w}: Chrome reads a number from 3.4e38 up as 3.4e38 (a 32-bit float's largest), so the page would compute with another number`);
    if (data && !shows(shown, x)) throw no(p, `<data value="${data.value}">${shown}</data>: its text shows another number than its value, so a reader would see ${JSON.stringify(shown)} and the page compute with ${w} (the text is the value rounded to the digits it shows; separators, and a %, k, M or B after it, are read)`);
    slot = { kind: 'literal', x, text: w }; }
  return { ...slot, line: lineOf(src, p) };
}
function seriesAt(src, lt, t, end, file) {
  const attrs = readAttrs(t.rawAttrs, lt), name = (attrs['data-dcss-series'] ?? '').trim().normalize('NFKC'), count = attrs['data-dcss-count']?.trim().normalize('NFKC');
  const no = (p, why) => new Error(`${file}:${lineOf(src, p)}: ${why}`);
  if (t.name === 'th') throw no(lt, 'data-dcss-series on a column header in a table marked data-dcss-series itself, or in no table: name the table\'s one series or its columns, not both');
  if (!['ol', 'ul', 'table'].includes(t.name)) throw no(lt, `data-dcss-series on <${t.name}>: a series is an <ol>, a <ul> or a <table>, or a column's <th scope="col">`);
  for (const [k, v] of [['data-dcss-series', name], ...(count !== undefined ? [['data-dcss-count', count]] : [])]) {
    if (!IDENT.test(v)) throw no(lt, `${k}="${v}": a name a formula can use, a CSS identifier`);
    if (RESERVED.test(v)) throw no(lt, `${k}="${v}": --${v} is a name dcss itself reads or writes`); }
  if (count === name) throw no(lt, `data-dcss-count="${count}" is the series' own name`);
  const list = t.name !== 'table', nest = list ? new Set(['ol', 'ul']) : new Set(['table']), items = [];
  let depth = 0, head = false, i = lt + t.length;
  while (i < end) {
    const p = src.indexOf('<', i); if (p < 0 || p >= end) break;
    if (src.startsWith('<!--', p)) { const e = src.indexOf('-->', p + 4); i = e < 0 ? end : e + 3; continue; }
    const u = tagAt(src, p); if (!u) { i = p + 1; continue; }
    i = p + u.length;
    if (!u.close && RAW.has(u.name)) { const e = closeAt(src, u.name, i); i = e < 0 ? end : e; continue; }
    if (nest.has(u.name) && !u.self && p < end - 1) { if (u.close) depth--; else depth++; continue; }
    if (depth) continue;
    if (!list && ['thead', 'tfoot', 'tbody'].includes(u.name)) { head = !u.close && u.name !== 'tbody'; continue; }
    if (!u.close && u.name === (list ? 'li' : 'tr') && !head) items.push({ at: p, carriers: [] });
    if (!list && !head && !u.close && u.name === 'th' && items.length && items.at(-1).label === undefined && !/(?:^|\s)data-dcss-value(?=[\s=]|$)/i.test(u.rawAttrs)
      && (readAttrs(u.rawAttrs, p).scope ?? 'row').trim().toLowerCase() === 'row') items.at(-1).label = cellText(src, p, u); // its row header
    if (u.close || !/(?:^|\s)data-dcss-value(?=[\s=]|$)/i.test(u.rawAttrs)) continue;
    if (!items.length || (!list && head)) throw no(p, 'a data-dcss-value outside the series\' items');
    items.at(-1).carriers.push(carrierAt(src, p, u, end, no));
  }
  for (const it of items) {
    if (it.carriers.length > 1) throw no(it.at, `${it.carriers.length} carriers marked data-dcss-value in one ${list ? 'item' : 'row'}: a series takes one value an item (two-column series aren't taken yet)`);
    if (!it.carriers.length) throw no(it.at, `a${list ? 'n item' : ' row'} of the series ${name} with no data-dcss-value: mark its number's element, or an empty one for a missing value`); }
  if (items.length > MAX_SLOTS) throw no(lt, `the series ${name} has ${items.length} ${list ? 'items' : 'rows'}, past the ${MAX_SLOTS} this build takes`);
  return { name, count, line: lineOf(src, lt), slots: items.map((it) => it.carriers[0]), labels: items.map((it) => it.label ?? null) };
}
// a table whose header row names its columns, <th scope="col" data-dcss-series="sales2025">: a series a column, one slot a
// body row. A cell's column is its column header by HTML's table model, the header its headers attribute names or else
// the one above it; merged cells, a row of another length, a headers attribute naming another column, column headers in
// two rows and a carrier under no series are refused, so no value can stand in another column's place. Rows in <tfoot>
// are no slots (a total goes there). Each row's header (<th scope="row">) is its slot's label
// a cell's text, its markup left out (its character references kept, as HTML)
const cellText = (src, p, u) => { const from = p + u.length, e = /<\/?(?:th|td|tr|tbody|thead|tfoot|table)\b/i.exec(src.slice(from)); return src.slice(from, e ? from + e.index : undefined).replace(/<[^>]*>/g, '').trim(); };
function columnsAt(src, lt, t, end, file) {
  const no = (p, why) => new Error(`${file}:${lineOf(src, p)}: ${why}`), rows = [];
  let depth = 0, section = 'body', i = lt + t.length;
  while (i < end) {
    const p = src.indexOf('<', i); if (p < 0 || p >= end) break;
    if (src.startsWith('<!--', p)) { const e = src.indexOf('-->', p + 4); i = e < 0 ? end : e + 3; continue; }
    const u = tagAt(src, p); if (!u) { i = p + 1; continue; }
    i = p + u.length;
    if (!u.close && RAW.has(u.name)) { const e = closeAt(src, u.name, i); i = e < 0 ? end : e; continue; }
    if (u.name === 'table' && !u.self && p < end - 1) { depth += u.close ? -1 : 1; continue; }
    if (depth) continue;
    if (['thead', 'tbody', 'tfoot'].includes(u.name)) { section = u.close || u.name === 'tbody' ? 'body' : u.name; continue; }
    if (!u.close && u.name === 'tr') rows.push({ at: p, section, cells: [] });
    if (u.close || (u.name !== 'td' && u.name !== 'th')) continue;
    const a = readAttrs(u.rawAttrs, p);
    if (!rows.length) throw no(p, `a <${u.name}> outside a <tr> in a table with column series`);
    for (const k of ['colspan', 'rowspan']) if (k in a && a[k].trim() !== '1') throw no(p, `${k}="${a[k]}" in a table with column series: a merged cell would put a value in another column's place`);
    rows.at(-1).cells.push({ at: p, u, a, value: /(?:^|\s)data-dcss-value(?=[\s=]|$)/i.test(u.rawAttrs), series: 'data-dcss-series' in a });
  }
  const heads = rows.filter((row) => row.cells.some((c) => c.series));
  if (heads.length > 1) throw no(heads[1].at, `column headers marked data-dcss-series in two rows (line ${lineOf(src, heads[0].at)} first): the columns are named in one header row`);
  if (!heads.length) return null;
  const head = heads[0], W = head.cells.length, k0 = rows.indexOf(head);
  if (head.section === 'tfoot') throw no(head.at, 'column headers in <tfoot>: the columns are named in the header row, <thead>');
  const cols = head.cells.map((c, k) => {
    if (!c.series) return null;
    const name = c.a['data-dcss-series'].trim().normalize('NFKC'), count = c.a['data-dcss-count']?.trim().normalize('NFKC'), scope = (c.a.scope ?? '').trim().toLowerCase();
    if (c.u.name !== 'th') throw no(c.at, `data-dcss-series on a <td>: a column is named by its header, <th scope="col" data-dcss-series="${name}">`);
    if (scope && scope !== 'col') throw no(c.at, `<th scope="${scope}" data-dcss-series="${name}">: a column's header is scope="col"`);
    for (const [kk, v] of [['data-dcss-series', name], ...(count !== undefined ? [['data-dcss-count', count]] : [])]) {
      if (!IDENT.test(v)) throw no(c.at, `${kk}="${v}": a name a formula can use, a CSS identifier`);
      if (RESERVED.test(v)) throw no(c.at, `${kk}="${v}": --${v} is a name dcss itself reads or writes`); }
    if (count === name) throw no(c.at, `data-dcss-count="${count}" is the series' own name`);
    return { k, name, count, id: c.a.id?.trim(), at: c.at, slots: [], labels: [] }; });
  const named = cols.filter(Boolean), ids = new Map(named.filter((c) => c.id).map((c) => [c.id, c]));
  rows.forEach((row, j) => {
    if (row === head) return;
    const carriers = row.cells.filter((c) => c.value);
    if (row.section !== 'body') { if (carriers.length) throw no(carriers[0].at, `a data-dcss-value in a ${row.section === 'tfoot' ? '<tfoot>' : 'header'} row: only body rows are slots (a total in <tfoot> reads its result with data-dcss-result)`); return; }
    if (j < k0) throw no(row.at, 'a body row above the column headers: the header row comes first');
    if (row.cells.length !== W) throw no(row.at, `a row of ${row.cells.length} cell${row.cells.length === 1 ? '' : 's'} under a header row of ${W}: each row has a cell for every column, an empty data-dcss-value one for a missing value`);
    const label = row.cells.find((c) => c.u.name === 'th' && !c.value && (c.a.scope ?? 'row').trim().toLowerCase() === 'row');
    row.cells.forEach((c, k) => {
      const col = cols[k];
      if (c.value && !col) throw no(c.at, `a data-dcss-value under a column with no data-dcss-series (column ${k + 1})`);
      if (!col) return;
      if (!c.value) throw no(c.at, `the cell under ${col.name} has no data-dcss-value: mark it, empty for a missing value`);
      if ('headers' in c.a) { const hs = c.a.headers.trim().split(/\s+/), other = hs.map((h) => ids.get(h)).find((x) => x && x !== col);
        if (!col.id || !hs.includes(col.id) || other) throw no(c.at, `headers="${c.a.headers}" on a cell under ${col.name}${col.id ? ` (id="${col.id}")` : ' (its header has no id)'}: a cell's headers name its own column's header`); }
      col.slots.push(carrierAt(src, c.at, c.u, end, no));
      col.labels.push(label ? cellText(src, label.at, label.u) : null); }); });
  for (const col of named) if (col.slots.length > MAX_SLOTS) throw no(col.at, `the series ${col.name} has ${col.slots.length} rows, past the ${MAX_SLOTS} this build takes`);
  return named.map(({ name, count, at, slots, labels }) => ({ name, count, line: lineOf(src, at), at, slots, labels }));
}
export function toDcss(src, { file = 'page.html' } = {}) {
  const was = CX; CX = { defs: new Map(), later: new Map(), elsewhere: new Map(), index: new Map(), series: new Map(), seriesElsewhere: new Map(), scope: 0, welford: new Set(), welfordNow: new Set() };
  try { return build(src, file); } finally { CX = was; }
}
function build(src, file) {
  // scopes: 0 is the page; each data-dcss-scope element another, inside the one it sits in
  const found = [], left = [], calls = new Set(), scopes = [{ id: 0, parent: null }], open = [], series = [], marks = [], colHeads = new Set(), lives = []; let i = 0, pOpen = null, built = null; // built: the line of the first thing an earlier build wrote // pOpen: the start of an open <p>, or null
  while (i < src.length) {
    const lt = src.indexOf('<', i); if (lt < 0) break;
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e < 0 ? src.length : e + 3; continue; }
    if (src[lt + 1] === '!' || src[lt + 1] === '?') { const e = src.indexOf('>', lt); i = e < 0 ? src.length : e + 1; continue; }
    const t = tagAt(src, lt);
    if (!t) { i = lt + 1; continue; }
    if (!t.close && RAW.has(t.name)) { const e = closeAt(src, t.name, lt + t.length); i = e < 0 ? src.length : e; continue; }
    while (open.length && lt >= open.at(-1).end) open.pop();
    while (lives.length && lt >= lives.at(-1).end) lives.pop();
    if (t.close) { if (t.name === 'p') pOpen = null; i = lt + t.length; continue; }
    if (/(?:^|\s)data-dcss-scope(?=[\s=]|$)/i.test(t.rawAttrs)) {
      const line = lineOf(src, lt), end = VOID.has(t.name) || OPTIONAL_END.has(t.name) || t.self ? -2 : endOf(src, lt, t);
      if (end === -2) throw new Error(`${file}:${line}: data-dcss-scope on <${t.name}>: a scope is an element whose end tag is required (section, div, article, figure…)`);
      if (end < 0) throw new Error(`${file}:${line}: the data-dcss-scope <${t.name}> is never closed`);
      const s = { id: scopes.length, parent: open.at(-1)?.id ?? 0, line, start: lt, end, tag: t }; scopes.push(s); open.push(s);
    }
    { const a = readAttrs(t.rawAttrs, lt), on = 'aria-live' in a ? a['aria-live'].trim().toLowerCase() !== 'off' : t.name === 'output' || LIVE_ROLES.test(a.role ?? '');
      if (('aria-live' in a || on) && !t.self && !VOID.has(t.name)) { const end = endOf(src, lt, t); if (end > 0) lives.push({ end, on, at: lt }); } }
    for (const kind of ['result', 'bind', 'error', 'label']) if (new RegExp(`(?:^|\\s)data-dcss-${kind}(?=[\\s=]|$)`, 'i').test(t.rawAttrs))
      marks.push({ kind, name: (readAttrs(t.rawAttrs, lt)[`data-dcss-${kind}`] ?? '').trim().normalize('NFKC'), at: lt, tag: t, scope: open.at(-1)?.id ?? 0, line: lineOf(src, lt), live: lives.findLast((r) => r.at !== lt)?.on ?? false });
    if (t.name === 'table' && !t.close && !/(?:^|\s)data-dcss-series(?=[\s=]|$)/i.test(t.rawAttrs)) { const end = endOf(src, lt, t);
      if (end > 0 && /data-dcss-series/i.test(src.slice(lt + t.length, end))) for (const c of columnsAt(src, lt, t, end, file) ?? []) { colHeads.add(c.at); series.push({ ...c, scope: open.at(-1)?.id ?? 0 }); } }
    if (/(?:^|\s)data-dcss-series(?=[\s=]|$)/i.test(t.rawAttrs) && !colHeads.has(lt)) {
      const end = t.self ? -1 : endOf(src, lt, t); if (end < 0) throw new Error(`${file}:${lineOf(src, lt)}: the data-dcss-series <${t.name}> is never closed`);
      series.push({ ...seriesAt(src, lt, t, end, file), scope: open.at(-1)?.id ?? 0 });
    }
    if (t.name === 'figure' && /\bdata-dcss-mathml\b/.test(t.rawAttrs)) { built ??= lineOf(src, lt); const e = closeAt(src, 'figure', lt); i = e < 0 ? src.length : e; continue; } // a formula this build wrote
    if (t.name === 'span' && /\bdata-dcss-mathml\b/.test(t.rawAttrs)) { built ??= lineOf(src, lt); const e = endOf(src, lt, t); i = e < 0 ? src.length : e; continue; } // one it wrote in a sentence
    if (!t.close && /(?:^|\s)data-dcss-built(?=[\s=]|$)/i.test(t.rawAttrs)) built ??= lineOf(src, lt); // a scope or a reader it wrote
    if (t.name === 'p') pOpen = { start: lt, end: lt + t.length, raw: t.rawAttrs, line: lineOf(src, lt) };
    else if (CLOSES_P.has(t.name)) pOpen = null;
    if (t.name !== 'svg' && t.name !== 'math') { i = lt + t.length; continue; }
    if (t.name === 'svg') { const e = closeAt(src, 'svg', lt); i = e < 0 ? src.length : e; continue; }
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
      left.push(lineOf(src, math.start)); continue;
    }
    let from = math.start, to = math.end, inline = false, pAttrs = '';
    if (pOpen) { // a formula alone in a paragraph takes the paragraph's place as a figure; beside text it is phrasing, in the sentence
      const before = src.slice(pOpen.end, math.start), after = src.slice(math.end), close = /^\s*<\/p\s*>/i.exec(after), next = /^\s*<([a-z][a-z0-9]*)/i.exec(after);
      const alone = !before.trim() && (close || /^\s*$/.test(after) || (next && CLOSES_P.has(next[1].toLowerCase())));
      if (alone) { from = pOpen.start; to = close ? math.end + close[0].length : math.end; // the paragraph's attributes go to the figure
        if (/(?:^|\s)data-dcss-(scope|series|result|bind|error)(?=[\s=]|$)/i.test(pOpen.raw)) throw new Error(`${file}:${pOpen.line}: a data-dcss- attribute on the paragraph a formula stands alone in: the formula takes the paragraph's place, so put the attribute on an element around it`);
        pAttrs = pOpen.raw; pOpen = null; }
      else if ((math.attrs.display ?? '').trim().toLowerCase() === 'block') throw new Error(`${file}:${lineOf(src, math.start)}: a formula with display="block" beside text in a paragraph: a block formula takes its own paragraph; without display="block" it stays in the sentence`);
      else inline = true;
    }
    found.push({ from, to, math, scope: open.at(-1)?.id ?? 0, inline, pAttrs, live: lives.at(-1)?.on ?? false });
  }
  // a page an earlier build wrote, with something new in it, is refused: the new formulas would be numbered from 1 again
  // and read the old ones' answers, and the old scopes' steps aren't written again (a built page alone builds to itself)
  const fresh = [found[0] && lineOf(src, found[0].math.start), marks.find((mk) => !/(?:^|\s)data-dcss-built(?=[\s=]|$)/i.test(mk.tag.rawAttrs))?.line,
    series.flatMap((q) => q.slots).find((x) => x.kind === 'live' && !x.built)?.line].filter(Boolean);
  if (built !== null && fresh.length) throw new Error(`${file}:${Math.min(...fresh)}: this page holds what an earlier build wrote (line ${built}) and something new to build: build the source page, not the built one`);
  // and a built page changed in any other way (a number in a series, a formula's text) is refused too: its folded answers
  // and its steps were written for the page as built, so each mark carries the SHA-256 of the page the build wrote
  if (built !== null) { const h = FINGERPRINT.exec(src)?.[1], bare = h && src.replace(new RegExp(`(\\sdata-dcss-(?:built|mathml))="${h}"`, 'g'), '$1');
    if (!h || fingerprint(bare) !== h) throw new Error(`${file}:${built}: this page holds what an earlier build wrote ${h ? 'and was changed after it' : 'with no fingerprint of it (an older build, or one taken out)'}: build the source page, not the built one`); }
  // the page's definitions, in document order: each name once in a scope and the scopes around and inside it (sibling
  // scopes may reuse one), and never one the page sets itself
  const around = (s) => { const up = new Set(); for (let q = s; q !== null; q = scopes[q].parent) up.add(q); return up; }, ups = scopes.map((s) => around(s.id));
  const sees = (s, q) => ups[s].has(q); // a formula in scope s sees definitions of scope q
  const defs = found.map((f) => definition(elements(f.math)[0])), where = [];
  defs.forEach((d, k) => { if (!d) return; const at = found[k].math.start, line = lineOf(src, at), s = found[k].scope;
    const twice = where.find((w) => w.name === d[0] && (sees(s, w.scope) || sees(w.scope, s)));
    if (twice) throw new Error(twice.scope === s ? `${file}:${line}: ${d[0]} is defined twice (line ${twice.line} first)` : `${file}:${line}: ${d[0]} is defined twice, in a data-dcss-scope and one around it (line ${twice.line})`);
    const outside = src.slice(0, found[0].from) + found.map((f, j) => src.slice(f.to, found[j + 1]?.from ?? src.length)).join('');
    const set = new RegExp(`--(${d[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-ready)?)\\s*:`).exec(outside);
    if (set) throw new Error(`${file}:${line}: the page sets --${set[1]} itself, which this definition would hide from the formulas after it (a scope's result is --${d[0]} and --${d[0]}-ready)`);
    where.push({ name: d[0], k, line, scope: s }); });
  // a series' name and its count's are names of their scope too: once there and around it, and never a definition's
  const names = [...where.map((w) => ({ name: w.name, line: w.line, scope: w.scope })), ...series.flatMap((q) => [{ name: q.name, line: q.line, scope: q.scope, q }, ...(q.count ? [{ name: q.count, line: q.line, scope: q.scope, q }] : [])])];
  for (const q of series) for (const nm of [q.name, q.count].filter(Boolean)) {
    const other = names.find((w) => w.name === nm && w.q !== q && (sees(q.scope, w.scope) || sees(w.scope, q.scope))); // another entry, even on the same line
    if (other) throw new Error(`${file}:${Math.max(q.line, other.line)}: ${nm} is named twice in a data-dcss-scope or one around it (${q.line === other.line ? `twice on line ${q.line}` : `lines ${Math.min(q.line, other.line)} and ${Math.max(q.line, other.line)}`})`); }
  // a live slot is kept on its scope's element through the split (five registered integers, inherited, named
  // --dcss-series-s<scope>q<series>-<slot>: a formula's own renaming leaves them be) with two flags:
  // p, present (sign(abs(v) + 1), 1 for any number, ±infinity too: an unset, empty or non-numeric value or NaN leaves its
  // initial 0, so the slot is missing and
  // voids nothing else), and g, present and below 3.4e38 (Chrome reads a larger number as 3.4e38). Its carrier prints it
  // what the build adds to an element's start tag (a scope's steps and stores, a reader's style and class), one edit a tag
  const liveEdits = [], scopeDecls = new Map(), tagAdds = new Map(), add = (at, t, style, more = {}) => { const a = tagAdds.get(at) ?? { t, style: [], props: [], cls: '', css: '' }; tagAdds.set(at, a); a.style.push(...style); if (more.props) a.props.push(...more.props); if (more.cls) a.cls = more.cls; if (more.css) a.css += more.css; if (more.inner) a.inner = more.inner; if (more.attrs) a.attrs = more.attrs; };
  series.forEach((q) => { const live = q.slots.filter((x) => x.kind === 'live'); if (!live.length) return;
    if (!q.scope) throw new Error(`${file}:${q.line}: the series ${q.name} has values the page sets: put it in a data-dcss-scope, whose element keeps them`);
    const j = series.filter((r) => r.scope === q.scope).indexOf(q) + 1, ds = scopeDecls.get(q.scope) ?? []; scopeDecls.set(q.scope, ds);
    q.slots.forEach((x, i) => { if (x.kind !== 'live') return; const Q = x.store = `--dcss-series-s${q.scope}q${j}-${i}`, v = `var(--${x.name})`;
      for (const z of 'eabcz') ds.push([`${Q}-${z}`, `calc(${SPLIT[z](Q, v)})`]);
      ds.push([`${Q}-p`, `calc(sign(abs(${v}) + 1))`], [`${Q}-g`, `calc(1 - min(1, max(0, sign(abs(${v}) - ${FMAX}) + 1)))`]);
      if (!x.built) liveEdits.push({ from: x.after, to: x.after, html: printed(x.attrs, `calc(${join(Q)} * (1 + 0 / var(${Q}-g)))`) }); }); }); // the slot, as the formulas read it
  for (const [id, ds] of scopeDecls) add(scopes[id].start, scopes[id].tag, ds.map(([k, v]) => `${k}: ${v}`), { props: ds.map(([k]) => [k, true]) });
  // each scope's formulas numbered from 1: a scoped formula's private names (its steps, macros and flags) carry its scope
  // and number, so formulas sharing an element (B5) never share a name; the page's own formulas keep theirs as they are
  const nth = new Map(), tag = found.map((f) => { const n = (nth.get(f.scope) ?? 0) + 1; nth.set(f.scope, n); return f.scope ? `s${f.scope}r${n}-` : ''; });
  const answers = new Map(), defAt = new Map(); // a scoped formula's answer's name, by its place on the page
  // the first formula brings the rule that lays figures out and sets answers in the formulas' font: before its figure, or
  // inside its span in a sentence, where a sentence's words are read without it
  const lay = (k, f, html) => k ? html : f.inline ? html.replace(/^<span data-dcss-mathml[^>]*>/, (o) => o + LAYOUT) : LAYOUT + html;
  const edits = found.map((f, k) => {
    CX.defs = new Map(); CX.later = new Map(); CX.elsewhere = new Map(); CX.series = new Map(); CX.seriesElsewhere = new Map();
    for (const w of where) if (!sees(f.scope, w.scope)) CX.elsewhere.set(w.name, w.line); else if (w.k < k) CX.defs.set(w.name, null); else if (w.k > k) CX.later.set(w.name, w.line);
    // the series its scope and those around it hold, wherever they stand in it, and their counts as numbers the build knows
    for (const q of series) if (sees(f.scope, q.scope)) { CX.series.set(q.name, q); if (q.count) CX.defs.set(q.count, { op: 'id', call: 'id', items: [{ x: q.slots.length, neg: false, mag: `<mn>${q.slots.length}</mn>` }] }); }
      else { CX.seriesElsewhere.set(q.name, q.line); if (q.count) CX.elsewhere.set(q.count, q.line); }
    let compiled;
    try {
      for (const w of where) if (w.k < k && sees(f.scope, w.scope)) { const node = found[w.k].compiled.root.items[1].node;
      CX.defs.set(w.name, answers.has(w.k) && valueOf(node) === null ? { result: answers.get(w.k) } : node); } // a scope's live result is read, not computed again
      CX.scope = f.scope; CX.welfordNow = new Set(); compiled = f.compiled = compile(f.math);
      // shared steps are read from the scope's element only by a formula whose own steps go there too
      const onScope = f.scope && (compiled.kind === 'value' || compiled.kind === 'define');
      if (onScope) for (const w of CX.welfordNow) CX.welford.add(w);
      else if ([...CX.welfordNow].some((w) => CX.welford.has(w))) { const kept = CX.welford; CX.welford = new Set(); compiled = f.compiled = compile(f.math); CX.welford = kept; }
    } catch (e) { if (e instanceof Refusal) throw new Error(`${file}:${lineOf(src, e.at)}: ${e.message}`); throw e; }
    const mine = new Set(), slotsRead = new Set(), uses = new Set(), each = (n) => { calls.add(n.call); mine.add(n.call); if (n.series) slotsRead.add(n.series.name); n.items.forEach((x) => { if (x.node) each(x.node); if (x.slot) slotsRead.add(x.slot); if (x.def) each(x.def); if (x.result) uses.add(x.ci); }); }; each(compiled.root);
    f.report = { mine, slotsRead, uses };
    // the first figure brings the rule that puts each answer beside its formula, at no specificity, so a page's own wins (a
    // sentence's formula needs none, and a <style> there would sit in the paragraph)
    const T = (x) => (tag[k] ? x.replaceAll('--dcss-dcss-', `--dcss-dcss-${tag[k]}`) : x);
    if (f.scope && (compiled.kind === 'value' || compiled.kind === 'define')) {
      // in a scope, a value's steps and its answer go on the scope's element, the answer through the split with a flag,
      // inherited; the formula's output, a data-dcss-result and a later formula read it from there. A named one is also
      // --<name> (the double, worked out there and inherited as its tokens) and --<name>-ready (1 while it has an answer,
      // else 0), for the page's own CSS anywhere inside: width: calc(var(--average) * 2px)
      const A = `--dcss-answer-s${f.scope}r${tag[k].slice(tag[k].indexOf('r') + 1, -1)}`, V = T(compiled.value); answers.set(k, A); defAt.set(k, f.scope);
      const own = compiled.decls.map((d) => T(d).replace(/;$/, '')), parts = ANSWER.map((z) => `${A}-${z}`);
      add(scopes[f.scope].start, scopes[f.scope].tag, [...own, ...'eabcz'.split('').map((z) => `${A}-${z}: calc(${SPLIT[z](A, `clamp(-1 * (pow(2, 1023) * (2 - pow(2, -52))), ${V}, (pow(2, 1023) * (2 - pow(2, -52))))`)})`), `${A}-v: calc(${V} * 0 + 1)`,
        ...(compiled.kind === 'define' ? [`--${compiled.name}: ${readAnswer(A)}`, `--${compiled.name}-ready: var(${A}-v)`] : [])],
        { props: [...compiled.ints.map((n) => [T(n), false]), ...parts.map((n) => [n, true])] });
      return { from: f.from, to: f.to, html: lay(k, f, write({ ...compiled, value: readAnswer(A), decls: [], ints: [] }, f.math, src, f.inline, f.pAttrs, QUIET(f.live))) };
    }
    return { from: f.from, to: f.to, html: lay(k, f, T(write(compiled, f.math, src, f.inline, f.pAttrs, QUIET(f.live)))) };
  });
  // the readers of a scope's results: data-dcss-result prints one (the page's own CSS reads --<name>). Each reads a result
  // of its own scope or one around it (values flow down)
  const results = new Map(); where.forEach((w) => results.set(`${w.scope}:${w.name}`, w));
  // data-dcss-error marks the page's own message for a result: hidden while it has an answer, by a style query on the
  // element around it (which inherits the result's flag v), so it shows while the result has none
  for (const mk of marks) {
    const own = readAttrs(mk.tag.rawAttrs, mk.at), at = `${file}:${mk.line}: `;
    if (mk.kind === 'bind') throw new Error(`${at}data-dcss-bind="${mk.name}": a result is read by its own name now, var(--${mk.name}) and var(--${mk.name}-ready), anywhere in its scope`);
    if (/(?:^|\s)data-dcss-built(?=[\s=]|$)/i.test(mk.tag.rawAttrs)) continue; // read by a build already
    if (mk.kind === 'result') { const e = mk.tag.self ? -1 : endOf(src, mk.at, mk.tag), inner = e < 0 ? '' : src.slice(mk.at + mk.tag.length, src.lastIndexOf('<', e - 1)).replace(/<!--[\s\S]*?-->/g, '');
      if (/\d/.test(inner.replace(/<[^>]*>/g, ''))) throw new Error(`${at}data-dcss-result="${mk.name}" holds ${JSON.stringify(inner.trim().slice(0, 40))}: what a result's element holds shows while it has no answer, so it holds no digit, which would read as one`); }
    if (mk.kind === 'error' && scopes[mk.scope]?.start === mk.at) throw new Error(`${at}data-dcss-error on the data-dcss-scope itself: a message reads its result from the element around it, so it goes inside the scope`);
    let w = null; for (let q = mk.scope; q !== null && !w; q = scopes[q].parent) w = results.get(`${q}:${mk.name}`) ?? null;
    // where no formula has the name, a series' data-dcss-count: its number of rows, known when the page is built, so a total
    // can say what it covers ("285 across 2 of 6 months")
    let rows = null; if (!w) for (let q = mk.scope; q !== null && rows === null; q = scopes[q].parent) rows = series.find((x) => x.scope === q && x.count === mk.name)?.slots.length ?? null;
    if (rows !== null && mk.kind === 'label') throw new Error(`${at}data-dcss-label="${mk.name}": ${mk.name} is a series' number of rows (data-dcss-count), not d3's maxIndex or minIndex of a series`);
    if (!w && rows === null) { const there = where.find((x) => x.name === mk.name);
      throw new Error(there ? `${at}data-dcss-${mk.kind}="${mk.name}": ${mk.name} is ${there.scope ? 'a result of another data-dcss-scope' : 'defined by the page, not a data-dcss-scope'} (line ${there.line}): an element reads the results of its own scope and the scopes around it`
        : `${at}data-dcss-${mk.kind}="${mk.name}": no formula defines ${mk.name} in this data-dcss-scope or one around it`); }
    if (w && !w.scope) throw new Error(`${at}data-dcss-${mk.kind}="${mk.name}": ${mk.name} is defined by the page, not a data-dcss-scope (line ${w.line}): put the formula and its readers in one`);
    const A = w ? answers.get(w.k) : null;
    if (mk.kind === 'result') { const fmt = (own.class ?? '').split(/\s+/).filter((c) => c.startsWith('dcss-format-')), set = splitStyle(own.style).some(([kk]) => FORMAT_SETTINGS.test(kk));
      const node = w ? found[w.k].compiled.root.items[1]?.node : null, kv = w ? (node ? valueOf(node) : null) : rows, ff = kv === null ? null : fixedOf((own.class ?? '').split(/\s+/).filter(Boolean), splitStyle(own.style)), text = ff ? fixedText(kv, ff) : null;
      // what the element holds is shown while it prints no number (no answer, or one its format can't print), and with no
      // CSS; a dash when it holds nothing. Hidden for an answer written as text, which shows in any case
      const e = mk.tag.self ? -1 : endOf(src, mk.at, mk.tag), shut = e < 0 ? -1 : src.lastIndexOf('<', e - 1), held = shut < 0 ? '' : src.slice(mk.at + mk.tag.length, shut).replace(/<!--[\s\S]*?-->/g, '').trim();
      const none = held ? `<span data-dcss-none${text === null ? '' : ' hidden'}>` : text === null ? NONE : ''; if (held) liveEdits.push({ from: shut, to: shut, html: '</span>' });
      add(mk.at, mk.tag, [`--value: ${A ? readAnswer(A) : rows}`, ...(fmt.length || set ? [] : ['--precision: 6', '--trim: 1', '--comma: 1'])], { cls: [fmt.length ? '' : 'dcss-format-fixed', text === null ? '' : 'dcss-text'].filter(Boolean).join(' '), inner: (text === null ? '' : asText(kv, text)) + none,
        attrs: mk.tag.name === 'output' && !('aria-live' in own) && !('role' in own) ? QUIET(mk.live) : '' }); }
    else if (mk.kind === 'label') { // the row header at an index result: every label written, hidden, and the one at the index shown
      const node = found[w.k].compiled.root.items[1]?.node, q = node?.indexOf, c = `dcss-label-${A.slice('--dcss-answer-'.length)}`, sc = scopes[w.scope];
      if (!q) throw new Error(`${at}data-dcss-label="${mk.name}": ${mk.name} is not d3's maxIndex or minIndex of a series (line ${w.line}): a label is the row header at that index`);
      const bare = (q.labels ?? q.slots.map(() => null)).findIndex((l) => !l); // every row its header, or a label could print nothing
      if (bare >= 0) throw new Error(`${at}data-dcss-label="${mk.name}": ${q.labels?.some(Boolean) ? `row ${bare + 1} of the series ${q.name} (line ${q.line}) has` : `the series ${q.name} (line ${q.line}) has`} no row header, <th scope="row">, to print`);
      // what the element holds is its text while no row wins (d3's -1, or no answer), and with no CSS. The index is kept
      // plus one, 0 for none: Chrome 155 matches no style(--i: -1) on a registered integer computed by calc() (facts/style-query-negative-calc.mjs)
      const e = mk.tag.self ? -1 : endOf(src, mk.at, mk.tag), shut = e < 0 ? -1 : src.lastIndexOf('<', e - 1), own = shut < 0 ? '' : src.slice(mk.at + mk.tag.length, shut);
      add(mk.at, mk.tag, [], { cls: c, inner: q.labels.map((l, k) => `<span hidden data-dcss-k="${k}">${l}</span>`).join('') + (own.trim() ? '<span data-dcss-k="-1">' : '') });
      if (own.trim()) liveEdits.push({ from: shut, to: shut, html: '</span>' });
      if (!(tagAdds.get(sc.start)?.css ?? '').includes(`.${c} `)) add(sc.start, sc.tag, (tagAdds.get(sc.start)?.style ?? []).some((d) => d.startsWith(`${A}-i:`)) ? [] : [`${A}-i: calc(var(${A}-v) * (round(nearest, ${join(A)}, 1) + 1))`],
        { props: [[`${A}-i`, true]], css: `.${c} > [data-dcss-k="-1"] { display: none; } @container style(${A}-i: 0) { .${c} > [data-dcss-k="-1"] { display: inline; } } ` + q.labels.map((l, k) => (l ? `@container style(${A}-i: ${k + 1}) { .${c} > [data-dcss-k="${k}"] { display: inline; } } ` : '')).join('') }); }
    else if (!A) add(mk.at, mk.tag, [], { attrs: 'hidden' in own ? '' : ' hidden' }); // a number of rows: always there
    else { const c = `dcss-unavailable-${A.slice('--dcss-answer-'.length)}`, sc = scopes[w.scope], node = found[w.k].compiled.root.items[1]?.node, kv = node ? valueOf(node) : null;
      add(mk.at, mk.tag, [], { cls: c, attrs: kv !== null && Number.isFinite(kv) && !('hidden' in own) ? ' hidden' : '' }); // known when built: its message never shows, with CSS or without
      if (!(tagAdds.get(sc.start)?.css ?? '').includes(`.${c} `)) add(sc.start, sc.tag, [], { css: `@container style(${A}-v: 1) { .${c} { display: none !important; } } ` }); }
  }
  for (const [at, a] of tagAdds) { const t = a.t; if (/(?:^|\s)data-dcss-built(?=[\s=]|$)/i.test(t.rawAttrs)) continue; // kept by a build already
    const close = t.length - (t.self ? 2 : 1), body = a.style.join('; '), open = src.slice(at, at + t.length).replace(/(\/?>)$/, `${a.attrs ?? ''} data-dcss-built\u0001$1`); // marked, for a build of the built page
    const st = /(\sstyle\s*=\s*)("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(t.rawAttrs), old = st ? st[3] ?? st[4] ?? st[5] ?? '' : '';
    let tg = st ? open.replace(st[0], `${st[1]}"${old.replace(/;?\s*$/, '').replace(/"/g, '&quot;')}${old.trim() ? '; ' : ''}${body}"`) : `${open.slice(0, close)} style="${body}"${open.slice(close)}`;
    if (a.cls) { const c = /(\sclass\s*=\s*)("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(tg); tg = c ? tg.replace(c[0], `${c[1]}"${(c[3] ?? c[4] ?? c[5] ?? '').trim()} ${a.cls}"`) : tg.replace(/(\/?>)$/, ` class="${a.cls}"$1`); }
    if (!a.style.length) tg = tg.replace(/\sstyle=""(?=[\s/>])/, ''); // a class alone
    const rules = [...a.props.map(([n, inh]) => `@property ${n} { syntax: '<integer>'; inherits: ${inh}; initial-value: 0; }`), ...(a.css ? [a.css] : [])];
    liveEdits.push({ from: at, to: at + t.length, html: tg + (rules.length ? `<style>${rules.join(' ')}</style>` : '') + (a.inner ?? '') }); }
  let out = '', at = 0;
  for (const e of [...edits, ...liveEdits].sort((a, b) => a.from - b.from || a.to - b.to)) { out += src.slice(at, e.from) + e.html.replace(/<(figure|span) data-dcss-mathml(?=[\s>])/g, '<$1 data-dcss-mathml\u0001'); at = e.to; }
  out += src.slice(at);
  const report = buildReport(file, src, scopes, series, found, where, marks, answers);
  const linked = links(out, edits.length + liveEdits.length), print = fingerprint(linked.html.replaceAll('\u0001', '')); // each mark the build wrote carries it
  return { ...linked, html: linked.html.replaceAll('\u0001', `="${print}"`), calls: [...calls], count: edits.length, left, series: series.map(({ name, count, line, scope, slots }) => ({ name, count, line, scope, slots })), report };
}

// the build's report: the page's scopes, the names it reads, its series, each formula's result (folded when the page is
// built or live, what it reads, and when it has no answer: an input unset or not a number, a value outside the function's
// range, or too near halfway between two doubles to round), and the elements that read results. Written only when the
// build succeeds (a refused page has its reason instead)
const RANGE = { exp: 'x outside -708 to 709', log: 'x not above 2^-1022, or past e^708', trig: '|x| past 2^20 (csc and sec where they are infinite)', tan: '|x| past 2^20 (cot of 0)',
  acot: 'arccot of 0 or of |x| past 2^996', rhyp: '|x| past 709 for sech and csch, below 2^-1022 for csch and coth', asin: '|x| past 1', asec: '|x| below 1 (arccsc past 2^996)', nroot: 'x below 0 for an even degree', hyp: '|x| past 709 for sinh and cosh', ahyp: 'arccosh below 1, |arctanh| from 1, |x| past about 1.5e307', rahyp: 'arcsech outside 0 to 1, arccoth within ±1, |x| below 2^-1022 or past 2^996', gcd: 'a value not a whole number within ±2^53', lcm: 'a value not a whole number within ±2^53, or an lcm between arguments past it',
  factorial: 'n not a whole number from 0 to 170', binomial: 'n or k not whole, n past 170, or C(n, k) from 2^50', series: 'no slot present (d3 has no answer)', quotient: 'a or b not whole within ±2^26, or b is 0', rem: 'a or b not whole within ±2^26, or b is 0' };
const HALFWAY = new Set(['exp', 'log', 'trig', 'tan', 'atan', 'acot', 'asin', 'asec', 'rahyp', 'nroot', 'hyp', 'rhyp', 'ahyp']);
function buildReport(file, src, scopes, series, found, where, marks, answers) {
  const reads = (c) => [...new Set([...`${c.value} ${c.decls.join(' ')}`.matchAll(/var\(--([^\s,)]+)/g)].map((x) => x[1]).filter((x) => !x.startsWith('dcss-')))];
  const results = found.map((f, k) => { const c = f.compiled, live = [...f.report.mine].filter((x) => x in RANGE || HALFWAY.has(x) || x === 'eset'), names = reads(c), slots = [...f.report.slotsRead];
    const uses = [...f.report.uses], noAnswer = [...(names.length || slots.length ? [`an input it reads is unset, not a number, or from 3.4e38 up${names.length ? ` (${names.map((x) => `--${x}`).join(', ')})` : ''}`] : []),
      ...(uses.length ? [`a result it reads has none (${uses.join(', ')})`] : []),
      ...live.filter((x) => RANGE[x]).map((x) => `out of range: ${RANGE[x]}`), ...(live.some((x) => HALFWAY.has(x)) ? ['too near halfway between two doubles to round'] : [])];
    return { line: lineOf(src, f.math.start), scope: f.scope, kind: c.kind, name: c.name ?? null, inline: !!f.inline, answer: answers.get(k) ?? null,
      folded: !names.length && !slots.length && !uses.length && !live.length, live, reads: names, uses, series: slots.filter((x) => !x.startsWith('--')), compares: c.compares, noAnswer }; });
  const inputs = new Map(); results.forEach((r) => r.reads.forEach((x) => { const i = inputs.get(x) ?? { name: x, lines: [] }; i.lines.push(r.line); inputs.set(x, i); }));
  series.forEach((q) => q.slots.forEach((x) => { if (x.kind !== 'live') return; const i = inputs.get(x.name) ?? { name: x.name, lines: [] }; i.lines.push(x.line); inputs.set(x.name, i); }));
  return { file, scopes: scopes.slice(1).map(({ id, line, parent }) => ({ id, line, parent })), inputs: [...inputs.values()],
    series: series.map((q) => ({ name: q.name, line: q.line, scope: q.scope, count: q.count ?? null, slots: q.slots.length, live: q.slots.filter((x) => x.kind === 'live').length, missing: q.slots.filter((x) => x.kind === 'missing').length })),
    results, readers: marks.map((mk) => ({ kind: mk.kind, name: mk.name, line: mk.line, scope: mk.scope })) };
}

const FINGERPRINT = /\sdata-dcss-(?:built|mathml)="([0-9a-f]{16})"/, fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
// a formula's answer (= 118.5) in the font the browser draws the formula in, so the two read as one; the page's own CSS
// overrides either rule (no specificity). An answer written as text prints no second copy
// an output the build writes or reads into is no live region (ARIA's aria-live): one that changes with every input would be
// announced on each; inside a live region of the page's own (aria-live, a live role, an <output>) it is plain text, and
// the page's region speaks
const LIVE_ROLES = /^\s*(status|alert|log|timer|marquee)\b/i, QUIET = (live) => (live ? ' role="none"' : ' aria-live="off"');
// what an answer shows while it prints no number (none, or one its format can't print): a dash, there with no CSS too,
// hidden by the rule below once the output's format prints (format.css's --dcss-fmt-error 0 on it)
const NONE = '<span data-dcss-none>&#x2014;</span>';
const LAYOUT = '<style>@container style(--dcss-fmt-error: 0) { :where([data-dcss-none]) { display: none; } } :where(figure[data-dcss-mathml]) { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 0.5em; } :where(figure[data-dcss-mathml] > div, span[data-dcss-mathml]) { font-family: math; } :where(.dcss-text)::after { content: none !important; }</style>';
// the sheets the compiled calls need, linked beside the page's link to dcss (dcss.css, or dcss-array.css as published until 2026-10-30),
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

// run as a command, by any path to it (a link, macOS's /var for /private/var): a plain comparison of the two paths ran nothing
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  // node mathml.mjs page.html [built.html] [--report report.json] [--watch]: the built page to the file, written only when
  // the build succeeds, or to stdout; with --report, the build's report as JSON beside it, only then too; with --watch,
  // built again each time page.html is saved, a refusal printed and the last good page left as it was
  const args = process.argv.slice(2), watch = args.includes('--watch'), rest = args.filter((a) => a !== '--watch'), ri = rest.indexOf('--report'), rep = ri >= 0 ? rest[ri + 1] : null;
  const [file, to] = rest.filter((_, i) => ri < 0 || (i !== ri && i !== ri + 1));
  if (args.some((a) => /^(-h|--help)$/.test(a))) { console.log('usage: node mathml.mjs <page.html> [built.html] [--report report.json] [--watch]  (with no second file, the page goes to stdout; --watch needs it)'); process.exit(0); }
  if (!file || (ri >= 0 && !rep) || (watch && !to)) { console.error('usage: node mathml.mjs <page.html> [built.html] [--report report.json] [--watch]  (with no second file, the page goes to stdout; --watch needs it)'); process.exit(1); }
  const once = () => { const r = toDcss(readFileSync(file, 'utf8'), { file });
    if (r.needs.length) throw new Error(`${file}: the page links no dcss sheet: link ${manifest.core.file} (it brings ${r.needs.join(', ')} beside it); nothing written`);
    if (to) writeFileSync(to, r.html); else process.stdout.write(r.html);
    // a <math> with no Content MathML is copied as it is, said once on stderr (a clean-room trial, 2026-10-30: LaTeX in an
    // annotation built to an unchanged page with no word)
    if (r.left.length) console.error(`${file}:${r.left.join(', ')}: ${r.left.length} <math> left as written: only Content MathML computes (an <apply> or a <piecewise>); from LaTeX, latexmlmath --cmml=- writes it`);
    if (rep) writeFileSync(rep, JSON.stringify(r.report, null, 2) + '\n');
    return r; };
  if (!watch) { try { once(); } catch (e) { console.error(e.message); process.exit(1); } }
  else { const build = () => { try { const r = once(); console.log(`${to}: ${r.count} formula${r.count === 1 ? '' : 's'}, ${r.series.length} series`); } catch (e) { console.error(e.message); } };
    let timer = null; build(); watchFile(file, { interval: 200 }, () => { clearTimeout(timer); timer = setTimeout(build, 50); }); console.log(`watching ${file}`); }
}
