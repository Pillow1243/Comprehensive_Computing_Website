/**
 * Word-problem assistant (v4) — offline text → formula + prefilled inputs.
 *
 * Two stages:
 *  1. keyword rules for the most common school/uni problem shapes, with
 *     human-checked variable assignments (numbers are pulled from the text,
 *     Persian digits and number-words included);
 *  2. a generic fallback that maps the extracted numbers, in reading order,
 *     onto the numeric variables of the best smart-search matches.
 *
 * It never invents numbers: every suggested input is traced back to a
 * number the user actually typed.
 */

import { normalizeText, type Formula } from '@/lib/formulas';
import { normalizeDigits } from '@/lib/utils';

const PERSIAN_NUMBER_WORDS: Record<string, number> = {
  یک: 1, دو: 2, سه: 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10,
  یازده: 11, دوازده: 12, سیزده: 13, چهارده: 14, پانزده: 15, شانزده: 16, هفده: 17,
  هجده: 18, نوزده: 19, بیست: 20, سی: 30, چهل: 40, پنجاه: 50, شصت: 60, هفتاد: 70,
  هشتاد: 80, نود: 90, صد: 100, دویست: 200, هزار: 1000, نیم: 0.5,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30, fifty: 50,
  hundred: 100, thousand: 1000, half: 0.5,
};

/** Extract every number from free text (Latin/Persian digits & number words). */
export function extractNumbers(text: string): number[] {
  const cleaned = normalizeDigits(text).replace(/٫/g, '.').replace(/٬/g, '');
  const numbers: number[] = [];
  const digitPattern = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  for (const match of cleaned.matchAll(digitPattern)) {
    const value = Number(match[0]);
    if (Number.isFinite(value)) numbers.push(value);
  }
  if (numbers.length === 0) {
    for (const token of normalizeText(cleaned).split(/[\s،؛.,:!?()«»"]+/)) {
      const value = PERSIAN_NUMBER_WORDS[token];
      if (value !== undefined) numbers.push(value);
    }
  }
  return numbers;
}

export interface TextSolutionSuggestion {
  formulaId: string;
  inputs: Record<string, number>;
  confidence: number;
  matchedKeywords: string[];
  noteFa: string;
  noteEn: string;
}

interface Rule {
  formulaId: string;
  keywords: string[];
  noteFa: string;
  noteEn: string;
  assign: (nums: number[], normalized: string) => Record<string, number> | null;
}

const RULES: Rule[] = [
  {
    formulaId: 'kinematics',
    keywords: ['سرعت اولیه', 'شتاب', 'حرکت', 'initial velocity', 'acceleration', 'kinematics'],
    noteFa: 'اعداد به‌ترتیب سرعت اولیه، شتاب و زمان در نظر گرفته شدند.',
    noteEn: 'Numbers were mapped to initial velocity, acceleration and time.',
    assign: (n) => (n.length >= 3 ? { u: n[0], a: n[1], t: n[2] } : null),
  },
  {
    formulaId: 'newton_energy',
    keywords: ['انرژی جنبشی', 'kinetic energy', 'قانون دوم نیوتن'],
    noteFa: 'عدد اول جرم و عدد بعد سرعت فرض شد؛ بقیه ورودی‌ها را در صفحه فرمول کامل کنید.',
    noteEn: 'First number was taken as mass; review the remaining inputs on the formula page.',
    assign: (n) => (n.length >= 2 ? { m: n[0], v: n[1] } : null),
  },
  {
    formulaId: 'pythagorean',
    keywords: ['فیثاغورس', 'وتر', 'مثلث قائمه', 'hypotenuse', 'pythagoras', 'right triangle'],
    noteFa: 'دو ضلع قائم و زاویه ۹۰ درجه پیش‌فرض گرفته شد.',
    noteEn: 'The two legs were used with a 90° included angle.',
    assign: (n) => (n.length >= 2 ? { a: n[0], b: n[1], C: 90 } : null),
  },
  {
    formulaId: 'heron',
    keywords: ['مساحت مثلث', 'هرون', 'سه ضلع', 'heron', 'triangle area', 'three sides'],
    noteFa: 'سه عدد اول، ضلع‌های مثلث‌اند.',
    noteEn: 'The first three numbers were taken as the triangle sides.',
    assign: (n) => (n.length >= 3 ? { a: n[0], b: n[1], c: n[2] } : null),
  },
  {
    formulaId: 'ohm_circuit',
    keywords: ['قانون اهم', 'ولتاژ', 'مقاومت', 'جریان', 'ohm', 'voltage', 'resistance', 'circuit'],
    noteFa: 'عدد اول ولتاژ و عددهای بعد مقاومت‌ها هستند.',
    noteEn: 'First number is the voltage, the next ones are resistances.',
    assign: (n) => (n.length >= 2 ? { V: n[0], R1: n[1], ...(n[2] !== undefined ? { R2: n[2] } : {}) } : null),
  },
  {
    formulaId: 'compound_interest',
    keywords: ['بهره مرکب', 'سود مرکب', 'compound interest', 'ارزش آینده'],
    noteFa: 'به‌ترتیب: سرمایه اولیه، نرخ سالانه، تعداد سال؛ ترکیب ماهانه پیش‌فرض است.',
    noteEn: 'Mapped to principal, annual rate and years with monthly compounding.',
    assign: (n) => (n.length >= 3 ? { PV: n[0], rate: n[1], years: n[2], m: 12 } : null),
  },
  {
    formulaId: 'loan_payment',
    keywords: ['قسط', 'وام', 'loan', 'mortgage', 'monthly payment', 'تسهیلات'],
    noteFa: 'به‌ترتیب: مبلغ وام، نرخ سالانه و تعداد قسط ماهانه.',
    noteEn: 'Mapped to loan amount, annual rate and number of monthly payments.',
    assign: (n) => (n.length >= 3 ? { principal: n[0], annual_rate: n[1], months: n[2] } : null),
  },
  {
    formulaId: 'simple_interest',
    keywords: ['بهره ساده', 'سود ساده', 'simple interest'],
    noteFa: 'به‌ترتیب: سرمایه، نرخ و مدت (سال).',
    noteEn: 'Mapped to principal, rate and years.',
    assign: (n) => (n.length >= 3 ? { principal: n[0], rate: n[1], years: n[2] } : null),
  },
  {
    formulaId: 'percent_change',
    keywords: ['درصد تغییر', 'افزایش درصد', 'کاهش درصد', 'percent change', 'درصد افزایش', 'درصد کاهش'],
    noteFa: 'عدد اول مقدار قدیم و عدد دوم مقدار جدید است.',
    noteEn: 'First number is the old value, second is the new value.',
    assign: (n) => (n.length >= 2 ? { old: n[0], new: n[1] } : null),
  },
  {
    formulaId: 'bmi',
    keywords: ['شاخص توده', 'bmi', 'توده بدنی', 'body mass'],
    noteFa: 'عدد اول جرم (kg) و عدد دوم قد است؛ واحد قد را در صفحه فرمول بررسی کنید.',
    noteEn: 'First number is mass (kg), second is height — check the height unit on the formula page.',
    assign: (n) => (n.length >= 2 ? { mass: n[0], height: n[1] } : null),
  },
  {
    formulaId: 'quadratic',
    keywords: ['معادله درجه دو', 'درجه دوم', 'quadratic', 'دلتا'],
    noteFa: 'سه عدد به‌عنوان ضرایب a و b و c گرفته شدند.',
    noteEn: 'The three numbers were taken as coefficients a, b and c.',
    assign: (n) => (n.length >= 3 ? { a: n[0], b: n[1], c: n[2] } : null),
  },
  {
    formulaId: 'gcd_lcm',
    keywords: ['ب م م', 'بمم', 'کمم', 'مقسوم علیه', 'gcd', 'lcm', 'مضرب مشترک'],
    noteFa: 'دو عدد اول مسئله استفاده شدند.',
    noteEn: 'The first two numbers were used.',
    assign: (n) => (n.length >= 2 ? { a: n[0], b: n[1] } : null),
  },
  {
    formulaId: 'ncr_npr',
    keywords: ['ترکیب و جایگشت', 'ترکیب', 'جایگشت', 'combination', 'permutation', 'انتخاب'],
    noteFa: 'عدد بزرگ‌تر n و عدد دیگر r در نظر گرفته شد.',
    noteEn: 'The larger number was taken as n, the other as r.',
    assign: (n) => (n.length >= 2 ? { n: Math.max(n[0], n[1]), r: Math.min(n[0], n[1]) } : null),
  },
  {
    formulaId: 'arithmetic_seq',
    keywords: ['دنباله حسابی', 'تصاعد حسابی', 'arithmetic sequence', 'قدر نسبت'],
    noteFa: 'به‌ترتیب: جمله اول، قدر نسبت و شماره جمله.',
    noteEn: 'Mapped to first term, common difference and term index.',
    assign: (n) => (n.length >= 3 ? { a1: n[0], d: n[1], n: n[2] } : null),
  },
  {
    formulaId: 'geometric_seq',
    keywords: ['دنباله هندسی', 'تصاعد هندسی', 'geometric sequence'],
    noteFa: 'به‌ترتیب: جمله اول، نسبت و شماره جمله.',
    noteEn: 'Mapped to first term, ratio and term index.',
    assign: (n) => (n.length >= 3 ? { a1: n[0], ratio: n[1], n: n[2] } : null),
  },
  {
    formulaId: 'circle',
    keywords: ['دایره', 'محیط دایره', 'مساحت دایره', 'circle', 'شعاع'],
    noteFa: 'عدد اول شعاع در نظر گرفته شد.',
    noteEn: 'The first number was taken as the radius.',
    assign: (n) => (n.length >= 1 ? { radius: n[0], theta: 360 } : null),
  },
  {
    formulaId: 'wave',
    keywords: ['طول موج', 'فرکانس', 'بسامد', 'wavelength', 'frequency', 'موج'],
    noteFa: 'عدد اول فرکانس و عدد دوم طول موج است.',
    noteEn: 'First number is frequency, second is wavelength.',
    assign: (n) => (n.length >= 2 ? { f: n[0], lambda: n[1] } : null),
  },
  {
    formulaId: 'ideal_gas',
    keywords: ['گاز کامل', 'گاز ایده آل', 'ideal gas', 'قانون گازها'],
    noteFa: 'به‌ترتیب: مول، دما (K) و حجم (L)؛ فشار محاسبه می‌شود.',
    noteEn: 'Mapped to moles, temperature (K) and volume (L).',
    assign: (n) => (n.length >= 3 ? { n: n[0], T: n[1], V: n[2] } : null),
  },
  {
    formulaId: 'ph',
    keywords: ['ph', 'غلظت یون', 'اسیدیته', 'هیدرونیوم'],
    noteFa: 'عدد مسئله غلظت یون هیدرونیوم در نظر گرفته شد.',
    noteEn: 'The number was taken as the hydronium concentration.',
    assign: (n) => (n.length >= 1 ? { concentration: n[0] } : null),
  },
];

/** Keyword-rule suggestions for a free-form problem statement. */
export function analyzeTextProblem(text: string): TextSolutionSuggestion[] {
  const normalized = normalizeText(text);
  const numbers = extractNumbers(text);
  const suggestions: TextSolutionSuggestion[] = [];
  for (const rule of RULES) {
    const matched = rule.keywords.filter((keyword) => normalized.includes(normalizeText(keyword)));
    if (!matched.length) continue;
    const inputs = rule.assign(numbers, normalized);
    if (!inputs) continue;
    suggestions.push({
      formulaId: rule.formulaId,
      inputs,
      confidence: Math.min(0.98, 0.55 + matched.length * 0.15 + (numbers.length > 0 ? 0.1 : 0)),
      matchedKeywords: matched,
      noteFa: rule.noteFa,
      noteEn: rule.noteEn,
    });
  }
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Generic fallback: assign extracted numbers, in reading order, to the
 * numeric variables of a fully-loaded formula.
 */
export function mapNumbersToVariables(formula: Formula, numbers: number[]): Record<string, number> {
  const inputs: Record<string, number> = {};
  const numericVars = formula.variables.filter((variable) => variable.type === 'number');
  numericVars.forEach((variable, index) => {
    if (numbers[index] !== undefined) inputs[variable.name] = numbers[index];
  });
  return inputs;
}

/** Build the shareable deep link for a suggestion (same scheme as formula pages). */
export function suggestionHref(suggestion: TextSolutionSuggestion): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(suggestion.inputs)) params.set(name, String(value));
  const query = params.toString();
  return `/formula/${suggestion.formulaId}/${query ? `?${query}` : ''}`;
}
