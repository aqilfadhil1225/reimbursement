import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reimbursely',
  description: 'Dashboard pengelolaan pengajuan reimburse untuk tim Anda.',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  applicationName: 'Reimbursely',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Reimbursely',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  other: {
    'msapplication-TileColor': '#1f2937',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#e8722a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
