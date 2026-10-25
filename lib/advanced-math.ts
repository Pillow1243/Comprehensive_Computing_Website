/**
 * Advanced mathematics core (v5).
 *
 * Pure, deterministic and worker-safe building blocks that lift the app from a
 * forward-only formula library to a small computer-algebra / analysis engine:
 *
 *  · a symbolic differentiator & integrator for the safe expression grammar
 *    (x, constants, + - * / ^ and sin/cos/tan/exp/ln/sqrt/abs-free forms);
 *  · a robust numeric inverse solver (scan + Brent-style bisection) used for
 *    "solve for any variable" on every formula;
 *  · one-at-a-time sensitivity (tornado) analysis and seeded Monte-Carlo
 *    uncertainty propagation;
 *  · SI dimensional analysis over compound unit strings (`kg*m/s^2`, `m/s`);
 *  · significant-figure formatting and a stable verification fingerprint.
 *
 * Nothing here evaluates user strings with `eval`; symbolic work happens on a
 * small typed AST produced by its own recursive-descent parser.
 */
import { evaluateExpression } from '@/lib/expression';

// ─── Symbolic AST ────────────────────────────────────────────────────────────

export type AstNode =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'neg'; arg: AstNode }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/' | '^'; left: AstNode; right: AstNode }
  | { kind: 'call'; fn: string; arg: AstNode };

const num = (value: number): AstNode => ({ kind: 'num', value });
type BinOp = '+' | '-' | '*' | '/' | '^';
const bin = (op: BinOp, left: AstNode, right: AstNode): AstNode => ({
  kind: 'bin',
  op,
  left,
  right,
});
const call = (fn: string, arg: AstNode): AstNode => ({ kind: 'call', fn, arg });

const SYMBOLIC_FUNCTIONS = new Set(['sin', 'cos', 'tan', 'exp', 'ln', 'log', 'sqrt', 'sinh', 'cosh', 'tanh']);

function tokenizeSymbolic(source: string): Array<{ t: string; v?: number | string }> {
  const s = source.replace(/\s+/g, '');
  if (!s) throw new Error('Expression is empty');
  const tokens: Array<{ t: string; v?: number | string }> = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j += 1;
      tokens.push({ t: 'num', v: Number(s.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_π]/.test(ch)) {
      let j = i;
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j += 1;
      tokens.push({ t: 'id', v: s.slice(i, j).replace('π', 'pi') });
      i = j;
      continue;
    }
    if ('+-*/%^(),'.includes(ch)) {
      tokens.push({ t: ch });
      i += 1;
      continue;
    }
    throw new Error(`Invalid character: ${ch}`);
  }
  return tokens;
}

/** Parse an expression into the symbolic AST. Implicit multiplication is supported. */
export function parseSymbolic(source: string, variable = 'x'): AstNode {
  const toks = tokenizeSymbolic(source);
  let pos = 0;
  const peek = () => toks[pos];
  const next = () => toks[pos++];

  function parseExpr(): AstNode {
    let node = parseTerm();
    while (peek() && (peek()!.t === '+' || peek()!.t === '-')) {
      const op = next()!.t as '+' | '-';
      node = bin(op, node, parseTerm());
    }
    return node;
  }
  function parseTerm(): AstNode {
    let node = parseUnary();
    for (;;) {
      const token = peek();
      if (token && (token.t === '*' || token.t === '/')) {
        const op = next()!.t as '*' | '/';
        node = bin(op, node, parseUnary());
        continue;
      }
      // implicit multiplication: 2x, (x+1)(x-1), x sin(x)
      if (token && (token.t === 'num' || token.t === 'id' || token.t === '(')) {
        node = bin('*', node, parseUnary());
        continue;
      }
      return node;
    }
  }
  function parseUnary(): AstNode {
    if (peek()?.t === '-') {
      next();
      return { kind: 'neg', arg: parseUnary() };
    }
    if (peek()?.t === '+') {
      next();
      return parseUnary();
    }
    return parsePower();
  }
  function parsePower(): AstNode {
    const base = parseAtom();
    if (peek()?.t === '^') {
      next();
      return bin('^', base, parseUnary());
    }
    return base;
  }
  function parseAtom(): AstNode {
    const token = next();
    if (!token) throw new Error('Unexpected end of expression');
    if (token.t === 'num') return num(Number(token.v));
    if (token.t === '(') {
      const inner = parseExpr();
      if (next()?.t !== ')') throw new Error('Missing closing parenthesis');
      return inner;
    }
    if (token.t === 'id') {
      const name = String(token.v);
      if (name === 'pi') return num(Math.PI);
      if (name === 'e' && peek()?.t !== '(') return num(Math.E);
      if (peek()?.t === '(') {
        if (!SYMBOLIC_FUNCTIONS.has(name)) throw new Error(`Function not supported symbolically: ${name}`);
        next();
        const arg = parseExpr();
        if (next()?.t !== ')') throw new Error('Missing closing parenthesis');
        return call(name, arg);
      }
      return { kind: 'var', name: name === variable ? variable : name };
    }
    throw new Error(`Unexpected token: ${token.t}`);
  }

  const ast = parseExpr();
  if (pos < toks.length) throw new Error('Unexpected trailing input');
  return ast;
}

function clone(node: AstNode): AstNode {
  return JSON.parse(JSON.stringify(node)) as AstNode;
}

/** Constant folding + algebraic simplification (identities, not magic). */
export function simplify(node: AstNode): AstNode {
  switch (node.kind) {
    case 'num':
    case 'var':
      return node;
    case 'neg': {
      const arg = simplify(node.arg);
      if (arg.kind === 'num') return num(-arg.value);
      if (arg.kind === 'neg') return arg.arg;
      return { kind: 'neg', arg };
    }
    case 'call':
      return call(node.fn, simplify(node.arg));
    case 'bin': {
      const left = simplify(node.left);
      const right = simplify(node.right);
      if (left.kind === 'num' && right.kind === 'num') {
        const a = left.value;
        const b = right.value;
        if (node.op === '+') return num(a + b);
        if (node.op === '-') return num(a - b);
        if (node.op === '*') return num(a * b);
        if (node.op === '/' && b !== 0) return num(a / b);
        if (node.op === '^') return num(a ** b);
      }
      const isNum = (n: AstNode, v: number) => n.kind === 'num' && n.value === v;
      if (node.op === '+') {
        if (isNum(left, 0)) return right;
        if (isNum(right, 0)) return left;
      }
      if (node.op === '-') {
        if (isNum(right, 0)) return left;
        if (isNum(left, 0)) return { kind: 'neg', arg: right };
      }
      if (node.op === '*') {
        if (isNum(left, 0) || isNum(right, 0)) return num(0);
        if (isNum(left, 1)) return right;
        if (isNum(right, 1)) return left;
      }
      if (node.op === '/') {
        if (isNum(left, 0)) return num(0);
        if (isNum(right, 1)) return left;
      }
      if (node.op === '^') {
        if (isNum(right, 0)) return num(1);
        if (isNum(right, 1)) return left;
        if (isNum(left, 0)) return num(0);
        if (isNum(left, 1)) return right;
      }
      return bin(node.op, left, right);
    }
  }
}

/** Symbolic derivative with respect to `variable`. */
export function differentiate(node: AstNode, variable = 'x'): AstNode {
  switch (node.kind) {
    case 'num':
      return num(0);
    case 'var':
      return num(node.name === variable ? 1 : 0);
    case 'neg':
      return { kind: 'neg', arg: differentiate(node.arg, variable) };
    case 'call': {
      const u = node.arg;
      const du = differentiate(u, variable);
      const wrap = (outer: AstNode): AstNode => simplify(bin('*', outer, du));
      switch (node.fn) {
        case 'sin': return wrap(call('cos', clone(u)));
        case 'cos': return wrap({ kind: 'neg', arg: call('sin', clone(u)) });
        case 'tan': return wrap(bin('/', num(1), bin('^', call('cos', clone(u)), num(2))));
        case 'exp': return wrap(call('exp', clone(u)));
        case 'ln': return simplify(bin('/', du, clone(u)));
        case 'log': return simplify(bin('/', du, bin('*', clone(u), num(Math.LN10))));
        case 'sqrt': return simplify(bin('/', du, bin('*', num(2), call('sqrt', clone(u)))));
        case 'sinh': return wrap(call('cosh', clone(u)));
        case 'cosh': return wrap(call('sinh', clone(u)));
        case 'tanh': return wrap(bin('/', num(1), bin('^', call('cosh', clone(u)), num(2))));
        default: throw new Error(`Cannot differentiate ${node.fn}`);
      }
    }
    case 'bin': {
      const { left: u, right: v } = node;
      const du = differentiate(u, variable);
      const dv = differentiate(v, variable);
      switch (node.op) {
        case '+': return simplify(bin('+', du, dv));
        case '-': return simplify(bin('-', du, dv));
        case '*': return simplify(bin('+', bin('*', du, clone(v)), bin('*', clone(u), dv)));
        case '/':
          return simplify(bin('/', bin('-', bin('*', du, clone(v)), bin('*', clone(u), dv)), bin('^', clone(v), num(2))));
        case '^': {
          if (v.kind === 'num') {
            // d(u^n) = n·u^(n−1)·u′
            return simplify(bin('*', bin('*', num(v.value), bin('^', clone(u), num(v.value - 1))), du));
          }
          if (u.kind === 'num') {
            // d(a^v) = a^v · ln(a) · v′
            return simplify(bin('*', bin('*', bin('^', clone(u), clone(v)), num(Math.log(u.value))), dv));
          }
          // general: u^v · (v′ ln u + v u′/u)
          return simplify(
            bin('*', bin('^', clone(u), clone(v)),
              bin('+', bin('*', dv, call('ln', clone(u))), bin('/', bin('*', clone(v), du), clone(u)))),
          );
        }
      }
    }
  }
}

/**
 * Symbolic antiderivative for the reliably integrable subset: constants,
 * powers of x, sin/cos/exp and sums thereof. Returns null outside that subset
 * so callers can fall back to numeric integration instead of guessing.
 */
export function integrateSymbolic(node: AstNode, variable = 'x'): AstNode | null {
  const n = simplify(node);
  if (n.kind === 'num') return bin('*', num(n.value), { kind: 'var', name: variable });
  if (n.kind === 'var') {
    return n.name === variable
      ? bin('/', bin('^', { kind: 'var', name: variable }, num(2)), num(2))
      : bin('*', clone(n), { kind: 'var', name: variable });
  }
  if (n.kind === 'neg') {
    const inner = integrateSymbolic(n.arg, variable);
    return inner ? { kind: 'neg', arg: inner } : null;
  }
  if (n.kind === 'call') {
    const argIsVar = n.arg.kind === 'var' && n.arg.name === variable;
    if (!argIsVar) return null;
    const x: AstNode = { kind: 'var', name: variable };
    if (n.fn === 'sin') return { kind: 'neg', arg: call('cos', x) };
    if (n.fn === 'cos') return call('sin', x);
    if (n.fn === 'exp') return call('exp', x);
    return null;
  }
  if (n.kind === 'bin') {
    if (n.op === '+' || n.op === '-') {
      const a = integrateSymbolic(n.left, variable);
      const b = integrateSymbolic(n.right, variable);
      return a && b ? simplify(bin(n.op, a, b)) : null;
    }
    if (n.op === '^' && n.left.kind === 'var' && n.left.name === variable && n.right.kind === 'num') {
      const p = n.right.value;
      if (p === -1) return call('ln', { kind: 'var', name: variable });
      return simplify(bin('/', bin('^', { kind: 'var', name: variable }, num(p + 1)), num(p + 1)));
    }
    if (n.op === '*') {
      // c·f(x)  or  f(x)·c
      if (n.left.kind === 'num') {
        const inner = integrateSymbolic(n.right, variable);
        return inner ? simplify(bin('*', num(n.left.value), inner)) : null;
      }
      if (n.right.kind === 'num') {
        const inner = integrateSymbolic(n.left, variable);
        return inner ? simplify(bin('*', inner, num(n.right.value))) : null;
      }
    }
    if (n.op === '/' && n.right.kind === 'num') {
      const inner = integrateSymbolic(n.left, variable);
      return inner ? simplify(bin('/', inner, num(n.right.value))) : null;
    }
  }
  return null;
}

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };

/** Render an AST back to a compact expression string understood by the evaluator. */
export function astToString(node: AstNode): string {
  switch (node.kind) {
    case 'num':
      return Object.is(node.value, -0) ? '0' : String(node.value);
    case 'var':
      return node.name;
    case 'neg':
      return `(-${astToString(node.arg)})`;
    case 'call':
      return `${node.fn}(${astToString(node.arg)})`;
    case 'bin': {
      const wrap = (child: AstNode): string => {
        const text = astToString(child);
        if (child.kind === 'bin' && PRECEDENCE[child.op] < PRECEDENCE[node.op]) return `(${text})`;
        return text;
      };
      return `${wrap(node.left)}${node.op}${wrap(node.right)}`;
    }
  }
}

export interface SymbolicResult {
  derivative: string;
  derivativeValue?: number;
  antiderivative: string | null;
}

/** Full symbolic work-up of one expression in x. */
export function symbolicAnalysis(expression: string, at?: number): SymbolicResult {
  const ast = parseSymbolic(expression, 'x');
  const derivative = astToString(simplify(differentiate(ast, 'x')));
  const antiderivativeNode = integrateSymbolic(ast, 'x');
  return {
    derivative,
    derivativeValue: at !== undefined && Number.isFinite(at) ? evaluateExpression(derivative, { x: at }) : undefined,
    antiderivative: antiderivativeNode ? astToString(simplify(antiderivativeNode)) : null,
  };
}

// ─── Numeric inverse solving ─────────────────────────────────────────────────

export interface InverseSolution {
  x: number;
  iterations: number;
  residual: number;
}

/**
 * Solve f(x) = target. Strategy: probe an expanding set of candidate brackets
 * around `guess`, then bisect (robust for the monotone stretches that dominate
 * real formulas). Returns null when no sign change can be bracketed.
 */
export function solveInverse(
  f: (x: number) => number,
  target: number,
  options: { guess?: number; min?: number; max?: number; tolerance?: number } = {},
): InverseSolution | null {
  const guess = options.guess ?? 1;
  const tolerance = options.tolerance ?? 1e-10;
  const g = (x: number) => {
    try {
      const y = f(x);
      return Number.isFinite(y) ? y - target : Number.NaN;
    } catch {
      return Number.NaN;
    }
  };
  const atGuess = g(guess);
  if (Number.isFinite(atGuess) && Math.abs(atGuess) <= tolerance) {
    return { x: guess, iterations: 0, residual: Math.abs(atGuess) };
  }
  // Candidate brackets: symmetric expansion around the guess, clipped to bounds.
  const loBound = options.min ?? -1e9;
  const hiBound = options.max ?? 1e9;
  const points = new Set<number>([guess, 0, 1, -1]);
  for (let scale = 1; scale <= 1e7; scale *= 4) {
    points.add(guess + scale);
    points.add(guess - scale);
    points.add(scale);
    points.add(-scale);
  }
  const sorted = [...points]
    .map((x) => Math.min(hiBound, Math.max(loBound, x)))
    .sort((a, b) => a - b)
    .filter((x, i, arr) => i === 0 || x !== arr[i - 1]);

  // Try brackets nearest the guess first, so x²=16 from guess 1 returns +4, not −4.
  const brackets = sorted
    .slice(0, -1)
    .map((lo, i) => ({ lo, hi: sorted[i + 1], distance: Math.min(Math.abs(lo - guess), Math.abs(sorted[i + 1] - guess)) }))
    .sort((a, b) => a.distance - b.distance);
  for (const bracket of brackets) {
    let lo = bracket.lo;
    let hi = bracket.hi;
    let flo = g(lo);
    const fhi = g(hi);
    if (!Number.isFinite(flo) || !Number.isFinite(fhi)) continue;
    if (Math.abs(flo) <= tolerance) return { x: lo, iterations: 0, residual: Math.abs(flo) };
    if (Math.abs(fhi) <= tolerance) return { x: hi, iterations: 0, residual: Math.abs(fhi) };
    if (flo * fhi > 0) continue;
    let iterations = 0;
    for (; iterations < 100; iterations += 1) {
      const mid = (lo + hi) / 2;
      const fmid = g(mid);
      if (!Number.isFinite(fmid)) break;
      if (Math.abs(fmid) <= tolerance || (hi - lo) / 2 <= tolerance * Math.max(1, Math.abs(mid))) {
        return { x: mid, iterations: iterations + 1, residual: Math.abs(fmid) };
      }
      if (flo * fmid < 0) hi = mid;
      else {
        lo = mid;
        flo = fmid;
      }
    }
    return { x: (lo + hi) / 2, iterations, residual: Math.abs(g((lo + hi) / 2)) };
  }
  return null;
}

// ─── Sensitivity & uncertainty ───────────────────────────────────────────────

export interface SensitivityEntry {
  name: string;
  low: number;
  high: number;
  /** |effect| relative to the largest effect, 0..1 */
  relative: number;
  delta: number;
}

/** One-at-a-time ±fraction sensitivity ("tornado") of an output. */
export function sensitivityAnalysis(
  names: string[],
  base: Record<string, number>,
  compute: (inputs: Record<string, number>) => number,
  fraction = 0.1,
): SensitivityEntry[] {
  const entries: SensitivityEntry[] = names.map((name) => {
    const centre = base[name];
    const step = centre !== 0 ? Math.abs(centre) * fraction : fraction;
    const lowInputs = { ...base, [name]: centre - step };
    const highInputs = { ...base, [name]: centre + step };
    let low = Number.NaN;
    let high = Number.NaN;
    try { low = compute(lowInputs); } catch { /* domain edge */ }
    try { high = compute(highInputs); } catch { /* domain edge */ }
    const delta = Number.isFinite(low) && Number.isFinite(high) ? Math.abs(high - low) : Number.NaN;
    return { name, low, high, relative: 0, delta };
  });
  const max = Math.max(0, ...entries.map((e) => (Number.isFinite(e.delta) ? e.delta : 0)));
  for (const entry of entries) {
    entry.relative = max > 0 && Number.isFinite(entry.delta) ? entry.delta / max : 0;
  }
  return entries.sort((a, b) => (b.delta || 0) - (a.delta || 0));
}

/** Deterministic PRNG (mulberry32) so Monte-Carlo results are reproducible. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Summarise already-collected Monte-Carlo outputs (used by async UI sampling). */
export function summarizeSamples(outputs: number[]): UncertaintyResult {
  if (outputs.length < 8) throw new Error('Too few valid samples');
  const sorted = [...outputs].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const std = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / (sorted.length - 1));
  const quant = (p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)))];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const binCount = 12;
  const width = (max - min) / binCount || 1;
  const histogram = Array.from({ length: binCount }, (_, i) => ({
    from: min + i * width,
    to: min + (i + 1) * width,
    count: 0,
  }));
  for (const value of outputs) histogram[Math.min(binCount - 1, Math.floor((value - min) / width))].count += 1;
  return { mean, std, p5: quant(0.05), p50: quant(0.5), p95: quant(0.95), min, max, samples: outputs.length, histogram };
}

export interface UncertaintyResult {
  mean: number;
  std: number;
  p5: number;
  p50: number;
  p95: number;
  min: number;
  max: number;
  samples: number;
  histogram: Array<{ from: number; to: number; count: number }>;
}

/**
 * Propagate input uncertainties (±, treated as uniform half-widths) through a
 * computation by seeded Monte-Carlo sampling. Reproducible for a given seed.
 */
export function propagateUncertainty(
  base: Record<string, number>,
  uncertainties: Record<string, number>,
  compute: (inputs: Record<string, number>) => number,
  samples = 240,
  seed = 42,
): UncertaintyResult {
  const rng = mulberry32(seed);
  const outputs: number[] = [];
  for (let i = 0; i < samples; i += 1) {
    const inputs: Record<string, number> = { ...base };
    for (const [name, halfWidth] of Object.entries(uncertainties)) {
      if (halfWidth > 0) inputs[name] = base[name] + (rng() * 2 - 1) * halfWidth;
    }
    try {
      const value = compute(inputs);
      if (Number.isFinite(value)) outputs.push(value);
    } catch { /* sample outside the domain */ }
  }
  if (outputs.length < 8) throw new Error('Too few valid samples; widen the range or reduce uncertainty');
  const sorted = [...outputs].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const std = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / (sorted.length - 1));
  const quant = (p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)))];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const binCount = 12;
  const width = (max - min) / binCount || 1;
  const histogram = Array.from({ length: binCount }, (_, i) => ({
    from: min + i * width,
    to: min + (i + 1) * width,
    count: 0,
  }));
  for (const value of outputs) {
    histogram[Math.min(binCount - 1, Math.floor((value - min) / width))].count += 1;
  }
  return { mean, std, p5: quant(0.05), p50: quant(0.5), p95: quant(0.95), min, max, samples: outputs.length, histogram };
}

// ─── Dimensional analysis ────────────────────────────────────────────────────

/** Dimension vector over SI base quantities. */
export interface Dimension {
  length: number;
  mass: number;
  time: number;
  current: number;
  temperature: number;
  amount: number;
  luminous: number;
}

const zeroDimension = (): Dimension => ({
  length: 0, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminous: 0,
});

const UNIT_DIMENSIONS: Record<string, Partial<Dimension>> = {
  m: { length: 1 }, metre: { length: 1 }, meter: { length: 1 }, km: { length: 1 }, cm: { length: 1 },
  mm: { length: 1 }, nm: { length: 1 }, mi: { length: 1 }, ft: { length: 1 }, in: { length: 1 },
  'm²': { length: 2 }, 'm^2': { length: 2 }, 'm³': { length: 3 }, 'm^3': { length: 3 },
  L: { length: 3 }, ml: { length: 3 }, 'cm³': { length: 3 },
  s: { time: 1 }, sec: { time: 1 }, ms: { time: 1 }, min: { time: 1 }, h: { time: 1 }, hr: { time: 1 }, day: { time: 1 },
  kg: { mass: 1 }, g: { mass: 1 }, mg: { mass: 1 }, t: { mass: 1 }, lb: { mass: 1 },
  A: { current: 1 }, mA: { current: 1 },
  K: { temperature: 1 }, '°C': { temperature: 1 }, '°F': { temperature: 1 },
  mol: { amount: 1 }, mmol: { amount: 1 },
  cd: { luminous: 1 },
  Hz: { time: -1 }, '1/s': { time: -1 },
  N: { mass: 1, length: 1, time: -2 }, newton: { mass: 1, length: 1, time: -2 },
  Pa: { mass: 1, length: -1, time: -2 }, kPa: { mass: 1, length: -1, time: -2 }, bar: { mass: 1, length: -1, time: -2 }, atm: { mass: 1, length: -1, time: -2 },
  J: { mass: 1, length: 2, time: -2 }, kJ: { mass: 1, length: 2, time: -2 }, cal: { mass: 1, length: 2, time: -2 }, eV: { mass: 1, length: 2, time: -2 },
  W: { mass: 1, length: 2, time: -3 }, kW: { mass: 1, length: 2, time: -3 },
  V: { mass: 1, length: 2, time: -3, current: -1 }, volt: { mass: 1, length: 2, time: -3, current: -1 },
  'Ω': { mass: 1, length: 2, time: -3, current: -2 }, ohm: { mass: 1, length: 2, time: -3, current: -2 },
  C: { time: 1, current: 1 }, coulomb: { time: 1, current: 1 },
  F: { mass: -1, length: -2, time: 4, current: 2 }, farad: { mass: -1, length: -2, time: 4, current: 2 },
  T: { mass: 1, time: -2, current: -1 }, tesla: { mass: 1, time: -2, current: -1 },
  'm/s': { length: 1, time: -1 }, 'km/h': { length: 1, time: -1 },
  'm/s²': { length: 1, time: -2 }, 'm/s^2': { length: 1, time: -2 },
  'kg/m³': { mass: 1, length: -3 }, 'g/cm³': { mass: 1, length: -3 },
  'mol/L': { amount: 1, length: -3 }, M: { amount: 1, length: -3 },
  rad: {}, deg: {}, '°': {}, angle: {}, '%': {}, percent: {}, ratio: {},
};

/** Parse a (possibly compound) unit string into its dimension vector. */
export function dimensionOfUnit(unit: string | null | undefined): Dimension | null {
  if (!unit) return null;
  const raw = unit.trim();
  if (!raw) return null;
  if (UNIT_DIMENSIONS[raw]) return { ...zeroDimension(), ...UNIT_DIMENSIONS[raw] };
  // compound form: a*b/c^2 …
  if (/[*·/]/.test(raw) || /\^/.test(raw)) {
    const result = zeroDimension();
    const parts = raw.split(/([*/·])/);
    let sign = 1;
    let failed = false;
    for (const part of parts) {
      if (part === '*') { sign = 1; continue; }
      if (part === '/' || part === '·') { sign = part === '/' ? -1 : 1; continue; }
      const match = part.trim().match(/^(.+?)(?:\^(-?\d+(?:\.\d+)?)|²|³)?$/);
      if (!match) { failed = true; break; }
      const base = match[1].trim();
      const exponent = match[2] ? Number(match[2]) : part.includes('²') ? 2 : part.includes('³') ? 3 : 1;
      const dim = UNIT_DIMENSIONS[base];
      if (!dim) { failed = true; break; }
      for (const key of Object.keys(result) as Array<keyof Dimension>) {
        result[key] += sign * exponent * (dim[key] ?? 0);
      }
    }
    return failed ? null : result;
  }
  return null;
}

const DIMENSION_SYMBOLS: Array<[keyof Dimension, string]> = [
  ['length', 'L'], ['mass', 'M'], ['time', 'T'], ['current', 'I'],
  ['temperature', 'Θ'], ['amount', 'N'], ['luminous', 'J'],
];

/** Human-readable dimension, e.g. `L·T⁻¹` or `dimensionless`. */
export function dimensionLabel(dim: Dimension | null): string {
  if (!dim) return '—';
  const superscripts: Record<string, string> = {
    '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '.': '·',
  };
  const parts = DIMENSION_SYMBOLS
    .filter(([key]) => dim[key] !== 0)
    .map(([key, symbol]) => {
      const power = dim[key];
      if (power === 1) return symbol;
      const text = String(power).split('').map((c) => superscripts[c] ?? c).join('');
      return `${symbol}${text}`;
    });
  return parts.length ? parts.join('·') : '1';
}

export function dimensionsEqual(a: Dimension | null, b: Dimension | null): boolean {
  if (!a || !b) return false;
  return DIMENSION_SYMBOLS.every(([key]) => a[key] === b[key]);
}

// ─── Formatting & verification ───────────────────────────────────────────────

/** Format with significant figures (no spurious trailing digits). */
export function formatSignificant(value: number, figures = 6): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-4) return value.toExponential(Math.max(0, figures - 1));
  return String(Number(value.toPrecision(figures)));
}

/** Stable FNV-1a fingerprint of a canonical record — a "calculation receipt". */
export function verificationCode(record: unknown): string {
  const canonical = JSON.stringify(record, (_key, value) =>
    typeof value === 'number' ? Number(value.toPrecision(12)) : value,
  );
  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i += 1) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `SE-${hex.slice(0, 4)}-${hex.slice(4)}`;
}

// ─── ODE integrator (RK4) ────────────────────────────────────────────────────

export interface OdePoint { x: number; y: number }

/** Classic Runge–Kutta integration of y′ = f(x, y) exposed to the expression grammar. */
export function integrateOde(
  expression: string,
  x0: number,
  y0: number,
  x1: number,
  steps = 100,
): OdePoint[] {
  const f = (x: number, y: number) => evaluateExpression(expression, { x, y });
  const n = Math.max(1, Math.min(5000, Math.trunc(steps)));
  const h = (x1 - x0) / n;
  const points: OdePoint[] = [{ x: x0, y: y0 }];
  let x = x0;
  let y = y0;
  for (let i = 0; i < n; i += 1) {
    const k1 = f(x, y);
    const k2 = f(x + h / 2, y + (h / 2) * k1);
    const k3 = f(x + h / 2, y + (h / 2) * k2);
    const k4 = f(x + h, y + h * k3);
    y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    x = x0 + (i + 1) * h;
    if (!Number.isFinite(y)) throw new Error('ODE solution diverged (non-finite value)');
    points.push({ x, y });
  }
  return points;
}
