'use client'

import { PropsWithChildren, useMemo } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { ModalProvider } from './modal-provider'

type TProps = PropsWithChildren & {
  messages: Record<string, any>
  locale: string
}

const AppProviders = ({ children, messages, locale }: TProps) => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false },
        },
      }),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TooltipProvider>
            <ModalProvider>
              <Toaster position="top-right" />
              {children}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </ModalProvider>
          </TooltipProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export { AppProviders }
