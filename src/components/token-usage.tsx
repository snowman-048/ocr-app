'use client'

import { useTranslations } from 'next-intl'

import { TOcrAiConsumption } from '@/lib/ocr/types'

type TProps = {
  consumption?: TOcrAiConsumption
}

const TokenUsage = ({ consumption }: TProps) => {
  const t = useTranslations('tokens')

  if (!consumption || !consumption.total) return null

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-medium">{t('usage')}:</span>
      <span>
        {t('input')}: {consumption.input.toLocaleString()}
      </span>
      <span>
        {t('output')}: {consumption.output.toLocaleString()}
      </span>
      {consumption.cached > 0 && (
        <span>
          {t('cached')}: {consumption.cached.toLocaleString()}
        </span>
      )}
      <span className="font-medium">
        {t('total')}: {consumption.total.toLocaleString()}
      </span>
    </div>
  )
}

export { TokenUsage }
