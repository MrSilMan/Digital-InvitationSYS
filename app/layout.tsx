import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';

import { DEFAULT_LOCALE, t } from '@/i18n';
import { REQUEST_ID_HEADER } from '@/lib/request-id';

import './globals.css';

export const metadata: Metadata = {
  title: { default: t.app.name, template: `%s · ${t.app.name}` },
  description: t.app.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7fafc',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Reading request headers renders every page per request, which the per-request CSP nonce
  // requires. The request ID lets the browser SDK correlate client errors with server logs.
  const requestId = (await headers()).get(REQUEST_ID_HEADER) ?? undefined;

  return (
    <html lang={DEFAULT_LOCALE} data-request-id={requestId}>
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
