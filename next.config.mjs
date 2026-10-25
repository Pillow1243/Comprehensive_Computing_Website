/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * GitHub Pages configuration.
 *
 * The repository name is hard-coded on purpose (requirement B01): deriving it
 * from `github.repository` silently breaks forks, previews and local builds.
 */
const isProd = process.env.NODE_ENV === 'production';
const REPO = 'Comprehensive_Computing_Website';
const basePath = isProd ? `/${REPO}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only — `next export` is deprecated and must not be used (B02).
  output: 'export',
  basePath,
  assetPrefix: isProd ? `${basePath}/` : '',
  trailingSlash: true, // B03 — Deep links must end in `/` on Pages.
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default nextConfig;
