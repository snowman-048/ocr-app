import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locale.config'
import { ELocale } from './locale.enum'
import { ECookieKey } from '@/enums/cookie-key'

const isSupported = (value?: string): value is ELocale =>
  !!value && SUPPORTED_LOCALES.includes(value as ELocale)

export default getRequestConfig(async ({ requestLocale }) => {
  // Priority: URL segment (from middleware) > cookie > default
  const urlLocale = await requestLocale

  const store = await cookies()
  const cookieLocale = store.get(ECookieKey.LOCALE)?.value

  const locale = isSupported(urlLocale)
    ? urlLocale
    : isSupported(cookieLocale)
      ? cookieLocale
      : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
