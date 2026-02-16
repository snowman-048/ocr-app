'use client'

import { JSX, useState } from 'react'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TOcrResponse } from '@/api/ocr/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TOcrTemplate, TTemplateRecord } from '@/lib/ocr/templates'
import { cn } from '@/lib/utils'

import { Button } from './ui/button'

type TManageDataProvidedValues = {
  currentIndex: number
  currentRecords: TTemplateRecord[]
  onDataChange: (data: TTemplateRecord[]) => void
}

type TProps = {
  ocrData: TOcrResponse[]
  template: TOcrTemplate
  children: (props: TManageDataProvidedValues) => JSX.Element
  onGoBack: () => void
  onGoNext: (data: TOcrResponse[]) => void
  finishLabel?: string
  withFinishArrow?: boolean
}

const ManageDataWrapper = ({
  ocrData,
  children,
  template,
  onGoBack,
  onGoNext,
  finishLabel,
  withFinishArrow = true,
}: TProps) => {
  const t = useTranslations()

  const [data, setData] = useState<TOcrResponse[]>(ocrData)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [currentRecords, setCurrentRecords] = useState<TTemplateRecord[]>(
    data[currentIndex].records,
  )

  const canGoBack = currentIndex > 0
  const isLastItem = currentIndex >= data.length - 1

  const moveToIndex = (index: number) => {
    if (index < 0) return

    setData((prev) => {
      const newData = [...prev]
      newData[currentIndex] = { ...newData[currentIndex], records: [...currentRecords] }

      if (index >= newData.length) {
        onGoNext(newData)
        return newData
      }

      setCurrentRecords(newData[index].records)
      setCurrentIndex(index)

      return newData
    })
  }

  const Actions = ({ className }: { className?: string }) => (
    <div className={cn('flex items-center gap-2 ml-auto', className)}>
      {data.length > 1 && (
        <>
          <span className="text-muted-foreground text-sm font-bold">
            ({currentIndex + 1}/{data.length})
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
            <p>{template.name}</p>
          </div>

          <Actions className="self-start hidden sm:flex" />
        </CardTitle>
        <CardDescription>{template.description}</CardDescription>
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
