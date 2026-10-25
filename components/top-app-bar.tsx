'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Settings, Sigma, Wrench } from 'lucide-react';
import { cn, haptic } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

const titles: Record<string, string> = {
  '/categories': 'categories',
  '/search': 'search',
  '/history': 'history',
  '/settings': 'settings',
  '/tools': 'tools',
  '/tools/units': 'unitConverter',
  '/tools/chemistry': 'molarMass',
  '/tools/graph': 'graphTool',
  '/tools/matrix': 'matrixTool',
  '/tools/statistics': 'statsTool',
  '/tools/assistant': 'assistantTool',
  '/practice': 'practice',
  '/learn': 'learn',
  '/workspace': 'workspace',
  '/periodic-table': 'periodicTable',
  '/constants': 'constantsRef',
};

/**
 * Collapsible M3 top app bar: 64 px at rest, 56 px once scrolled, with a
 * blurred surface when content slides underneath.
 */
export function TopAppBar() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { t } = useI18n();
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHome = pathname === '/';
  const titleKey = titles[pathname];
  const title = titleKey ? t(titleKey) : t('appName');

  const goBack = () => {
    haptic(10, hapticsEnabled);
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-nav safe-top transition-shadow duration-200',
        scrolled ? 'shadow-elevation-1' : '',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1 px-2 transition-all duration-200 ease-emphasized sm:px-4',
          scrolled ? 'h-14 border-b border-outline-variant' : 'h-16',
          scrolled ? 'glass-bar' : 'bg-surface',
        )}
      >
        {isHome ? (
          <>
            <Link
              href="/"
              className="flex min-h-touch items-center gap-2 rounded-full px-2"
              aria-label={t('appName')}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Sigma className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="text-title-medium font-semibold tracking-tight text-on-surface">
                Solve<span className="text-primary">Everything</span>
              </span>
            </Link>
            <div className="flex-1" />
            <Link
              href="/tools"
              aria-label={t('tools')}
              className="state-layer flex h-12 w-12 items-center justify-center rounded-full text-on-surface-variant"
            >
              <Wrench className="h-6 w-6" aria-hidden="true" />
            </Link>
            <Link
              href="/search"
              aria-label={t('search')}
              onClick={(event) => {
                // Progressive enhancement: once the lazy command palette has
                // mounted, the search button opens it instead of navigating.
                if ((window as Window & { __sePaletteReady?: boolean }).__sePaletteReady) {
                  event.preventDefault();
                  window.dispatchEvent(new CustomEvent('se:open-palette'));
                }
              }}
              className="state-layer flex h-12 w-12 items-center justify-center rounded-full text-on-surface-variant"
            >
              <Search className="h-6 w-6" aria-hidden="true" />
            </Link>
            <Link
              href="/settings"
              aria-label={t('settings')}
              className="state-layer flex h-12 w-12 items-center justify-center rounded-full text-on-surface-variant"
            >
              <Settings className="h-6 w-6" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={goBack}
              aria-label={t('back')}
              className="state-layer flex h-12 w-12 items-center justify-center rounded-full text-on-surface"
            >
              <ArrowLeft className="h-6 w-6 rtl:rotate-180" aria-hidden="true" />
            </button>
            <h1 className="flex-1 truncate pe-2 text-title-large text-on-surface">{title}</h1>
            <Link
              href="/tools"
              aria-label={t('tools')}
              className="state-layer flex h-12 w-12 items-center justify-center rounded-full text-on-surface-variant"
            >
              <Wrench className="h-6 w-6" aria-hidden="true" />
            </Link>
            <Link
              href="/search"
              aria-label={t('search')}
              onClick={(event) => {
                // Progressive enhancement: once the lazy command palette has
                // mounted, the search button opens it instead of navigating.
                if ((window as Window & { __sePaletteReady?: boolean }).__sePaletteReady) {
                  event.preventDefault();
                  window.dispatchEvent(new CustomEvent('se:open-palette'));
                }
              }}
              className="state-layer flex h-12 w-12 items-center justify-center rounded-full text-on-surface-variant"
            >
              <Search className="h-6 w-6" aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
