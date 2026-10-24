'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, LayoutGrid, Search, Settings, Sigma, House } from 'lucide-react';
import { cn, haptic } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

interface Tab {
  href: string;
  key: string;
  icon: typeof House;
  match: (path: string) => boolean;
  center?: boolean;
}

const tabs: Tab[] = [
  { href: '/', key: 'home', icon: House, match: (path: string) => path === '/' },
  { href: '/categories', key: 'categories', icon: LayoutGrid, match: (path: string) => path.startsWith('/categories') },
  { href: '/search', key: 'search', icon: Search, match: (path: string) => path.startsWith('/search'), center: true },
  { href: '/history', key: 'history', icon: History, match: (path: string) => path.startsWith('/history') },
  { href: '/settings', key: 'settings', icon: Settings, match: (path: string) => path.startsWith('/settings') },
];

/**
 * Five-tab M3 navigation bar. 80 px + safe-area, 48×48 minimum targets,
 * and it collapses into a side rail in landscape (see globals.css).
 */
export function BottomNav() {
  const pathname = usePathname() || '/';
  const { t } = useI18n();
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);

  return (
    <nav
      aria-label={t('home')}
      className={cn(
        'bottom-nav fixed inset-x-0 bottom-0 z-nav border-t border-outline-variant bg-surface-container/95',
        'glass-bar flex items-stretch justify-around pb-safe-bottom',
      )}
      style={{ minHeight: 'var(--bottom-nav-height)' }}
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        if (tab.center) {
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              aria-label={t(tab.key)}
              onClick={() => haptic(10, hapticsEnabled)}
              className="relative flex flex-1 flex-col items-center justify-end pb-2 pt-3"
            >
              <span
                className={cn(
                  'flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full shadow-elevation-3 transition-colors',
                  active ? 'bg-primary text-on-primary' : 'bg-primary-container text-on-primary-container',
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
              </span>
              <span
                className={cn(
                  '-mt-2 text-label-small bottom-nav__label',
                  active ? 'font-bold text-on-surface' : 'text-on-surface-variant',
                )}
              >
                {t(tab.key)}
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            onClick={() => haptic(10, hapticsEnabled)}
            className="group flex min-h-touch flex-1 flex-col items-center justify-center gap-1 px-1 py-2"
          >
            <span
              className={cn(
                'flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-200',
                active ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant',
              )}
            >
              <Icon
                className="h-6 w-6"
                strokeWidth={active ? 2.4 : 1.8}
                fill={active ? 'currentColor' : 'none'}
                fillOpacity={active ? 0.16 : 0}
                aria-hidden="true"
              />
            </span>
            <span
              className={cn(
                'text-label-small leading-none bottom-nav__label',
                active ? 'font-bold text-on-surface' : 'text-on-surface-variant',
              )}
            >
              {t(tab.key)}
            </span>
          </Link>
        );
      })}
      <span className="sr-only" aria-hidden="true">
        <Sigma />
      </span>
    </nav>
  );
}
