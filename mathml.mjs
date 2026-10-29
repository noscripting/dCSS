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
const CALLS = { median: 'median', mean: 'mean', min: 'min', max: 'max', plus: 'sum',
  minus: 'minus', times: 'times', divide: 'divide', power: 'power', root: 'root', abs: 'abs', floor: 'floor', ceiling: 'ceiling' };
const SYMBOLS = { s_data1: ['median', 'mean'], minmax1: ['min', 'max'], arith1: ['plus', 'minus', 'unary_minus', 'times', 'divide', 'power', 'root', 'abs'], rounding1: ['floor', 'ceiling'] };
// how many arguments each takes, past the statistics' lists
const ARITY = { minus: [1, 2], divide: [2, 2], power: [2, 2], root: [1, 1], abs: [1, 1], floor: [1, 1], ceiling: [1, 1], times: [2, Infinity], plus: [2, Infinity] };
// CSS's exp(), log() and trigonometric functions round otherwise than JavaScript's Math (to the bit, 300 values each,
// 2026-10-29: sin() 95 the same in Chrome, tan() 85 in WebKit, log(x, 10) 175 and 131, exp() 266 in both)
const INEXACT = "CSS's exp(), log() and trigonometric functions don't give JavaScript's Math to the bit (sin(): 95 of 300 values in Chrome; tan(): 85 in WebKit)";
const WHY = {
  ...Object.fromEntries(['exp', 'ln', 'log', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'arcsin', 'arccos', 'arctan', 'arcsec', 'arccsc', 'arccot', 'sinh', 'cosh', 'tanh', 'sech', 'csch', 'coth', 'arcsinh', 'arccosh', 'arctanh'].map((k) => [k, INEXACT])),
  factorial: 'CSS has no factorial, and d3 none', quotient: 'not yet: integer division', rem: 'not yet: a remainder',
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
const loneName = (a) => (a?.name === 'ci' && !elements(a).length ? textOf(a).trim() : subName(a) && elements(a).length === 3 && ['ci', 'cn'].includes(elements(a)[2].name) ? `${textOf(elements(a)[1]).trim()}_${textOf(elements(a)[2]).trim()}` : null);
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
  } else { const root = call(top); out = { kind: 'value', root, ...emit(root) }; }
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
  if (head.name === 'apply') throw refusal(head.start, 'a nested <apply> as the operator: one operator applied to numbers');
  let op, args = kids.slice(1), degree = 2;
  if (head.name === 'csymbol' && head.attrs.cd === 'ambiguous' && textOf(head).trim() === 'superscript') op = 'power'; // LaTeXML's x^2, read as a power
  else if (head.name === 'csymbol' && head.attrs.cd === 'ambiguous' && textOf(head).trim() === 'subscript') throw refusal(head.start, 'a subscript as the operator (an indexed function): this build has no definition for it');
  else if (head.name === 'ci') throw refusal(head.start, `<ci>${textOf(head).trim()}</ci> as the operator (a function the page names): this build has no definition for it`);
  else if (head.name === 'csymbol') {
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
    if (!(head.name in CALLS)) throw refusal(head.start, WHY[head.name] ?? `<${head.name}/> is not an operator this build takes (median, mean, min, max, plus, minus, times, divide, power, root, abs, floor and ceiling)`);
    op = head.name;
  }
  if (op === 'root') { const q = args.filter((a) => a.name === 'degree'); // <root/> with a <degree> qualifier (MathML 4, 4.3.3.2); none is a square root
    if (q.length > 1) throw refusal(q[1].start, 'two <degree>s');
    if (q.length) { const k = elements(q[0]); if (k.length !== 1 || k[0].name !== 'cn') throw refusal(q[0].start, '<degree> holds one <cn>, the root\'s degree'); degree = degreeOf(k[0]); args = args.filter((a) => a !== q[0]); } }
  for (const a of args) if (QUALIFIERS.has(a.name)) throw refusal(a.start, `<${a.name}>: qualifiers aren't taken, only numbers`);
  for (const a of args) if (!['cn', 'ci', 'apply'].includes(a.name)) throw refusal(a.start, `<${a.name}> as an argument: only <cn> numbers, <ci> names and another <apply>`);
  if (!args.length) throw refusal(apply.start, `${op} of nothing`);
  const [lo, hi] = ARITY[op] ?? [1, Infinity];
  if (args.length < lo || args.length > hi) throw refusal(apply.start, `${op} of ${args.length} argument${args.length === 1 ? '' : 's'}: it takes ${lo === hi ? lo : hi === Infinity ? `${lo} or more` : `${lo} or ${hi}`}`);
  if (args.length === 1 && args[0].name === 'ci' && !ARITY[op]) throw refusal(args[0].start, `one <ci> alone: MathML reads it as a data set (MathML 4, §4.3.5.13), not one value`);
  const items = args.map((a) => item(a));
  return { op, call: CALLS[op], items, degree, start: apply.start };
}
// one argument: a number ({ x }), a name ({ ci }, with the page's definition of it, { def }), or another <apply> ({ node })
function item(a, defining = false) {
  {
    const sub = a.name === 'apply' && elements(a)[0]?.name === 'csymbol' && elements(a)[0].attrs.cd === 'ambiguous' && textOf(elements(a)[0]).trim() === 'subscript';
    if (sub) { // LaTeXML's x_1: one name, x_1, read from --x_1 and drawn as a subscript
      const [, base, index, ...more] = elements(a);
      if (!base || !index || more.length || base.name !== 'ci' || !['ci', 'cn'].includes(index.name) || elements(base).length || elements(index).length) throw refusal(a.start, 'a subscript other than a name and one name or number (x_1, x_i): this build reads those as one name');
      const id = `${textOf(base).trim()}_${textOf(index).trim()}`;
      if (!/^-?[_a-zA-Z\u0080-\u{10FFFF}][-_a-zA-Z0-9\u0080-\u{10FFFF}]*$/u.test(id)) throw refusal(a.start, `the subscripted name ${id} is no CSS identifier`);
      return named({ ci: id, sub: [textOf(base).trim(), textOf(index).trim(), index.name] }, a, defining);
    }
    if (a.name === 'apply') return { node: call(a) };
    if (a.name === 'cn') return number(a);
    if (elements(a).length) throw refusal(a.start, '<ci> with markup inside: a name is text');
    if ('type' in a.attrs) throw refusal(a.start, `<ci type="${a.attrs.type}"> names a collection or another kind of value`);
    const id = textOf(a).trim();
    // a CSS identifier: letters past ASCII too (𝑚)
    if (!/^-?[_a-zA-Z\u0080-\u{10FFFF}][-_a-zA-Z0-9\u0080-\u{10FFFF}]*$/u.test(id)) throw refusal(a.start, `<ci>${id}</ci>: a name must be a CSS identifier`);
    if (RESERVED.test(id)) throw refusal(a.start, `<ci>${id}</ci>: --${id} is a name dcss itself reads or writes`);
    return named({ ci: id }, a, defining);
  }
}
// a name the page defines: the definition's side in its place; one it defines further down is refused
function named(x, a, defining) {
  if (defining) return x;
  if (DEFS.has(x.ci)) return { ...x, def: DEFS.get(x.ci) };
  if (LATER.has(x.ci)) throw refusal(a.start, `${x.ci} is defined further down the page (line ${LATER.get(x.ci)}): define it before the formulas that use it`);
  return x;
}
// a root's degree: a whole number from 2
function degreeOf(cn) { const { x } = number(cn); if (!Number.isInteger(x) || x < 2) throw refusal(cn.start, `a root of degree ${x}: this build takes whole degrees from 2`); return x; }

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
const DIVIDE = { plain: (a, b) => `((${a}) / (${b}))`, length: (a, b) => `(((${a}) * 1px) / ((${b}) * 1px))` };
const either = (plain, length) => (plain === length ? plain : `${sel(`(1 - ${W})`, plain)} + ${sel(W, length)}`);
const SPLIT = { e: (n, v) => `round(down, log(max(abs(${v}), pow(2, -1006)), 2))`, a: (n, v) => `round(to-zero, ${v} * pow(2, 17 - var(${n}-e)))`,
  b: (n, v) => `round(to-zero, rem(${v} * pow(2, 17 - var(${n}-e)), 1) * 524288)`, c: (n, v) => `calc(rem(${v} * pow(2, 17 - var(${n}-e)) * 524288, 1) * 524288)` };
const join = (n) => `((var(${n}-a) + var(${n}-b) / 524288 + var(${n}-c) / 274877906944) * pow(2, var(${n}-e) - 17))`;
// d3's answer in JavaScript's doubles (JavaScript's Math where d3 has no call), when every number under it is written
// (null with a <ci> under it); CSS's pow() and sqrt() are Math.pow's and Math.sqrt's to the bit (300 of 300 each, both engines)
const D3 = {
  minus: (xs) => (xs.length === 1 ? -xs[0] : xs[0] - xs[1]), times: (xs) => xs.reduce((a, b) => a * b), divide: (xs) => xs[0] / xs[1],
  power: (xs) => Math.pow(xs[0], xs[1]), root: (xs, n) => (n.degree === 2 ? Math.sqrt(xs[0]) : Math.pow(xs[0], 1 / n.degree)),
  abs: (xs) => Math.abs(xs[0]), floor: (xs) => Math.floor(xs[0]), ceiling: (xs) => Math.ceil(xs[0]),
  sum: (xs) => xs.reduce((s, x) => s + x, 0), mean: (xs) => xs.reduce((s, x) => s + x, 0) / xs.length,
  min: (xs) => Math.min(...xs), max: (xs) => Math.max(...xs), id: (xs) => xs[0],
  median: (xs) => { const s = [...xs].sort((a, b) => a - b), i0 = Math.floor((s.length - 1) / 2); return s.length % 2 ? s[i0] : s[i0] + (s[i0 + 1] - s[i0]) * 0.5; },
};
const valueOf = (node) => { const xs = node.items.map((x) => (x.node ? valueOf(x.node) : x.def ? valueOf(x.def) : x.ci ? null : x.x)); return xs.includes(null) ? null : D3[node.call](xs, node); };
// a median of n values the page sets compares n · (n - 1) pairs: 2,048 is a median of 45 names, 93 KB of style, a change
// 0.1 ms of style work in Chrome and WebKit (2026-10-29)
const MAX_COMPARES = 2048;
// the formula in one form of division: the answer's expression and the registered steps before it, as [name, expression]
// the CSS of formulas in one form of division: expr(node) is a node's expression; the registered steps it needs collect in
// decls, as [name, expression], and the names the page sets in names
function former(divide) {
  const decls = [], names = new Set(), f = { decls, names, compares: 0 }; let id = 0;
  const expr = f.expr = (node) => {
    const k = ++id, xs = node.items.map((x) => (x.node ? expr(x.node) : x.def ? expr(x.def) : x.ci ? (names.add(x.ci), `var(--${x.ci})`) : String(x.x)));
    if (node.call === 'id') return xs[0];
    const total = () => xs.reduce((a, b) => F(`${a} + ${b}`));
    if (node.call === 'sum') return total();
    if (node.call === 'mean') return divide(total(), xs.length);
    if (node.call === 'minus') return xs.length === 1 ? `(-1 * ${xs[0]})` : F(`${xs[0]} - ${xs[1]}`);
    if (node.call === 'times') return xs.reduce((a, b) => F(`${a} * ${b}`));
    if (node.call === 'divide') return divide(xs[0], xs[1]);
    if (node.call === 'power') return `pow(${xs[0]}, ${xs[1]})`;
    if (node.call === 'root') return node.degree === 2 ? `sqrt(${xs[0]})` : `pow(${xs[0]}, ${String(1 / node.degree)})`;
    if (node.call === 'abs') return `abs(${xs[0]})`;
    if (node.call === 'floor' || node.call === 'ceiling') return `round(${node.call === 'floor' ? 'down' : 'up'}, ${xs[0]}, 1)`;
    if (node.call !== 'median') return `${node.call}(${xs.join(', ')})`;
    const n = xs.length; if (n === 1) return xs[0];
    const known = node.items.map((x) => (x.node ? valueOf(x.node) : x.def ? valueOf(x.def) : x.ci ? null : x.x));
    const live = known.includes(null); // with every value known the order is the build's, and nothing is compared in CSS
    const ref = xs.map((x, i) => { if (!live || !(node.items[i].node || node.items[i].def)) return x; const p = `--dcss-dcss-m${k}-${i}`; for (const q of 'eabc') decls.push([`${p}-${q}`, SPLIT[q](p, x)]); return join(p); });
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
    return n % 2 ? pick(i0) : F(`${F(pick(i0))} + ${F(`${F(`${pick(i0 + 1)} - ${pick(i0)}`)} * 0.5`)}`);
  };
  return f;
}
// a name the page doesn't set (or sets to no number) leaves no answer: --value fails with it, and so does a registered
// step that took it (its initial 0 would be a number): 0 / 0 then
const okDecl = (names) => ['--dcss-dcss-ok', `calc(${[...names].map((n) => `var(--${n}) * 0`).join(' + ')} + 1)`];
function form(root, divide) {
  const f = former(divide), value = f.expr(root);
  if (f.names.size) f.decls.push(okDecl(f.names));
  return { value: `${value}${f.names.size ? ' + 0 / var(--dcss-dcss-ok)' : ''}`, decls: f.decls, compares: f.compares };
}
// each declaration in both forms of division, the engine's flag picking one
const both = (plain, length) => ({ value: `calc(${either(plain.value, length.value)})`, decls: plain.decls.map(([k, v], i) => `${k}: calc(${either(v, length.decls[i][1])});`),
  ints: plain.decls.map(([k]) => k), compares: plain.compares });
const emit = (root) => both(form(root, DIVIDE.plain), form(root, DIVIDE.length));
// inequalities: each pair's truth as JavaScript's operator gives it on the two doubles (the sign of a fenced difference,
// exact for finite doubles), the chain's the least of them; --dcss-dcss-fin is 0 when a side is NaN or infinite or
// a name is unset, and then nothing prints
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
  const PREC = { plus: 1, minus: 1, times: 2, power: 4 }; // the rest stand alone
  const prec = (x) => (x.node ? (x.node.op === 'minus' && x.node.items.length === 1 ? 3 : PREC[x.node.op] ?? 9) : x.neg ? 3 : 9);
  const pres = (node, arg = '') => {
    const { op, items } = node, ids = items.map((_, i) => `$a${i + 1}`).join(',');
    const show = (i, need = 0) => { const x = items[i], a = ` arg="a${i + 1}"`;
      const m = x.node ? pres(x.node, a) : x.sub ? `<msub${a}><mi>${esc(x.sub[0])}</mi><${x.sub[2] === 'cn' ? 'mn' : 'mi'}>${esc(x.sub[1])}</${x.sub[2] === 'cn' ? 'mn' : 'mi'}></msub>` : x.ci ? `<mi${a}>${esc(x.ci)}</mi>`
        : !x.neg ? (x.mag.startsWith('<mn>') && x.mag.indexOf('<', 1) === x.mag.indexOf('</mn>') ? `<mn${a}>${x.mag.slice(4)}` : `<mrow${a}>${x.mag}</mrow>`)
        : `<mrow${a}><mo>−</mo>${x.mag}</mrow>`;
      return prec(x) < need ? `<mrow><mo>(</mo>${m}<mo>)</mo></mrow>` : m; };
    const infix = (sign, need) => items.map((x, i) => show(i, prec(x) === 3 ? 4 : need(i))).join(`<mo>${sign}</mo>`);
    if (op === 'eq' || op === 'assign') return `<mrow${arg} intent="${op === 'eq' ? 'equals' : 'assign'}(${ids})">${items.map((_, i) => show(i)).join(`<mo>${op === 'eq' ? '=' : '≔'}</mo>`)}</mrow>`;
    if (op in RELS) return `<mrow${arg} intent="${{ lt: 'less-than', leq: 'less-than-or-equal', gt: 'greater-than', geq: 'greater-than-or-equal' }[op]}(${ids})">${infix(RELS[op], () => 0)}</mrow>`;
    if (op === 'and') return `<mrow${arg} intent="and(${ids})">${items.map((_, i) => show(i)).join('<mo>,</mo><mspace width="0.5em"/>')}</mrow>`;
    if (op === 'plus') return `<mrow${arg} intent="plus(${ids})">${infix('+', () => 2)}</mrow>`;
    if (op === 'times') return `<mrow${arg} intent="times(${ids})">${infix('×', () => 2)}</mrow>`;
    if (op === 'minus') return items.length === 1 ? `<mrow${arg} intent="minus(${ids})"><mo>−</mo>${show(0, 4)}</mrow>` : `<mrow${arg} intent="minus(${ids})">${infix('−', (i) => (i ? 2 : 1))}</mrow>`;
    if (op === 'divide') return `<mfrac${arg} intent="divide(${ids})">${show(0)}${show(1)}</mfrac>`;
    if (op === 'power') return `<msup${arg} intent="power(${ids})">${show(0, 5)}${show(1)}</msup>`;
    if (op === 'root') return node.degree === 2 ? `<msqrt${arg} intent="square-root(${ids})">${show(0)}</msqrt>` : `<mroot${arg} intent="root($a1,$a2)">${show(0)}<mn arg="a2">${node.degree}</mn></mroot>`;
    if (op === 'abs' || op === 'floor' || op === 'ceiling') { const [l, r] = { abs: ['|', '|'], floor: ['⌊', '⌋'], ceiling: ['⌈', '⌉'] }[op];
      return `<mrow${arg} intent="${op === 'abs' ? 'absolute-value' : op}(${ids})"><mo>${l}</mo>${show(0)}<mo>${r}</mo></mrow>`; }
    return `<mrow${arg} intent="${op}(${ids})"><mi>${op}</mi><mo>⁡</mo><mrow><mo>(</mo>${items.map((_, i) => show(i)).join('<mo>,</mo>')}<mo>)</mo></mrow></mrow>`;
  };
  const mathAttrs = Object.entries(math.attrs).filter(([k]) => !['class', 'style'].includes(k)).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
    + (keep.length ? ` class="${esc(keep.join(' '))}"` : '') + (mathDecls.length ? ` style="${esc(css(mathDecls))}"` : '');
  const annotation = src.slice(elements(math)[0].start, elements(math)[0].end);
  const caption = `<figcaption style="overflow-x: auto"><math${mathAttrs}><semantics>${pres(root)}<annotation-xml encoding="application/mathml-content+xml">${annotation}</annotation-xml></semantics></math></figcaption>`;
  // the answer prints through a formatter: the author's, or d3.format(",.6~f"), as the calls print their own (format-general,
  // d3.format(","), cost 80 ms a frame for 20 moving means in WebKit, fixed 17, the formula itself 3: 2026-10-29)
  const f = fmt.length ? fmt.join(' ') : 'dcss-format-fixed', st = fmt.length || fmtDecls.length ? css(fmtDecls) : '--precision: 6; --trim: 1; --comma: 1';
  // a relation's truth prints through a counter style: nothing, false or true
  const truth = kind === 'truth' ? '@counter-style dcss-dcss-truth { system: fixed 0; symbols: "" "false" "true"; } [data-dcss-truth]::after { content: counter(dcss-dcss-truth, dcss-dcss-truth); }' : '';
  const props = ints.length || truth ? `<style>${ints.map((n) => `@property ${n} { syntax: '<integer>'; inherits: false; initial-value: 0; }`).join(' ')}${truth ? ' ' + truth : ''}</style>` : '';
  const one = (v, d) => `<output class="${f}" style="${d.length ? d.join(' ') + ' ' : ''}--value: ${v}${st ? '; ' + st : ''}"></output>`;
  const answer = kind === 'sides' ? sides.map((e) => one(e.value, e.decls)).join('<span aria-hidden="true"> · </span>') : kind === 'truth'
    ? `<output data-dcss-truth style="${own.join(' ')} counter-reset: dcss-dcss-truth calc(${value} * var(--dcss-dcss-fin) * (1 + var(--dcss-dcss-t))); --dcss-err: calc(1 - ${value} * var(--dcss-dcss-fin))"></output>`
    : `<output class="${f}" style="${own.length ? own.join(' ') + ' ' : ''}--value: ${value}${st ? '; ' + st : ''}"></output>`;
  return `<figure data-dcss-mathml${varDecls.length ? ` style="${esc(css(varDecls))}"` : ''}>${caption}${props}<div>${answer}</div></figure>`;
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
    return { from: f.from, to: f.to, html: write(compiled, f.math, src) };
  });
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
