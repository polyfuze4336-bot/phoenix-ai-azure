import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import { LanguageProvider } from '@/components/language-provider'
import { PwaRegister } from '@/components/pwa-register'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { TelemetryProvider } from '@/components/telemetry-provider'
import { getSiteUrl } from '@/lib/config/environment'

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Phoenix AI — Burn & Wound Care Assessment Tool',
  description: 'AI-powered clinical decision support for burn and wound care in Malaysia',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    images: ['/og-image.png'],
  },
  metadataBase: getSiteUrl(),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent' as const,
    title: 'Phoenix AI',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B0000',
  viewportFit: 'cover' as const,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Phoenix AI" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          {children}
          <PwaInstallPrompt />
          <PwaRegister />
          <TelemetryProvider />
          <Toaster />
          <ChunkLoadErrorHandler />
        </LanguageProvider>
      </body>
    </html>
  )
}
