/* eslint-disable react-hooks/static-components */
'use client'

import { JSX, useState } from 'react'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { Button } from './ui/button'

type TManageDataProvidedValues<T> = {
  currentIndex: number
  currentRecords: T
  onDataChange: (savedData: T) => void
}

type TProps<T> = {
  data: T[]
  children: (props: TManageDataProvidedValues<T>) => JSX.Element
  onGoBack: () => void
  onGoNext: (savedData: T[]) => void
  title?: string
  description?: string
  finishLabel?: string
  withFinishArrow?: boolean
}

const ManageDataWrapper = <T,>({
  data,
  children,
  title,
  description,
  onGoBack,
  onGoNext,
  finishLabel,
  withFinishArrow = true,
}: TProps<T>) => {
  const t = useTranslations()

  const [savedData, setSavedData] = useState(data)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [currentRecords, setCurrentRecords] = useState(savedData[currentIndex])

  const canGoBack = currentIndex > 0
  const isLastItem = currentIndex >= savedData.length - 1

  const moveToIndex = (index: number) => {
    if (index < 0) return

    const newData = [...savedData]
    newData[currentIndex] = JSON.parse(JSON.stringify(currentRecords))

    if (index >= newData.length) {
      onGoNext(newData)
      return
    }

    setCurrentRecords(newData[index])
    setCurrentIndex(index)

    setSavedData(newData)
  }

  const Actions = ({ className }: { className?: string }) => (
    <div className={cn('flex items-center gap-2 ml-auto', className)}>
      {savedData.length > 1 && (
        <>
          <span className="text-muted-foreground text-sm font-bold">
            ({currentIndex + 1}/{savedData.length})
          </span>
          <Button
            onClick={() => moveToIndex(currentIndex - 1)}
            variant="outline"
            disabled={!canGoBack}
          >
            <ArrowLeft /> {t('common.previous')}
          </Button>
        </>
      )}
      <Button onClick={() => moveToIndex(currentIndex + 1)}>
        {isLastItem ? (finishLabel ?? t('common.next_step')) : t('common.next_item')}
        {(!isLastItem || withFinishArrow) && <ArrowRight />}
      </Button>
    </div>
  )

  return (
    <Card className="max-h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex-row flex items-center">
          <div className="flex items-center gap-1">
            <Button onClick={onGoBack} size="icon-sm" variant="ghost">
              <ArrowLeft />
            </Button>
            {!!title && <p>{title}</p>}
          </div>

          <Actions className="self-start hidden sm:flex" />
        </CardTitle>
        {!!description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="overflow-hidden flex">
        {children({
          currentIndex,
          currentRecords,
          onDataChange: setCurrentRecords,
        })}
      </CardContent>
      <CardFooter className="sm:invisible sm:p-0 flex">
        <Actions className="sm:hidden flex" />
      </CardFooter>
    </Card>
  )
}

export { ManageDataWrapper }

export type { TProps as TManageDataWrapperProps }
