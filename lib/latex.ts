import katex from 'katex';

/**
 * Build-time LaTeX rendering.
 *
 * Formula pages are statically exported, so the KaTeX markup can be produced
 * while the site is built and shipped inside the HTML. That removes both the
 * 45 KB KaTeX bundle and the "raw LaTeX → then a real formula" re-paint from
 * the critical path: the largest element on a formula page now paints with the
 * first contentful paint instead of ~500 ms later.
 *
 * Server-only on purpose — never import this from a `'use client'` module, or
 * KaTeX lands back in the browser bundle.
 */
export const renderLatex = (latex: string, displayMode = true): string => {
  if (!latex) return '';
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'html',
    });
  } catch {
    return '';
  }
};
