export const dynamic = 'force-static';

import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/base-path';
import { FORMULAS } from '@/lib/formulas';

const SITE = 'https://pillow1243.github.io';

/**
 * Static sitemap: every prerendered route, including all formula pages.
 * `trailingSlash` is on, so entries carry the trailing slash GitHub Pages needs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/categories/',
    '/search/',
    '/history/',
    '/settings/',
    '/tools/',
    '/tools/units/',
    '/tools/chemistry/',
    '/tools/graph/',
    '/tools/matrix/',
    '/tools/statistics/',
    '/tools/assistant/',
    '/practice/',
    '/learn/',
    '/workspace/',
    '/periodic-table/',
    '/constants/',
  ];

  return [
    ...routes.map((route) => ({
      url: `${SITE}${BASE_PATH}${route || '/'}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? ('weekly' as const) : ('monthly' as const),
      priority: route === '' ? 1 : 0.6,
    })),
    ...FORMULAS.map((formula) => ({
      url: `${SITE}${BASE_PATH}/formula/${formula.id}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
