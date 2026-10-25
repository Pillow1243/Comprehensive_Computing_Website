'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ClipboardPaste,
  Delete,
  Mic,
  MicOff,
  Sigma,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, haptic } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

interface Key {
  label: string;
  insert?: string;
  action?: 'backspace' | 'clear' | 'done' | 'paste' | 'voice';
  wide?: boolean;
  aria?: string;
}

const numericKeys: Key[] = [
  { label: '7', insert: '7' },
  { label: '8', insert: '8' },
  { label: '9', insert: '9' },
  { label: '÷', insert: '/', aria: 'تقسیم' },
  { label: '4', insert: '4' },
  { label: '5', insert: '5' },
  { label: '6', insert: '6' },
  { label: '×', insert: '*', aria: 'ضرب' },
  { label: '1', insert: '1' },
  { label: '2', insert: '2' },
  { label: '3', insert: '3' },
  { label: '−', insert: '-', aria: 'تفریق' },
  { label: '0', insert: '0' },
  { label: '.', insert: '.' },
  { label: ',', insert: ',' },
  { label: '+', insert: '+', aria: 'جمع' },
  { label: 'π', insert: 'pi', aria: 'پی' },
  { label: 'e', insert: 'e' },
  { label: '( )', insert: '()' },
  { label: '=', insert: '=', aria: 'مساوی' },
];

const functionKeys: Key[] = [
  { label: '√', insert: 'sqrt(', aria: 'ریشه دوم' },
  { label: '∛', insert: 'cbrt(', aria: 'ریشه سوم' },
  { label: 'x²', insert: '^2', aria: 'توان دو' },
  { label: 'xⁿ', insert: '^', aria: 'توان' },
  { label: '½', insert: '1/2', aria: 'یک دوم' },
  { label: '|x|', insert: 'abs(', aria: 'قدر مطلق' },
  { label: 'sin', insert: 'sin(', aria: 'سینوس' },
  { label: 'cos', insert: 'cos(', aria: 'کسینوس' },
  { label: 'tan', insert: 'tan(', aria: 'تانژانت' },
  { label: 'log', insert: 'log(', aria: 'لگاریتم' },
  { label: 'ln', insert: 'ln(', aria: 'لگاریتم طبیعی' },
  { label: 'x!', insert: '!', aria: 'فاکتوریل' },
  { label: '∑', insert: 'sum(', aria: 'سیگما' },
  { label: '∏', insert: 'prod(', aria: 'حاصل‌ضرب' },
  { label: '≤', insert: '<=', aria: 'کوچک‌تر یا مساوی' },
  { label: '≥', insert: '>=', aria: 'بزرگ‌تر یا مساوی' },
  { label: '≠', insert: '!=', aria: 'نامساوی' },
  { label: '∞', insert: 'Infinity', aria: 'بی‌نهایت' },
  { label: 'x', insert: 'x', aria: 'متغیر x' },
  { label: 'y', insert: 'y', aria: 'متغیر y' },
];

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

const spokenMap: Array<[RegExp, string]> = [
  [/به علاوه|جمع|\bplus\b/gi, '+'],
  [/منهای|تفریق|\bminus\b/gi, '-'],
  [/ضرب در|ضرب|\btimes\b|\bmultiplied by\b/gi, '*'],
  [/تقسیم بر|تقسیم|\bdivided by\b/gi, '/'],
  [/مساوی|\bequals?\b/gi, '='],
  [/جذر|ریشه دوم|square root/gi, 'sqrt('],
  [/پی|\bpi\b/gi, 'pi'],
  [/سینوس|\bsin\b/gi, 'sin('],
  [/کسینوس|\bcos\b/gi, 'cos('],
  [/تانژانت|\btan\b/gi, 'tan('],
  [/لگاریتم طبیعی|\bln\b/gi, 'ln('],
  [/لگاریتم|\blog\b/gi, 'log('],
  [/توان|\bpower\b/gi, '^'],
  [/یک|۱/gi, '1'],
  [/دو|۲/gi, '2'],
  [/سه|۳/gi, '3'],
  [/چهار|۴/gi, '4'],
  [/پنج|۵/gi, '5'],
  [/شش|۶/gi, '6'],
  [/هفت|۷/gi, '7'],
  [/هشت|۸/gi, '8'],
  [/نه|۹/gi, '9'],
  [/صفر|۰/gi, '0'],
];

const sanitizePasted = (raw: string) =>
  raw
    .replace(/\$\$?/g, '')
    .replace(/\\left|\\right|\\mathrm|\\text/g, '')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pi/g, 'pi')
    .replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/[{}\\]/g, '')
    .trim();

export interface MathKeyboardProps {
  open: boolean;
  onClose: () => void;
  onInsert: (token: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onDone: () => void;
  activeLabel?: string;
}

/**
 * Dedicated math keyboard (requirement 2.5.2).
 * Sits above the safe area, hides the system keyboard via `inputmode="none"`
 * on the paired input, and inserts at the caret position.
 */
export function MathKeyboard({
  open,
  onClose,
  onInsert,
  onBackspace,
  onClear,
  onDone,
  activeLabel,
}: MathKeyboardProps) {
  const { t, lang } = useI18n();
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const [tab, setTab] = useState<'numbers' | 'functions'>('numbers');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null);

  const press = useCallback(
    (key: Key) => {
      haptic(8, hapticsEnabled);
      switch (key.action) {
        case 'backspace':
          onBackspace();
          return;
        case 'clear':
          onClear();
          return;
        case 'done':
          onDone();
          return;
        case 'paste':
          void (async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (!text.trim()) return;
              onInsert(sanitizePasted(text));
              toast.success(t('pasted'));
            } catch {
              toast.error(t('paste'));
            }
          })();
          return;
        case 'voice':
          return;
        default:
          if (key.insert) onInsert(key.insert);
      }
    },
    [hapticsEnabled, onBackspace, onClear, onDone, onInsert, t],
  );

  const toggleVoice = useCallback(() => {
    if (listening) {
      recognition?.stop();
      setListening(false);
      return;
    }
    const Constructor = (
      window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }
    ).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!Constructor) {
      toast.message(t('keyboardHint'));
      return;
    }
    const instance = new Constructor();
    instance.lang = lang === 'fa' ? 'fa-IR' : lang === 'ar' ? 'ar-SA' : 'en-US';
    instance.interimResults = false;
    instance.continuous = false;
    instance.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      let normalized = transcript;
      for (const [pattern, replacement] of spokenMap) normalized = normalized.replace(pattern, replacement);
      if (normalized.trim()) onInsert(normalized.replace(/\s+/g, ''));
    };
    instance.onerror = () => setListening(false);
    instance.onend = () => setListening(false);
    instance.start();
    setRecognition(instance);
    setListening(true);
  }, [lang, listening, onInsert, recognition, t]);

  useEffect(() => {
    if (!open) {
      recognition?.stop();
      setListening(false);
    }
  }, [open, recognition]);

  const keys = tab === 'numbers' ? numericKeys : functionKeys;

  // Mounted only on the client: the sheet is portalled to <body> so that no
  // ancestor transform, filter or overflow can re-anchor or clip it.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setPortalTarget(document.body), []);

  const sheet =
    open && portalTarget
      ? createPortal(
          <>
            <section
              aria-label={t('mathKeyboard')}
              className={cn(
                'anim-sheet-in',
                // Capped to the viewport so the keys can never fall off-screen on
                // short devices; the grid scrolls instead.
                'fixed inset-x-0 bottom-0 z-[60] max-h-[78dvh] overflow-y-auto overscroll-contain',
                'border-t border-outline-variant bg-surface-container-high shadow-elevation-4 safe-bottom',
              )}
            >
              <div className="mx-auto w-full max-w-2xl px-2 pb-2 pt-1">
                <div className="flex items-center gap-1">
                  <span className="flex h-9 items-center gap-1.5 rounded-full px-2 text-label-medium text-on-surface-variant">
                    <Sigma className="h-4 w-4" aria-hidden="true" />
                    <span className="max-w-32 truncate">{activeLabel ?? t('mathKeyboard')}</span>
                  </span>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => press({ label: '', action: 'paste' })}
                    aria-label={t('paste')}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant active:bg-on-surface/10"
                  >
                    <ClipboardPaste className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleVoice}
                    aria-label={t('insert')}
                    aria-pressed={listening}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      listening ? 'bg-error text-on-error' : 'text-on-surface-variant active:bg-on-surface/10',
                    )}
                  >
                    {listening ? (
                      <MicOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Mic className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => press({ label: '', action: 'clear' })}
                    aria-label={t('clearSearch')}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant active:bg-on-surface/10"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('hideKeyboard')}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant active:bg-on-surface/10"
                  >
                    <ChevronDown className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-1.5 flex gap-1 rounded-full bg-surface-container p-0.5" role="tablist">
                  {(['numbers', 'functions'] as const).map((key) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={tab === key}
                      onClick={() => {
                        haptic(8, hapticsEnabled);
                        setTab(key);
                      }}
                      className={cn(
                        'h-9 flex-1 rounded-full text-label-medium transition-colors',
                        tab === key ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant',
                      )}
                    >
                      {key === 'numbers' ? '۱۲۳' : 'ƒ(x)'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {keys.map((key) => (
                    <button
                      key={`${key.label}-${key.insert ?? key.action}`}
                      type="button"
                      onClick={() => press(key)}
                      aria-label={key.aria ?? key.label}
                      className={cn(
                        'tap-none flex h-12 items-center justify-center rounded-lg bg-surface-container-highest',
                        'font-mono text-body-large text-on-surface shadow-elevation-1',
                        'transition-transform active:scale-95',
                      )}
                    >
                      {key.label}
                    </button>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => press({ label: '', action: 'backspace' })}
                    aria-label={t('delete')}
                    className="flex h-12 items-center justify-center gap-1 rounded-lg bg-surface-container-highest text-on-surface shadow-elevation-1 active:scale-95"
                  >
                    <Delete className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsert('%')}
                    className="flex h-12 items-center justify-center rounded-lg bg-surface-container-highest font-mono text-body-large text-on-surface shadow-elevation-1 active:scale-95"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsert('rad')}
                    className="flex h-12 items-center justify-center rounded-lg bg-surface-container-highest text-label-medium text-on-surface shadow-elevation-1 active:scale-95"
                  >
                    °/rad
                  </button>
                  <button
                    type="button"
                    onClick={onDone}
                    className="flex h-12 items-center justify-center rounded-lg bg-primary text-label-large font-semibold text-on-primary shadow-elevation-1 active:scale-95"
                  >
                    {t('done')}
                  </button>
                </div>
              </div>
            </section>
          </>,
          portalTarget,
        )
      : null;

  return sheet;
}
