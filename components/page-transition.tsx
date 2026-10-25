'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Fade on navigation (220 ms, ease-out).
 *
 * Opacity only on purpose: this wrapper contains the whole page, including
 * fixed UI (the bottom CTA and the math keyboard). A residual `transform` on an
 * ancestor turns `position: fixed` into "fixed to this wrapper", which pushed
 * those elements off the viewport on tall pages. The slide-in effect is kept
 * for cards and list items, which never wrap fixed elements.
 *
 * Implemented in CSS so the animation runtime never enters the first-load
 * bundle; `prefers-reduced-motion` is honoured globally in globals.css.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="anim-page-in">
      {children}
    </div>
  );
}
