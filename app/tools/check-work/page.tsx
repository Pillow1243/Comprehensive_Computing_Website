'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Eraser, ImagePlus, Volume2, XCircle } from 'lucide-react';
import { checkWork, type CheckWorkResult } from '@/lib/check-work';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';

export default function CheckWorkPage() {
  const { lang, numerals } = useI18n();
  const fa = lang !== 'en';
  const [text, setText] = useState('2*x + 4 = 10\n2*x = 6\nx = 3');
  const [expected, setExpected] = useState('3');
  const [result, setResult] = useState<CheckWorkResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const fmt = (value: number) => formatNumber(value, { decimals: 6, lang, numerals });

  const analyze = () => {
    const target = expected.trim() === '' ? undefined : Number(expected);
    setResult(checkWork(text, Number.isFinite(target) ? target : undefined));
  };

  const speak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !result) return;
    const summary = result.lines
      .map((line) => `${line.index + 1}: ${fa ? line.noteFa : line.noteEn}`)
      .join('. ');
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = fa ? 'fa-IR' : 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width, y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height };
  };

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10"><ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />{fa ? 'ابزارها' : 'Tools'}</p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{fa ? 'حلم را چک کن' : 'Check my work'}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">
          {fa
            ? 'حل خودتان را خط‌به‌خط بنویسید (یا از روی برگه عکس بگیرید و خطوطش را تایپ کنید)؛ اولین خطِ ناسازگار و نوع اشتباه رایجش را پیدا می‌کنیم، نه فقط جواب آخر را.'
            : 'Write your solution line by line (or photograph the page and transcribe it); we find the first inconsistent line and the likely misconception — not just the final answer.'}
        </p>
      </header>

      <section className="space-y-3 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <div className="flex flex-wrap gap-2">
          <label className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-outline-variant px-3 text-label-large text-on-surface">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {fa ? 'افزودن عکس برگه' : 'Add a photo of the page'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setImageUrl(URL.createObjectURL(file));
              }}
            />
          </label>
          {result && (
            <button type="button" onClick={speak} className="flex min-h-10 items-center gap-1.5 rounded-full border border-outline-variant px-3 text-label-large text-on-surface">
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              {fa ? 'خواندن بازخورد با صدا' : 'Read feedback aloud'}
            </button>
          )}
        </div>

        {imageUrl && (
          <figure className="overflow-hidden rounded-2xl border border-outline-variant">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={fa ? 'عکس برگهٔ حل' : 'Photo of the worked solution'} className="max-h-72 w-full object-contain bg-surface-container-lowest" />
            <figcaption className="p-2 text-body-small text-on-surface-variant">
              {fa ? 'عکس فقط روی دستگاه شما می‌ماند و برای مرجع نمایش داده می‌شود؛ خطوط حل را پایین بنویسید تا بررسی عددی شوند.' : 'The photo stays on your device for reference; type the lines below so they can be checked numerically.'}
            </figcaption>
          </figure>
        )}

        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'خطوط حل شما (هر خط یک گام)' : 'Your solution lines (one step per line)'}</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} dir="ltr" className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 font-mono text-body-medium text-on-surface outline-none focus:border-primary" />
        </label>

        <label className="block">
          <span className="mb-1 block text-label-medium text-on-surface-variant">{fa ? 'جواب مورد انتظار (اختیاری)' : 'Expected final answer (optional)'}</span>
          <input value={expected} onChange={(e) => setExpected(e.target.value)} dir="ltr" inputMode="decimal" className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 font-mono text-on-surface outline-none focus:border-primary" />
        </label>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-medium text-on-surface-variant">{fa ? 'دفتر خط‌خطی (برای فکر کردن)' : 'Scratch pad (for thinking)'}</span>
            <button
              type="button"
              onClick={() => {
                const canvas = canvasRef.current;
                canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
              }}
              className="flex items-center gap-1 text-label-medium text-on-surface-variant"
            >
              <Eraser className="h-4 w-4" aria-hidden="true" />{fa ? 'پاک کردن' : 'Clear'}
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={640}
            height={180}
            className="w-full touch-none rounded-2xl border border-outline-variant bg-surface-container-lowest"
            onPointerDown={(event) => {
              drawing.current = true;
              const ctx = event.currentTarget.getContext('2d');
              const point = canvasPoint(event);
              ctx?.beginPath();
              ctx?.moveTo(point.x, point.y);
            }}
            onPointerMove={(event) => {
              if (!drawing.current) return;
              const ctx = event.currentTarget.getContext('2d');
              if (!ctx) return;
              const point = canvasPoint(event);
              ctx.strokeStyle = '#8AB4FF';
              ctx.lineWidth = 2.5;
              ctx.lineCap = 'round';
              ctx.lineTo(point.x, point.y);
              ctx.stroke();
            }}
            onPointerUp={() => { drawing.current = false; }}
            onPointerLeave={() => { drawing.current = false; }}
            aria-label={fa ? 'دفتر خط‌خطی' : 'Scratch pad'}
          />
        </div>

        <button type="button" onClick={analyze} className="min-h-12 w-full rounded-full brand-gradient font-semibold text-white shadow-glow">
          {fa ? 'بررسی خط‌به‌خط' : 'Check line by line'}
        </button>
      </section>

      {result && (
        <section className="space-y-2" aria-live="polite">
          <h2 className="text-title-medium font-semibold text-on-surface">
            {result.firstErrorIndex === null
              ? fa ? 'همهٔ خطوط سازگارند ✓' : 'All lines are consistent ✓'
              : fa ? `اولین ناسازگاری: خط ${result.firstErrorIndex + 1}` : `First inconsistency: line ${result.firstErrorIndex + 1}`}
          </h2>
          {result.lines.map((line) => (
            <article key={line.index} className={`flex gap-3 rounded-2xl border p-3.5 ${line.status === 'error' ? 'border-error/60 bg-error-container/30' : 'border-outline-variant bg-surface-container'}`}>
              {line.status === 'error'
                ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
                : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />}
              <div className="min-w-0">
                <p className="tnum break-all font-mono text-body-medium text-on-surface" dir="ltr">{line.index + 1}. {line.raw}{line.value !== undefined ? `  →  ${fmt(line.value)}` : ''}</p>
                <p className="mt-1 text-body-small leading-relaxed text-on-surface-variant">{fa ? line.noteFa : line.noteEn}</p>
                {line.issue && (
                  <p className="mt-1 text-label-medium font-semibold text-on-surface">
                    {fa ? 'نوع اشتباه احتمالی: ' : 'Likely issue: '}
                    {line.issue === 'sign-error' ? (fa ? 'خطای علامت' : 'Sign error')
                      : line.issue === 'arithmetic-error' ? (fa ? 'خطای محاسباتی' : 'Arithmetic error')
                      : line.issue === 'not-equivalent' ? (fa ? 'گام غیرهم‌ارز / جملهٔ حذف‌شده' : 'Non-equivalent step / dropped term')
                      : line.issue === 'final-mismatch' ? (fa ? 'ناسازگاری جواب نهایی' : 'Final answer mismatch')
                      : (fa ? 'خطای نوشتار عبارت' : 'Expression syntax error')}
                  </p>
                )}
              </div>
            </article>
          ))}
          {result.finalValue !== undefined && (
            <p className="tnum rounded-xl bg-primary-container/40 p-3 text-body-medium font-semibold text-on-surface" dir="ltr">
              {fa ? 'مقدار نهایی شما' : 'Your final value'}: {fmt(result.finalValue)}
              {result.finalMatches === true ? ' ✓' : result.finalMatches === false ? ' ✗' : ''}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
