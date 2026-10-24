const isProd = process.env.NODE_ENV === 'production';
const repoName = 'Comprehensive_Computing_Website';
const basePath = isProd ? `/${repoName}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  ...(isProd ? {
    basePath,
    assetPrefix: `${basePath}/`,
  } : {}),
  images: {unoptimized: true},
  trailingSlash: true,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
