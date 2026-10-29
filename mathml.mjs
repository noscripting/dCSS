// node libraries/dcss/mathml.mjs <page.html>: a page whose dcss calls are written in Content MathML, with today's dcss
// markup in their place, on stdout; exits 1 with file:line and the reason on a formula it can't take.
// Content MathML (MathML 4, chapter 4) says what a formula means; Chrome and Safari draw none of it and CSS can't read a
// <cn>'s text, so a page can't compute on it: this build writes each formula as the call dcss computes in the browser,
// and keeps the formula, as Presentation MathML with the author's Content MathML as its annotation, for readers.
//   <math><apply><median/><cn>4</cn><cn>1</cn><ci>jan</ci></apply></math>
// becomes a figure with the formula as its caption and a .dcss-median call: <li style="--value: 4">, ... and
// --value: var(--jan, 0.001) for the <ci> (a name the page never sets is off the 1/64 grid, so no answer, not a list one
// short). An <apply> inside another is its own call, computed first, its answer the outer call's item. Only a <math>
// whose one element child is an <apply> of a dcss operator is compiled; the rest of the page is copied byte for byte, so
// the build run on its own output changes nothing.
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

// --- numbers: exact, as a fraction of BigInts
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const frac = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
const decimal = (s) => { const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s); if (!m || !(m[2] || m[3])) return null;
  let n = BigInt((m[2] || '0') + (m[3] || '')) * (m[1] === '-' ? -1n : 1n), d = 10n ** BigInt((m[3] || '').length);
  const e = +(m[4] || 0); if (e > 0) n *= 10n ** BigInt(e); else if (e < 0) d *= 10n ** BigInt(-e); return frac(n, d); };
const plain = ({ n, d }) => { // a fraction whose denominator divides 64, as the shortest exact decimal
  const neg = n < 0n, a = neg ? -n : n, whole = a / d, rest = a % d;
  let f = ''; if (rest) { f = ((rest * 1000000n) / d).toString().padStart(6, '0').replace(/0+$/, ''); }
  return (neg ? '-' : '') + whole + (f ? '.' + f : ''); };
function number(cn) {
  const type = cn.attrs.type ?? 'real', base = cn.attrs.base;
  if (base !== undefined && base.trim() !== '10') throw refusal(cn.start, `<cn base="${base}">: this build reads numbers in base 10 only`);
  for (const k of Object.keys(cn.attrs)) if (!['type', 'base', 'id', 'xref', 'class', 'style', 'href', 'encoding'].includes(k)) throw refusal(cn.start, `<cn ${k}="…">: an attribute this build doesn't take`);
  const parts = []; let cur = '';
  for (const c of cn.children) { if (c.name === 'sep') { parts.push(cur); cur = ''; } else if (c.name) throw refusal(c.start, `<${c.name}> inside a <cn>: a number is text`); else cur += c.text; }
  parts.push(cur); const p = parts.map((x) => x.trim());
  const bad = () => refusal(cn.start, `<cn${type === 'real' ? '' : ` type="${type}"`}>${p.join('<sep/>')}</cn> is not a number this build reads`);
  let v;
  if (['real', 'integer', 'double'].includes(type)) {
    if (p.length !== 1) throw bad();
    if (type === 'integer' ? !/^[+-]?\d+$/.test(p[0]) : !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(p[0]) || (type !== 'double' && /[eE]/.test(p[0]))) throw bad();
    v = decimal(p[0]);
  } else if (type === 'e-notation') {
    if (p.length !== 2 || !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(p[0]) || !/^[+-]?\d+$/.test(p[1])) throw bad();
    v = decimal(`${p[0]}e${p[1]}`);
  } else if (type === 'rational') {
    if (p.length !== 2 || !/^[+-]?\d+$/.test(p[0]) || !/^[+-]?\d+$/.test(p[1]) || /^[+-]?0+$/.test(p[1])) throw bad();
    v = frac(BigInt(p[0]), BigInt(p[1]));
  } else throw refusal(cn.start, `<cn type="${type}">: this build reads integer, real, double, e-notation and rational numbers`);
  if (!v) throw bad();
  v.text = p.join(type === 'rational' ? '/' : 'e');
  return v;
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
// a <ci> name the sheet itself sets on the items or their call: the item would read that, not the page's value
const RESERVED = /^(value|dcss-.*)$/;
const RANGE = { // the call's inputs (README's tables), as exact checks
  median: (v) => onGrid(v) && (whole(v) ? v.n >= -131072n && v.n <= 8257535n : v.n >= -131072n * v.d && v.n <= 131071n * v.d),
  min: (v) => onGrid(v) && (whole(v) ? v.n >= -131072n && v.n <= 8257535n : v.n >= -131072n * v.d && v.n <= 131072n * v.d),
  mean: (v) => onGrid(v) && v.n >= -1024n * v.d, sum: (v) => onGrid(v) };
RANGE.max = RANGE.min;
const onGrid = (v) => 64n % v.d === 0n, whole = (v) => v.d === 1n;

function compile(math) {
  if ('cdgroup' in math.attrs) throw refusal(math.start, 'a cdgroup could rename the symbols');
  return call(elements(math)[0]);
}
// one <apply>: its call and its items, each a number ({ v }), a name ({ ci }) or another <apply> ({ node }, with its
// exact value { v } when every number under it is written)
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
  const name = CALLS[op], items = args.map((a) => {
    if (a.name === 'apply') { // computed first; its answer is this call's item, so it must be one this call takes
      const node = call(a), v = valueOf(node);
      if (v && !RANGE[name](v)) throw refusal(a.start, `${node.op}(…) is ${v.text}, which ${name === 'sum' ? 'a sum' : 'the ' + name} can't take: ${onGrid(v) ? rangeWhy(name, v) : 'it is not on the 1/64 grid'}`);
      return { node, v };
    }
    if (a.name === 'cn') { const v = number(a); if (!RANGE[name](v)) throw refusal(a.start, rangeWhy(name, v)); return { v }; }
    if (elements(a).length) throw refusal(a.start, '<ci> with markup inside: a name is text');
    if ('type' in a.attrs) throw refusal(a.start, `<ci type="${a.attrs.type}"> names a collection or another kind of value`);
    const id = textOf(a).trim();
    if (!/^-?[_a-zA-Z][-_a-zA-Z0-9]*$/.test(id)) throw refusal(a.start, `<ci>${id}</ci>: a name must be a CSS identifier`);
    if (RESERVED.test(id)) throw refusal(a.start, `<ci>${id}</ci>: --${id} is a name dcss itself reads or writes`);
    return { ci: id };
  });
  if (name === 'median' && items.length > 64) throw refusal(apply.start, `a median of ${items.length} items: the sheet takes 64`);
  const known = items.filter((x) => x.v);
  if (known.length === items.length) { // a list of numbers only: what Chrome reads exactly (README, Performance), 64ths below 2^18 px
    const vs = known.map((x) => Number(x.v.n) / Number(x.v.d)), part = known.some((x) => !whole(x.v)), limit = part ? 2 ** 18 : 2 ** 24;
    const pos = vs.reduce((s, x) => s + Math.max(0, x), 0), neg = vs.reduce((s, x) => s + Math.max(0, -x), 0), negs = vs.filter((x) => x < 0).length;
    const lost = name === 'sum' ? Math.max(pos, neg) >= limit
      : name === 'mean' ? pos - neg + 1024 * negs >= limit || (part && negs >= 64)
      : name === 'min' || name === 'max' ? 2 * (Math.max(...vs) - Math.min(...vs)) + 1 >= limit : false;
    if (lost) throw refusal(apply.start, `Chrome reads this ${name} without its ${part ? '64ths' : 'whole numbers'}: ${name === 'sum' ? 'its positive or negative values add up' : name === 'mean' ? 'its values and 1024 for each negative one add up' : 'twice its spread is'} past ${part ? '262,144' : '16,777,216'}${name === 'mean' && negs >= 64 ? ', or it has 64 negative values' : ''}`);
  }
  return { op, call: name, items, start: apply.start };
}
// a call's exact answer, as d3 gives it, when every number under it is written; null with a <ci> under it
const cmp = (a, b) => (a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0);
const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
function valueOf({ call, items }) {
  if (items.some((x) => !x.v)) return null;
  const vs = items.map((x) => x.v), sorted = [...vs].sort(cmp), total = vs.reduce(add, frac(0n));
  const v = call === 'sum' ? total : call === 'mean' ? frac(total.n, total.d * BigInt(vs.length)) : call === 'min' ? sorted[0] : call === 'max' ? sorted.at(-1)
    : sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : frac(add(sorted[sorted.length / 2 - 1], sorted[sorted.length / 2]).n, add(sorted[sorted.length / 2 - 1], sorted[sorted.length / 2]).d * 2n);
  let d = v.d; while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n;   // a decimal ends when the denominator is 2s and 5s
  return { ...v, text: d === 1n && 1000000n % v.d === 0n ? plain(v) : `${v.n}/${v.d}` };
}
const rangeWhy = (call, v) => !onGrid(v) ? `${v.text} is not on the 1/64 grid (12.25 is, 12.3 isn't): give tenths or cents as whole numbers and scale the answer`
  : call === 'mean' ? 'the mean takes values from -1024' : call === 'sum' ? '' : 'past the median, min and max range: 64ths within ±131,072, whole numbers from -131,072 to 8,257,535';

// --- what the page gets
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const FORMAT_SETTINGS = /^--(precision|comma|symbol|sign|trim|type|currency|locale|base|grouping|zero|fill|align|width|percent)$/;
const splitStyle = (s) => (s ?? '').split(';').map((d) => d.trim()).filter(Boolean).map((d) => { const k = d.indexOf(':'); return [d.slice(0, k).trim(), d.slice(k + 1).trim()]; });
function write(root, math, src) {
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
      const s = plain(x.v);
      return s.startsWith('-') ? (op === 'plus' ? `<mrow${a}><mo>(</mo><mo>−</mo><mn>${s.slice(1)}</mn><mo>)</mo></mrow>` : `<mrow${a}><mo>−</mo><mn>${s.slice(1)}</mn></mrow>`) : `<mn${a}>${s}</mn>`;
    });
    const intent = `${op}(${items.map((_, i) => `$a${i + 1}`).join(',')})`;
    return op === 'plus' ? `<mrow${arg} intent="${intent}">${inSum ? '<mo>(</mo>' : ''}${shown.join('<mo>+</mo>')}${inSum ? '<mo>)</mo>' : ''}</mrow>`
      : `<mrow${arg} intent="${intent}"><mi>${op}</mi><mo>⁡</mo><mrow><mo>(</mo>${shown.join('<mo>,</mo>')}<mo>)</mo></mrow></mrow>`;
  };
  const mathAttrs = Object.entries(math.attrs).filter(([k]) => !['class', 'style'].includes(k)).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
    + (keep.length ? ` class="${esc(keep.join(' '))}"` : '') + (mathDecls.length ? ` style="${esc(css(mathDecls))}"` : '');
  const annotation = src.slice(elements(math)[0].start, elements(math)[0].end);
  const caption = `<figcaption style="overflow-x: auto"><math${mathAttrs}><semantics>${pres(root)}<annotation-xml encoding="application/mathml-content+xml">${annotation}</annotation-xml></semantics></math></figcaption>`;
  // the calls in the order they compute, an <apply> inside another first. A call's answer reaches only what is inside
  // the element after its list, so each inner call's figure holds the next, and its answer is copied there to a name of
  // its own (README, Using two calls together): --dcss-dcss-arg-k for the k-th, read by the item it is
  const order = [], line = (n) => { const items = n.items.map((x) => (x.node ? { arg: line(x.node) } : x)); order.push({ ...n, items }); return order.length; };
  line(root);
  const inner = order.slice(0, -1), last = order.at(-1), nested = inner.length > 0;
  const lis = (c) => c.items.map((x) => `<li style="--value: ${x.arg ? `var(--dcss-dcss-arg-${x.arg})` : x.ci ? `var(--${x.ci}, 0.001)` : plain(x.v)}"></li>`).join('');
  // where a call's answer is: in the children of the element after its list; the median's, of the third of three
  const reach = (c) => (c === 'median' ? ['<div><div><div><div>', '</div></div></div></div>'] : ['<div><div>', '</div></div>']);
  // the first figure is one line, clipped; the ones inside it take no height and the page's width, so the last answer
  // prints on that line however narrow the lists before it are (each figure clips across at its own width)
  let open = '', close = '';
  inner.forEach((c, i) => { const k = i + 1, [o, cl] = reach(c.call);
    open += `<figure class="dcss-${c.call}" style="${i ? 'margin: 0; height: 0; width: 100vw' : 'margin: 0; height: 1lh; overflow: clip'}"><ol aria-hidden="true">${lis(c)}</ol>${o}<div data-dcss-arg="${k}" style="--dcss-dcss-arg-${k}: var(--dcss-${c.call})">`;
    close = `</div>${cl}</figure>${close}`; });
  // an inner call with no answer gives the call that takes it none: its copy becomes 0.001, off the 1/64 grid (an item
  // with no number would be skipped, giving another list's answer)
  const voids = nested ? `<style>${[1, 2].map((e) => `@container style(--dcss-err: ${e}) { ${inner.map((_, i) => `[data-dcss-arg="${i + 1}"] { --dcss-dcss-arg-${i + 1}: 0.001 !important; }`).join(' ')} }`).join(' ')}</style>` : '';
  const result = `--dcss-${last.call}`;
  let answer;
  if (last.call === 'median') { // the median prints through a formatter: the author's, or d3.format(",") as the other calls print
    const f = fmt.length ? fmt.join(' ') : 'dcss-format-general', st = fmt.length ? css(fmtDecls) : fmtDecls.length ? css(fmtDecls) : '--comma: 1';
    answer = `<div><div><div><output class="${f}" style="--value: var(${result})${st ? '; ' + st : ''}"></output></div></div></div>`;
  } else if (fmt.length) answer = `<div><output class="${fmt.join(' ')}" style="--value: var(${result})${fmtDecls.length ? '; ' + css(fmtDecls) : ''}"></output></div>`;
  else answer = '<output></output>'; // the call prints its own answer, as d3.format(",") does, when the <output> follows its list
  const callStyle = (last.call === 'median' ? 'margin: 0' : 'margin: 0; height: 1lh; overflow: clip') + (nested ? '; width: 100vw' : '');
  return `<figure data-dcss-mathml${varDecls.length ? ` style="${esc(css(varDecls))}"` : ''}>${caption}${voids}${open}<figure class="dcss-${last.call}" style="${callStyle}"><ol aria-hidden="true">${lis(last)}</ol>${answer}</figure>${close}</figure>`;
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
    edits.push({ from, to, html: write(compiled, math, src) }); const each = (n) => { calls.add(n.call); n.items.forEach((x) => x.node && each(x.node)); }; each(compiled);
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
