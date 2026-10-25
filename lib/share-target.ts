const MAX_SHARED_FIELD_LENGTH = 2_000;
const MAX_QUERY_FIELDS = 16;

export interface ShareTargetOptions {
  origin: string;
  basePath: string;
  formulaIds: ReadonlySet<string>;
}

/**
 * Resolve Web Share Target input to an internal route. Only same-origin formula
 * links are opened directly; shared external URLs are treated as search text,
 * never as navigation targets. This prevents the share endpoint becoming an
 * open redirect and keeps shared content on-device.
 */
export function resolveShareTarget(params: URLSearchParams, options: ShareTargetOptions): string {
  const bounded = (value: string | null) => (value ?? '').slice(0, MAX_SHARED_FIELD_LENGTH).trim();
  const title = bounded(params.get('title'));
  const text = bounded(params.get('text'));
  const sharedUrl = bounded(params.get('url'));
  const origin = new URL(options.origin).origin;

  const candidates = [sharedUrl, ...(text.match(/https?:\/\/[^\s<>"']+/gi) ?? [])];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate.replace(/[),.;!?]+$/, ''), origin);
      if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.origin !== origin || url.username || url.password) continue;
      const basePath = options.basePath.replace(/\/$/, '');
      const underBasePath = !basePath || url.pathname === basePath || url.pathname.startsWith(`${basePath}/`);
      if (!underBasePath) continue;
      const path = basePath ? url.pathname.slice(basePath.length) || '/' : url.pathname;
      const match = path.match(/^\/formula\/([a-z][a-z0-9_]{1,79})\/?$/);
      if (!match || !options.formulaIds.has(match[1])) continue;

      const query = new URLSearchParams();
      for (const [key, value] of url.searchParams) {
        if (query.size >= MAX_QUERY_FIELDS) break;
        if (!/^[A-Za-z][A-Za-z0-9_]{0,49}$/.test(key) || value.length > 100) continue;
        query.set(key, value);
      }
      const suffix = query.size ? `?${query.toString()}` : '';
      return `/formula/${match[1]}/${suffix}`;
    } catch {
      // Malformed user-provided URLs fall through to the safe search route.
    }
  }

  const searchText = (text && !/^https?:\/\/\S+$/i.test(text) ? text : title).trim();
  return searchText ? `/search/?q=${encodeURIComponent(searchText.slice(0, 240))}` : '/search/';
}
