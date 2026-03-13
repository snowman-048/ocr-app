'use client'

import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

type TStep = {
  id: string
  labelKey: string
}

type TProps = {
  steps: TStep[]
  currentStepId: string
}

const StepProgress = ({ steps, currentStepId }: TProps) => {
  const t = useTranslations()

  const currentIndex = steps.findIndex((s) => s.id === currentStepId)

  return (
    <nav aria-label={t('steps.upload')} className="w-full">
      <ol className="flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStepId
          const isCompleted = index < currentIndex
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.id}
              className={cn('flex items-center gap-2', !isLast && 'flex-1')}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={cn(
                    'flex items-center justify-center w-7 h-7 sm:w-6 sm:h-6 rounded-full text-xs font-medium shrink-0',
                    isActive && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-primary/20 text-primary',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'text-xs truncate hidden sm:block',
                    isActive && 'font-medium text-foreground',
                    !isActive && 'text-muted-foreground',
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 min-w-2 sm:min-w-4',
                    isCompleted ? 'bg-primary/40' : 'bg-border',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
      <div role="status" aria-live="polite" className="sr-only">
        {t(steps[currentIndex]?.labelKey)} - {currentIndex + 1} / {steps.length}
      </div>
    </nav>
  )
}

export { StepProgress }
