import type { Metadata } from 'next'
import { display, displayItalic, body, mono } from '@/lib/design/fonts'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'MK Trip',
  description: 'Le carnet de bord du crew.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MK Trip',
  },
}

export const viewport = {
  themeColor: '#F2EDE3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${display.variable} ${displayItalic.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
