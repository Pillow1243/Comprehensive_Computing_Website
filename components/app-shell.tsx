'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { TopAppBar } from '@/components/top-app-bar';
import { BottomNav } from '@/components/bottom-nav';
import { OfflineBanner } from '@/components/offline-banner';
import { QuickStartFab } from '@/components/quick-start-fab';
import { PageTransition } from '@/components/page-transition';
import { AppBackdrop } from '@/components/app-backdrop';

/**
 * App chrome: top app bar, bottom navigation, offline banner and the
 * quick-start FAB. Formula pages render their own action bar and CTA.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const { t } = useI18n();
  const isFormula = pathname.startsWith('/formula');
  const showFab = pathname === '/';

  return (
    <div className="relative min-h-dvh">
      <AppBackdrop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        {t('home')}
      </a>
      {!isFormula && <TopAppBar />}
      <OfflineBanner />
      <main
        id="main"
        tabIndex={-1}
        className={cn(
          'app-main relative z-10 mx-auto w-full max-w-2xl focus:outline-none',
          isFormula ? 'pb-0' : 'content-under-nav',
          !isFormula && 'pt-[calc(4rem+var(--safe-top))]',
        )}
      >
        <PageTransition>{children}</PageTransition>
      </main>
      {showFab && <QuickStartFab />}
      <BottomNav />
    </div>
  );
}
