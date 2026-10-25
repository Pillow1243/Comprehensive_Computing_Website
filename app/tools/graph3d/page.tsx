'use client';

import { useEffect, useRef, useState } from 'react';
import { Box } from 'lucide-react';
import { evaluateExpression } from '@/lib/expression';
import { useI18n } from '@/lib/i18n';

type Mode = 'surface' | 'polar' | 'parametric' | 'implicit';

const inputClass = 'h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary';

export default function Graph3dPage() {
  const { lang } = useI18n();
  const fa = lang !== 'en';
  const [mode, setMode] = useState<Mode>('surface');
  const [expr, setExpr] = useState('sin(x)*cos(y)');
  const [exprY, setExprY] = useState('sin(3*x)');
  const [azimuth, setAzimuth] = useState(0.7);
  const [elevation, setElevation] = useState(0.55);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => setWidth(Math.max(260, Math.floor(entries[0].contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = 380;
    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;

    if (mode === 'surface') {
      const grid = 26;
      const extent = 3;
      const scale = width / 9;
      const cosA = Math.cos(azimuth);
      const sinA = Math.sin(azimuth);
      const cosE = Math.cos(elevation);
      const sinE = Math.sin(elevation);
      const project = (x: number, y: number, z: number) => {
        const rx = x * cosA - y * sinA;
        const ry = x * sinA + y * cosA;
        return { x: cx + rx * scale, y: cy + (ry * sinE - z * cosE) * scale, depth: ry * cosE + z * sinE };
      };
      const values: number[][] = [];
      for (let i = 0; i <= grid; i += 1) {
        values.push([]);
        for (let j = 0; j <= grid; j += 1) {
          const x = -extent + (2 * extent * i) / grid;
          const y = -extent + (2 * extent * j) / grid;
          try {
            const z = evaluateExpression(expr, { x, y });
            values[i].push(Number.isFinite(z) ? Math.max(-3, Math.min(3, z)) : Number.NaN);
          } catch {
            values[i].push(Number.NaN);
          }
        }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < grid; i += 1) {
        for (let j = 0; j < grid; j += 1) {
          const x0 = -extent + (2 * extent * i) / grid;
          const y0 = -extent + (2 * extent * j) / grid;
          const x1 = -extent + (2 * extent * (i + 1)) / grid;
          const y1 = -extent + (2 * extent * (j + 1)) / grid;
          const quad = [
            project(x0, y0, values[i][j]),
            project(x1, y0, values[i + 1][j]),
            project(x1, y1, values[i + 1][j + 1]),
            project(x0, y1, values[i][j + 1]),
          ];
          if (quad.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) continue;
          const zAvg = (values[i][j] + values[i + 1][j + 1]) / 2;
          const shade = Math.max(0, Math.min(1, (zAvg + 2) / 4));
          ctx.fillStyle = `rgba(${Math.round(80 + 120 * shade)}, ${Math.round(140 + 60 * shade)}, 255, 0.28)`;
          ctx.strokeStyle = 'rgba(160,190,255,0.45)';
          ctx.beginPath();
          ctx.moveTo(quad[0].x, quad[0].y);
          for (let k = 1; k < 4; k += 1) ctx.lineTo(quad[k].x, quad[k].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      return;
    }

    // 2D modes share axes.
    const scale = width / 11;
    ctx.strokeStyle = 'rgba(148,163,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();
    ctx.strokeStyle = '#8AB4FF';
    ctx.lineWidth = 2;

    if (mode === 'polar') {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= 720; i += 1) {
        const theta = (i / 720) * Math.PI * 2;
        try {
          const r = evaluateExpression(expr, { x: theta, theta });
          if (!Number.isFinite(r)) { started = false; continue; }
          const px = cx + r * Math.cos(theta) * scale;
          const py = cy - r * Math.sin(theta) * scale;
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        } catch { started = false; }
      }
      ctx.stroke();
      return;
    }

    if (mode === 'parametric') {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= 600; i += 1) {
        const t = -5 + (10 * i) / 600;
        try {
          const pxValue = evaluateExpression(expr, { x: t, t });
          const pyValue = evaluateExpression(exprY, { x: t, t });
          if (!Number.isFinite(pxValue) || !Number.isFinite(pyValue)) { started = false; continue; }
          const px = cx + pxValue * scale;
          const py = cy - pyValue * scale;
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        } catch { started = false; }
      }
      ctx.stroke();
      return;
    }

    // Implicit f(x, y) = 0: mark pixels whose cell corners change sign.
    const step = 4;
    ctx.fillStyle = '#7ADFA0';
    for (let py = 0; py < height; py += step) {
      for (let px = 0; px < width; px += step) {
        const x = (px - cx) / scale;
        const y = (cy - py) / scale;
        const x2 = (px + step - cx) / scale;
        const y2 = (cy - (py + step)) / scale;
        try {
          const corners = [
            evaluateExpression(expr, { x, y }),
            evaluateExpression(expr, { x: x2, y }),
            evaluateExpression(expr, { x, y: y2 }),
            evaluateExpression(expr, { x: x2, y: y2 }),
          ];
          if (corners.some((value) => !Number.isFinite(value))) continue;
          if (Math.min(...corners) <= 0 && Math.max(...corners) >= 0) ctx.fillRect(px, py, step, step);
        } catch { /* undefined cell */ }
      }
    }
  }, [mode, expr, exprY, azimuth, elevation, width]);

  const modes: Array<{ id: Mode; fa: string; en: string; hintFa: string; hintEn: string }> = [
    { id: 'surface', fa: 'سطح سه‌بعدی z=f(x,y)', en: '3D surface z=f(x,y)', hintFa: 'بکشید تا بچرخد', hintEn: 'Drag to rotate' },
    { id: 'polar', fa: 'قطبی r=f(θ) — با x به‌جای θ', en: 'Polar r=f(θ) — x is θ', hintFa: 'θ از ۰ تا ۲π', hintEn: 'θ from 0 to 2π' },
    { id: 'parametric', fa: 'پارامتری (x(t), y(t)) — با x به‌جای t', en: 'Parametric (x(t), y(t)) — x is t', hintFa: 't از ‎−۵ تا ۵', hintEn: 't from −5 to 5' },
    { id: 'implicit', fa: 'ضمنی f(x,y)=0', en: 'Implicit f(x,y)=0', hintFa: 'مثلاً x^2+y^2-4', hintEn: 'e.g. x^2+y^2-4' },
  ];
  const active = modes.find((item) => item.id === mode)!;

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10"><Box className="h-3.5 w-3.5" aria-hidden="true" />{fa ? 'ابزارها' : 'Tools'}</p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{fa ? 'نمودار پیشرفته و سه‌بعدی' : 'Advanced & 3D graphing'}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">
          {fa ? 'سطح سه‌بعدی چرخان، نمودار قطبی، پارامتری و ضمنی — همه با همان عبارت‌نویس امن برنامه.' : 'Rotating 3D surfaces plus polar, parametric and implicit plots — all on the app’s safe expression engine.'}
        </p>
      </header>

      <div className="chip-rail" role="tablist" aria-label={fa ? 'حالت نمودار' : 'Plot mode'}>
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => setMode(item.id)}
            className={`min-h-10 rounded-full px-3 text-label-large ${mode === item.id ? 'brand-gradient font-semibold text-white' : 'bg-surface-container text-on-surface-variant'}`}
          >
            {fa ? item.fa : item.en}
          </button>
        ))}
      </div>

      <div ref={wrapRef} className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest">
        <canvas
          ref={canvasRef}
          style={{ width, height: 380, touchAction: 'none', cursor: mode === 'surface' ? 'grab' : 'default' }}
          onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY }; }}
          onPointerMove={(event) => {
            if (!drag.current || mode !== 'surface') return;
            const dx = event.clientX - drag.current.x;
            const dy = event.clientY - drag.current.y;
            drag.current = { x: event.clientX, y: event.clientY };
            setAzimuth((value) => value + dx * 0.01);
            setElevation((value) => Math.max(-1.3, Math.min(1.3, value + dy * 0.01)));
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerLeave={() => { drag.current = null; }}
          aria-label={fa ? active.fa : active.en}
        />
      </div>
      <p className="text-body-small text-on-surface-variant">{fa ? active.hintFa : active.hintEn}</p>

      <section className="space-y-2">
        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant" dir="ltr">{mode === 'surface' ? 'z = f(x, y)' : mode === 'polar' ? 'r = f(x)' : mode === 'parametric' ? 'x(t) =' : 'f(x, y) ='}</span>
          <input value={expr} onChange={(e) => setExpr(e.target.value)} dir="ltr" className={inputClass} />
        </label>
        {mode === 'parametric' && (
          <label className="block">
            <span className="mb-1 block text-label-medium text-on-surface-variant" dir="ltr">y(t) =</span>
            <input value={exprY} onChange={(e) => setExprY(e.target.value)} dir="ltr" className={inputClass} />
          </label>
        )}
        {mode === 'surface' && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'چرخش افقی' : 'Azimuth'}</span>
              <input type="range" min={-3.14} max={3.14} step={0.01} value={azimuth} onChange={(e) => setAzimuth(Number(e.target.value))} className="w-full accent-primary" dir="ltr" />
            </label>
            <label className="block">
              <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'زاویهٔ ارتفاع' : 'Elevation'}</span>
              <input type="range" min={-1.3} max={1.3} step={0.01} value={elevation} onChange={(e) => setElevation(Number(e.target.value))} className="w-full accent-primary" dir="ltr" />
            </label>
          </div>
        )}
        <div className="chip-rail">
          {(mode === 'surface'
            ? ['sin(x)*cos(y)', 'x^2-y^2', 'sin(sqrt(x^2+y^2))', 'exp(-(x^2+y^2)/3)']
            : mode === 'implicit'
              ? ['x^2+y^2-4', 'x^2/4+y^2-1', 'x^3+y^3-3*x*y', 'sin(x)+cos(y)']
              : mode === 'polar'
                ? ['1+cos(x)', 'sin(4*x)', 'x/4', '2*cos(3*x)']
                : ['sin(x)', 'cos(2*x)', 'x/2', 'sin(3*x)']
          ).map((preset) => (
            <button key={preset} type="button" onClick={() => setExpr(preset)} className="min-h-10 rounded-full border border-outline-variant px-3 font-mono text-label-medium text-on-surface" dir="ltr">
              {preset}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
