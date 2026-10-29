// node libraries/dcss/mathml.mjs <page.html>: a page whose formulas are written in Content MathML, each compiled to a
// calc() the page computes, on stdout; exits 1 with file:line and the reason on a formula it can't take.
// Content MathML (MathML 4, chapter 4) says what a formula means; Chrome and Safari draw none of it and CSS can't read a
// <cn>'s text, so a page can't compute on it: this build writes each formula as the calc() of d3's own operations, and
// keeps the formula, as Presentation MathML with the author's Content MathML as its annotation, for readers.
//   <math><apply><median/><apply><mean/><cn>4</cn><cn>1.5</cn></apply><ci>jan</ci></apply></math>
// becomes a figure with the formula as its caption and an <output> whose --value is d3.median([d3.mean([4, 1.5]),
// jan]) to the bit, jan read from --jan on an ancestor (unset: no answer, --dcss-err 1). Only a <math> whose one element
// child is an <apply> of an operator it takes is compiled; the rest of the page is copied byte for byte, so the build
// run on its own output changes nothing.
import { readFileSync } from 'node:fs';
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
  return { x, neg: x < 0 || Object.is(x, -0), mag };
}

// --- the operators: Content MathML's elements and their OpenMath symbols (MathML 4, appendix E; F.8.3 for s_data1)
const CALLS = { median: 'median', mean: 'mean', min: 'min', max: 'max', plus: 'sum' };
const SYMBOLS = { s_data1: ['median', 'mean'], minmax1: ['min', 'max'], arith1: ['plus'] };
const WHY = {
  sum: '<sum/> binds a variable over limits; a list of numbers is added with <plus/>',
  variance: "MathML doesn't say it divides by n - 1, as d3 and dcss do", sdev: "MathML doesn't say it divides by n - 1, as d3 and dcss do",
  mode: 'dcss has no mode', moment: 'dcss has no moment', card: "a set's size drops repeated values, which d3.count counts",
};
const QUALIFIERS = new Set(['bvar', 'condition', 'domainofapplication', 'lowlimit', 'uplimit', 'degree', 'momentabout', 'interval']);
// a <ci> name dcss reads or writes itself: the formula would read that, not the page's value
const RESERVED = /^(value|dcss-.*)$/;

function compile(math) {
  if ('cdgroup' in math.attrs) throw refusal(math.start, 'a cdgroup could rename the symbols');
  const root = call(elements(math)[0]), out = emit(root);
  if (out.compares > MAX_COMPARES) throw refusal(math.start, `this formula's medians compare ${out.compares.toLocaleString('en-US')} pairs of values the page sets, past the ${MAX_COMPARES.toLocaleString('en-US')} this build writes: give a long list as a .dcss-median call (README, Writing a call)`);
  return { root, ...out };
}
// one <apply>: its call and its items, each a number ({ x }), a name ({ ci }) or another <apply> ({ node })
function call(apply) {
  const kids = elements(apply), head = kids[0];
  if (!head) throw refusal(apply.start, 'an empty <apply>');
  if (head.name === 'apply') throw refusal(head.start, 'a nested <apply> as the operator: one operator applied to numbers');
  let op, args = kids.slice(1);
  if (head.name === 'csymbol') {
    const cd = head.attrs.cd, name = textOf(head).trim();
    if (!SYMBOLS[cd]?.includes(name)) throw refusal(head.start, `<csymbol cd="${cd}">${name}</csymbol> is not an operator this build takes (s_data1 median and mean, minmax1 min and max, arith1 plus)`);
    op = name;
    if (cd === 'minmax1') { // min and max are unary on a set (MathML 4, F.5.1): unwrap <apply><csymbol cd="set1">set</csymbol>…</apply>
      const set = args[0], sh = set && elements(set)[0];
      if (args.length !== 1 || set.name !== 'apply' || sh?.name !== 'csymbol' || sh.attrs.cd !== 'set1' || textOf(sh).trim() !== 'set') throw refusal(head.start, 'minmax1 min and max take one set1 set: <apply><csymbol cd="set1">set</csymbol>…</apply>');
      args = elements(set).slice(1);
    }
  } else {
    if (!blank(head) || elements(head).length) throw refusal(head.start, `<${head.name}> is an operator: write it empty, <${head.name}/>`);
    for (const k of ['definitionurl', 'encoding']) if (k in head.attrs) throw refusal(head.start, `<${head.name} ${k}="…">: the operator would mean another function`);
    if (!(head.name in CALLS)) throw refusal(head.start, WHY[head.name] ?? `<${head.name}/> has no dcss call (this build takes median, mean, min, max and plus)`);
    op = head.name;
  }
  for (const a of args) if (QUALIFIERS.has(a.name)) throw refusal(a.start, `<${a.name}>: qualifiers aren't taken, only numbers`);
  for (const a of args) if (!['cn', 'ci', 'apply'].includes(a.name)) throw refusal(a.start, `<${a.name}> as an argument: only <cn> numbers, <ci> names and another <apply>`);
  if (!args.length) throw refusal(apply.start, `${op} of nothing`);
  if (op === 'plus' && args.length < 2) throw refusal(apply.start, 'plus of one argument');
  if (args.length === 1 && args[0].name === 'ci') throw refusal(args[0].start, `one <ci> alone: MathML reads it as a data set (MathML 4, §4.3.5.13), not one value`);
  const items = args.map((a) => {
    if (a.name === 'apply') return { node: call(a) };
    if (a.name === 'cn') return number(a);
    if (elements(a).length) throw refusal(a.start, '<ci> with markup inside: a name is text');
    if ('type' in a.attrs) throw refusal(a.start, `<ci type="${a.attrs.type}"> names a collection or another kind of value`);
    const id = textOf(a).trim();
    if (!/^-?[_a-zA-Z][-_a-zA-Z0-9]*$/.test(id)) throw refusal(a.start, `<ci>${id}</ci>: a name must be a CSS identifier`);
    if (RESERVED.test(id)) throw refusal(a.start, `<ci>${id}</ci>: --${id} is a name dcss itself reads or writes`);
    return { ci: id };
  });
  return { op, call: CALLS[op], items, start: apply.start };
}

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
const sel = (g, x) => `clamp(-1 * (pow(2, 2000 * ${g}) - 1), ${x}, pow(2, 2000 * ${g}) - 1)`;
// Chrome divides numbers exactly and lengths as a · (1/b), WebKit the other way round (number.mjs cssDiv), and in Chrome a
// length anywhere under a division makes it a length's (a mean of means read 1 ulp off): so each declaration is written
// twice, every division a number's and every division a length's, and the engine's flag picks one whole form
const DIVIDE = { plain: (a, n) => `((${a}) / ${n})`, length: (a, n) => `(((${a}) * 1px) / (${n} * 1px))` };
const either = (plain, length) => (plain === length ? plain : `${sel(`(1 - ${W})`, plain)} + ${sel(W, length)}`);
const SPLIT = { e: (n, v) => `round(down, log(max(abs(${v}), pow(2, -1006)), 2))`, a: (n, v) => `round(to-zero, ${v} * pow(2, 17 - var(${n}-e)))`,
  b: (n, v) => `round(to-zero, rem(${v} * pow(2, 17 - var(${n}-e)), 1) * 524288)`, c: (n, v) => `calc(rem(${v} * pow(2, 17 - var(${n}-e)) * 524288, 1) * 524288)` };
const join = (n) => `((var(${n}-a) + var(${n}-b) / 524288 + var(${n}-c) / 274877906944) * pow(2, var(${n}-e) - 17))`;
// d3's answer in JavaScript's doubles, when every number under it is written (null with a <ci> under it)
const D3 = {
  sum: (xs) => xs.reduce((s, x) => s + x, 0), mean: (xs) => xs.reduce((s, x) => s + x, 0) / xs.length,
  min: (xs) => Math.min(...xs), max: (xs) => Math.max(...xs),
  median: (xs) => { const s = [...xs].sort((a, b) => a - b), i0 = Math.floor((s.length - 1) / 2); return s.length % 2 ? s[i0] : s[i0] + (s[i0 + 1] - s[i0]) * 0.5; },
};
const valueOf = (node) => { const xs = node.items.map((x) => (x.node ? valueOf(x.node) : x.ci ? null : x.x)); return xs.includes(null) ? null : D3[node.call](xs); };
// a median of n values the page sets compares n · (n - 1) pairs: 2,048 is a median of 45 names, 93 KB of style, a change
// 0.1 ms of style work in Chrome and WebKit (2026-10-29)
const MAX_COMPARES = 2048;
// the formula in one form of division: the answer's expression and the registered steps before it, as [name, expression]
function form(root, divide) {
  const decls = [], names = new Set(); let id = 0, compares = 0;
  const expr = (node) => {
    const k = ++id, xs = node.items.map((x) => (x.node ? expr(x.node) : x.ci ? (names.add(x.ci), `var(--${x.ci})`) : String(x.x)));
    const total = () => xs.reduce((a, b) => F(`${a} + ${b}`));
    if (node.call === 'sum') return total();
    if (node.call === 'mean') return divide(total(), xs.length);
    if (node.call !== 'median') return `${node.call}(${xs.join(', ')})`;
    const n = xs.length; if (n === 1) return xs[0];
    const known = node.items.map((x) => (x.node ? valueOf(x.node) : x.ci ? null : x.x));
    const live = known.includes(null); // with every value known the order is the build's, and nothing is compared in CSS
    const ref = xs.map((x, i) => { if (!live || !node.items[i].node) return x; const p = `--dcss-dcss-m${k}-${i}`; for (const q of 'eabc') decls.push([`${p}-${q}`, SPLIT[q](p, x)]); return join(p); });
    // j goes before i when it is smaller, or equal and earlier
    const rank = xs.map((_, i) => { let c = 0; const terms = [];
      for (let j = 0; j < n; j++) if (j !== i) {
        if (known[i] !== null && known[j] !== null) c += (j < i ? known[j] <= known[i] : known[j] < known[i]) ? 1 : 0;
        else { compares++; terms.push(j < i ? `(1 - sign(max(0, ${ref[j]} - ${ref[i]})))` : `sign(max(0, ${ref[i]} - ${ref[j]}))`); } }
      if (!terms.length) return c;
      const r = `--dcss-dcss-r${k}-${i}`; decls.push([r, `calc(${[c, ...terms].join(' + ')})`]); return r; });
    const pick = (t) => { const hits = rank.map((r, i) => (typeof r === 'number' ? (r === t ? ref[i] : null) : `${ref[i]} * (1 - abs(sign(var(${r}) - ${t})))`)).filter(Boolean);
      return hits.length === 1 ? hits[0] : `(${hits.join(' + ')})`; };
    const i0 = Math.floor((n - 1) / 2);
    // every expression stands alone (a fenced sum, a function, a parenthesis), so what is written around it can't regroup it
    return n % 2 ? pick(i0) : F(`${F(pick(i0))} + ${F(`${F(`${pick(i0 + 1)} - ${pick(i0)}`)} * 0.5`)}`);
  };
  const value = expr(root);
  // a name the page doesn't set (or sets to no number) leaves no answer: --value fails with it, and so does a registered
  // step that took it (its initial 0 would be a number): 0 / 0 then
  if (names.size) decls.push(['--dcss-dcss-ok', `calc(${[...names].map((n) => `var(--${n}) * 0`).join(' + ')} + 1)`]);
  return { value: `${value}${names.size ? ' + 0 / var(--dcss-dcss-ok)' : ''}`, decls, compares };
}
function emit(root) {
  const plain = form(root, DIVIDE.plain), length = form(root, DIVIDE.length);
  return { value: `calc(${either(plain.value, length.value)})`, decls: plain.decls.map(([k, v], i) => `${k}: calc(${either(v, length.decls[i][1])});`),
    ints: plain.decls.map(([k]) => k), compares: plain.compares };
}

// --- what the page gets
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const FORMAT_SETTINGS = /^--(precision|comma|symbol|sign|trim|type|currency|locale|base|grouping|zero|fill|align|width|percent)$/;
const splitStyle = (s) => (s ?? '').split(';').map((d) => d.trim()).filter(Boolean).map((d) => { const k = d.indexOf(':'); return [d.slice(0, k).trim(), d.slice(k + 1).trim()]; });
function write({ root, value, decls: own, ints }, math, src) {
  const classes = (math.attrs.class ?? '').split(/\s+/).filter(Boolean), fmt = classes.filter((c) => c.startsWith('dcss-format-')), keep = classes.filter((c) => !c.startsWith('dcss-format-'));
  const decls = splitStyle(math.attrs.style), fmtDecls = decls.filter(([k]) => FORMAT_SETTINGS.test(k)), varDecls = decls.filter(([k]) => k.startsWith('--') && !FORMAT_SETTINGS.test(k)), mathDecls = decls.filter(([k]) => !k.startsWith('--'));
  const css = (ds) => ds.map(([k, v]) => `${k}: ${v}`).join('; ');
  // the formula, for readers: function notation, plus as a sum (in parentheses inside another sum); U+2061 after a
  // function's name; a negative as an operator. Each argument is named for its call's intent; the search for a name
  // stops at an element with its own intent (MathML 4, 5.1), so an inner call's names are its own
  const pres = ({ op, items }, arg = '', inSum = false) => {
    const shown = items.map((x, i) => {
      const a = ` arg="a${i + 1}"`;
      if (x.node) return pres(x.node, a, op === 'plus');
      if (x.ci) return `<mi${a}>${esc(x.ci)}</mi>`;
      if (!x.neg) return x.mag.startsWith('<mn>') && x.mag.indexOf('<', 1) === x.mag.indexOf('</mn>') ? `<mn${a}>${x.mag.slice(4)}` : `<mrow${a}>${x.mag}</mrow>`;
      return op === 'plus' ? `<mrow${a}><mo>(</mo><mo>−</mo>${x.mag}<mo>)</mo></mrow>` : `<mrow${a}><mo>−</mo>${x.mag}</mrow>`;
    });
    const intent = `${op}(${items.map((_, i) => `$a${i + 1}`).join(',')})`;
    return op === 'plus' ? `<mrow${arg} intent="${intent}">${inSum ? '<mo>(</mo>' : ''}${shown.join('<mo>+</mo>')}${inSum ? '<mo>)</mo>' : ''}</mrow>`
      : `<mrow${arg} intent="${intent}"><mi>${op}</mi><mo>⁡</mo><mrow><mo>(</mo>${shown.join('<mo>,</mo>')}<mo>)</mo></mrow></mrow>`;
  };
  const mathAttrs = Object.entries(math.attrs).filter(([k]) => !['class', 'style'].includes(k)).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
    + (keep.length ? ` class="${esc(keep.join(' '))}"` : '') + (mathDecls.length ? ` style="${esc(css(mathDecls))}"` : '');
  const annotation = src.slice(elements(math)[0].start, elements(math)[0].end);
  const caption = `<figcaption style="overflow-x: auto"><math${mathAttrs}><semantics>${pres(root)}<annotation-xml encoding="application/mathml-content+xml">${annotation}</annotation-xml></semantics></math></figcaption>`;
  // the answer prints through a formatter: the author's, or d3.format(",") (format-general with commas)
  const f = fmt.length ? fmt.join(' ') : 'dcss-format-general', st = fmt.length || fmtDecls.length ? css(fmtDecls) : '--comma: 1';
  const props = ints.length ? `<style>${ints.map((n) => `@property ${n} { syntax: '<integer>'; inherits: false; initial-value: 0; }`).join(' ')}</style>` : '';
  const answer = `<output class="${f}" style="${own.length ? own.join(' ') + ' ' : ''}--value: ${value}${st ? '; ' + st : ''}"></output>`;
  return `<figure data-dcss-mathml${varDecls.length ? ` style="${esc(css(varDecls))}"` : ''}>${caption}${props}<div>${answer}</div></figure>`;
}

// --- the page: each <math> the parser would build, compiled when it is one <apply> of an operator
const lineOf = (src, at) => src.slice(0, at).split('\n').length;
export function toDcss(src, { file = 'page.html' } = {}) {
  const edits = [], calls = new Set(); let i = 0, pOpen = null; // pOpen: the start of an open <p>, or null
  while (i < src.length) {
    const lt = src.indexOf('<', i); if (lt < 0) break;
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e < 0 ? src.length : e + 3; continue; }
    if (src[lt + 1] === '!' || src[lt + 1] === '?') { const e = src.indexOf('>', lt); i = e < 0 ? src.length : e + 1; continue; }
    const t = tagAt(src, lt);
    if (!t) { i = lt + 1; continue; }
    if (!t.close && RAW.has(t.name)) { const e = src.toLowerCase().indexOf(`</${t.name}`, lt + t.length); i = e < 0 ? src.length : e; continue; }
    if (t.close) { if (t.name === 'p') pOpen = null; i = lt + t.length; continue; }
    if (t.name === 'p') pOpen = { start: lt, end: lt + t.length };
    else if (CLOSES_P.has(t.name)) pOpen = null;
    if (t.name !== 'svg' && t.name !== 'math') { i = lt + t.length; continue; }
    if (t.name === 'svg') { const e = src.toLowerCase().indexOf('</svg', lt); i = e < 0 ? src.length : e; continue; }
    let math;
    try { math = parseMath(src, lt); } catch (e) { if (e instanceof Refusal) throw new Error(`${file}:${lineOf(src, e.at)}: ${e.message}`); throw e; }
    i = math.end;
    const kids = elements(math);
    if (kids.length !== 1 || kids[0].name !== 'apply' || !blank(math)) {
      // a formula with Content MathML outside an annotation would draw nothing in Chrome and Safari
      const loose = (n) => elements(n).some((c) => c.name === 'annotation-xml' || c.name === 'annotation' ? false : ['apply', 'cn', 'ci', 'csymbol', 'bind'].includes(c.name) || loose(c));
      if (loose(math)) throw new Error(`${file}:${lineOf(src, math.start)}: Content MathML outside an annotation draws nothing in Chrome and Safari; this build compiles a <math> whose one element is an <apply>`);
      continue;
    }
    let compiled;
    try { compiled = compile(math); } catch (e) { if (e instanceof Refusal) throw new Error(`${file}:${lineOf(src, e.at)}: ${e.message}`); throw e; }
    let from = math.start, to = math.end;
    if (pOpen) { // a formula alone in a paragraph takes the paragraph's place; beside text the figure's list would close it
      const before = src.slice(pOpen.end, math.start), after = src.slice(math.end), close = /^\s*<\/p\s*>/i.exec(after), next = /^\s*<([a-z][a-z0-9]*)/i.exec(after);
      const alone = !before.trim() && (close || /^\s*$/.test(after) || (next && CLOSES_P.has(next[1].toLowerCase())));
      if (!alone) throw new Error(`${file}:${lineOf(src, math.start)}: a formula beside text in a paragraph: the call's list would close the paragraph; give the formula its own line`);
      from = pOpen.start; to = close ? math.end + close[0].length : math.end; pOpen = null;
    }
    edits.push({ from, to, html: write(compiled, math, src) }); const each = (n) => { calls.add(n.call); n.items.forEach((x) => x.node && each(x.node)); }; each(compiled.root);
  }
  let out = '', at = 0;
  for (const e of edits) { out += src.slice(at, e.from) + e.html; at = e.to; }
  out += src.slice(at);
  return { ...links(out, edits.length), calls: [...calls], count: edits.length };
}

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
  const file = process.argv[2];
  if (!file) { console.error('usage: node mathml.mjs <page.html>  (writes the page to stdout)'); process.exit(1); }
  try { const r = toDcss(readFileSync(file, 'utf8'), { file }); process.stdout.write(r.html); if (r.needs.length) console.error(`${file}: ${r.count} formulas compiled; the page links no dcss sheet: it needs ${manifest.core.file} and ${r.needs.join(', ')}`); }
  catch (e) { console.error(e.message); process.exit(1); }
}
