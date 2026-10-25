export const dynamic = 'force-static';

import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/base-path';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `https://pillow1243.github.io${BASE_PATH}/sitemap.xml`,
  };
}
