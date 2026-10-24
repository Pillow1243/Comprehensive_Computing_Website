/**
 * GitHub Pages serves the app from `/<repo>/`. Next injects the basePath into
 * `NEXT_PUBLIC_BASE_PATH` at build time (see next.config.mjs).
 * Every runtime URL that is not handled by next/link must go through here.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

export const withBasePath = (path: string): string => {
  if (!path) return BASE_PATH || '/';
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
};

/** Strip the basePath so route comparisons work in the browser. */
export const stripBasePath = (pathname: string): string => {
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length) || '/';
  }
  return pathname || '/';
};
