'use client';

import { useMemo, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import {
  addMatrices,
  createMatrix,
  determinant,
  eigenvalues2x2,
  frobeniusNorm,
  inverseMatrix,
  matrixRank,
  multiplyMatrices,
  solveLinearSystem,
  subtractMatrices,
  traceMatrix,
  transposeMatrix,
  type Matrix,
} from '@/lib/matrix';
import { formatNumber } from '@/lib/utils';

type Op = 'add' | 'subtract' | 'multiply' | 'transpose' | 'inverse' | 'solve';

const toText = (m: Matrix): string[][] => m.map((row) => row.map((value) => String(value)));
const toNumbers = (cells: string[][]): Matrix => cells.map((row) => row.map((cell) => Number(cell) || 0));

export default function MatrixPage() {
  const { t, lang, numerals } = useI18n();
  const [size, setSize] = useState(3);
  const [aCells, setACells] = useState<string[][]>(() => toText([[2, 1, 0], [1, 3, 1], [0, 1, 2]]));
  const [bCells, setBCells] = useState<string[][]>(() => toText(createMatrix(3, 3, 'identity')));
  const [bVector, setBVector] = useState<string[]>(['4', '10', '8']);
  const [op, setOp] = useState<Op>('multiply');

  const fmt = (value: number) => formatNumber(value, { decimals: 6, lang, numerals });

  const resize = (next: number) => {
    const grow = (cells: string[][]) =>
      Array.from({ length: next }, (_, i) =>
        Array.from({ length: next }, (_, j) => cells[i]?.[j] ?? (i === j ? '1' : '0')),
      );
    setSize(next);
    setACells((cells) => grow(cells));
    setBCells((cells) => grow(cells));
    setBVector((vector) => Array.from({ length: next }, (_, i) => vector[i] ?? '0'));
  };

  const fill = (which: 'a' | 'b', kind: 'identity' | 'zero' | 'random') => {
    const matrix =
      kind === 'random'
        ? createMatrix(size, size).map((row) => row.map(() => Math.floor(Math.random() * 9) - 2))
        : createMatrix(size, size, kind);
    if (which === 'a') setACells(toText(matrix));
    else setBCells(toText(matrix));
  };

  const { result, error } = useMemo(() => {
    const a = toNumbers(aCells);
    const b = toNumbers(bCells);
    try {
      switch (op) {
        case 'add':
          return { result: addMatrices(a, b), error: null };
        case 'subtract':
          return { result: subtractMatrices(a, b), error: null };
        case 'multiply':
          return { result: multiplyMatrices(a, b), error: null };
        case 'transpose':
          return { result: transposeMatrix(a), error: null };
        case 'inverse':
          return { result: inverseMatrix(a), error: null };
        case 'solve': {
          const solution = solveLinearSystem(a, bVector.map((cell) => Number(cell) || 0));
          return { result: solution.map((value) => [value]), error: null };
        }
        default:
          return { result: null, error: null };
      }
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : t('matrixError') };
    }
  }, [aCells, bCells, bVector, op, t]);

  const facts = useMemo(() => {
    const a = toNumbers(aCells);
    try {
      return {
        det: determinant(a),
        trace: traceMatrix(a),
        rank: matrixRank(a),
        norm: frobeniusNorm(a),
        eigen: size === 2 ? eigenvalues2x2(a) : null,
      };
    } catch {
      return null;
    }
  }, [aCells, size]);

  const editor = (
    title: string,
    cells: string[][],
    setCells: (cells: string[][]) => void,
    which: 'a' | 'b',
  ) => (
    <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-title-small font-semibold text-on-surface">{title}</h3>
        <div className="flex gap-1">
          <button type="button" onClick={() => fill(which, 'identity')} className="rounded-full border border-outline-variant px-2.5 py-1 text-label-medium text-on-surface-variant">
            {t('fillIdentity')}
          </button>
          <button type="button" onClick={() => fill(which, 'random')} className="rounded-full border border-outline-variant px-2.5 py-1 text-label-medium text-on-surface-variant">
            {t('fillRandom')}
          </button>
          <button type="button" onClick={() => fill(which, 'zero')} className="rounded-full border border-outline-variant px-2.5 py-1 text-label-medium text-on-surface-variant">
            {t('fillZero')}
          </button>
        </div>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0,1fr))` }} dir="ltr">
        {cells.map((row, i) =>
          row.map((cell, j) => (
            <input
              key={`${i}-${j}`}
              type="text"
              inputMode="decimal"
              value={cell}
              aria-label={`${title} (${i + 1},${j + 1})`}
              onChange={(event) => {
                const next = cells.map((r) => [...r]);
                next[i][j] = event.target.value;
                setCells(next);
              }}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-1 text-center font-mono text-body-medium text-on-surface outline-none focus:border-primary"
            />
          )),
        )}
      </div>
    </div>
  );

  const ops: { id: Op; label: string }[] = [
    { id: 'add', label: t('matAdd') },
    { id: 'subtract', label: t('matSubtract') },
    { id: 'multiply', label: t('matMultiply') },
    { id: 'transpose', label: t('matTranspose') },
    { id: 'inverse', label: t('matInverse') },
    { id: 'solve', label: t('matSolve') },
  ];

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10">
          <Grid3x3 className="h-3.5 w-3.5" aria-hidden="true" />
          {t('tools')}
        </p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{t('matrixTitle')}</h1>
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-label-large text-on-surface-variant">{t('matrixSize')}</span>
        {[2, 3, 4].map((n) => (
          <Chip key={n} selected={size === n} onClick={() => resize(n)}>
            {n}×{n}
          </Chip>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {editor(t('matrixA'), aCells, setACells, 'a')}
        {editor(t('matrixB'), bCells, setBCells, 'b')}
      </div>

      {op === 'solve' && (
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
          <h3 className="mb-3 text-title-small font-semibold text-on-surface">{t('vectorB')}</h3>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0,1fr))` }} dir="ltr">
            {bVector.map((cell, i) => (
              <input
                key={i}
                type="text"
                inputMode="decimal"
                value={cell}
                aria-label={`b${i + 1}`}
                onChange={(event) => {
                  const next = [...bVector];
                  next[i] = event.target.value;
                  setBVector(next);
                }}
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-1 text-center font-mono text-body-medium text-on-surface outline-none focus:border-primary"
              />
            ))}
          </div>
        </div>
      )}

      <div className="chip-rail -mx-4 px-4" role="tablist" aria-label={t('matrixTitle')}>
        {ops.map((item) => (
          <Chip key={item.id} selected={op === item.id} onClick={() => setOp(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>

      {facts && (
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t('matrixA')}>
          {[
            { label: t('matDeterminant'), value: fmt(facts.det) },
            { label: t('matTrace'), value: fmt(facts.trace) },
            { label: t('matRank'), value: fmt(facts.rank) },
            { label: t('matNorm'), value: fmt(facts.norm) },
          ].map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-outline-variant bg-surface-container p-3">
              <p className="text-label-medium text-on-surface-variant">{fact.label}</p>
              <p className="mono-result mt-0.5 text-title-medium font-semibold text-on-surface">{fact.value}</p>
            </div>
          ))}
          {facts.eigen && (
            <div className="rounded-2xl border border-outline-variant bg-surface-container p-3 col-span-2 sm:col-span-4">
              <p className="text-label-medium text-on-surface-variant">{t('matEigen')}</p>
              <p className="mono-result mt-0.5 text-body-large font-semibold text-on-surface" dir="ltr">
                λ = {facts.eigen.map((e) => (e.imag === 0 ? fmt(e.real) : `${fmt(e.real)} ${e.imag > 0 ? '+' : '−'} ${fmt(Math.abs(e.imag))}i`)).join(' , ')}
              </p>
            </div>
          )}
        </section>
      )}

      <section className="hero-surface p-4" aria-label={t('resultMatrix')} aria-live="polite">
        <h2 className="relative z-10 text-title-medium font-semibold text-on-surface">{t('resultMatrix')}</h2>
        {error ? (
          <p className="relative z-10 mt-2 text-body-medium text-error">{error}</p>
        ) : result ? (
          <div
            className="relative z-10 mt-3 grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${result[0]?.length ?? 1}, minmax(0,1fr))` }}
            dir="ltr"
          >
            {result.flatMap((row, i) =>
              row.map((value, j) => (
                <div
                  key={`${i}-${j}`}
                  className="mono-result flex h-11 items-center justify-center rounded-lg bg-surface-container-lowest/90 px-1 text-center text-body-medium font-semibold text-on-surface"
                >
                  {fmt(value)}
                </div>
              )),
            )}
          </div>
        ) : null}
        {result && !error && (
          <div className="relative z-10 mt-3">
            <Button
              variant="tonal"
              size="sm"
              onClick={() => {
                if (result.length === size && (result[0]?.length ?? 0) === size) setACells(toText(result));
              }}
            >
              {t('resultMatrix')} ← A
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
