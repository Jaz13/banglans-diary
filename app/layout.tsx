import type { Metadata, Viewport } from 'next'
import { Inter, Bebas_Neue, Geist_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const bebasNeue = Bebas_Neue({
  variable: '--font-rock',
  weight: '400',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Banglans Diary',
  description: 'The legendary chronicles of the Banglans — Class of 92, Calicut Medical College',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Banglans',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Banglans" />
      </head>
      <body className={`${inter.variable} ${bebasNeue.variable} ${geistMono.variable} antialiased`}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function(err) {
        console.log('SW registration failed:', err);
      });
    });
  }
`}} />
      </body>
    </html>
  )
}
