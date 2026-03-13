// components/export-step.tsx
'use client'

import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'
import { Clipboard, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { TOcrResponse } from '@/api/ocr/types'
import { copyToClipboard } from '@/helpers/copy-to-clipboard'
import { exportToTsv } from '@/helpers/export-to-tsv'
import { TOcrTemplate, TOcrTemplateExportVariant, TTemplateRecord } from '@/lib/ocr/templates'

import { ManageDataWrapper, TManageDataWrapperProps } from './manage-data-wrapper'
import { Button } from './ui/button'
import { DataTable } from './ui/data-table'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

type TExportStepContentProps = {
  template: TOcrTemplate
  formatMethod: TOcrTemplateExportVariant
  formattedData: Record<string, unknown>[]
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const ExportStepContent = ({ template, formatMethod, formattedData }: TExportStepContentProps) => {
  const t = useTranslations()

  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(() => {
    let keys = formatMethod.columnsOrder

    if (!keys?.length) {
      const uniqueKeys = new Set<string>()

      formattedData.forEach((record) => {
        Object.keys(record).forEach((key) => {
          uniqueKeys.add(key)
        })
      })

      keys = Array.from(uniqueKeys)
    }

    return keys.map((key) => ({
      header: formatMethod.getHeader
        ? formatMethod.getHeader(key)
        : (template.fields?.find((f) => f.key === key)?.label ?? key),
      accessorKey: key,
      cell: ({ getValue }) => <p className="text-center">{getValue() as string}</p>,
    }))
  }, [formattedData, formatMethod, template])

  const getTsvData = () =>
    exportToTsv(formattedData, formatMethod.exportColumnsOrder || formatMethod.columnsOrder)

  return (
    <div className="w-full flex flex-col gap-2 min-w-0">
      <div className="flex flex-wrap justify-between max-w-full items-center gap-2">
        <div>
          <p className="font-semibold">{formatMethod.name}</p>
          <p className="text-muted-foreground">{formatMethod.description}</p>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label={t('export.download_file')}
                onClick={() => {
                  const tsvData = getTsvData()
                  downloadFile(tsvData, `${template.type}-export.tsv`, 'text/tab-separated-values')
                }}
              >
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('export.download_file')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label={t('export.export_to_tsv')}
                onClick={() => {
                  const tsvData = getTsvData()
                  copyToClipboard(tsvData)
                  toast.success(t('export.copied_to_clipboard'))
                }}
              >
                <Clipboard />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('export.export_to_tsv')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <DataTable
        data={formattedData}
        columns={columns}
        className="max-w-full max-h-full flex overflow-hidden"
      />
    </div>
  )
}

type TProps = Omit<TManageDataWrapperProps<TTemplateRecord[]>, 'children' | 'data'> & {
  data: TOcrResponse[]
  formatMethodId: string
  template: TOcrTemplate
}

const ExportStep = ({ data, onGoBack, template, formatMethodId, onGoNext }: TProps) => {
  const t = useTranslations()

  const formatMethod = useMemo(
    () => template.exportVariants.find((variant) => variant.id === formatMethodId)!,
    [template, formatMethodId],
  )

  const formattedData = useMemo(() => {
    if (formatMethod.isBatchExport) {
      if (!formatMethod.formatBatchData) {
        return []
      }

      const allRecords = data.map((item) => item.records)
      return [formatMethod.formatBatchData(allRecords)]
    }
    return data.map((item) => formatMethod.formatData(item.records))
  }, [formatMethod, data])

  return (
    <ManageDataWrapper
      data={formattedData}
      title={template.name}
      description={template.description}
      onGoBack={onGoBack}
      onGoNext={onGoNext}
      finishLabel={t('common.finish')}
      withFinishArrow={false}
    >
      {({ currentIndex, currentRecords }) => (
        <ExportStepContent
          key={currentIndex}
          formattedData={currentRecords}
          template={template}
          formatMethod={formatMethod}
        />
      )}
    </ManageDataWrapper>
  )
}

export { ExportStep }
