/**
 * Safe arithmetic-expression evaluator for interactive tools (v4).
 *
 * This is a TypeScript port of the trusted parser in `apps/web/engine.js`
 * (tokenizer + recursive descent, never `eval`), kept semantically identical
 * — same functions, constants and precedence (`-2^2 = -4`, right-associative
 * `^`, postfix factorial) — with one grapher-friendly addition: implicit
 * multiplication (`2x`, `2(x+1)`, `(x+1)(x-1)`, `x sin(x)`).
 *
 * It runs on the main thread so the graphing tool can resample at pointer
 * speed; the formula solvers still run in the compute worker.
 */

type Vars = Record<string, number>;

const FUNCS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sec: (x) => 1 / Math.cos(x),
  csc: (x) => 1 / Math.sin(x),
  cot: (x) => 1 / Math.tan(x),
  ncr: (n, r) => {
    const nn = Math.round(n);
    const rr = Math.round(r);
    if (rr < 0 || rr > nn || nn < 0) return Number.NaN;
    let value = 1;
    for (let k = 1; k <= rr; k += 1) value = (value * (nn - rr + k)) / k;
    return value;
  },
  npr: (n, r) => {
    const nn = Math.round(n);
    const rr = Math.round(r);
    if (rr < 0 || rr > nn || nn < 0) return Number.NaN;
    let value = 1;
    for (let k = 0; k < rr; k += 1) value *= nn - k;
    return value;
  },
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  log10: Math.log10,
  exp: Math.exp,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  min: Math.min,
  max: Math.max,
};

const CONSTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: 2 * Math.PI,
  phi: (1 + Math.sqrt(5)) / 2,
};

export const EXPRESSION_FUNCTIONS = Object.keys(FUNCS);
export const EXPRESSION_CONSTANTS = Object.keys(CONSTS);

interface Token {
  t: string;
  v?: number | string;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const s = String(source).replace(/\s+/g, '');
  if (!s) throw new Error('عبارت خالی است');
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j += 1;
      if (s[j] === 'e' || s[j] === 'E') {
        let k = j + 1;
        if (s[k] === '+' || s[k] === '-') k += 1;
        if (/[0-9]/.test(s[k] ?? '')) {
          j = k;
          while (j < s.length && /[0-9]/.test(s[j])) j += 1;
        }
      }
      const raw = s.slice(i, j);
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`عدد نامعتبر: ${raw}`);
      tokens.push({ t: 'num', v: value });
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
    if ('+-*/%^(),!'.includes(ch)) {
      tokens.push({ t: ch });
      i += 1;
      continue;
    }
    throw new Error(`کاراکتر نامعتبر: ${ch}`);
  }
  return tokens;
}

/** Evaluate an expression such as `2x + sin(x)` with variables. Throws on bad input. */
export function evaluateExpression(expr: string, vars: Vars = {}): number {
  const toks = tokenize(expr);
  let pos = 0;
  const peek = (): Token | undefined => toks[pos];
  const next = (): Token | undefined => toks[pos++];

  function parseExpr(): number {
    let value = parseTerm();
    while (peek() && (peek()!.t === '+' || peek()!.t === '-')) {
      const op = next()!.t;
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function startsPrimary(tok: Token | undefined): boolean {
    return tok !== undefined && (tok.t === 'num' || tok.t === '(' || tok.t === 'id');
  }

  function parseTerm(): number {
    let value = parseUnary();
    for (;;) {
      const tok = peek();
      if (tok && (tok.t === '*' || tok.t === '/' || tok.t === '%')) {
        next();
        const rhs = parseUnary();
        value = tok.t === '*' ? value * rhs : tok.t === '/' ? value / rhs : value % rhs;
      } else if (startsPrimary(tok)) {
        // Implicit multiplication: 2x, 2(x+1), (x+1)(x−1), x sin(x)
        value *= parseUnary();
      } else {
        return value;
      }
    }
  }

  // Unary minus binds looser than ^ so -2^2 = -(2^2) = -4 and 2^-1 = 0.5.
  function parseUnary(): number {
    if (peek()?.t === '-') {
      next();
      return -parseUnary();
    }
    if (peek()?.t === '+') {
      next();
      return parseUnary();
    }
    return parsePower();
  }

  function factorial(n: number): number {
    if (n < 0 || Math.round(n) !== n) throw new Error('فاکتوریل فقط برای صحیح نامنفی');
    let result = 1;
    for (let k = 2; k <= n && k <= 171; k += 1) result *= k;
    return result;
  }

  function parsePower(): number {
    let base = parseAtom();
    if (peek()?.t === '!') {
      next();
      base = factorial(base);
    }
    if (peek()?.t === '^') {
      next();
      const exponent = parseUnary();
      base = Math.pow(base, exponent);
    }
    return base;
  }

  function parseAtom(): number {
    const tok = next();
    if (!tok) throw new Error('پایان غیرمنتظره عبارت');
    if (tok.t === 'num') return tok.v as number;
    if (tok.t === '(') {
      const value = parseExpr();
      if (next()?.t !== ')') throw new Error('پرانتز بسته نیست');
      return value;
    }
    if (tok.t === 'id') {
      const name = tok.v as string;
      if (peek()?.t === '(') {
        next();
        const args = [parseExpr()];
        while (peek()?.t === ',') {
          next();
          args.push(parseExpr());
        }
        if (next()?.t !== ')') throw new Error('پرانتز تابع بسته نیست');
        if (Object.prototype.hasOwnProperty.call(FUNCS, name)) return FUNCS[name](...args);
        throw new Error(`تابع ناشناخته: ${name}`);
      }
      if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name];
      if (Object.prototype.hasOwnProperty.call(CONSTS, name)) return CONSTS[name];
      throw new Error(`متغیر ناشناخته: ${name}`);
    }
    throw new Error('توکن غیرمنتظره');
  }

  const value = parseExpr();
  if (pos < toks.length) throw new Error('بخشی از عبارت پردازش نشد');
  return value;
}

/** True when the expression parses and evaluates for a sample x. */
export function isValidExpression(expr: string): boolean {
  if (!expr.trim()) return false;
  try {
    evaluateExpression(expr, { x: 0.37 });
    return true;
  } catch {
    try {
      evaluateExpression(expr, { x: 0 });
      return true;
    } catch {
      return false;
    }
  }
}

export interface SamplePoint {
  x: number;
  y: number | null;
}

/** Sample f(x) over a range; non-finite values become `null` (pen lifts). */
export function sampleExpression(
  expr: string,
  from: number,
  to: number,
  points = 240,
): SamplePoint[] {
  const out: SamplePoint[] = [];
  if (!(to > from) || points < 2) return out;
  const step = (to - from) / (points - 1);
  for (let i = 0; i < points; i += 1) {
    const x = from + i * step;
    let y: number | null = null;
    try {
      const value = evaluateExpression(expr, { x });
      y = Number.isFinite(value) ? value : null;
    } catch {
      y = null;
    }
    out.push({ x, y });
  }
  return out;
}

/** Central-difference derivative f′(at). */
export function derivativeAt(expr: string, at: number): number {
  const h = 1e-6;
  return (evaluateExpression(expr, { x: at + h }) - evaluateExpression(expr, { x: at - h })) / (2 * h);
}

/** Simpson-rule integral over [from, to]. */
export function integrateRange(expr: string, from: number, to: number, intervals = 400): number {
  const n = Math.max(2, intervals % 2 === 0 ? intervals : intervals + 1);
  const h = (to - from) / n;
  let sum = 0;
  for (let i = 0; i <= n; i += 1) {
    const x = from + i * h;
    const weight = i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2;
    sum += weight * evaluateExpression(expr, { x });
  }
  return (sum * h) / 3;
}

/** Locate roots of f(x)=0 inside [from, to] by sign-change scan + bisection. */
export function findRoots(expr: string, from: number, to: number, scans = 200): number[] {
  const roots: number[] = [];
  if (!(to > from)) return roots;
  const step = (to - from) / scans;
  const f = (x: number): number => {
    try {
      return evaluateExpression(expr, { x });
    } catch {
      return Number.NaN;
    }
  };
  let prevX = from;
  let prevY = f(from);
  for (let i = 1; i <= scans; i += 1) {
    const x = from + i * step;
    const y = f(x);
    if (Number.isFinite(prevY) && Number.isFinite(y)) {
      if (prevY === 0) roots.push(prevX);
      else if (prevY * y < 0) {
        let lo = prevX;
        let hi = x;
        let flo = prevY;
        for (let iter = 0; iter < 60; iter += 1) {
          const mid = (lo + hi) / 2;
          const fmid = f(mid);
          if (!Number.isFinite(fmid) || Math.abs(fmid) < 1e-12) {
            lo = mid;
            hi = mid;
            break;
          }
          if (flo * fmid < 0) hi = mid;
          else {
            lo = mid;
            flo = fmid;
          }
        }
        roots.push((lo + hi) / 2);
      }
    }
    prevX = x;
    prevY = y;
  }
  // De-duplicate roots found twice at scan boundaries.
  return roots.filter((root, index) => index === 0 || Math.abs(root - roots[index - 1]) > 1e-6);
}
