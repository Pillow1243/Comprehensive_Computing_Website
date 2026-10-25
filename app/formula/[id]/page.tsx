import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FORMULAS, getFormula, formulaName } from '@/lib/formulas';
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
  return {
    title: `${title} — ${english}`,
    description: formula.description_fa,
    keywords: [...formula.tags, formula.name_en, formula.name_fa],
    alternates: { canonical: `/formula/${formula.id}/` },
    openGraph: {
      title: `${title} · ${english}`,
      description: formula.description_fa,
      type: 'article',
    },
  };
}

export default async function FormulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getFormula(id)) notFound();
  return <FormulaDetail formulaId={id} />;
}
