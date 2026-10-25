/**
 * A deliberately small chemistry helper: parses formulas like
 * "Ca(OH)2", "Fe2(SO4)3", "CuSO4·5H2O" and hydrates, computes molar mass,
 * percent composition and element counts. No external dependency, no eval.
 */
import { ELEMENT_BY_SYMBOL, type Element } from './periodic-table';

export interface CompositionEntry {
  element: Element;
  count: number;
  mass: number;
  percent: number;
}

export interface FormulaAnalysis {
  formula: string;
  entries: CompositionEntry[];
  molarMass: number;
}

class Parser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): Map<string, number> {
    const counts = new Map<string, number>();
    let current = this.sequence();
    while (this.peek() === '·' || this.peek() === '.' || this.peek() === '*') {
      this.index += 1;
      const multiplier = this.number() || 1;
      const next = this.sequence();
      for (const [symbol, value] of next) {
        current.set(symbol, (current.get(symbol) ?? 0) + value * multiplier);
      }
    }
    for (const [symbol, value] of current) counts.set(symbol, value);
    return counts;
  }

  private sequence(): Map<string, number> {
    const counts = new Map<string, number>();
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char === '(' || char === '[') {
        this.index += 1;
        const inner = this.sequence();
        if (this.peek() !== ')' && this.peek() !== ']') throw new Error('پرانتز بسته نشده است');
        this.index += 1;
        const multiplier = this.number() || 1;
        for (const [symbol, value] of inner) {
          counts.set(symbol, (counts.get(symbol) ?? 0) + value * multiplier);
        }
        continue;
      }
      if (char === ')' || char === ']' || char === '·' || char === '.' || char === '*') break;
      if (char === ' ') {
        this.index += 1;
        continue;
      }
      const symbol = this.symbol();
      if (!symbol) throw new Error(`نماد نامعتبر در «${this.source}»`);
      const count = this.number() || 1;
      counts.set(symbol, (counts.get(symbol) ?? 0) + count);
    }
    return counts;
  }

  private symbol(): string | null {
    const first = this.source[this.index];
    if (!first || first !== first.toUpperCase() || !/[A-Z]/.test(first)) return null;
    let candidate = first;
    this.index += 1;
    const second = this.source[this.index];
    if (second && /[a-z]/.test(second)) {
      candidate += second;
      this.index += 1;
    }
    return ELEMENT_BY_SYMBOL.has(candidate.toLowerCase()) ? candidate : null;
  }

  private number(): number | null {
    const start = this.index;
    while (/[0-9]/.test(this.source[this.index] ?? '')) this.index += 1;
    if (start === this.index) return null;
    return Number(this.source.slice(start, this.index));
  }

  private peek(): string | undefined {
    return this.source[this.index];
  }
}

export const analyzeFormula = (raw: string): FormulaAnalysis => {
  const formula = raw.trim();
  if (!formula) throw new Error('فرمول را وارد کنید');
  const counts = new Parser(formula).parse();
  if (counts.size === 0) throw new Error('فرمول معتبر نیست');
  const entries: CompositionEntry[] = [];
  let molarMass = 0;
  for (const [symbol, count] of counts) {
    const element = ELEMENT_BY_SYMBOL.get(symbol.toLowerCase());
    if (!element) throw new Error(`عنصر «${symbol}» شناخته نشد`);
    const mass = element.mass * count;
    molarMass += mass;
    entries.push({ element, count, mass, percent: 0 });
  }
  for (const entry of entries) entry.percent = (entry.mass / molarMass) * 100;
  entries.sort((a, b) => b.mass - a.mass);
  return { formula, entries, molarMass };
};

/** Equivalent weight helpers used by the titration/stoichiometry cards. */
export const molesFromMass = (mass: number, molarMass: number) => mass / molarMass;
export const massFromMoles = (moles: number, molarMass: number) => moles * molarMass;
