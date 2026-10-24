import type {Metadata, Viewport} from 'next';
import './globals.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'SolveEverything — Solve equations, step by step',
  description: 'A client-first bilingual scientific formula solver for mathematics, physics, chemistry, engineering and finance.',
  applicationName: 'SolveEverything',
  manifest: `${basePath}/app/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/app/icon.svg`,
    apple: `${basePath}/app/icon.svg`,
  },
  openGraph: {
    title: 'SolveEverything',
    description: 'Solve any equation, step by step. Offline-ready and open source.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#7c5cff',
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'" />
      </head>
      <body>{children}</body>
    </html>
  );
}
