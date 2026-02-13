import type { ReactNode } from 'react'

import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { SUPPORTED_LOCALES } from '@/i18n/locale.config'
import { AppProviders } from '@/providers/app-providers'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export const dynamicParams = false

const LocaleLayout = async ({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) => {
  const { locale } = await params
  const messages = await getMessages()
  if (!messages) notFound()

  return (
    <AppProviders messages={messages} locale={locale}>
      {children}
    </AppProviders>
  )
}

export default LocaleLayout
