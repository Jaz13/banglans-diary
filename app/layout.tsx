import type { Metadata } from 'next'
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
  description: 'The legendary chronicles of the Banglans — Class of 99, Calicut Medical College',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${bebasNeue.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
