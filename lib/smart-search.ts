/**
 * Natural-language smart search (v4) — fully offline.
 *
 * Layers on top of the exact matcher in `lib/formulas.ts`:
 *  • Persian/English synonym expansion ("سود" → بهره/interest, "قسط" → وام)
 *  • typo tolerance via bounded edit distance against names and tags
 *  • subsequence matching on formula ids (`qdrtc` → quadratic)
 *  • "did you mean" suggestions when nothing matches
 *
 * Every result carries machine-readable `reasons` so the UI can explain
 * *why* a formula matched ("مترادف", "املای نزدیک", …).
 */

import {
  FORMULAS,
  normalizeText,
  searchFormulas,
  type FormulaMeta,
  type SearchFilters,
} from '@/lib/formulas';

export type SmartReason = 'exact' | 'name' | 'tag' | 'synonym' | 'fuzzy' | 'category' | 'id';

export interface SmartResult {
  formula: FormulaMeta;
  score: number;
  reasons: SmartReason[];
}

const SYNONYM_GROUPS: string[][] = [
  ['سود', 'بهره', 'interest', 'profit'],
  ['قسط', 'وام', 'loan', 'installment', 'تسهیلات'],
  ['سرمایه', 'سرمایه‌گذاری', 'investment', 'capital'],
  ['مساحت', 'area'],
  ['محیط', 'perimeter'],
  ['حجم', 'volume', 'گنجایش'],
  ['سرعت', 'velocity', 'speed', 'تندی'],
  ['شتاب', 'acceleration'],
  ['نیرو', 'force'],
  ['انرژی', 'energy'],
  ['توان', 'power'],
  ['ولتاژ', 'voltage'],
  ['جریان', 'current'],
  ['مقاومت', 'resistance', 'ohm'],
  ['زاویه', 'angle'],
  ['مثلث', 'triangle'],
  ['دایره', 'circle'],
  ['معادله', 'equation'],
  ['احتمال', 'probability', 'شانس'],
  ['میانگین', 'average', 'mean', 'معدل'],
  ['درصد', 'percent', 'percentage'],
  ['جرم', 'mass', 'وزن', 'weight'],
  ['قد', 'height'],
  ['دما', 'temperature', 'گرما', 'حرارت'],
  ['فشار', 'pressure'],
  ['فرکانس', 'frequency', 'بسامد'],
  ['طول موج', 'wavelength'],
  ['اسید', 'acid', 'ph'],
  ['غلظت', 'concentration', 'مولار', 'molarity'],
  ['واپاشی', 'decay', 'نیمه عمر', 'half-life'],
  ['مشتق', 'derivative'],
  ['انتگرال', 'integral'],
  ['ماتریس', 'matrix'],
  ['بردار', 'vector'],
  ['لگاریتم', 'log', 'logarithm', 'ln'],
  ['سینوس', 'sin', 'sine'],
  ['کسینوس', 'cos', 'cosine'],
  ['تانژانت', 'tan', 'tangent'],
  ['دنباله', 'sequence', 'تصاعد'],
  ['ترکیب', 'combination', 'ncr'],
  ['جایگشت', 'permutation', 'npr'],
  ['فاکتوریل', 'factorial'],
  ['اول', 'prime'],
  ['بمم', 'gcd'],
  ['کمم', 'lcm'],
  ['تخفیف', 'discount'],
  ['نرخ', 'rate'],
  ['فاصله', 'distance', 'مسافت'],
  ['کار', 'work'],
  ['گشتاور', 'torque'],
  ['چگالی', 'density'],
  ['مدار', 'circuit'],
  ['عدسی', 'lens'],
  ['موج', 'wave'],
  ['صدا', 'sound', 'audio', 'صوت'],
  ['نور', 'light'],
  ['رنگ', 'color', 'colour'],
  ['موسیقی', 'music', 'نت', 'note'],
  ['صف', 'queue'],
  ['بازی', 'game'],
  ['ربات', 'robot'],
  ['سیگنال', 'signal'],
  ['نویز', 'noise'],
  ['تصویر', 'image', 'عکس'],
  ['پیش‌بینی', 'forecast', 'prediction'],
  ['یادگیری ماشین', 'machine learning', 'ml', 'هوش مصنوعی'],
  ['بهینه', 'optimal', 'optimization', 'کمینه', 'بیشینه'],
  ['خرابی', 'failure', 'قابلیت اطمینان', 'reliability'],
  ['ناوبری', 'navigation', 'gps'],
  ['ماهواره', 'satellite', 'orbit'],
  ['زلزله', 'earthquake'],
  ['واریانس', 'variance'],
  ['انحراف معیار', 'standard deviation'],
  ['همبستگی', 'correlation'],
  ['رگرسیون', 'regression'],
  ['شاخص توده بدنی', 'bmi'],
];

const normalizedGroups = SYNONYM_GROUPS.map((group) => group.map((word) => normalizeText(word)));

/** Split a query into primary tokens plus synonym-expansion tokens. */
export function expandQueryTokens(query: string): { primary: string[]; expanded: string[] } {
  const q = normalizeText(query);
  const primary = q.split(' ').filter(Boolean);
  const primarySet = new Set(primary);
  const expanded = new Set<string>();
  for (const group of normalizedGroups) {
    const hit = group.some((member) =>
      member.includes(' ') ? q.includes(member) : primarySet.has(member),
    );
    if (!hit) continue;
    for (const member of group) {
      for (const token of member.split(' ')) {
        if (token && !primarySet.has(token)) expanded.add(token);
      }
    }
  }
  return { primary, expanded: [...expanded] };
}

/** Classic Levenshtein distance, early-exited above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const curr = [i];
    let best = curr[0];
    for (let j = 1; j <= b.length; j += 1) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, curr[j]);
    }
    if (best > max) return max + 1;
    prev = curr;
  }
  return prev[b.length];
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i += 1;
    if (i >= needle.length) return true;
  }
  return needle.length === 0;
}

/** Ranked, synonym- and typo-aware search over the formula registry. */
export function smartSearch(query: string, filters: SearchFilters = {}): SmartResult[] {
  const pool = searchFormulas('', filters);
  const q = normalizeText(query);
  if (!q) return pool.map((formula) => ({ formula, score: 0, reasons: [] }));
  const { primary, expanded } = expandQueryTokens(query);
  const results: SmartResult[] = [];

  for (const formula of pool) {
    const nameFa = normalizeText(formula.name_fa);
    const nameEn = normalizeText(formula.name_en);
    const idWords = formula.id.replace(/_/g, ' ');
    const tags = formula.tags.map((tag) => normalizeText(tag));
    const category = normalizeText(formula.category_path.join(' '));
    const haystack = `${nameFa} ${nameEn} ${idWords} ${tags.join(' ')} ${category} ${normalizeText(formula.description_fa ?? '')}`;
    const nameWords = `${nameFa} ${nameEn} ${tags.join(' ')}`.split(' ').filter((word) => word.length >= 3);
    let score = 0;
    const reasons = new Set<SmartReason>();

    if (nameFa === q || nameEn === q || formula.id === q.replace(/ /g, '_')) {
      score += 120;
      reasons.add('exact');
    }
    if (nameFa.startsWith(q) || nameEn.startsWith(q)) {
      score += 55;
      reasons.add('name');
    } else if (q.length >= 2 && (nameFa.includes(q) || nameEn.includes(q))) {
      score += 32;
      reasons.add('name');
    }

    for (const token of primary) {
      if (tags.includes(token)) {
        score += 26;
        reasons.add('tag');
      } else if (token.length >= 2 && tags.some((tag) => tag.includes(token))) {
        score += 10;
        reasons.add('tag');
      }
      if (category.split(' ').includes(token)) {
        score += 10;
        reasons.add('category');
      } else if (token.length >= 2 && haystack.includes(token)) {
        score += 12;
        reasons.add('name');
      }
      if (token.length >= 3 && /^[a-z0-9]+$/.test(token) && isSubsequence(token, formula.id.replace(/_/g, ''))) {
        score += 8;
        reasons.add('id');
      }
      if (token.length >= 4) {
        const limit = token.length > 6 ? 2 : 1;
        const fuzzy = nameWords.some((word) => {
          const distance = editDistance(token, word, limit);
          return distance > 0 && distance <= limit;
        });
        if (fuzzy) {
          score += 14;
          reasons.add('fuzzy');
        }
      }
    }

    for (const token of expanded) {
      if (token.length >= 2 && (tags.includes(token) || haystack.includes(token))) {
        score += tags.includes(token) ? 12 : 8;
        reasons.add('synonym');
      }
    }

    if (score > 0) results.push({ formula, score, reasons: [...reasons] });
  }

  return results.sort((a, b) => b.score - a.score || a.formula.id.localeCompare(b.formula.id));
}

/** Convenience wrapper returning just the formulas (drop-in for rankedSearch). */
export const smartSearchFormulas = (query: string, filters: SearchFilters = {}): FormulaMeta[] =>
  smartSearch(query, filters).map((result) => result.formula);

/** "Did you mean …?" formula names when a query finds nothing. */
export function suggestCorrections(query: string, limit = 3): string[] {
  const { primary } = expandQueryTokens(query);
  const tokens = primary.filter((token) => token.length >= 3);
  if (!tokens.length) return [];
  const suggestions: { name: string; distance: number }[] = [];
  for (const formula of FORMULAS) {
    const words = `${normalizeText(formula.name_fa)} ${formula.tags.map((tag) => normalizeText(tag)).join(' ')}`
      .split(' ')
      .filter((word) => word.length >= 3);
    let best = Infinity;
    for (const token of tokens) {
      for (const word of words) best = Math.min(best, editDistance(token, word, 2));
    }
    if (best >= 1 && best <= 2) suggestions.push({ name: formula.name_fa, distance: best });
  }
  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .map((suggestion) => suggestion.name)
    .filter((name, index, all) => all.indexOf(name) === index)
    .slice(0, limit);
}
