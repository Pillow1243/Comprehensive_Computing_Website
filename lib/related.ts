/**
 * Related-formula recommendation (v4).
 *
 * Replaces the first-match heuristic of `relatedFormulas` with a transparent
 * score: shared sub-category dominates, then shared tags, same discipline
 * and similar difficulty. Deterministic (id tie-break) so server-rendered
 * and hydrated lists always agree.
 */

import { FORMULAS, normalizeText, type FormulaMeta } from '@/lib/formulas';

const DIFFICULTY_ORDER = { basic: 0, intermediate: 1, advanced: 2 };

export function relatedScore(target: FormulaMeta, candidate: FormulaMeta): number {
  if (target.id === candidate.id) return -Infinity;
  let score = 0;
  if (candidate.category_path[1] && candidate.category_path[1] === target.category_path[1]) score += 30;
  if (candidate.category_path[0] === target.category_path[0]) score += 10;
  const targetTags = new Set(target.tags.map((tag) => normalizeText(tag)));
  const shared = candidate.tags.filter((tag) => targetTags.has(normalizeText(tag))).length;
  score += shared * 12;
  if (candidate.difficulty === target.difficulty) score += 4;
  else if (Math.abs(DIFFICULTY_ORDER[candidate.difficulty] - DIFFICULTY_ORDER[target.difficulty]) === 1) score += 2;
  if (candidate.test_count >= 3) score += 2;
  return score;
}

export function relatedFormulasV4(formula: FormulaMeta, limit = 6): FormulaMeta[] {
  return FORMULAS.map((candidate) => ({ candidate, score: relatedScore(formula, candidate) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/** Suggested "next steps": same sub-category, one rung harder first. */
export function nextStepFormulas(formula: FormulaMeta, limit = 3): FormulaMeta[] {
  const level = DIFFICULTY_ORDER[formula.difficulty];
  return FORMULAS.filter(
    (candidate) =>
      candidate.id !== formula.id &&
      candidate.category_path[1] === formula.category_path[1] &&
      DIFFICULTY_ORDER[candidate.difficulty] >= level,
  )
    .sort(
      (a, b) =>
        DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}
