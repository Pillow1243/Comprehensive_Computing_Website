'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, LineChart, Plus, RotateCcw, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { useI18n } from '@/lib/i18n';
import {
  derivativeAt,
  evaluateExpression,
  findRoots,
  integrateRange,
  isValidExpression,
  sampleExpression,
} from '@/lib/expression';
import { formatNumber, cn } from '@/lib/utils';

interface GraphFunction {
  id: number;
  expr: string;
  visible: boolean;
}

const COLORS = ['#8AB4FF', '#7ADFA0', '#FFC46B'];
const PRESETS = ['sin(x)', 'x^2 - 2x + 1', 'exp(-x) * cos(3x)', 'ln(x)', '1/x', 'abs(x)'];

interface View {
  cx: number;
  cy: number;
  scale: number;
}

const DEFAULT_VIEW: View = { cx: 0, cy: 0, scale: 42 };

function niceStep(scale: number): number {
  const raw = 64 / scale;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  if (fraction < 1.5) return power;
  if (fraction < 3.5) return 2 * power;
  if (fraction < 7.5) return 5 * power;
  return 10 * power;
}

export default function GraphPage() {
  const { t, lang, numerals } = useI18n();
  const [functions, setFunctions] = useState<GraphFunction[]>([
    { id: 1, expr: 'sin(x)', visible: true },
    { id: 2, expr: 'x^2 / 4', visible: true },
  ]);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [showDerivative, setShowDerivative] = useState(false);
  const [showIntegral, setShowIntegral] = useState(false);
  const [x0, setX0] = useState('1');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 320, height: 340 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; view: View } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setSize({ width: Math.max(200, Math.floor(rect.width)), height: 340 });
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const xRange = useMemo(() => {
    const half = size.width / 2 / view.scale;
    return { from: view.cx - half, to: view.cx + half };
  }, [size.width, view]);

  const valid = useMemo(
    () =>
      functions.map((fn) => ({
        ...fn,
        ok: fn.expr.trim() === '' || isValidExpression(fn.expr),
        empty: fn.expr.trim() === '',
      })),
    [functions],
  );

  const primary = valid.find((fn) => fn.visible && fn.ok && !fn.empty);
  const analysis = useMemo(() => {
    if (!primary) return null;
    const point = Number(x0);
    try {
      return {
        value: Number.isFinite(point) ? evaluateExpression(primary.expr, { x: point }) : Number.NaN,
        derivative: Number.isFinite(point) ? derivativeAt(primary.expr, point) : Number.NaN,
        integral: integrateRange(primary.expr, xRange.from, xRange.to),
        roots: findRoots(primary.expr, xRange.from, xRange.to),
      };
    } catch {
      return null;
    }
  }, [primary, x0, xRange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { width, height } = size;
    const toPxX = (x: number) => width / 2 + (x - view.cx) * view.scale;
    const toPxY = (y: number) => height / 2 - (y - view.cy) * view.scale;

    ctx.clearRect(0, 0, width, height);

    // Grid
    const step = niceStep(view.scale);
    ctx.lineWidth = 1;
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(148,163,255,0.55)';
    for (let gx = Math.floor(xRange.from / step) * step; gx <= xRange.to; gx += step) {
      const px = toPxX(gx);
      ctx.strokeStyle = gx === 0 ? 'rgba(200,205,255,0.5)' : 'rgba(148,163,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
      if (gx !== 0) ctx.fillText(String(Number(gx.toFixed(6))), px + 3, height - 6);
    }
    const yTop = view.cy + height / 2 / view.scale;
    const yBottom = view.cy - height / 2 / view.scale;
    for (let gy = Math.floor(yBottom / step) * step; gy <= yTop; gy += step) {
      const py = toPxY(gy);
      ctx.strokeStyle = gy === 0 ? 'rgba(200,205,255,0.5)' : 'rgba(148,163,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
      if (gy !== 0) ctx.fillText(String(Number(gy.toFixed(6))), 4, py - 3);
    }

    const trace = (expr: string, color: string, dashed: boolean, shade = false) => {
      const samples = sampleExpression(expr, xRange.from, xRange.to, Math.max(160, Math.floor(width)));
      if (shade) {
        ctx.save();
        ctx.fillStyle = `${color}33`;
        ctx.beginPath();
        let started = false;
        const axisY = toPxY(0);
        for (const point of samples) {
          if (point.y === null) {
            started = false;
            continue;
          }
          const px = toPxX(point.x);
          const py = toPxY(point.y);
          if (!started) {
            ctx.moveTo(px, axisY);
            ctx.lineTo(px, py);
            started = true;
          } else ctx.lineTo(px, py);
        }
        ctx.lineTo(width, axisY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dashed ? [6, 5] : []);
      ctx.beginPath();
      let penDown = false;
      let prevPy = 0;
      for (const point of samples) {
        if (point.y === null || Math.abs(point.y) > 1e7) {
          penDown = false;
          continue;
        }
        const px = toPxX(point.x);
        const py = toPxY(point.y);
        if (!penDown) {
          ctx.moveTo(px, py);
          penDown = true;
        } else if (Math.abs(py - prevPy) > height * 1.5) {
          ctx.moveTo(px, py);
        } else ctx.lineTo(px, py);
        prevPy = py;
      }
      ctx.stroke();
      ctx.restore();
    };

    valid.forEach((fn, index) => {
      if (!fn.visible || !fn.ok || fn.empty) return;
      const color = COLORS[index % COLORS.length];
      if (showIntegral && fn.id === primary?.id) trace(fn.expr, color, false, true);
      trace(fn.expr, color, false);
      if (showDerivative) {
        // Sample the numeric derivative as its own dashed curve.
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        let penDown = false;
        const steps = 140;
        for (let i = 0; i <= steps; i += 1) {
          const x = xRange.from + (i / steps) * (xRange.to - xRange.from);
          try {
            const dy = derivativeAt(fn.expr, x);
            if (!Number.isFinite(dy)) {
              penDown = false;
              continue;
            }
            const px = toPxX(x);
            const py = toPxY(dy);
            if (!penDown) {
              ctx.moveTo(px, py);
              penDown = true;
            } else ctx.lineTo(px, py);
          } catch {
            penDown = false;
          }
        }
        ctx.stroke();
        ctx.restore();
      }
    });

    // Roots of the primary function
    if (primary && analysis) {
      ctx.save();
      ctx.fillStyle = '#FFC46B';
      for (const root of analysis.roots) {
        ctx.beginPath();
        ctx.arc(toPxX(root), toPxY(0), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Analysis point marker
    const point = Number(x0);
    if (primary && analysis && Number.isFinite(point) && Number.isFinite(analysis.value)) {
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = COLORS[0];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toPxX(point), toPxY(analysis.value), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [size, view, valid, xRange, showDerivative, showIntegral, primary, analysis, x0]);

  const zoom = (factor: number) =>
    setView((current) => ({ ...current, scale: Math.min(4000, Math.max(2, current.scale * factor)) }));

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), view };
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = distance / Math.max(1, pinch.current.distance);
      const base = pinch.current.view;
      setView({ ...base, scale: Math.min(4000, Math.max(2, base.scale * factor)) });
      return;
    }
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    setView((current) => ({
      ...current,
      cx: current.cx - dx / current.scale,
      cy: current.cy + dy / current.scale,
    }));
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const endPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const updateFunction = (id: number, patch: Partial<GraphFunction>) =>
    setFunctions((current) => current.map((fn) => (fn.id === id ? { ...fn, ...patch } : fn)));

  const addFunction = () =>
    setFunctions((current) =>
      current.length >= 3 ? current : [...current, { id: Date.now(), expr: '', visible: true }],
    );

  const fmt = (value: number) => formatNumber(value, { decimals: 6, lang, numerals });

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10">
          <LineChart className="h-3.5 w-3.5" aria-hidden="true" />
          {t('tools')}
        </p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{t('graphTitle')}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">{t('graphHint')}</p>
      </header>

      <section className="space-y-2" aria-label={t('graphTitle')}>
        <div ref={wrapRef} className="relative overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest">
          <canvas
            ref={canvasRef}
            style={{ width: size.width, height: size.height, touchAction: 'none', cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onWheel={(event) => zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12)}
            aria-label={t('plot')}
          />
          <div className="absolute end-2 top-2 flex gap-1.5">
            <button type="button" onClick={() => zoom(1.3)} aria-label={t('zoomIn')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container/90 text-on-surface">
              <ZoomIn className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => zoom(1 / 1.3)} aria-label={t('zoomOut')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container/90 text-on-surface">
              <ZoomOut className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setView(DEFAULT_VIEW)} aria-label={t('resetView')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container/90 text-on-surface">
              <RotateCcw className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="text-body-small text-on-surface-variant">{t('plotHint')}</p>
      </section>

      <section className="space-y-2" aria-label={t('variables')}>
        {valid.map((fn, index) => (
          <div key={fn.id} className="rounded-2xl border border-outline-variant bg-surface-container p-3">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} aria-hidden="true" />
              <span className="text-label-large font-semibold text-on-surface" dir="ltr">
                f{index + 1}(x) =
              </span>
              <input
                type="text"
                dir="ltr"
                value={fn.expr}
                onChange={(event) => updateFunction(fn.id, { expr: event.target.value })}
                placeholder={t('functionPlaceholder')}
                aria-label={`f${index + 1}(x)`}
                className={cn(
                  'h-11 min-w-0 flex-1 rounded-xl border bg-surface-container-lowest px-3 font-mono text-body-medium text-on-surface outline-none focus:border-primary',
                  fn.ok ? 'border-outline-variant' : 'border-error',
                )}
              />
              <button
                type="button"
                onClick={() => updateFunction(fn.id, { visible: !fn.visible })}
                aria-label={fn.visible ? t('hideKeyboard') : t('showKeyboard')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant"
              >
                {fn.visible ? <Eye className="h-5 w-5" aria-hidden="true" /> : <EyeOff className="h-5 w-5" aria-hidden="true" />}
              </button>
              {functions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setFunctions((current) => current.filter((item) => item.id !== fn.id))}
                  aria-label={t('removeFunction')}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
            {!fn.ok && <p className="mt-1 text-label-medium text-error">{t('invalidExpression')}</p>}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-1.5">
          {functions.length < 3 && (
            <Chip onClick={addFunction} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              {t('addFunction')}
            </Chip>
          )}
          <Chip selected={showDerivative} onClick={() => setShowDerivative((v) => !v)}>
            {t('showDerivative')}
          </Chip>
          <Chip selected={showIntegral} onClick={() => setShowIntegral((v) => !v)}>
            {t('showIntegral')}
          </Chip>
        </div>
        <div className="chip-rail -mx-4 px-4">
          {PRESETS.map((preset) => (
            <Chip
              key={preset}
              onClick={() => updateFunction(functions[0].id, { expr: preset, visible: true })}
            >
              <span dir="ltr" className="font-mono">{preset}</span>
            </Chip>
          ))}
        </div>
      </section>

      {primary && analysis && (
        <section className="hero-surface space-y-3 p-4" aria-label={t('results')}>
          <h2 className="relative z-10 text-title-medium font-semibold text-on-surface" dir="ltr">
            f₁(x) = {primary.expr}
          </h2>
          <label className="relative z-10 block">
            <span className="mb-1 block text-label-medium text-on-surface-variant">{t('tangentPoint')}</span>
            <input
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={x0}
              onChange={(event) => setX0(event.target.value)}
              aria-label={t('tangentPoint')}
              className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary"
            />
          </label>
          <dl className="relative z-10 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-container-lowest/80 p-3">
              <dt className="text-label-medium text-on-surface-variant">{t('functionValue')} f(x₀)</dt>
              <dd className="mono-result mt-0.5 text-title-medium font-semibold text-on-surface">{fmt(analysis.value)}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-lowest/80 p-3">
              <dt className="text-label-medium text-on-surface-variant">{t('derivativeValue')} f′(x₀)</dt>
              <dd className="mono-result mt-0.5 text-title-medium font-semibold text-on-surface">{fmt(analysis.derivative)}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-lowest/80 p-3 col-span-2">
              <dt className="text-label-medium text-on-surface-variant">{t('integralValue')}</dt>
              <dd className="mono-result mt-0.5 text-title-medium font-semibold text-on-surface">{fmt(analysis.integral)}</dd>
            </div>
          </dl>
          <div className="relative z-10">
            <h3 className="text-label-large font-semibold text-on-surface">{t('rootsInView')}</h3>
            {analysis.roots.length ? (
              <p className="mono-result mt-1 text-body-medium text-on-surface" dir="ltr">
                {analysis.roots.map((root) => fmt(root)).join(' · ')}
              </p>
            ) : (
              <p className="mt-1 text-body-medium text-on-surface-variant">{t('noRoots')}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
