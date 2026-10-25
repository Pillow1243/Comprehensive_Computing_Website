'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  CornerDownLeft,
  Dices,
  Flame,
  Keyboard,
  MessagesSquare,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { CategoryIcon } from '@/components/icons';
import { ToolIcon } from '@/components/tool-icon';
import { FORMULAS, categoryMeta, formulaName, getFormula, normalizeText } from '@/lib/formulas';
import { smartSearch, suggestCorrections, type SmartReason } from '@/lib/smart-search';
import { TOOLS } from '@/lib/tools';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { cn, haptic } from '@/lib/utils';

export const OPEN_PALETTE_EVENT = 'se:open-palette';
export const OPEN_SHORTCUTS_EVENT = 'se:open-shortcuts';

type PaletteWindow = Window & { __sePaletteReady?: boolean };

const REASON_KEYS: Record<SmartReason, string> = {
  exact: 'reasonExact',
  name: 'reasonName',
  tag: 'reasonTag',
  synonym: 'reasonSynonym',
  fuzzy: 'reasonFuzzy',
  category: 'reasonCategory',
  id: 'reasonId',
};

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  badge?: string;
  icon: ReactNode;
  href?: string;
  run?: () => void;
}

interface PaletteGroup {
  title: string;
  items: PaletteItem[];
}

const iconBubble = (children: ReactNode, className?: string) => (
  <span
    className={cn(
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant',
      className,
    )}
    aria-hidden="true"
  >
    {children}
  </span>
);

/**
 * Ctrl/⌘+K quick-jump palette (v4.1): smart formula search with match
 * reasons, tools and one-key actions — fully offline, keyboard-first.
 * Mounted lazily by the app shell; sets `window.__sePaletteReady` so the
 * top-bar search button can upgrade from a link into a palette trigger.
 */
export function CommandPalette() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const recentIds = useAppStore((state) => state.recent);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    const win = window as PaletteWindow;
    win.__sePaletteReady = true;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      win.__sePaletteReady = false;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement;
    setQuery('');
    setActiveId(null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      if (restoreFocusRef.current instanceof HTMLElement) restoreFocusRef.current.focus();
    };
  }, [open]);

  const groups = useMemo<PaletteGroup[]>(() => {
    const trimmed = query.trim();
    const result: PaletteGroup[] = [];

    const formulaItem = (
      formula: NonNullable<ReturnType<typeof getFormula>>,
      badge?: string,
    ): PaletteItem => {
      const meta = categoryMeta(formula.category_path[0]);
      return {
        id: `formula:${formula.id}`,
        label: formulaName(formula, lang),
        hint: formula.id,
        badge,
        href: `/formula/${formula.id}/`,
        icon: (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br',
              meta.tint,
            )}
            style={{ color: meta.accent }}
            aria-hidden="true"
          >
            <CategoryIcon name={meta.icon} className="h-4.5 w-4.5" />
          </span>
        ),
      };
    };

    if (trimmed) {
      const matches = smartSearch(trimmed, { bookmarks }).slice(0, 8);
      if (matches.length) {
        result.push({
          title: t('formulas'),
          items: matches.map((match) =>
            formulaItem(match.formula, match.reasons[0] ? t(REASON_KEYS[match.reasons[0]]) : undefined),
          ),
        });
      }
    } else {
      const recent = recentIds
        .map((id) => getFormula(id))
        .filter((formula): formula is NonNullable<typeof formula> => Boolean(formula))
        .slice(0, 5);
      if (recent.length) {
        result.push({ title: t('recent'), items: recent.map((formula) => formulaItem(formula)) });
      }
    }

    const needle = normalizeText(trimmed);
    const tools = TOOLS.filter(
      (tool) =>
        !needle ||
        normalizeText(tool.fa).includes(needle) ||
        normalizeText(tool.en).includes(needle) ||
        tool.id.includes(needle),
    ).slice(0, trimmed ? 5 : 4);
    if (tools.length) {
      result.push({
        title: t('tools'),
        items: tools.map((tool) => ({
          id: `tool:${tool.id}`,
          label: lang === 'en' ? tool.en : tool.fa,
          hint: tool.href.replaceAll('/', ' ').trim(),
          href: tool.href,
          icon: (
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br',
                tool.tint,
              )}
              style={{ color: tool.accent }}
              aria-hidden="true"
            >
              <ToolIcon name={tool.icon} className="h-4.5 w-4.5" />
            </span>
          ),
        })),
      });
    }

    const actions: PaletteItem[] = [
      {
        id: 'action:daily',
        label: t('dailyChallenge'),
        hint: t('practiceTitle'),
        href: '/practice/',
        icon: iconBubble(<Flame className="h-4.5 w-4.5" />),
      },
      {
        id: 'action:assistant',
        label: t('assistantTool'),
        hint: t('assistantTitle'),
        href: '/tools/assistant/',
        icon: iconBubble(<MessagesSquare className="h-4.5 w-4.5" />),
      },
      {
        id: 'action:random',
        label: t('surpriseMe'),
        href: `/formula/${FORMULAS[Math.floor(Math.random() * FORMULAS.length)].id}/`,
        icon: iconBubble(<Dices className="h-4.5 w-4.5" />),
      },
      {
        id: 'action:settings',
        label: t('settings'),
        href: '/settings/',
        icon: iconBubble(<Settings className="h-4.5 w-4.5" />),
      },
      {
        id: 'action:shortcuts',
        label: t('keyboardShortcuts'),
        icon: iconBubble(<Keyboard className="h-4.5 w-4.5" />),
        run: () => window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_EVENT)),
      },
    ].filter(
      (action) => !needle || normalizeText(action.label).includes(needle),
    );
    if (actions.length) result.push({ title: t('actionsLabel'), items: actions });

    return result;
  }, [query, lang, recentIds, bookmarks, t]);

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const active = flat.find((item) => item.id === activeId) ?? flat[0] ?? null;
  const suggestions = useMemo(
    () => (query.trim() && flat.length === 0 ? suggestCorrections(query) : []),
    [query, flat.length],
  );

  useEffect(() => {
    setActiveId(flat[0]?.id ?? null);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return;
    listRef.current
      ?.querySelector(`[data-palette-item="${active.id}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const close = () => setOpen(false);

  const activate = (item: PaletteItem) => {
    haptic(10, hapticsEnabled);
    close();
    if (item.href) router.push(item.href);
    else item.run?.();
  };

  const move = (delta: number) => {
    if (!flat.length || !active) return;
    const index = flat.findIndex((item) => item.id === active.id);
    const next = flat[(index + delta + flat.length) % flat.length];
    setActiveId(next.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('commandPalette')}
      className="fixed inset-0 z-modal px-3"
    >
      <button
        type="button"
        aria-label={t('shortcutClose')}
        onClick={close}
        className="anim-fade absolute inset-0 h-full w-full cursor-default bg-scrim/70 backdrop-blur-sm"
      />
      <div className="anim-scale-in glass-card relative mx-auto mt-[10dvh] w-full max-w-xl overflow-hidden rounded-3xl shadow-elevation-5">
        <div className="flex items-center gap-2 border-b border-outline-variant px-4">
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                move(1);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                move(-1);
              } else if (event.key === 'Enter' && active) {
                event.preventDefault();
                activate(active);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                close();
              }
            }}
            placeholder={t('commandPaletteHint')}
            aria-label={t('commandPalette')}
            role="combobox"
            aria-expanded="true"
            aria-controls="se-palette-list"
            aria-activedescendant={active ? `se-palette-${active.id}` : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-14 min-w-0 flex-1 bg-transparent text-body-large text-on-surface outline-none placeholder:text-on-surface-variant/70"
          />
          <button
            type="button"
            onClick={close}
            aria-label={t('shortcutClose')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/10"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div
          ref={listRef}
          id="se-palette-list"
          role="listbox"
          aria-label={t('commandPalette')}
          className="max-h-[52dvh] overflow-y-auto p-2"
        >
          {groups.map((group) => (
            <div key={group.title} className="mb-1">
              <p className="px-2.5 pb-1 pt-2 text-label-small font-semibold uppercase tracking-wide text-on-surface-variant">
                {group.title}
              </p>
              {group.items.map((item) => {
                const isActive = active?.id === item.id;
                return (
                  <button
                    key={item.id}
                    id={`se-palette-${item.id}`}
                    data-palette-item={item.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveId(item.id)}
                    onClick={() => activate(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-start transition-colors',
                      isActive ? 'bg-primary-container/70' : 'hover:bg-surface-container-high',
                    )}
                  >
                    {item.icon}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-medium font-medium text-on-surface">
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="block truncate text-label-small text-on-surface-variant" dir="auto">
                          {item.hint}
                        </span>
                      )}
                    </span>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-tertiary-container px-2 py-0.5 text-label-small text-on-tertiary-container">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <CornerDownLeft
                        className="h-4 w-4 shrink-0 text-on-primary-container rtl:-scale-x-100"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {flat.length === 0 && (
            <div className="px-3 py-6 text-center">
              <p className="text-body-medium text-on-surface-variant">{t('searchEmptyTitle')}</p>
              {suggestions.length > 0 && (
                <>
                  <p className="mt-3 text-label-large text-on-surface">{t('didYouMean')}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setQuery(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-1.5 text-label-large text-primary"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-outline-variant px-4 py-2.5 text-label-small text-on-surface-variant">
          <span className="flex items-center gap-1">
            <kbd className="key-cap">↑</kbd>
            <kbd className="key-cap">↓</kbd>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="key-cap">Enter</kbd>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="key-cap">Esc</kbd>
          </span>
          <span className="ms-auto hidden items-center gap-1.5 sm:flex">
            {t('smartSearchHint')}
          </span>
        </div>
      </div>
    </div>
  );
}
