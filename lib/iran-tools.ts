/**
 * Iran desk (v5) — Jalali calendar maths and configurable local calculators.
 *
 * Calendar conversion uses the well-known arithmetic Jalali algorithm
 * (33-year leap cycle breaks) — exact for the supported range and verified
 * against known anchors (1403-01-01 = 2024-03-20). Financial/legal helpers are
 * deliberately *configurable*: rates and official indices are inputs supplied
 * by the user, because statutory rates change yearly and must never be baked
 * in as if they were current law.
 */

// ─── Jalali calendar ─────────────────────────────────────────────────────────

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}
function mod(a: number, b: number): number {
  return a - div(a, b) * b;
}

interface JalCal { leap: number; gy: number; march: number }

function jalCal(jy: number): JalCal {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const g = d2g(jdn);
  let jy = g.gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(g.gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export interface JalaliDate { jy: number; jm: number; jd: number }
export interface GregorianDate { gy: number; gm: number; gd: number }

export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
  return d2g(j2d(jy, jm, jd));
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd));
}

export function isJalaliLeap(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

export function isValidJalali(jy: number, jm: number, jd: number): boolean {
  return jy >= 1 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= jalaliMonthLength(jy, jm);
}

/** Whole days between two Jalali dates (b − a). */
export function jalaliDayDiff(a: JalaliDate, b: JalaliDate): number {
  return j2d(b.jy, b.jm, b.jd) - j2d(a.jy, a.jm, a.jd);
}

export interface AgeBreakdown { years: number; months: number; days: number; totalDays: number }

/** Exact age (years/months/days) between two Jalali dates. */
export function jalaliAge(birth: JalaliDate, at: JalaliDate): AgeBreakdown {
  const totalDays = jalaliDayDiff(birth, at);
  if (totalDays < 0) throw new Error('تاریخ دوم باید بعد از تاریخ تولد باشد');
  let years = at.jy - birth.jy;
  let months = at.jm - birth.jm;
  let days = at.jd - birth.jd;
  if (days < 0) {
    months -= 1;
    const prevMonth = at.jm === 1 ? 12 : at.jm - 1;
    const prevYear = at.jm === 1 ? at.jy - 1 : at.jy;
    days += jalaliMonthLength(prevYear, prevMonth);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days, totalDays };
}

// ─── Configurable Iran-specific calculators ──────────────────────────────────

export interface SalaryResult {
  insuranceEmployee: number;
  taxableIncome: number;
  incomeTax: number;
  netPay: number;
}

/**
 * Net salary from gross pay with *user-supplied* statutory rates (percent).
 * Rates change by year/budget law, so nothing is hard-coded as "the" rate.
 */
export function netSalaryIran(input: {
  gross: number;
  insuranceRatePercent?: number;
  taxRatePercent?: number;
  taxExemptMonthly?: number;
  otherDeductions?: number;
}): SalaryResult {
  const insuranceRate = (input.insuranceRatePercent ?? 7) / 100;
  const taxRate = (input.taxRatePercent ?? 10) / 100;
  const exempt = input.taxExemptMonthly ?? 0;
  const insuranceEmployee = input.gross * insuranceRate;
  const taxableIncome = Math.max(0, input.gross - exempt);
  const incomeTax = taxableIncome * taxRate;
  const netPay = input.gross - insuranceEmployee - incomeTax - (input.otherDeductions ?? 0);
  return { insuranceEmployee, taxableIncome, incomeTax, netPay };
}

/** مهریه به نرخ روز: مبلغ × (شاخص سال پرداخت ÷ شاخص سال عقد). Indices are user inputs. */
export function mehriehAtCurrentRate(principal: number, indexAtMarriage: number, indexAtPayment: number): number {
  if (!(indexAtMarriage > 0)) throw new Error('شاخص سال عقد باید مثبت باشد');
  return (principal * indexAtPayment) / indexAtMarriage;
}

/** A percentage of a full amount (e.g. a fraction of full دیه). Indices/rates stay user inputs. */
export function percentOfFullAmount(fullAmount: number, percent: number): number {
  return (fullAmount * percent) / 100;
}
