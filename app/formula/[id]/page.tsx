import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FORMULAS, getFormula, formulaName, type Formula, type FormulaMeta } from '@/lib/formulas';
import { renderLatex } from '@/lib/latex';
import { KATEX_CSS } from '@/lib/katex-css.generated';
import { FormulaDetail } from '@/components/formula-detail';

export const dynamicParams = false;

export function generateStaticParams() {
  return FORMULAS.map((formula) => ({ id: formula.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const formula = getFormula(id);
  if (!formula) return { title: 'فرمول پیدا نشد' };
  const title = formulaName(formula, 'fa');
  const english = formulaName(formula, 'en');
  const summaries = (await import('@/packages/formula-registry/formula-descriptions.json')).default as Record<string, string>;
  const description = summaries[formula.id];
  return {
    title: `${title} — ${english}`,
    description,
    keywords: [...formula.tags, formula.name_en, formula.name_fa],
    alternates: { canonical: `/formula/${formula.id}/` },
    openGraph: {
      title: `${title} · ${english}`,
      description,
      type: 'article',
    },
  };
}

export default async function FormulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = getFormula(id);
  if (!meta) notFound();

  // Resolve the solver manifest and render the LaTeX at build time. Both are
  // inlined into this route's static HTML, so the page paints its real content
  // with the first paint instead of after a manifest fetch and a KaTeX import.
  const details = (await import('@/packages/formula-registry/formula-details.json')).default as unknown as Record<
    string,
    Omit<Formula, keyof FormulaMeta>
  >;
  const detail = details[id];
  if (!detail) notFound();
  const formula: Formula = { ...meta, ...detail };
  const summaries = (await import('@/packages/formula-registry/formula-descriptions.json')).default as Record<string, string>;

  return (
    <>
      {/* Scoped to this route: no render-blocking stylesheet request, and no
          KaTeX CSS on the 289 pages that never show math. */}
      <style dangerouslySetInnerHTML={{ __html: KATEX_CSS }} />
      <FormulaDetail
        formula={formula}
        formulaHtml={renderLatex(formula.formula_latex)}
        description={summaries[id]}
      />
    </>
  );
}
