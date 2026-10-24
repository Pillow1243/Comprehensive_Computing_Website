'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatNumber } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import type { Formula } from '@/lib/formulas';

export interface TrianglePatch {
  a?: number;
  b?: number;
  c?: number;
  C?: number;
}

export interface DynamicPlotProps {
  formula: Formula;
  inputs: Record<string, number | string | boolean>;
  values?: Record<string, unknown>;
  onTriangleChange?: (patch: TrianglePatch) => void;
  className?: string;
}

type View = { x0: number; x1: number; panY: number };

interface Series {
  label: string;
  points: Array<[number, number]>;
  color: string;
  dashed?: boolean;
  fill?: boolean;
}

const PALETTE = {
  a: '#8AB4FF',
  b: '#FFC46B',
  c: '#7ADFA0',
};

const num = (value: unknown, fallback = Number.NaN) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const triangleMode = (formula: Formula): 'SAS' | 'SSS' | 'RIGHT' | null => {
  if (formula.id === 'heron') return 'SSS';
  if (formula.id === 'pythagorean') return 'RIGHT';
  if (formula.id === 'trig_triangle_law_of_cosines' || formula.plot_spec?.type === 'triangle') return 'SAS';
  return null;
};

const seriesPlotType = (formula: Formula): string | null => {
  if (triangleMode(formula)) return null;
  const type = formula.plot_spec?.type;
  if (type) return type;
  if (formula.id === 'quadratic') return 'quadratic';
  if (formula.id === 'ph') return 'ph_scale';
  return null;
};

function buildSeries(formula: Formula, inputs: Record<string, unknown>, view?: View): Series[] {
  const type = seriesPlotType(formula);
  const x0 = view?.x0 ?? 0;
  const x1 = view?.x1 ?? 10;
  const samples = 420;
  const step = (x1 - x0) / (samples - 1);
  const sample = (fn: (x: number) => number, from: number, to: number): Array<[number, number]> => {
    const points: Array<[number, number]> = [];
    const localStep = (to - from) / (samples - 1);
    for (let i = 0; i < samples; i += 1) {
      const x = from + localStep * i;
      const y = fn(x);
      if (Number.isFinite(y)) points.push([x, y]);
    }
    return points;
  };

  switch (type) {
    case 'quadratic': {
      const a = num(inputs.a, 1);
      const b = num(inputs.b, 0);
      const c = num(inputs.c, 0);
      const vertexX = a !== 0 ? -b / (2 * a) : 0;
      const from = view ? x0 : vertexX - 6;
      const to = view ? x1 : vertexX + 6;
      return [
        {
          label: `${a}x² + ${b}x + ${c}`,
          color: PALETTE.a,
          points: sample((x) => a * x * x + b * x + c, from, to),
        },
      ];
    }
    case 'trig': {
      const from = view ? x0 : 0;
      const to = view ? x1 : 360;
      return [
        { label: 'sin', color: PALETTE.a, points: sample((x) => Math.sin((x * Math.PI) / 180), from, to) },
        { label: 'cos', color: PALETTE.b, points: sample((x) => Math.cos((x * Math.PI) / 180), from, to) },
        {
          label: 'tan',
          color: PALETTE.c,
          dashed: true,
          points: sample((x) => {
            const value = Math.tan((x * Math.PI) / 180);
            return Math.abs(value) > 8 ? Number.NaN : value;
          }, from, to),
        },
      ];
    }
    case 'normal': {
      const mu = num(inputs.mu, 0);
      const sigma = Math.max(1e-6, num(inputs.sigma, 1));
      const from = view ? x0 : mu - 4 * sigma;
      const to = view ? x1 : mu + 4 * sigma;
      return [
        {
          label: `N(${formatNumber(mu, { decimals: 3 })}, ${formatNumber(sigma, { decimals: 3 })})`,
          color: PALETTE.a,
          fill: true,
          points: sample(
            (x) => Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI)),
            from,
            to,
          ),
        },
      ];
    }
    case 'kinematics': {
      const u = num(inputs.u, num(inputs.v0, 0));
      const a = num(inputs.a, 0);
      const from = view ? x0 : 0;
      const to = view ? x1 : 10;
      return [
        { label: 's(t)', color: PALETTE.a, points: sample((t) => u * t + 0.5 * a * t * t, from, to) },
        { label: 'v(t)', color: PALETTE.b, dashed: true, points: sample((t) => u + a * t, from, to) },
      ];
    }
    case 'growth': {
      const k = num(inputs.K, 1000);
      const p0 = Math.max(1e-6, num(inputs.P0, 10));
      const r = num(inputs.growth, 0.5);
      return [
        {
          label: 'P(t)',
          color: PALETTE.a,
          points: sample((t) => k / (1 + ((k - p0) / p0) * Math.exp(-r * t)), view ? x0 : 0, view ? x1 : 20),
        },
      ];
    }
    case 'ohm': {
      const resistance = Math.max(1e-6, num(inputs.R ?? inputs.R1, 100));
      return [{ label: 'I = V/R', color: PALETTE.a, points: sample((v) => v / resistance, view ? x0 : 0, view ? x1 : 24) }];
    }
    case 'points': {
      const x1v = num(inputs.x1, 0);
      const y1v = num(inputs.y1, 0);
      const x2v = num(inputs.x2, 3);
      const y2v = num(inputs.y2, 4);
      const slope = x2v === x1v ? null : (y2v - y1v) / (x2v - x1v);
      const from = Math.min(x1v, x2v) - 2;
      const to = Math.max(x1v, x2v) + 2;
      return [
        ...(slope !== null
          ? [
              {
                label: 'line',
                color: PALETTE.a,
                points: [
                  [from, y1v + slope * (from - x1v)],
                  [to, y1v + slope * (to - x1v)],
                ] as Array<[number, number]>,
              },
            ]
          : []),
      ];
    }
    default:
      return [];
  }
}

export function DynamicPlot({ formula, inputs, values, onTriangleChange, className }: DynamicPlotProps) {
  const { t, lang } = useI18n();
  const { resolved } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 320, height: 240 });
  const [view, setView] = useState<View | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; center: number; view: View } | null>(null);
  const panRef = useRef<{ x: number; view: View; type: 'x' | 'y' } | null>(null);
  const lastTap = useRef(0);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mode = triangleMode(formula);
  const plotType = seriesPlotType(formula);

  const defaultView = useMemo<View>(() => {
    if (plotType === 'trig') return { x0: 0, x1: 360, panY: 0 };
    if (plotType === 'normal') {
      const mu = num(inputs.mu, 0);
      const sigma = Math.max(1e-6, num(inputs.sigma, 1));
      return { x0: mu - 4 * sigma, x1: mu + 4 * sigma, panY: 0 };
    }
    if (plotType === 'growth') return { x0: 0, x1: 20, panY: 0 };
    if (plotType === 'kinematics') return { x0: 0, x1: 10, panY: 0 };
    if (plotType === 'quadratic' || formula.id === 'quadratic') {
      const a = num(inputs.a, 1);
      const b = num(inputs.b, 0);
      const vertex = a !== 0 ? -b / (2 * a) : 0;
      return { x0: vertex - 6, x1: vertex + 6, panY: 0 };
    }
    if (plotType === 'points') {
      const x1v = num(inputs.x1, 0);
      const x2v = num(inputs.x2, 3);
      return { x0: Math.min(x1v, x2v) - 2, x1: Math.max(x1v, x2v) + 2, panY: 0 };
    }
    return { x0: 0, x1: 24, panY: 0 };
  }, [plotType, formula.id, inputs.a, inputs.b, inputs.mu, inputs.sigma, inputs.x1, inputs.x2]);

  const activeView = view ?? defaultView;
  const series = useMemo(
    () => buildSeries(formula, inputs, view ?? undefined),
    [formula, inputs, view],
  );

  // ── triangle geometry ────────────────────────────────────────────────────
  const triangle = useMemo(() => {
    if (!mode) return null;
    if (mode === 'SSS') {
      const a = Math.max(0.01, num(inputs.a, 3));
      const b = Math.max(0.01, num(inputs.b, 4));
      const c = Math.max(0.01, num(inputs.c, 5));
      if (a + b <= c || a + c <= b || b + c <= a) return null;
      // A = (0,0), B = (c,0); find C via law of cosines at A
      const cx = (b * b + c * c - a * a) / (2 * c);
      const cy = Math.sqrt(Math.max(0, b * b - cx * cx));
      return {
        A: [0, 0] as [number, number],
        B: [c, 0] as [number, number],
        C: [cx, cy] as [number, number],
        labels: { AB: c, AC: b, BC: a },
      };
    }
    const a = Math.max(0.01, num(inputs.a, 3));
    const b = Math.max(0.01, num(inputs.b, 4));
    const angleC = mode === 'RIGHT' ? 90 : num(inputs.C, 90);
    const rad = (angleC * Math.PI) / 180;
    // C at origin, B along +x at distance a, A at distance b rotated by C
    return {
      A: [b * Math.cos(rad), b * Math.sin(rad)] as [number, number],
      B: [a, 0] as [number, number],
      C: [0, 0] as [number, number],
      labels: { AB: Math.hypot(b * Math.cos(rad) - a, b * Math.sin(rad)), AC: b, BC: a },
      angleC,
    };
  }, [mode, inputs.a, inputs.b, inputs.c, inputs.C]);

  const resize = useCallback(() => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSize({ width: Math.max(200, rect.width), height: fullscreen ? Math.min(window.innerHeight * 0.7, 640) : Math.max(220, Math.min(rect.height || 240, 420)) });
  }, [fullscreen]);

  useEffect(() => {
    resize();
    const target = wrapRef.current;
    if (!target || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(resize);
    observer.observe(target);
    return () => observer.disconnect();
  }, [resize]);

  // ── drawing ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);

    const css = getComputedStyle(document.documentElement);
    const rgb = (token: string, alpha = 1) => {
      const value = css.getPropertyValue(token).trim();
      return value ? `rgba(${value.split(/\s+/).join(',')},${alpha})` : `rgba(128,128,128,${alpha})`;
    };
    const colors = {
      grid: rgb('--md-outline-variant', 0.45),
      axis: rgb('--md-outline', 0.9),
      text: rgb('--md-on-surface-variant'),
      surface: rgb('--md-surface-container'),
    };
    void resolved;

    const pad = { left: 40, right: 14, top: 16, bottom: 30 };
    const width = size.width - pad.left - pad.right;
    const height = size.height - pad.top - pad.bottom;

    const drawGrid = (x0: number, x1: number, y0: number, y1: number) => {
      ctx.font = '10px var(--font-jetbrains), monospace';
      ctx.fillStyle = colors.text;
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i += 1) {
        const y = pad.top + (height * i) / 4;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + width, y);
        ctx.stroke();
        const value = y1 - ((y1 - y0) * i) / 4;
        ctx.fillText(formatNumber(value, { decimals: 2, lang: 'en' }), 4, y + 3);
      }
      for (let i = 0; i <= 4; i += 1) {
        const x = pad.left + (width * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + height);
        ctx.stroke();
        const value = x0 + ((x1 - x0) * i) / 4;
        ctx.fillText(formatNumber(value, { decimals: 2, lang: 'en' }), x - 10, size.height - 10);
      }
    };

    if (triangle) {
      const points = [triangle.A, triangle.B, triangle.C];
      const xs = points.map((point) => point[0]);
      const ys = points.map((point) => point[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const spanX = Math.max(maxX - minX, 0.5);
      const spanY = Math.max(maxY - minY, 0.5);
      const scale = Math.min((width - 30) / spanX, (height - 24) / spanY);
      const originX = pad.left + 18 - minX * scale + (width - 30 - spanX * scale) / 2;
      const originY = pad.top + height - 14 + minY * scale - (height - 24 - spanY * scale) / 2;
      const project = (point: [number, number]): [number, number] => [
        originX + point[0] * scale,
        originY - point[1] * scale,
      ];
      const projected = points.map(project);

      ctx.fillStyle = rgb('--md-primary', 0.12);
      ctx.strokeStyle = rgb('--md-primary', 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      projected.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const names = ['A', 'B', 'C'];
      const colorsBySide = [PALETTE.c, PALETTE.a, PALETTE.b];
      for (let i = 0; i < 3; i += 1) {
        const [x1, y1] = projected[i];
        const [x2, y2] = projected[(i + 1) % 3];
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const sideLength = Math.hypot(x1 - x2, y1 - y2);
        const label =
          i === 0 ? `c=${formatNumber(triangle.labels.AB, { decimals: 2, lang })}` : i === 1 ? `a=${formatNumber(triangle.labels.BC, { decimals: 2, lang })}` : `b=${formatNumber(triangle.labels.AC, { decimals: 2, lang })}`;
        if (sideLength > 48) {
          ctx.fillStyle = colorsBySide[i];
          ctx.font = '600 10px var(--font-jetbrains), monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, midX, midY - 6);
          ctx.textAlign = 'start';
        }
      }

      projected.forEach(([x, y], index) => {
        ctx.beginPath();
        ctx.arc(x, y, dragging === index ? 11 : 8, 0, Math.PI * 2);
        ctx.fillStyle = rgb('--md-surface-container-high');
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = rgb('--md-primary');
        ctx.stroke();
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 10px var(--font-jetbrains), monospace';
        ctx.fillText(names[index], x + 12, y - 10);
      });

      ctx.fillStyle = colors.text;
      ctx.font = '10px var(--font-vazirmatn), sans-serif';
      ctx.fillText(`∠C = ${formatNumber(triangle.angleC ?? num(inputs.C, 90), { decimals: 1, lang })}°`, pad.left + 4, pad.top + 10);
      return;
    }

    if (!series.length) {
      ctx.fillStyle = colors.text;
      ctx.font = '13px var(--font-vazirmatn), sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('noPlot'), size.width / 2, size.height / 2);
      ctx.textAlign = 'start';
      return;
    }

    const allPoints = series.flatMap((item) => item.points);
    let minY = Math.min(...allPoints.map((point) => point[1]));
    let maxY = Math.max(...allPoints.map((point) => point[1]));
    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || minY === maxY) {
      minY = (Number.isFinite(minY) ? minY : 0) - 1;
      maxY = (Number.isFinite(maxY) ? maxY : 0) + 1;
    }
    const padY = (maxY - minY) * 0.12;
    minY -= padY;
    maxY += padY;
    const x0 = activeView.x0;
    const x1 = activeView.x1;
    const projectX = (x: number) => pad.left + ((x - x0) / (x1 - x0)) * width;
    const projectY = (y: number) => pad.top + height - ((y - minY) / (maxY - minY)) * height;

    drawGrid(x0, x1, minY, maxY);

    // zero axes
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.2;
    if (minY < 0 && maxY > 0) {
      ctx.beginPath();
      ctx.moveTo(pad.left, projectY(0));
      ctx.lineTo(pad.left + width, projectY(0));
      ctx.stroke();
    }
    if (x0 < 0 && x1 > 0) {
      ctx.beginPath();
      ctx.moveTo(projectX(0), pad.top);
      ctx.lineTo(projectX(0), pad.top + height);
      ctx.stroke();
    }

    for (const item of series) {
      const visible = item.points.filter((point) => point[0] >= x0 && point[0] <= x1);
      if (!visible.length) continue;
      if (item.fill) {
        const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + height);
        gradient.addColorStop(0, `${item.color}55`);
        gradient.addColorStop(1, `${item.color}05`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(projectX(visible[0][0]), projectY(Math.max(minY, 0)));
        for (const [x, y] of visible) ctx.lineTo(projectX(x), projectY(y));
        ctx.lineTo(projectX(visible[visible.length - 1][0]), projectY(Math.max(minY, 0)));
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2.2;
      ctx.setLineDash(item.dashed ? [6, 5] : []);
      ctx.beginPath();
      let started = false;
      for (const [x, y] of visible) {
        const px = projectX(x);
        const py = projectY(y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (tooltip) {
      const bubbleWidth = 104;
      const bubbleX = Math.min(Math.max(tooltip.px - bubbleWidth / 2, pad.left), size.width - bubbleWidth - 4);
      const bubbleY = Math.max(tooltip.py - 44, 2);
      ctx.fillStyle = rgb('--md-inverse', 0.96);
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleWidth, 36, 8);
      ctx.fill();
      ctx.fillStyle = rgb('--md-inverse-on-surface');
      ctx.font = '600 11px var(--font-jetbrains), monospace';
      ctx.fillText(`x ${formatNumber(tooltip.x, { decimals: 2, lang: 'en' })}`, bubbleX + 8, bubbleY + 14);
      ctx.fillText(`y ${formatNumber(tooltip.y, { decimals: 3, lang: 'en' })}`, bubbleX + 8, bubbleY + 28);
    }
  }, [size, series, triangle, activeView, tooltip, dragging, resolved, lang, t, inputs.C]);

  // ── interaction ──────────────────────────────────────────────────────────
  const hitVertex = (event: React.PointerEvent<HTMLCanvasElement>): number | null => {
    if (!triangle) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    const points = [triangle.A, triangle.B, triangle.C];
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const pad = { left: 40, right: 14, top: 16, bottom: 30 };
    const width = size.width - pad.left - pad.right;
    const height = size.height - pad.top - pad.bottom;
    const spanX = Math.max(...xs) - Math.min(...xs, 0);
    const spanY = Math.max(...ys) - Math.min(...ys, 0);
    const safeSpanX = Math.max(spanX, 0.5);
    const safeSpanY = Math.max(spanY, 0.5);
    const scale = Math.min((width - 30) / safeSpanX, (height - 24) / safeSpanY);
    const originX = pad.left + 18 - Math.min(...xs) * scale + (width - 30 - safeSpanX * scale) / 2;
    const originY = pad.top + height - 14 + Math.min(...ys) * scale - (height - 24 - safeSpanY * scale) / 2;
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    for (let i = 0; i < points.length; i += 1) {
      const vx = originX + points[i][0] * scale;
      const vy = originY - points[i][1] * scale;
      if (Math.hypot(px - vx, py - vy) < 26) return i;
    }
    return null;
  };

  const updateTriangleFromPointer = (event: React.PointerEvent<HTMLCanvasElement>, index: number) => {
    if (!triangle || !onTriangleChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const points = [triangle.A, triangle.B, triangle.C];
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const pad = { left: 40, right: 14, top: 16, bottom: 30 };
    const width = size.width - pad.left - pad.right;
    const height = size.height - pad.top - pad.bottom;
    const safeSpanX = Math.max(Math.max(...xs) - Math.min(...xs), 0.5);
    const safeSpanY = Math.max(Math.max(...ys) - Math.min(...ys), 0.5);
    const scale = Math.min((width - 30) / safeSpanX, (height - 24) / safeSpanY);
    const originX = pad.left + 18 - Math.min(...xs) * scale + (width - 30 - safeSpanX * scale) / 2;
    const originY = pad.top + height - 14 + Math.min(...ys) * scale - (height - 24 - safeSpanY * scale) / 2;
    const x = (event.clientX - rect.left - originX) / scale;
    const y = (originY - (event.clientY - rect.top)) / scale;
    const next = points.map((point, i) => (i === index ? ([x, y] as [number, number]) : point));

    if (mode === 'SSS') {
      const [A, B, C] = next;
      onTriangleChange({
        a: Math.max(0.1, Math.hypot(B[0] - C[0], B[1] - C[1])),
        b: Math.max(0.1, Math.hypot(A[0] - C[0], A[1] - C[1])),
        c: Math.max(0.1, Math.hypot(A[0] - B[0], A[1] - B[1])),
      });
      return;
    }
    const C = next[2] ?? [0, 0];
    const A = next[0];
    const B = next[1];
    const a = Math.hypot(B[0] - C[0], B[1] - C[1]);
    const b = Math.hypot(A[0] - C[0], A[1] - C[1]);
    const angle = (Math.atan2(A[1] - C[1], A[0] - C[0]) * 180) / Math.PI;
    onTriangleChange({
      a: Math.max(0.1, a),
      b: Math.max(0.1, b),
      ...(mode === 'SAS' ? { C: Math.round(((angle % 360) + 360) % 360) } : {}),
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (triangle) {
      const vertex = hitVertex(event);
      if (vertex !== null) {
        setDragging(vertex);
        updateTriangleFromPointer(event, vertex);
        return;
      }
    }
    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      gesture.current = {
        distance: Math.hypot(p1.x - p2.x, p1.y - p2.y),
        center: (p1.x + p2.x) / 2,
        view: activeView,
      };
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setView(null);
      setTooltip(null);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    panRef.current = { x: event.clientX, view: activeView, type: 'x' };
    longPress.current = setTimeout(() => {
      if (!series.length) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const pad = { left: 40, right: 14, top: 16, bottom: 30 };
      const localX = event.clientX - rect.left;
      const ratio = (localX - pad.left) / (size.width - pad.left - pad.right);
      const x = activeView.x0 + ratio * (activeView.x1 - activeView.x0);
      const first = series[0];
      const nearest = first.points.reduce(
        (best, point) => (Math.abs(point[0] - x) < Math.abs(best[0] - x) ? point : best),
        first.points[0] ?? [x, 0],
      );
      const rectTop = rect.top + 20;
      setTooltip({ x: nearest[0], y: nearest[1], px: localX, py: event.clientY - rectTop });
      navigator.vibrate?.(10);
    }, 420);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (dragging !== null) {
      updateTriangleFromPointer(event, dragging);
      return;
    }
    if (pointers.current.size === 2 && gesture.current) {
      const [p1, p2] = [...pointers.current.values()];
      const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (gesture.current.distance > 0) {
        const factor = gesture.current.distance / Math.max(distance, 1);
        const base = gesture.current.view;
        const span = (base.x1 - base.x0) * factor;
        const centerRatio = 0.5;
        const centerValue = base.x0 + (base.x1 - base.x0) * centerRatio;
        setView({
          x0: centerValue - span * centerRatio,
          x1: centerValue + span * (1 - centerRatio),
          panY: base.panY,
        });
      }
      return;
    }
    if (panRef.current) {
      if (longPress.current) {
        clearTimeout(longPress.current);
        longPress.current = null;
      }
      const dx = event.clientX - panRef.current.x;
      if (Math.abs(dx) > 2) {
        const base = panRef.current.view;
        const span = base.x1 - base.x0;
        const shift = (dx / Math.max(size.width - 54, 100)) * span;
        setView({ x0: base.x0 - shift, x1: base.x1 - shift, panY: base.panY });
        setTooltip(null);
      }
    }
  };

  const endPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
    if (dragging !== null) setDragging(null);
    panRef.current = null;
    if (longPress.current) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }
  };

  const zoom = (factor: number) => {
    const base = activeView;
    const span = (base.x1 - base.x0) * factor;
    const center = (base.x0 + base.x1) / 2;
    setView({ x0: center - span / 2, x1: center + span / 2, panY: base.panY });
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${formula.id}-plot.png`;
      link.click();
      toast.success(t('downloadPng'));
    } catch {
      toast.error(t('plotUnavailable'));
    }
  };

  const legendItems = series.map((item) => item.label);

  const body = (
    <div
      ref={wrapRef}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container',
        fullscreen ? 'h-[70dvh]' : 'aspect-chart-mobile',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        className="drag-none block"
        role="img"
        aria-label={`${formula.name_fa} — ${t('plot')}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={(event) => {
          event.preventDefault();
          zoom(event.deltaY > 0 ? 1.12 : 0.9);
        }}
      />

      {legendItems.length > 0 && (
        <div className="absolute start-2 top-2 max-w-[70%]">
          <button
            type="button"
            onClick={() => setLegendOpen((open) => !open)}
            aria-expanded={legendOpen}
            className="flex min-h-8 items-center gap-1 rounded-full bg-surface-container-high/85 px-2.5 text-label-small text-on-surface-variant backdrop-blur"
          >
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', !legendOpen && '-rotate-90')}
              aria-hidden="true"
            />
            {t('plot')}
          </button>
          {legendOpen && (
            <ul className="mt-1 space-y-1 rounded-lg bg-surface-container-high/85 px-2 py-1.5 backdrop-blur">
              {series.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1.5 text-label-small text-on-surface-variant">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="max-w-32 truncate font-latin">{item.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="absolute bottom-2 end-2 flex gap-1">
        <PlotButton label={t('zoomIn')} onClick={() => zoom(0.8)}>
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </PlotButton>
        <PlotButton label={t('zoomOut')} onClick={() => zoom(1.25)}>
          <ZoomOut className="h-4 w-4" aria-hidden="true" />
        </PlotButton>
        <PlotButton label={t('resetView')} onClick={() => { setView(null); setTooltip(null); }}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </PlotButton>
        <PlotButton label={t('downloadPng')} onClick={download}>
          <Download className="h-4 w-4" aria-hidden="true" />
        </PlotButton>
        <PlotButton
          label={fullscreen ? t('exitFullscreen') : t('fullscreen')}
          onClick={() => setFullscreen((value) => !value)}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
        </PlotButton>
      </div>
    </div>
  );

  if (!mode && !plotType) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center text-body-medium text-on-surface-variant">
        {values ? t('noPlot') : t('noPlot')}
      </div>
    );
  }

  return (
    <div className={cn(fullscreen && 'fixed inset-0 z-modal flex items-center justify-center bg-surface/95 p-3 backdrop-blur')}>
      {body}
      {!fullscreen && mode && (
        <p className="mt-2 px-1 text-body-small text-on-surface-variant">{t('dragVertexHint')}</p>
      )}
      {!fullscreen && !mode && (
        <p className="mt-2 px-1 text-body-small text-on-surface-variant">{t('plotHint')}</p>
      )}
    </div>
  );
}

function PlotButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high/85 text-on-surface backdrop-blur active:scale-95"
    >
      {children}
    </button>
  );
}
