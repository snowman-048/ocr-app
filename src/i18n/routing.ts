import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locale.config'

const routing = {
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // This makes locale an optional path segment for default value
  // localePrefix: 'as-needed' as const,
}

export { routing }
