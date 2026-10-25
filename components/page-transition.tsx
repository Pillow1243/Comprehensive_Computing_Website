'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Fade + 8 px slide on navigation (300 ms, ease-out).
 * Implemented in CSS so the animation runtime never enters the first-load
 * bundle; `prefers-reduced-motion` is honoured globally in globals.css.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="anim-fade-up">
      {children}
    </div>
  );
}
