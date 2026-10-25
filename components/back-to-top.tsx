'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { haptic } from '@/lib/utils';

/**
 * Floating back-to-top button (v4.1). Appears after a long scroll; hidden on
 * formula pages, which own their bottom action bar.
 */
export function BackToTop() {
  const pathname = usePathname() || '/';
  const { t } = useI18n();
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 720);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible || pathname.startsWith('/formula')) return null;

  return (
    <button
      type="button"
      aria-label={t('backToTop')}
      onClick={() => {
        haptic(10, hapticsEnabled);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="anim-scale-in glass-bar fixed end-4 z-nav flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant text-on-surface shadow-elevation-3"
      style={{ bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 0.85rem)' }}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
