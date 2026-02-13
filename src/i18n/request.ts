import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'


import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locale.config'
import { ELocale } from './locale.enum'
import { ECookieKey } from '@/enums/cookie-key'

export default getRequestConfig(async () => {
  const store = await cookies()
  let locale = store.get(ECookieKey.LOCALE)?.value

  if (!locale || !SUPPORTED_LOCALES.includes(locale as ELocale)) {
    locale = DEFAULT_LOCALE
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
