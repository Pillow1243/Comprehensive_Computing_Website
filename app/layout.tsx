import type { Metadata, Viewport } from 'next';
import './globals.css';
import { fontVariables } from './fonts';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/app-shell';
import { themeBootstrapScript } from '@/lib/theme';
import { BASE_PATH } from '@/lib/base-path';
import { CATEGORIES, FORMULAS, totalTests } from '@/lib/formulas';

const siteUrl = 'https://pillow1243.github.io/Comprehensive_Computing_Website';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SolveEverything — حل همه‌چیز گام‌به‌گام',
    template: '%s · SolveEverything',
  },
  description: `SolveEverything یک ابزار محاسبات علمی گام‌به‌گام با ${FORMULAS.length} محاسبه‌گر آزمون‌شده در ریاضی، فیزیک، شیمی، مهندسی و رشته‌های دیگر است. وضعیت بازبینی علمی هر فرمول جداگانه نمایش داده می‌شود.`,
  applicationName: 'SolveEverything',
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${BASE_PATH}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${BASE_PATH}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: `${BASE_PATH}/icons/icon-192.png`, sizes: '192x192' }],
  },
  appleWebApp: {
    capable: true,
    title: 'SolveEverything',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  keywords: ['math solver', 'physics', 'chemistry', 'engineering', ' calculators', 'حل معادله', 'ماشین حساب علمی'],
  authors: [{ name: 'Pillow1243', url: 'https://github.com/Pillow1243' }],
  openGraph: {
    type: 'website',
    title: 'SolveEverything — solve any equation, step by step',
    description:
      `An offline-first scientific calculator with ${FORMULAS.length} tested formula tools across ${CATEGORIES.length} disciplines and ${totalTests} declared test cases. Scientific review status is shown per formula.`,
    url: siteUrl,
    siteName: 'SolveEverything',
    locale: 'fa_IR',
    alternateLocale: ['en_US'],
    images: [{ url: `${BASE_PATH}/icons/icon-512.png`, width: 512, height: 512, alt: 'SolveEverything' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolveEverything',
    description: 'Bilingual, offline-first scientific formula solver.',
    images: [`${BASE_PATH}/icons/icon-512.png`],
  },
  category: 'education',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#FEFBFF' },
  ],
  colorScheme: 'dark light',
};

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href={`${BASE_PATH}/icons/icon-192.png`} />
        <link rel="icon" href={`${BASE_PATH}/icons/icon.svg`} type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${fontVariables} font-sans`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
