'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll-reveal wrapper (v4.1). Content is server-rendered fully visible;
 * after mount, blocks that start below the fold are "armed" with
 * `.reveal-pending` and released the first time they scroll into view.
 * No-JS and reduced-motion users simply never see a hidden state.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger in ms. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94) return; // already on screen
    setPending(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPending(false);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('reveal', pending && 'reveal-pending', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
