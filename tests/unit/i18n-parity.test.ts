import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * v4 shipped with 144 English-only keys — the Persian UI silently rendered
 * raw key names on every new page. This guard keeps the fa/en dictionaries
 * in exact parity so it can never happen again.
 */
const i18nSource = readFileSync('lib/i18n.tsx', 'utf8');
const dictionariesSource = readFileSync('lib/dictionaries.ts', 'utf8');

const extractKeys = (segment: string): string[] =>
  [...segment.matchAll(/^\s{2}(\w+):/gm)].map((match) => match[1]);

const faSegment = i18nSource.slice(
  i18nSource.indexOf('const fa:'),
  i18nSource.indexOf('export interface I18nContextValue'),
);
const enSegment = dictionariesSource.slice(
  dictionariesSource.indexOf('export const en:'),
  dictionariesSource.indexOf('export const ar:'),
);

const faKeys = extractKeys(faSegment);
const enKeys = extractKeys(enSegment);

describe('i18n dictionary parity', () => {
  it('has no duplicate keys in either dictionary', () => {
    expect(new Set(faKeys).size).toBe(faKeys.length);
    expect(new Set(enKeys).size).toBe(enKeys.length);
  });

  it('translates every English key into Persian', () => {
    const fa = new Set(faKeys);
    const missing = enKeys.filter((key) => !fa.has(key));
    expect(missing).toEqual([]);
  });

  it('translates every Persian key into English', () => {
    const en = new Set(enKeys);
    const missing = faKeys.filter((key) => !en.has(key));
    expect(missing).toEqual([]);
  });
});
