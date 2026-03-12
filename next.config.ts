import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: true,
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@tanstack/react-query'],
    typedRoutes: false,
  },
}

export default withNextIntl(nextConfig)
