'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * Set once the first screen has been hydrated, so the initial paint is never
 * faded in. A fade on first load hides the whole page behind `opacity: 0` for
 * ~220 ms, which delays the largest contentful paint by exactly that much.
 */
let hydratedOnce = false;

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
  // Client-side navigations mount a fresh instance and read the flag as `true`,
  // so the fade still runs for every route change after the first load.
  const [animate] = useState(() => hydratedOnce);
  useEffect(() => {
    hydratedOnce = true;
  }, []);

  return (
    <div key={pathname} className={animate ? 'anim-page-in' : undefined}>
      {children}
    </div>
  );
}
