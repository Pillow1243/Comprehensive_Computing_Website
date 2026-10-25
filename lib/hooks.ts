'use client';

import { useEffect, useRef, useState } from 'react';

/** True after the first client render — guards persisted/SSR-sensitive UI. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener?.('change', listener);
    return () => media.removeEventListener?.('change', listener);
  }, [query]);
  return matches;
}

export interface VisualViewportState {
  height: number;
  width: number;
  offsetTop: number;
  keyboardHeight: number;
  keyboardOpen: boolean;
}

/**
 * VisualViewport API helper (requirement 2.5.1).
 *
 * Android Chrome and iOS Safari do not resize `window.innerHeight` reliably when
 * the on-screen keyboard appears. We measure the real viewport, publish
 * `--keyboard-height` for layout, and scroll the focused field into view.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    height: 0,
    width: 0,
    offsetTop: 0,
    keyboardHeight: 0,
    keyboardOpen: false,
  });
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const apply = () => {
      const height = viewport.height;
      const width = viewport.width;
      const offsetTop = viewport.offsetTop;
      const keyboardHeight = Math.max(0, window.innerHeight - height - offsetTop);
      const keyboardOpen = keyboardHeight > 120;
      document.documentElement.style.setProperty('--keyboard-height', `${Math.round(keyboardHeight)}px`);
      document.documentElement.style.setProperty('--visual-height', `${Math.round(height)}px`);
      setState({ height, width, offsetTop, keyboardHeight, keyboardOpen });
      if (keyboardOpen) {
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          requestAnimationFrame(() => {
            active.scrollIntoView({ block: 'center', behavior: 'smooth' });
          });
        }
      }
    };

    const schedule = () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(apply);
    };

    apply();
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);
    return () => {
      viewport.removeEventListener('resize', schedule);
      viewport.removeEventListener('scroll', schedule);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return state;
}

/** Track window scroll position (for collapsing headers). */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

/** Interval that pauses when the tab is hidden (used by update checks). */
export function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
