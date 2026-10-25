'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Rocket } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';

export default function SimulatorPage() {
  const { lang, numerals } = useI18n();
  const fa = lang !== 'en';
  const [speed, setSpeed] = useState(28);
  const [angleDeg, setAngleDeg] = useState(45);
  const [gravity, setGravity] = useState(9.80665);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);
  const startedAt = useRef<number | null>(null);

  const fmt = (value: number) => formatNumber(value, { decimals: 4, lang, numerals });
  const angle = (angleDeg * Math.PI) / 180;
  const vx = speed * Math.cos(angle);
  const vy = speed * Math.sin(angle);
  const flightTime = gravity > 0 ? (2 * vy) / gravity : 0;
  const range = vx * flightTime;
  const maxHeight = gravity > 0 ? (vy * vy) / (2 * gravity) : 0;

  useEffect(() => {
    const element = wrapRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => setWidth(Math.max(260, Math.floor(entries[0].contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) {
      startedAt.current = null;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      if (startedAt.current === null) startedAt.current = now - progress * flightTime * 1000;
      const elapsed = (now - startedAt.current) / 1000;
      const next = flightTime > 0 ? Math.min(1, elapsed / flightTime) : 1;
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // progress is intentionally read once when play starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, flightTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = 300;
    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const pad = 24;
    const scaleX = (width - pad * 2) / Math.max(range, 1);
    const scaleY = (height - pad * 2) / Math.max(maxHeight * 1.25, 1);
    const scale = Math.min(scaleX, scaleY);
    const groundY = height - pad;
    const toPx = (x: number, y: number) => ({ x: pad + x * scale, y: groundY - y * scale });

    ctx.strokeStyle = 'rgba(148,163,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(pad, groundY);
    ctx.lineTo(width - pad, groundY);
    ctx.stroke();

    ctx.strokeStyle = '#8AB4FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) {
      const t = (flightTime * i) / 120;
      const point = toPx(vx * t, Math.max(0, vy * t - 0.5 * gravity * t * t));
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    const t = progress * flightTime;
    const current = toPx(vx * t, Math.max(0, vy * t - 0.5 * gravity * t * t));
    ctx.fillStyle = '#FFC46B';
    ctx.beginPath();
    ctx.arc(current.x, current.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(230,233,255,0.85)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(`R = ${range.toFixed(1)} m`, pad, 16);
    ctx.fillText(`H = ${maxHeight.toFixed(1)} m`, pad, 32);
  }, [speed, angleDeg, gravity, progress, width, vx, vy, flightTime, range, maxHeight]);

  const slider = (label: string, value: number, setValue: (value: number) => void, min: number, max: number, step: number, unit: string) => (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-label-medium text-on-surface-variant">
        <span>{label}</span>
        <span className="tnum font-mono text-on-surface" dir="ltr">{fmt(value)} {unit}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => { setValue(Number(event.target.value)); setProgress(0); setPlaying(false); }} className="w-full accent-primary" dir="ltr" />
    </label>
  );

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10"><Rocket className="h-3.5 w-3.5" aria-hidden="true" />{fa ? 'ابزارها' : 'Tools'}</p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{fa ? 'آزمایشگاه مجازی پرتابه' : 'Projectile virtual lab'}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">
          {fa ? 'فرمول را لمس کنید: با اسلایدر سرعت، زاویه و گرانش (زمین، ماه یا مریخ) مسیر، برد و اوج را زنده ببینید و پخش کنید.' : 'Touch the formula: drag speed, angle and gravity (Earth, Moon or Mars) to explore trajectory, range and apex live.'}
        </p>
      </header>

      <div ref={wrapRef} className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest">
        <canvas ref={canvasRef} style={{ width, height: 300 }} aria-label={fa ? 'مسیر پرتابه' : 'Projectile trajectory'} />
      </div>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        {slider(fa ? 'سرعت اولیه' : 'Initial speed', speed, setSpeed, 1, 60, 0.5, 'm/s')}
        {slider(fa ? 'زاویهٔ پرتاب' : 'Launch angle', angleDeg, setAngleDeg, 5, 85, 1, '°')}
        {slider(fa ? 'گرانش' : 'Gravity', gravity, setGravity, 1, 25, 0.01, 'm/s²')}
        <div className="flex flex-wrap gap-2">
          {[
            [fa ? 'زمین ۹.۸۱' : 'Earth 9.81', 9.80665],
            [fa ? 'ماه ۱.۶۲' : 'Moon 1.62', 1.62],
            [fa ? 'مریخ ۳.۷۱' : 'Mars 3.71', 3.71],
          ].map(([label, value]) => (
            <button key={label as string} type="button" onClick={() => { setGravity(value as number); setProgress(0); setPlaying(false); }} className="min-h-10 rounded-full border border-outline-variant px-3 text-label-large text-on-surface">
              {label}
            </button>
          ))}
          <button type="button" onClick={() => { if (progress >= 1) setProgress(0); setPlaying((value) => !value); }} className="flex min-h-10 items-center gap-1.5 rounded-full brand-gradient px-4 font-semibold text-white">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            {playing ? (fa ? 'توقف' : 'Pause') : (fa ? 'پخش حرکت' : 'Play motion')}
          </button>
        </div>
        <dl className="grid grid-cols-3 gap-2" aria-live="polite">
          {[
            [fa ? 'برد' : 'Range', `${fmt(range)} m`],
            [fa ? 'اوج' : 'Apex', `${fmt(maxHeight)} m`],
            [fa ? 'زمان پرواز' : 'Flight time', `${fmt(flightTime)} s`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-surface-container-high/70 p-3">
              <dt className="text-label-small text-on-surface-variant">{label}</dt>
              <dd className="tnum mt-0.5 font-mono text-body-medium font-bold text-on-surface" dir="ltr">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
