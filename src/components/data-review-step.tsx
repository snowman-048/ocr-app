/* eslint-disable @next/next/no-img-element */
'use client'

import { useState } from 'react'

import { AlertTriangle, Columns2, ImageIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TOcrResponse } from '@/api/ocr/types'
import { Button } from '@/components/ui/button'
import { EImageQuality } from '@/enums/image-quality'
import { useImageFilesPreviews } from '@/hooks/use-image-files-previews'
import { TOcrTemplate, TTemplateRecord } from '@/lib/ocr/templates'
import { cn } from '@/lib/utils'
import { useModal } from '@/providers/modal-provider'

import { DynamicDataTable } from './dynamic-data-table'
import { ImageFilePreview } from './image-file-preview'
import { ManageDataWrapper, TManageDataWrapperProps } from './manage-data-wrapper'
import { TokenUsage } from './token-usage'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

type TProps = Omit<TManageDataWrapperProps<TTemplateRecord[]>, 'children' | 'data'> & {
  data: TOcrResponse[]
  template: TOcrTemplate
  files?: File[]
}

const DataReviewStep = ({ data, template, files, onGoBack, onGoNext }: TProps) => {
  const t = useTranslations()
  const [compareMode, setCompareMode] = useState(false)

  const { openModal } = useModal()

  const { previews } = useImageFilesPreviews(files)

  const hasFiles = !!files?.length && !!previews?.length

  const onPreview = (index: number) => {
    if (!files?.[index] || !previews?.[index]) return

    openModal(
      <ImageFilePreview previews={[{ fileName: files[index].name, preview: previews[index] }]} />,
      {
        title: t('image_upload.preview.title'),
        description: t('image_upload.preview.description'),
      },
    )
  }

  return (
    <ManageDataWrapper
      data={data.map((item) => item.records)}
      title={template.name}
      description={template.description}
      onGoBack={onGoBack}
      onGoNext={onGoNext}
      renderTitleAddon={({ currentIndex }) => (
        <>
          {hasFiles && (
            <div className="flex items-center gap-1 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="icon"
                      type="button"
                      variant={compareMode ? 'default' : 'outline'}
                      aria-label={t('image_upload.preview.title')}
                      disabled={!files[currentIndex]}
                      onClick={() => setCompareMode((prev) => !prev)}
                    >
                      <Columns2 />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t('image_upload.preview.title')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="icon"
                      type="button"
                      variant="outline"
                      aria-label={t('image_upload.preview.title')}
                      disabled={!files[currentIndex]}
                      onClick={() => onPreview(currentIndex)}
                    >
                      <ImageIcon />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t('image_upload.preview.title')}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </>
      )}
    >
      {({ currentIndex, currentRecords, onDataChange }) => (
        <div
          className={cn(
            'flex gap-2 overflow-hidden',
            compareMode ? 'flex-col md:flex-row' : 'flex-col',
          )}
        >
          {compareMode && hasFiles && previews[currentIndex] && (
            <div className="flex-none md:flex-1 overflow-auto min-w-0 border rounded-md p-1 max-h-48 md:max-h-none">
              <img
                src={previews[currentIndex]}
                alt={`Source image: ${files[currentIndex]?.name || 'uploaded file'}`}
                className="w-full h-auto object-contain"
              />
            </div>
          )}
          <div
            className={cn('flex flex-col gap-2 overflow-hidden', compareMode && 'flex-1 min-w-0')}
          >
            <DynamicDataTable
              key={currentIndex}
              records={currentRecords}
              template={template}
              onDataChange={onDataChange}
            />
            {data[currentIndex]?.imageQuality === EImageQuality.POOR && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{t('data_review.low_quality_warning')}</span>
              </div>
            )}
            <TokenUsage consumption={data[currentIndex]?.tokensConsumption} />
          </div>
        </div>
      )}
    </ManageDataWrapper>
  )
}

export { DataReviewStep }
