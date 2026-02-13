import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter } from 'next/font/google'

import { DEFAULT_LOCALE } from '@/i18n/locale.config'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Journal OCR App',
}

const RootLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) => {
  const { locale } = await params

  return (
    <html lang={locale || DEFAULT_LOCALE} suppressHydrationWarning className={inter.variable}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}

export default RootLayout
