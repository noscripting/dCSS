// node steps.mjs <page.html> [built.html]: writes what a page's solves and samples need, so the page counts nothing
// by hand, to built.html or stdout; exits 1 with file:line and the reason on an element it can't take.
//   <div class="dcss-solve" data-dcss-steps="24">…</div>   gets its 24 nested <i>s
// data-dcss-steps="n" (a .dcss-solve's tries, a .dcss-solve-rows's pieces), data-dcss-within="t" (how close the answer
// must be: the build counts the tries), data-dcss-pieces="n" and data-dcss-apart="d" on a .dcss-solve-every, the <i> of
// a .dcss-evaluate, and on a page with a .dcss-solve-newton or .dcss-solve-turning-point, --dcss-slope beside each
// --dcss-formula that has none (one it can't take is said on stderr with its line, and the rest of the page builds).
// The rest of the page is copied byte for byte and nothing adds a line, so the build run on its own output changes
// nothing and every line number stays the page's. BASICSS's MathML format runs it too, before its formulas.
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 noscript.ing contributors
import { readFileSync, realpathSync, watchFile, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// --- reading the page as the HTML parser does: comments, raw-text elements, tags with lower-case names, references
const RAW = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript', 'template']);
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', minus: '−', InvisibleTimes: '⁢', ApplyFunction: '⁡', af: '⁡' };
const decode = (s, where) => s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);?/gi, (m, r) => {
  if (r[0] === '#') return String.fromCodePoint(r[1] === 'x' || r[1] === 'X' ? parseInt(r.slice(2), 16) : +r.slice(1));
  if (r in NAMED) return NAMED[r];
  throw buildError(where, `the character reference ${m} is one this build doesn't know: write the character itself`);
});
class BuildError extends Error {}
const buildError = (at, why) => Object.assign(new BuildError(why), { at });
const attrRe = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const readAttrs = (s, at) => { const out = {}; for (const m of s.matchAll(attrRe)) { const k = m[1].toLowerCase(); if (!(k in out)) out[k] = decode(m[2] ?? m[3] ?? m[4] ?? '', at); } return out; };
// one tag at i (s[i] === '<'): { name, end, close, self, attrs, length } or null for text
const TAG = /<(\/?)([a-zA-Z][^\s/>]*)((?:\s+(?:[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)|\s*\/(?!>))*)\s*(\/?)>/y;
const tagAt = (s, i) => {
  TAG.lastIndex = i; const m = TAG.exec(s); // the whole tag, however long (a built scope's start tag passes 40 KB)
  return m && { name: m[2].toLowerCase(), close: !!m[1], self: !!m[4], rawAttrs: m[3], length: m[0].length };
};

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
// data-dcss-steps="n" on a solve or an invert: the build writes its <i>s, so the page never counts them. A solve's
// content goes inside n nested <i>s; an invert gets a first child of n pairs, <span><i><i></i></i>…</span>. Nothing
// adds a line, so every line number stays the page's; an element that holds its <i>s already is left as it is (the
// build run on its own output changes nothing), and one holding a different count is an error.
const NESTED = /(?:^|\s)dcss-solve(?=\s|$)/, NEWTONS = /(?:^|\s)dcss-solve-newton(?=\s|$)/;
// data-dcss-within="t" on a halving .dcss-solve: how close the answer must be, in the formula's own input, and the build
// counts the tries. n <i>s leave the answer within |to - from| / 2^(n - 1) (2 ends, n - 2 halvings, the middle of what
// is left), so n is the least that reaches t, 3 at least. The build reads --from and --to as numbers from the element's
// style or a <style> rule on one of its own classes; anything else (a var(), a Newton solve, an invert, whose steps
// buy no fixed width) is an error, reported with its line.
function withinSteps(src, a, cls, invert, where, parts = 1) {
  if ('data-dcss-steps' in a) throw new Error(`${where}: data-dcss-within beside data-dcss-steps: write one, how close or how many`);
  if (invert || !/(?:^|\s)dcss-solve(?:-every)?(?=\s|$)/.test(cls) || NEWTONS.test(cls)) throw new Error(`${where}: data-dcss-within on ${invert ? 'a .dcss-solve-rows' : 'a solve that takes Newton\'s steps'}: how close its answer gets has no fixed count; write data-dcss-steps`);
  const t = Number((a['data-dcss-within'] ?? '').trim());
  if (!(t > 0) || !Number.isFinite(t)) throw new Error(`${where}: data-dcss-within="${a['data-dcss-within']}": write how close the answer must be, a number above 0`);
  const num = '(-?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)\\s*(?:;|$|!)';
  const find = (name) => { const re = new RegExp(`(?:^|[;{\\s])--${name}\\s*:\\s*${num}`, 'i');
    const own = re.exec(a.style ?? ''); if (own) return Number(own[1]);
    const css = [...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, '')).join('\n');
    for (const c of cls.split(/\s+/).filter((c) => c && !c.startsWith('dcss-')))
      for (const m of css.matchAll(new RegExp(`(?:^|[}\\s,])\\.${c.replace(/[^\w-]/g, '')}\\s*\\{([^}]*)\\}`, 'g'))) { const v = re.exec(m[1]); if (v) return Number(v[1]); }
    return null; };
  const from = find('from'), to = find('to');
  if (parts === 'range') return [from, to];
  if (from === null || to === null) throw new Error(`${where}: data-dcss-within needs --from and --to as numbers on the element's style or a rule on one of its classes; write data-dcss-steps where they come from elsewhere`);
  const n = Math.max(3, Math.ceil(Math.log2(Math.abs(to - from) / parts / t) - 1e-12) + 1);
  if (n > 54) throw new Error(`${where}: data-dcss-within="${a['data-dcss-within']}" on ${from} to ${to} takes ${n} tries, past a double's 54`);
  return n;
}
function stepsPass(src, file) {
  const edits = []; let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i); if (lt < 0) break;
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e < 0 ? src.length : e + 3; continue; }
    const t = tagAt(src, lt); if (!t) { i = lt + 1; continue; }
    if (!t.close && RAW.has(t.name)) { const e = closeAt(src, t.name, lt + t.length); i = e < 0 ? src.length : e; continue; }
    i = lt + t.length;
    // .dcss-evaluate: the build writes the <i> the page's formula runs on, around what the call holds
    if (!t.close && /dcss-evaluate/.test(t.rawAttrs) && /(?:^|\s)dcss-evaluate(?=\s|$)/.test(readAttrs(t.rawAttrs, lt).class ?? '')) {
      const end = t.self || VOID.has(t.name) ? -1 : endOf(src, lt, t); if (end < 0) throw new Error(`${file}:${lineOf(src, lt)}: the .dcss-evaluate <${t.name}> is never closed`);
      const inner = lt + t.length, close = src.lastIndexOf('</', end - 1);
      if (!/^\s*<i>/.test(src.slice(inner, close))) edits.push([inner, '<i>'], [close, '</i>']);
      continue;
    }
    if (t.close || !/(?:^|\s)data-dcss-(?:steps|within)(?=[\s=]|$)/i.test(t.rawAttrs)) continue;
    const a = readAttrs(t.rawAttrs, lt), cls = a.class ?? '', line = lineOf(src, lt);
    const nested = NESTED.test(cls), invert = /(?:^|\s)dcss-solve-rows(?=\s|$)/.test(cls);
    if (/(?:^|\s)dcss-solve-turning-point(?=\s|$)/.test(cls) && NEWTONS.test(cls)) throw new Error(`${file}:${line}: .dcss-solve-turning-point beside .dcss-solve-newton: a highest or lowest point is found by halving; drop .dcss-solve-newton`);
    // .dcss-solve-every: n pieces, each its own .dcss-solve holding its <i>s and a copy of what the call holds
    if (/(?:^|\s)dcss-solve-every(?=\s|$)/.test(cls)) {
      const where = `${file}:${line}`;
      if (NEWTONS.test(cls)) throw new Error(`${where}: .dcss-solve-every beside .dcss-solve-newton: its pieces halve; drop .dcss-solve-newton`);
      if ('data-dcss-apart' in a && 'data-dcss-pieces' in a) throw new Error(`${where}: data-dcss-apart beside data-dcss-pieces: write one, how far apart or how many`);
      let p = Number((a['data-dcss-pieces'] ?? '').trim());
      // data-dcss-apart="d": the fewest pieces no wider than d, so two crossings at least d apart fall in two pieces
      if ('data-dcss-apart' in a) {
        const d = Number(a['data-dcss-apart'].trim()), [from, to] = withinSteps(src, { style: a.style, 'data-dcss-within': '1' }, cls, false, where, 'range');
        if (!(d > 0) || !Number.isFinite(d)) throw new Error(`${where}: data-dcss-apart="${a['data-dcss-apart']}": write how far apart two crossings may be, a number above 0`);
        if (from === null || to === null) throw new Error(`${where}: data-dcss-apart needs --from and --to as numbers on the element's style or a rule on one of its classes; write data-dcss-pieces where they come from elsewhere`);
        p = Math.max(2, Math.ceil(Math.abs(to - from) / d - 1e-12));
      }
      if (!Number.isInteger(p) || p < 2 || p > 200) throw new Error(`${where}: ${'data-dcss-apart' in a ? `data-dcss-apart="${a['data-dcss-apart']}" takes ${p} pieces` : `data-dcss-pieces="${a['data-dcss-pieces'] ?? ''}"`}: a .dcss-solve-every takes 2 to 200 pieces`);
      const n = 'data-dcss-within' in a ? withinSteps(src, a, cls, false, where, p) : Number((a['data-dcss-steps'] ?? '').trim());
      if (!Number.isInteger(n) || n < 3 || n > 54) throw new Error(`${where}: data-dcss-steps="${a['data-dcss-steps']}": each piece takes 3 to 54 steps`);
      const end = t.self || VOID.has(t.name) ? -1 : endOf(src, lt, t); if (end < 0) throw new Error(`${where}: the .dcss-solve-every <${t.name}> is never closed`);
      const inner = lt + t.length, close = src.lastIndexOf('</', end - 1), body = src.slice(inner, close);
      // each piece carries the call's classes (so a page's @scope (.wave) to (.dcss-solve) reaches its <i>s, a
      // turning-point solve takes its slope) and .dcss-solve
      const pc = ['dcss-solve', ...cls.split(/\s+/).filter((c) => c && c !== 'dcss-solve' && c !== 'dcss-solve-every')].join(' ');
      const piece = /^\s*<div class="[^"]*\bdcss-solve\b[^"]*">/;
      if (piece.test(body)) { const had = body.match(/<div class="[^"]*\bdcss-solve\b[^"]*">/g).length; if (had < p) throw new Error(`${where}: data-dcss-pieces="${p}" on an element that holds ${had} pieces already: write the attribute or the pieces, not both`); continue; }
      if (/\s(?:id|for|aria-labelledby|aria-describedby|aria-controls)\s*=/i.test(body)) throw new Error(`${where}: a .dcss-solve-every's content is copied into each of its ${p} pieces, so it holds no id, for or aria reference to one`);
      const copy = stepsPass(body, file);
      edits.push([inner, `<div class="${pc}">${'<i>'.repeat(n)}${copy}${'</i>'.repeat(n)}</div>`.repeat(p), close - inner]);
      i = close; continue;
    }
    if (!nested && !invert) throw new Error(`${file}:${line}: data-dcss-${'data-dcss-steps' in a ? 'steps' : 'within'} on an element that is neither a .dcss-solve nor a .dcss-solve-rows`);
    const n = 'data-dcss-within' in a ? withinSteps(src, a, cls, invert, `${file}:${line}`) : Number((a['data-dcss-steps'] ?? '').trim());
    const [lo, hi] = invert ? [1, 1000] : NEWTONS.test(cls) ? [3, 14] : [3, 54];
    if (!Number.isInteger(n) || n < lo || n > hi) throw new Error(`${file}:${line}: data-dcss-steps="${a['data-dcss-steps']}": ${invert ? 'an invert takes 1 to 1,000 pieces' : `this solve takes ${lo} to ${hi} steps`}`);
    const end = t.self || VOID.has(t.name) ? -1 : endOf(src, lt, t); if (end < 0) throw new Error(`${file}:${line}: the data-dcss-steps <${t.name}> is never closed`);
    const inner = lt + t.length, close = src.lastIndexOf('</', end - 1), body = src.slice(inner, close);
    // how many it holds already: leading <i>s (a solve), or pairs in a first <span> (an invert)
    const had = invert ? (/^\s*<span>((?:\s*<i><i><\/i><\/i>)*)\s*<\/span>/.exec(body)?.[1].match(/<i><i>/g)?.length ?? 0) : (/^(?:\s*<i>)*/.exec(body)[0].match(/<i>/g)?.length ?? 0);
    if (had === n) continue;
    if (had) throw new Error(`${file}:${line}: data-dcss-steps="${n}" on an element that holds ${had} ${invert ? 'pairs' : '<i>s'} already: write the attribute or the <i>s, not both`);
    // the walk goes on inside, so a solve in another's answer gets its own steps
    edits.push(invert ? [inner, `<span>${'<i><i></i></i>'.repeat(n)}</span>`] : [inner, '<i>'.repeat(n)], ...(invert ? [] : [[close, '</i>'.repeat(n)]]));
  }
  let out = src;
  for (const [at, text, cut = 0] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, at) + text + out.slice(at + cut);
  return out;
}
// On a page with a .dcss-solve-newton, the build writes --dcss-slope beside each --dcss-formula in its <style>s that has
// none: the formula's derivative in --dcss-input, worked out from its text. A slope the page wrote is left; one this build
// wrote (its comment says so) is written again, so a changed formula gets a new slope and the build stays its own fixed
// point. Nothing adds a line. Units are kept: a derivative has its formula's type (sin's argument in deg or rad, an
// angle from asin). A var() other than --dcss-input is a constant, a number unless written with a unit; one that the page
// works out from --dcss-input is an error, since its own slope isn't in the text.
const { slopeOf: slopeOfText, slopePass } = (() => { // its own scope: its small names (add, mul, D) stay inside
const SLOPE_MARK = '/* the slope, written by steps.mjs */', SLOPE_MARKS = [SLOPE_MARK, '/* the slope, written by mathml.mjs */']; // the second, on a page built before 2026-10-31
const ANGLE = { deg: Math.PI / 180, rad: 1, grad: Math.PI / 200, turn: 2 * Math.PI };
class NoSlope extends Error {}
const CONSTS = new Set(['e', 'pi', 'infinity', '-infinity', 'nan']), ROUNDS = new Set(['nearest', 'up', 'down', 'to-zero']);
function parseCalc(text) {
  const toks = [], re = /\s+|([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|[a-z]+)?|(var)\(\s*(--[\w-]+)\s*(?:,[^()]*(?:\([^()]*\)[^()]*)*)?\)|([a-z][a-z0-9-]*)(\()?|([-+*/(),])/giy;
  for (let m; re.lastIndex < text.length;) {
    const at = re.lastIndex; if (!(m = re.exec(text))) throw new NoSlope(`it can't read "${text.slice(at, at + 12)}"`);
    if (m[1] !== undefined) toks.push({ k: 'num', t: m[1] + (m[2] ?? ''), v: Number(m[1]), u: (m[2] ?? '').toLowerCase() });
    else if (m[3]) toks.push(m[4] === '--dcss-input' ? { k: 'x' } : { k: 'c', t: m[0].replace(/\s+/g, ' '), name: m[4] });
    else if (m[5]) toks.push(m[6] ? { k: 'f', f: m[5].toLowerCase() } : { k: 'id', t: m[5].toLowerCase() });
    else if (m[7]) toks.push({ k: m[7] });
  }
  // a sign written against a number after an operand is the operator: "x -1" never parses as x and -1
  for (let i = 1; i < toks.length; i++) if (toks[i].k === 'num' && /^[+-]/.test(toks[i].t) && ['num', 'x', 'c', 'id', ')'].includes(toks[i - 1].k)) {
    const s = toks[i].t[0]; toks.splice(i, 1, { k: s }, { ...toks[i], t: toks[i].t.slice(1), v: Math.abs(toks[i].v) }); }
  let p = 0; const peek = () => toks[p], take = (k) => { if (toks[p]?.k !== k) throw new NoSlope(`it expected "${k}"`); return toks[p++]; };
  const sum = () => { let a = product(); while (peek()?.k === '+' || peek()?.k === '-') { const o = toks[p++].k; a = { k: o, a, b: product() }; } return a; };
  const product = () => { let a = unary(); while (peek()?.k === '*' || peek()?.k === '/') { const o = toks[p++].k; a = { k: o, a, b: unary() }; } return a; };
  const unary = () => { if (peek()?.k === '-') { p++; return { k: 'neg', a: unary() }; } if (peek()?.k === '+') { p++; return unary(); } return atom(); };
  const atom = () => {
    const t = toks[p++]; if (!t) throw new NoSlope('it ends early');
    if (t.k === 'num') { if (t.u === '%') throw new NoSlope('a percentage has no type the build can know'); return t; }
    if (t.k === 'x' || t.k === 'c') return t;
    if (t.k === '(') { const a = sum(); take(')'); return a; }
    if (t.k === 'id') { if (CONSTS.has(t.t)) return { k: 'num', t: t.t, v: NaN, u: '' }; throw new NoSlope(`"${t.t}" is no constant`); }
    if (t.k === 'f') {
      if (t.f === 'calc') { const a = sum(); take(')'); return a; }
      const args = []; let mode = null;
      if (t.f === 'round' && peek()?.k === 'id' && ROUNDS.has(peek().t)) { mode = toks[p++].t; take(','); }
      if (peek()?.k !== ')') for (;;) { args.push(sum()); if (peek()?.k === ',') { p++; continue; } break; }
      take(')'); return { k: 'fn', f: t.f, args, mode };
    }
    throw new NoSlope(`it can't read "${t.k}" there`);
  };
  const tree = sum(); if (p < toks.length) throw new NoSlope('it has more after the formula'); return tree;
}
const typeOf = (n) => {
  switch (n.k) {
    case 'num': return n.u in ANGLE ? 'angle' : n.u;
    case 'x': case 'c': return '';
    case 'neg': return typeOf(n.a);
    case '+': case '-': { const a = typeOf(n.a), b = typeOf(n.b); if (a !== b) throw new NoSlope(`it adds a ${a || 'number'} to a ${b || 'number'}`); return a; }
    case '*': { const a = typeOf(n.a), b = typeOf(n.b); if (a && b) throw new NoSlope(`it multiplies a ${a} by a ${b}`); return a || b; }
    case '/': { const a = typeOf(n.a), b = typeOf(n.b); if (b && a !== b) throw new NoSlope(`it divides a ${a || 'number'} by a ${b}`); return b ? '' : a; }
    case 'fn': {
      const ts = n.args.map(typeOf), same = () => { if (ts.some((t) => t !== ts[0])) throw new NoSlope(`${n.f}() mixes types`); return ts[0]; };
      if (['sin', 'cos', 'tan'].includes(n.f)) { if (ts[0] && ts[0] !== 'angle') throw new NoSlope(`${n.f}() of a ${ts[0]}`); return ''; }
      if (['asin', 'acos', 'atan'].includes(n.f)) { if (ts[0]) throw new NoSlope(`${n.f}() of a ${ts[0]}`); return 'angle'; }
      if (n.f === 'atan2') { if (same()) throw new NoSlope('atan2() of dimensions'); return 'angle'; }
      if (['pow', 'sqrt', 'exp', 'log', 'sign'].includes(n.f)) { if (n.f !== 'sign' && ts.some(Boolean)) throw new NoSlope(`${n.f}() of a ${ts.find(Boolean)}`); return ''; }
      if (n.f === 'hypot') { if (same()) throw new NoSlope('hypot() of dimensions'); return ''; }
      if (['abs', 'min', 'max', 'clamp', 'round', 'mod', 'rem'].includes(n.f)) return same();
      throw new NoSlope(`it has no derivative for ${n.f}()`);
    }
  }
};
const ARGS = { sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1, atan2: 2, pow: 2, sqrt: 1, exp: 1, sign: 1, abs: 1, mod: 2, rem: 2 };
const num = (v, u = '') => ({ k: 'num', t: String(v) + u, v, u }), ZERO = num(0), ONE = num(1), RAD = num(1, 'rad');
const zero = (n) => n.k === 'num' && n.v === 0, one = (n) => n.k === 'num' && n.v === 1 && !n.u, plain = (n) => n.k === 'num' && !n.u && Number.isFinite(n.v) && /^-?[\d.]+$/.test(n.t);
const fn = (f, ...args) => ({ k: 'fn', f, args });
const neg = (a) => zero(a) ? ZERO : a.k === 'neg' ? a.a : plain(a) ? num(-a.v) : { k: 'neg', a };
const add = (a, b) => zero(a) ? b : zero(b) ? a : b.k === 'neg' ? sub(a, b.a) : { k: '+', a, b };
const sub = (a, b) => zero(b) ? a : zero(a) ? neg(b) : b.k === 'neg' ? add(a, b.a) : { k: '-', a, b };
const mul = (a, b) => zero(a) || zero(b) ? ZERO : one(a) ? b : one(b) ? a : plain(a) && a.v === -1 ? neg(b) : plain(b) && b.v === -1 ? neg(a) : plain(a) && plain(b) ? num(a.v * b.v) : a.k === 'neg' ? neg(mul(a.a, b)) : b.k === 'neg' ? neg(mul(a, b.a)) : { k: '*', a, b };
const same = (a, b) => a.k === 'num' && b.k === 'num' && a.t === b.t; // 1rad and 1rad
const div = (a, b) => zero(a) ? ZERO : one(b) ? a : same(a, b) ? ONE : a.k === 'num' && b.k === 'num' && a.u && a.u === b.u && /^[\d.]+$/.test(a.t.slice(0, -a.u.length) + b.t.slice(0, -b.u.length)) ? num(a.v / b.v) : a.k === '*' && same(a.a, b) ? a.b : a.k === '*' && same(a.b, b) ? a.a : a.k === 'neg' ? neg(div(a.a, b)) : { k: '/', a, b };
const half = (s) => div(s, num(2));
function D(n) {
  switch (n.k) {
    case 'num': case 'c': return ZERO;
    case 'x': return ONE;
    case 'neg': return neg(D(n.a));
    case '+': return add(D(n.a), D(n.b));
    case '-': return sub(D(n.a), D(n.b));
    case '*': return add(mul(D(n.a), n.b), mul(n.a, D(n.b)));
    case '/': { const da = D(n.a), db = D(n.b); return zero(db) ? div(da, n.b) : div(sub(da, mul(div(n.a, n.b), db)), n.b); }
  }
  const [a, b] = n.args, da = a && D(a), db = b && D(b);
  if (ARGS[n.f] !== undefined && n.args.length !== ARGS[n.f]) throw new NoSlope(`${n.f}() takes ${ARGS[n.f]} argument${ARGS[n.f] > 1 ? 's' : ''}`);
  const rad = (d) => typeOf(a) === 'angle' ? div(d, RAD) : d; // sin's argument in an angle: its slope over 1rad, a number
  switch (n.f) {
    case 'sin': return mul(fn('cos', a), rad(da));
    case 'cos': return neg(mul(fn('sin', a), rad(da)));
    case 'tan': return div(rad(da), mul(fn('cos', a), fn('cos', a)));
    case 'asin': return mul(RAD, div(da, fn('sqrt', sub(ONE, mul(a, a)))));
    case 'acos': return neg(mul(RAD, div(da, fn('sqrt', sub(ONE, mul(a, a))))));
    case 'atan': return mul(RAD, div(da, add(ONE, mul(a, a))));
    case 'atan2': return mul(RAD, div(sub(mul(b, da), mul(a, db)), add(mul(a, a), mul(b, b))));
    case 'pow': if (zero(db)) return mul(mul(b, fn('pow', a, plain(b) ? num(b.v - 1) : sub(b, ONE))), da);
      return mul(n, add(mul(db, fn('log', a)), div(mul(b, da), a)));
    case 'sqrt': return div(da, mul(num(2), n));
    case 'exp': return mul(n, da);
    case 'log': return b ? D({ k: '/', a: fn('log', a), b: fn('log', b) }) : div(da, a);
    case 'hypot': return n.args.length === 1 ? mul(fn('sign', a), da) : div(n.args.map((x) => mul(x, D(x))).reduce(add), n);
    case 'abs': return mul(fn('sign', a), da);
    case 'sign': case 'round': return ZERO;
    case 'min': case 'max': { if (n.args.length === 1) return da; const rest = n.args.length > 2 ? { ...n, args: n.args.slice(1) } : b, dr = D(rest);
      if (zero(da) && zero(dr)) return ZERO;
      const s = fn('sign', sub(a, rest)), pick = n.f === 'min' ? half(sub(ONE, s)) : half(add(ONE, s)); // 1 where a is the one taken, ½ at a tie
      return add(mul(pick, da), mul(n.f === 'min' ? half(add(ONE, s)) : half(sub(ONE, s)), dr)); }
    case 'clamp': if (n.args.length !== 3) throw new NoSlope('clamp() takes 3 arguments'); return D(fn('max', n.args[0], fn('min', n.args[1], n.args[2])));
    case 'mod': case 'rem': return sub(da, mul(db, { k: 'fn', f: 'round', mode: n.f === 'mod' ? 'down' : 'to-zero', args: [div(a, b)] }));
  }
  throw new NoSlope(`it has no derivative for ${n.f}()`);
}
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 2 };
function emit(n, outer = 0, right = false) {
  let s, p = PREC[n.k] ?? 3;
  switch (n.k) {
    case 'num': s = n.t; break;
    case 'x': s = 'var(--dcss-input)'; break;
    case 'c': s = n.t; break;
    case 'neg': s = `-1 * ${emit(n.a, 2, true)}`; break;
    case '+': case '-': case '*': case '/': s = `${emit(n.a, p)} ${n.k} ${emit(n.b, p, true)}`; break;
    case 'fn': s = `${n.f}(${n.mode ? `${n.mode}, ` : ''}${n.args.map((x) => emit(x)).join(', ')})`; break;
  }
  return p < outer || (right && p === outer && p < 3) ? `(${s})` : s;
}
function slopeOf(text) { const t = parseCalc(text.replace(/\/\*[\s\S]*?\*\//g, '').trim()); typeOf(t); const d = D(t); return d.k === 'num' ? d.t : `calc(${emit(d)})`; }
const SOLVE_NEWTON = /\bclass\s*=\s*(?:"[^"]*\b(?:dcss-solve-(?:newton|turning-point)|dcss-evaluate)\b[^"]*"|'[^']*\b(?:dcss-solve-(?:newton|turning-point)|dcss-evaluate)\b[^']*'|(?:dcss-solve-(?:newton|turning-point)|dcss-evaluate)\b)/i; // the solves that read a slope
function slopePass(src, file) {
  if (!SOLVE_NEWTON.test(src)) return { src, skipped: [] };
  const skipped = [], edits = [], styles = [], reStyle = /<style\b[^>]*>/gi;
  for (let m; (m = reStyle.exec(src));) { const from = m.index + m[0].length, to = closeAt(src, 'style', from); if (to < 0) break; styles.push([from, to]); reStyle.lastIndex = to; }
  const css = styles.map(([f, t]) => src.slice(f, t)).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  // the page's own names worked out from --dcss-input, directly or through another such name: a formula reading one has
  // a slope the text doesn't show
  const decls = [...css.matchAll(/(--[\w-]+)\s*:([^;{}]*)/g)].filter(([, k]) => k !== '--dcss-formula' && k !== '--dcss-slope'), fromAt = new Set(['--dcss-input']);
  for (let grew = true; grew;) { grew = false; for (const [, k, v] of decls) if (!fromAt.has(k) && [...v.matchAll(/var\(\s*(--[\w-]+)/g)].some((r) => fromAt.has(r[1]))) { fromAt.add(k); grew = true; } }
  fromAt.delete('--dcss-input');
  const valueEnd = (s, i) => { let d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '(') d++; else if (c === ')') d--; else if (d <= 0 && (c === ';' || c === '}')) return i; else if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 1; } } return s.length; };
  for (const [from, to] of styles) {
    const body = src.slice(from, to), re = /(?<![\w-])--dcss-formula\s*:/g;
    for (let m; (m = re.exec(body));) {
      const vStart = m.index + m[0].length, vEnd = valueEnd(body, vStart), at = from + m.index, line = lineOf(src, at);
      let open = body.lastIndexOf('{', m.index), close = body.indexOf('}', vEnd); if (close < 0) close = body.length;
      const block = body.slice(open + 1, close), own = /(?<![\w-])--dcss-slope\s*:/.exec(block);
      let old = null;
      if (own) { const s = open + 1 + own.index, e = valueEnd(body, s + own[0].length); if (!SLOPE_MARKS.some((k) => body.slice(s, e).includes(k))) continue; old = [s, e]; }
      const value = body.slice(vStart, vEnd).trim(), reads = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((r) => r[1]).find((k) => fromAt.has(k));
      let slope;
      try { if (reads) throw new NoSlope(`it reads ${reads}, which the page works out from --dcss-input`); slope = slopeOf(value); }
      // one formula the build can't take leaves that formula's rule without a slope (a .dcss-solve-newton it feeds says
      // --dcss-err 1); the rest of the page builds, so a sample's or an invert's formula never stops a solve's
      catch (e) { if (e instanceof NoSlope) { skipped.push(`${file}:${line}: no slope written for this --dcss-formula: ${e.message}; write --dcss-slope beside it if a .dcss-solve-newton reads it`); continue; } throw e; }
      const decl = `--dcss-slope: ${slope} ${SLOPE_MARK}`;
      if (old) { const [s, e] = old; if (body.slice(s, e) !== decl) edits.push([from + s, from + e, decl]); }
      else { const e = vStart + body.slice(vStart, vEnd).trimEnd().length; edits.push(body[vEnd] === ';' ? [from + vEnd + 1, from + vEnd + 1, ` ${decl};`] : [from + e, from + e, `; ${decl}`]); }
    }
  }
  let out = src;
  for (const [s, e, text] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, s) + text + out.slice(e);
  return { src: out, skipped };
}
return { slopeOf, slopePass };
})();
export const slopeOf = slopeOfText; // for probes/dcss/slope/check.mjs
export { RAW, NAMED, decode, BuildError, buildError, readAttrs, tagAt, lineOf, closeAt, VOID, OPTIONAL_END, endOf, stepsPass, slopePass };

// the page with its steps and slopes written: { html, noSlope } (noSlope: a line for each formula left without one)
export function buildSteps(src, { file = 'page.html' } = {}) { const sl = slopePass(src, file); return { html: stepsPass(sl.src, file), noSlope: sl.skipped }; }

// run as a command, by any path to it (a link, macOS's /var for /private/var)
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2), watch = args.includes('--watch'), [file, to] = args.filter((a) => a !== '--watch');
  const use = 'usage: node steps.mjs <page.html> [built.html] [--watch]  (with no second file, the page goes to stdout; --watch needs it)';
  if (args.some((a) => /^(-h|--help)$/.test(a))) { console.log(use); process.exit(0); }
  if (!file || (watch && !to)) { console.error(use); process.exit(1); }
  const once = () => { const r = buildSteps(readFileSync(file, 'utf8'), { file }); if (to) writeFileSync(to, r.html); else process.stdout.write(r.html); for (const line of r.noSlope) console.error(line); };
  if (!watch) { try { once(); } catch (e) { console.error(e.message); process.exit(1); } }
  else { const run = () => { try { once(); console.log(`${to}: built`); } catch (e) { console.error(e.message); } };
    let timer = null; run(); watchFile(file, { interval: 200 }, () => { clearTimeout(timer); timer = setTimeout(run, 50); }); console.log(`watching ${file}`); }
}
