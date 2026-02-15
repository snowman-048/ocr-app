'use client'

import { useMemo, useState } from 'react'

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
import { TTemplateRecord, getOcrTemplate } from '@/lib/ocr/templates'
import { cn } from '@/lib/utils'

import { DynamicDataTable } from './dynamic-data-table'
import { Button } from './ui/button'

type TProps = {
  ocrResponse: TOcrResponse[]
  onGoBack: () => void
  onGoNext: (data: TOcrResponse[]) => void
}

const DataReviewStep = ({ ocrResponse, onGoBack, onGoNext }: TProps) => {
  const t = useTranslations()

  const [data, setData] = useState<TOcrResponse[]>(ocrResponse)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [currentRecords, setCurrentRecords] = useState<TTemplateRecord[]>(
    data[currentIndex].records,
  )

  const template = useMemo(() => getOcrTemplate(ocrResponse?.[0]?.templateType), [ocrResponse])

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
      <span className="text-muted-foreground text-sm font-bold">
        ({currentIndex + 1}/{data.length})
      </span>
      <Button onClick={() => moveToIndex(currentIndex - 1)} variant="outline" disabled={!canGoBack}>
        <ArrowLeft /> {t('common.previous')}
      </Button>
      <Button onClick={() => moveToIndex(currentIndex + 1)}>
        {isLastItem ? t('ocr_validation.finish_validation') : t('ocr_validation.next_item')}
        <ArrowRight />
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
        <DynamicDataTable
          key={currentIndex}
          records={currentRecords}
          template={template}
          onDataChange={setCurrentRecords}
        />
      </CardContent>
      <CardFooter className="sm:invisible sm:p-0 flex">
        <Actions className="sm:hidden flex" />
      </CardFooter>
    </Card>
  )
}

export { DataReviewStep }
