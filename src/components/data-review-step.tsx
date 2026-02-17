'use client'

import { ImageIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TOcrResponse } from '@/api/ocr/types'
import { Button } from '@/components/ui/button'
import { useImageFilesPreviews } from '@/hooks/use-image-files-previews'
import { TOcrTemplate, TTemplateRecord } from '@/lib/ocr/templates'
import { useModal } from '@/providers/modal-provider'

import { DynamicDataTable } from './dynamic-data-table'
import { ImageFilePreview } from './image-file-preview'
import { ManageDataWrapper, TManageDataWrapperProps } from './manage-data-wrapper'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

type TProps = Omit<TManageDataWrapperProps<TTemplateRecord[]>, 'children' | 'data'> & {
  data: TOcrResponse[]
  template: TOcrTemplate
  files?: File[]
}

const DataReviewStep = ({ data, template, files, onGoBack, onGoNext }: TProps) => {
  const t = useTranslations()

  const { openModal } = useModal()

  const { previews } = useImageFilesPreviews(files)

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
          {!!files?.length && !!previews?.length && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-fit ml-2">
                  <Button
                    size="icon"
                    type="button"
                    disabled={!files[currentIndex]}
                    onClick={() => onPreview(currentIndex)}
                  >
                    <ImageIcon />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t('image_upload.preview.title')}</TooltipContent>
            </Tooltip>
          )}
        </>
      )}
    >
      {({ currentIndex, currentRecords, onDataChange }) => (
        <DynamicDataTable
          key={currentIndex}
          records={currentRecords}
          template={template}
          onDataChange={onDataChange}
        />
      )}
    </ManageDataWrapper>
  )
}

export { DataReviewStep }
