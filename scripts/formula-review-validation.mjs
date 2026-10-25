export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isSafeCitation(reference) {
  if (!reference || typeof reference !== 'object' || typeof reference.title !== 'string' || !reference.title.trim()) return false;
  try {
    const url = new URL(reference.url);
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) return false;
  } catch {
    return false;
  }
  return reference.accessed_at === undefined || isIsoDate(reference.accessed_at);
}
