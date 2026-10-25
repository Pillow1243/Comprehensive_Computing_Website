import { describe, expect, it } from 'vitest';
import { resolveShareTarget } from '@/lib/share-target';

const options = {
  origin: 'https://example.test',
  basePath: '/Comprehensive_Computing_Website',
  formulaIds: new Set(['quadratic', 'pythagorean']),
};

const resolve = (query: string) => resolveShareTarget(new URLSearchParams(query), options);

describe('Web Share Target routing', () => {
  it('opens a valid same-origin formula link and preserves bounded inputs', () => {
    expect(resolve('url=https%3A%2F%2Fexample.test%2FComprehensive_Computing_Website%2Fformula%2Fquadratic%2F%3Fa%3D1%26b%3D-5%26c%3D6'))
      .toBe('/formula/quadratic/?a=1&b=-5&c=6');
  });

  it('accepts a formula URL shared inside the text field', () => {
    expect(resolve('text=Try%20this%20https%3A%2F%2Fexample.test%2FComprehensive_Computing_Website%2Fformula%2Fpythagorean%2F%3Fa%3D3'))
      .toBe('/formula/pythagorean/?a=3');
  });

  it('does not navigate to an external URL and searches the shared title instead', () => {
    expect(resolve('title=External%20article&url=https%3A%2F%2Fevil.test%2Fformula%2Fquadratic%2F'))
      .toBe('/search/?q=External%20article');
  });

  it('does not accept unknown formula IDs or non-formula internal routes', () => {
    expect(resolve('url=https%3A%2F%2Fexample.test%2Fformula%2Fsecret%2F')).toBe('/search/');
    expect(resolve('url=https%3A%2F%2Fexample.test%2Fsettings%2F')).toBe('/search/');
  });

  it('handles malformed input and empty shares without throwing', () => {
    expect(resolve('url=%')).toBe('/search/');
    expect(resolve('')).toBe('/search/');
  });

  it('caps query count, key shape, and encoded values', () => {
    const inputs = Array.from({ length: 25 }, (_, i) => `v${i}=x`).join('&');
    const url = `https://example.test/Comprehensive_Computing_Website/formula/quadratic/?${inputs}&bad%5Bkey%5D=1`;
    const result = resolve(`url=${encodeURIComponent(url)}`);
    expect(new URL(result, 'https://example.test').searchParams.size).toBe(16);
    expect(result).not.toContain('bad%5Bkey%5D');
  });
});
