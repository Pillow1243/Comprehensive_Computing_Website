/**
 * "Check my work" (v5) — line-by-line verification of a student's own written
 * solution. Each non-empty line may be:
 *
 *   · an equation   `2x + 4 = 10`     → both sides are evaluated and compared
 *   · a bare value  `= 3` / `3`       → compared with the previous line's value
 *   · a transition  `x = (10-4)/2`    → checked for algebraic equivalence with
 *                                       the previous equation at sample points
 *
 * The checker names the first line that breaks and classifies the likely
 * misconception (sign slip, arithmetic slip, dropped term…) instead of only
 * saying "wrong". Everything runs on the safe expression evaluator.
 */
import { evaluateExpression } from '@/lib/expression';

export type LineStatus = 'ok' | 'error' | 'skipped';

export interface CheckedLine {
  index: number;
  raw: string;
  status: LineStatus;
  /** evaluated numeric value when the line has one */
  value?: number;
  /** lhs − rhs for equation lines */
  residual?: number;
  issue?: Misconception;
  noteFa: string;
  noteEn: string;
}

export type Misconception =
  | 'sign-error'
  | 'arithmetic-error'
  | 'not-equivalent'
  | 'parse-error'
  | 'final-mismatch';

export interface CheckWorkResult {
  lines: CheckedLine[];
  firstErrorIndex: number | null;
  finalValue?: number;
  finalMatches: boolean | null;
}

const SAMPLE_POINTS = [0.5, 1.5, 2.5, -1.25, 3.75];

function tryEvaluate(expr: string, vars: Record<string, number> = {}): number | null {
  try {
    const value = evaluateExpression(expr, vars);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** Split `lhs = rhs` on the first top-level equals sign. */
function splitEquation(line: string): [string, string] | null {
  let depth = 0;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === '=' && depth === 0) return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }
  return null;
}

/** Are two expressions numerically equivalent at several sample points? */
function equivalent(a: string, b: string, variable: string): boolean | null {
  let evaluated = 0;
  for (const point of SAMPLE_POINTS) {
    const va = tryEvaluate(a, { [variable]: point, x: point });
    const vb = tryEvaluate(b, { [variable]: point, x: point });
    if (va === null || vb === null) continue;
    evaluated += 1;
    if (Math.abs(va - vb) > 1e-6 * Math.max(1, Math.abs(va), Math.abs(vb))) return false;
  }
  return evaluated >= 2 ? true : null;
}

function inferVariable(lines: string[]): string {
  for (const line of lines) {
    const match = line.match(/[a-zA-Z]/);
    if (match && !'sincostanlnlogexpsqrtpi'.includes(match[0])) return match[0];
    if (match) return match[0];
  }
  return 'x';
}

/**
 * Verify a multi-line solution. `expectedFinal` (when given) is compared with
 * the value of the last evaluable line.
 */
export function checkWork(text: string, expectedFinal?: number): CheckWorkResult {
  const rawLines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const variable = inferVariable(rawLines);
  const lines: CheckedLine[] = [];
  let previousValue: number | undefined;
  let previousEquation: [string, string] | null = null;
  let firstErrorIndex: number | null = null;

  rawLines.forEach((raw, index) => {
    const cleaned = raw.replace(/^(?:=>|⇒|→|∴)\s*/, '').trim();
    const equation = splitEquation(cleaned);
    const mark = (line: CheckedLine) => {
      lines.push(line);
      if (line.status === 'error' && firstErrorIndex === null) firstErrorIndex = index;
    };

    if (equation) {
      const [lhs, rhs] = equation;
      // Pure numeric equation / assignment like `x = 3` or `2+3 = 5`.
      const lhsValue = tryEvaluate(lhs, { [variable]: previousValue ?? 0, x: previousValue ?? 0 });
      const rhsValue = tryEvaluate(rhs, { [variable]: previousValue ?? 0, x: previousValue ?? 0 });
      const bareVariable = new RegExp(`^${variable}$`).test(lhs);
      if (bareVariable && rhsValue !== null) {
        // candidate final answer: x = <number or expression>
        if (previousEquation) {
          const [pl, pr] = previousEquation;
          const holds = tryEvaluate(pl, { [variable]: rhsValue, x: rhsValue }) !== null &&
            Math.abs((tryEvaluate(pl, { [variable]: rhsValue, x: rhsValue }) ?? 0) - (tryEvaluate(pr, { [variable]: rhsValue, x: rhsValue }) ?? 0)) <= 1e-6;
          if (!holds) {
            mark({
              index, raw, status: 'error', value: rhsValue, issue: 'not-equivalent',
              noteFa: 'این مقدار در معادلهٔ خط قبل صدق نمی‌کند؛ جایگذاری را بررسی کنید.',
              noteEn: 'This value does not satisfy the previous line’s equation — check the substitution.',
            });
            previousValue = rhsValue;
            previousEquation = equation;
            return;
          }
        }
        mark({ index, raw, status: 'ok', value: rhsValue, noteFa: 'مقدار این خط با خط قبل سازگار است.', noteEn: 'Consistent with the previous line.' });
        previousValue = rhsValue;
        previousEquation = equation;
        return;
      }
      if (lhsValue !== null && rhsValue !== null && !/[a-zA-Z]/.test(cleaned.replace(/sin|cos|tan|ln|log|exp|sqrt|pi/g, ''))) {
        const residual = lhsValue - rhsValue;
        if (Math.abs(residual) <= 1e-9) {
          mark({ index, raw, status: 'ok', value: rhsValue, residual, noteFa: 'دو طرف برابرند.', noteEn: 'Both sides are equal.' });
        } else {
          const signSlip = Math.abs(lhsValue + rhsValue) <= 1e-9 || Math.abs(Math.abs(lhsValue) - Math.abs(rhsValue)) <= 1e-9;
          mark({
            index, raw, status: 'error', value: rhsValue, residual,
            issue: signSlip ? 'sign-error' : 'arithmetic-error',
            noteFa: signSlip
              ? 'به نظر می‌رسد یک علامت (+/−) جابه‌جا شده است؛ دو طرف فقط در علامت فرق دارند.'
              : 'دو طرف این برابری یکی نیستند؛ محاسبهٔ همین خط را دوباره انجام دهید.',
            noteEn: signSlip
              ? 'Looks like a sign slip — the two sides differ only by sign.'
              : 'The two sides differ — redo the arithmetic on this line.',
          });
        }
        previousValue = rhsValue;
        previousEquation = equation;
        return;
      }
      // Symbolic transition: is the new equation equivalent to the previous one?
      if (previousEquation) {
        const [pl, pr] = previousEquation;
        const sameLhs = equivalent(lhs, pl, variable);
        const sameRhs = equivalent(rhs, pr, variable);
        const cross = equivalent(`${lhs}-(${rhs})`, `${pl}-(${pr})`, variable);
        if (cross === false && sameLhs !== true) {
          mark({
            index, raw, status: 'error', issue: 'not-equivalent',
            noteFa: 'این خط هم‌ارز خط قبل نیست؛ احتمالاً یک جمله حذف یا یک عمل فقط روی یک طرف انجام شده است.',
            noteEn: 'This line is not equivalent to the previous one — a term may be dropped, or an operation applied to one side only.',
          });
          previousEquation = equation;
          return;
        }
      }
      mark({ index, raw, status: 'ok', noteFa: 'خط قابل قبول است.', noteEn: 'Line accepted.' });
      previousEquation = equation;
      return;
    }

    // Bare expression / value line.
    const value = tryEvaluate(cleaned, { [variable]: previousValue ?? 0, x: previousValue ?? 0 });
    if (value === null) {
      mark({
        index, raw, status: 'error', issue: 'parse-error',
        noteFa: 'این خط قابل محاسبه نیست؛ عبارت را بررسی کنید (پرانتز یا عملگر ناقص؟).',
        noteEn: 'This line cannot be evaluated — check for a missing parenthesis or operator.',
      });
      return;
    }
    mark({ index, raw, status: 'ok', value, noteFa: 'مقدار خط محاسبه شد.', noteEn: 'Line evaluated.' });
    previousValue = value;
  });

  const finalValue = [...lines].reverse().find((line) => line.value !== undefined)?.value;
  const finalMatches = expectedFinal !== undefined && finalValue !== undefined
    ? Math.abs(finalValue - expectedFinal) <= 1e-6 * Math.max(1, Math.abs(expectedFinal))
    : null;
  if (finalMatches === false && firstErrorIndex === null && lines.length) {
    const last = lines[lines.length - 1];
    last.status = 'error';
    last.issue = 'final-mismatch';
    last.noteFa = 'نتیجهٔ نهایی با جواب مورد انتظار یکی نیست؛ اولین خط ناسازگار را پیدا کنید.';
    last.noteEn = 'The final result differs from the expected answer — hunt down the first inconsistent line.';
    firstErrorIndex = last.index;
  }
  return { lines, firstErrorIndex, finalValue, finalMatches };
}
