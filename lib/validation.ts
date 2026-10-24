import type { Formula, FormulaVariable } from '@/lib/formulas';
import { evaluate } from '@/apps/web/engine.js';

export type RawInputs = Record<string, string | number | boolean>;
export type ValidationErrors = Record<string, string>;

export interface ValidationResult {
  ok: boolean;
  values: Record<string, number | string | boolean>;
  errors: ValidationErrors;
}

export class FormulaError extends Error {
  readonly code:
    | 'validation'
    | 'compute'
    | 'timeout'
    | 'cancelled'
    | 'domain'
    | 'unit'
    | 'non-finite'
    | 'unknown';
  readonly formulaId: string;
  readonly field?: string;
  readonly inputs?: RawInputs;
  readonly cause?: unknown;

  constructor(
    code: FormulaError['code'],
    message: string,
    context: { formulaId: string; field?: string; inputs?: RawInputs; cause?: unknown },
  ) {
    super(message);
    this.name = 'FormulaError';
    this.code = code;
    this.formulaId = context.formulaId;
    this.field = context.field;
    this.inputs = context.inputs;
    this.cause = context.cause;
  }
}

const parseNumeric = (raw: string | number): number | null => {
  if (typeof raw === 'number') return raw;
  const normalized = String(raw)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[٫,]/g, '.')
    .replace(/\s+/g, '')
    .trim();
  if (!normalized) return null;
  // Accept simple fractions such as 1/3 — useful for angle inputs.
  const fraction = normalized.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return Number.NaN;
    return Number(fraction[1]) / denominator;
  }
  const numeric = Number(normalized);
  if (!Number.isNaN(numeric)) return numeric;
  // The math keyboard inserts symbols such as pi, sqrt(, ^ and /.
  // Evaluate safe expressions (never eval) so "pi/2" or "sqrt(2)" are valid.
  try {
    const result = evaluate(normalized);
    return typeof result === 'number' ? result : null;
  } catch {
    return null;
  }
};

export interface ValidateOptions {
  lang?: 'fa' | 'en' | 'ar';
}

const messages = {
  fa: {
    required: 'این مقدار الزامی است',
    invalidNumber: 'عدد معتبر وارد کنید',
    outOfRange: 'مقدار خارج از محدوده مجاز است',
    invalidOption: 'گزینه نامعتبر است',
    divideByZero: 'تقسیم بر صفر مجاز نیست',
  },
  en: {
    required: 'This value is required',
    invalidNumber: 'Enter a valid number',
    outOfRange: 'Value is outside the allowed range',
    invalidOption: 'Invalid option',
    divideByZero: 'Division by zero is not allowed',
  },
  ar: {
    required: 'هذا الحقل مطلوب',
    invalidNumber: 'أدخل رقمًا صحيحًا',
    outOfRange: 'القيمة خارج النطاق المسموح',
    invalidOption: 'خيار غير صالح',
    divideByZero: 'القسمة على صفر غير مسموحة',
  },
} as const;

const labelFor = (variable: FormulaVariable, lang: 'fa' | 'en' | 'ar') =>
  lang === 'fa' ? variable.label_fa : variable.label_en;

/**
 * Per-formula input validation (requirement B08).
 * Runs before any compute call so the main thread never receives NaN/∞ silently.
 */
export const validateInputs = (
  formula: Formula,
  raw: RawInputs,
  options: ValidateOptions = {},
): ValidationResult => {
  const lang = options.lang ?? 'fa';
  const t = messages[lang];
  const errors: ValidationErrors = {};
  const values: Record<string, number | string | boolean> = {};

  for (const variable of formula.variables) {
    const input = raw[variable.name];
    const label = labelFor(variable, lang);
    const isEmpty = input === undefined || input === null || input === '';

    if (isEmpty) {
      if (variable.default !== undefined && variable.default !== null && variable.default !== '') {
        values[variable.name] = variable.default;
      } else if (variable.required) {
        errors[variable.name] = t.required;
      }
      continue;
    }

    if (variable.type === 'number') {
      const numeric = parseNumeric(input as string | number);
      if (numeric === null) {
        errors[variable.name] = `${label}: ${t.invalidNumber}`;
        continue;
      }
      if (!Number.isFinite(numeric)) {
        errors[variable.name] = `${label}: ${t.invalidNumber}`;
        continue;
      }
      if (variable.min !== undefined && numeric < variable.min) {
        errors[variable.name] = `${label}: ${t.outOfRange} (≥ ${variable.min})`;
        continue;
      }
      if (variable.max !== undefined && numeric > variable.max) {
        errors[variable.name] = `${label}: ${t.outOfRange} (≤ ${variable.max})`;
        continue;
      }
      values[variable.name] = numeric;
      continue;
    }

    if (variable.type === 'boolean') {
      values[variable.name] = input === true || input === 'true';
      continue;
    }

    const text = String(input).trim();
    if (variable.type === 'select' && variable.options?.length) {
      if (!variable.options.includes(text)) {
        errors[variable.name] = `${label}: ${t.invalidOption}`;
        continue;
      }
    }
    values[variable.name] = text;
  }

  for (const [field, error] of Object.entries(errors)) {
    void field;
    void error;
  }

  return { ok: Object.keys(errors).length === 0, values, errors };
};

/** Post-compute guard: reject NaN/Infinity and explain which output failed. */
export const assertFiniteOutputs = (
  formula: Formula,
  values: Record<string, unknown>,
  inputs: RawInputs,
): void => {
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== 'number') continue;
    if (Number.isFinite(value)) continue;
    throw new FormulaError(
      'non-finite',
      `خروجی «${key}» متناهی نیست؛ ورودی‌ها را بررسی کنید (${formula.name_fa})`,
      { formulaId: formula.id, field: key, inputs },
    );
  }
};

export const describeError = (
  error: unknown,
  lang: 'fa' | 'en' | 'ar' = 'fa',
): { title: string; message: string; field?: string; code: string } => {
  if (error instanceof FormulaError) {
    if (error.code === 'timeout') {
      return {
        title: lang === 'fa' ? 'زمان محاسبه به پایان رسید' : 'Calculation timed out',
        message:
          lang === 'fa'
            ? 'محاسبه بیش از ۳۰ ثانیه طول کشید و لغو شد. ورودی‌ها را ساده‌تر کنید.'
            : 'The calculation ran longer than 30 seconds and was cancelled. Try simpler inputs.',
        code: error.code,
        field: error.field,
      };
    }
    return {
      title: lang === 'fa' ? 'محاسبه انجام نشد' : 'Calculation failed',
      message: error.message,
      code: error.code,
      field: error.field,
    };
  }
  if (error instanceof Error) {
    const message = error.message?.trim();
    return {
      title: lang === 'fa' ? 'محاسبه انجام نشد' : 'Calculation failed',
      message:
        message && message.length < 240
          ? message
          : lang === 'fa'
            ? 'ورودی‌ها را بررسی کنید و دوباره تلاش کنید.'
            : 'Check your inputs and try again.',
      code: 'compute',
    };
  }
  return {
    title: lang === 'fa' ? 'خطای نامشخص' : 'Unexpected error',
    message: lang === 'fa' ? 'دوباره تلاش کنید.' : 'Please try again.',
    code: 'unknown',
  };
};
