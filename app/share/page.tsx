'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FORMULAS } from '@/lib/formulas';
import { BASE_PATH } from '@/lib/base-path';
import { resolveShareTarget } from '@/lib/share-target';

/** Web Share Target entry point declared in public/manifest.webmanifest. */
export default function SharePage() {
  const router = useRouter();

  useEffect(() => {
    const destination = resolveShareTarget(new URLSearchParams(window.location.search), {
      origin: window.location.origin,
      basePath: BASE_PATH,
      formulaIds: new Set(FORMULAS.map(({ id }) => id)),
    });
    router.replace(destination);
  }, [router]);

  return (
    <section className="mx-4 mt-8 rounded-3xl border border-outline-variant bg-surface-container p-5 text-center" role="status" aria-live="polite">
      <h1 className="text-title-large font-semibold text-on-surface">در حال بازکردن محتوای اشتراک‌گذاری‌شده</h1>
      <p className="mt-2 text-body-medium text-on-surface-variant">Opening shared content…</p>
    </section>
  );
}
