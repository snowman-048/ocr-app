// components/export-step.tsx
'use client'

import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { TOcrResponse } from '@/api/ocr/types'
import { copyToClipboard } from '@/helpers/copy-to-clipboard'
import { exportToTsv } from '@/helpers/export-to-tsv'
import { TOcrTemplate, TOcrTemplateExportVariant, TTemplateRecord } from '@/lib/ocr/templates'

import { ManageDataWrapper, TManageDataWrapperProps } from './manage-data-wrapper'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { DataTable } from './ui/data-table'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

type TExportStepContentProps = {
  records: TTemplateRecord[]
  template: TOcrTemplate
  formatMethod: TOcrTemplateExportVariant
}

const ExportStepContent = ({ records, template, formatMethod }: TExportStepContentProps) => {
  const t = useTranslations()

  const formattedData = useMemo(() => formatMethod.formatData(records), [formatMethod, records])

  const columns: ColumnDef<any>[] = useMemo(() => {
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
    }))
  }, [formattedData, formatMethod, template])

  return (
    <div className="min-w-lg w-full flex flex-col gap-2">
      <div className="flex justify-between">
        <div>
          <p className="font-semibold">{formatMethod.name}</p>
          <p className="text-muted-foreground">{formatMethod.description}</p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                const tsvData = exportToTsv(formattedData, formatMethod.columnsOrder)
                copyToClipboard(tsvData)
                toast.success('Values are copied to clipboard')
              }}
            >
              <Upload />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('export.export_to_tsv')}</TooltipContent>
        </Tooltip>
      </div>
      <DataTable
        data={formattedData}
        columns={columns}
        className="max-w-full max-h-full flex overflow-hidden"
      />
    </div>
  )
}

type TBatchExportContentProps = {
  ocrData: TOcrResponse[]
  template: TOcrTemplate
  formatMethod: TOcrTemplateExportVariant
  onGoBack: () => void
}

const BatchExportContent = ({
  ocrData,
  template,
  formatMethod,
  onGoBack,
}: TBatchExportContentProps) => {
  const t = useTranslations()

  const formattedData = useMemo(() => {
    if (!formatMethod.formatBatchData) {
      return []
    }

    // Extract all records from all sheets
    const allRecords = ocrData.map((data) => data.records)
    return formatMethod.formatBatchData(allRecords)
  }, [formatMethod, ocrData])

  const columns: ColumnDef<any>[] = useMemo(() => {
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
    }))
  }, [formattedData, formatMethod, template])

  return (
    <Card className="max-h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Button onClick={onGoBack} size="icon-sm" variant="ghost">
            <ArrowLeft />
          </Button>
          {template.name}
        </CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden flex">
        <div className="min-w-lg w-full flex flex-col gap-2">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{formatMethod.name}</p>
              <p className="text-muted-foreground">{formatMethod.description}</p>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    const tsvData = exportToTsv(formattedData, formatMethod.columnsOrder)
                    copyToClipboard(tsvData)
                    toast.success('Values are copied to clipboard')
                  }}
                >
                  <Upload />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('export.export_to_tsv')}</TooltipContent>
            </Tooltip>
          </div>
          <DataTable
            data={formattedData}
            columns={columns}
            className="max-w-full max-h-full flex overflow-hidden"
          />
        </div>
      </CardContent>
    </Card>
  )
}

type TProps = Omit<TManageDataWrapperProps, 'children'> & {
  formatMethodId: string
}

const ExportStep = ({ ocrData, onGoBack, template, formatMethodId, onGoNext }: TProps) => {
  const formatMethod = useMemo(
    () => template.exportVariants.find((variant) => variant.id === formatMethodId)!,
    [template, formatMethodId],
  )

  if (formatMethod.isBatchExport) {
    return (
      <BatchExportContent
        ocrData={ocrData}
        template={template}
        formatMethod={formatMethod}
        onGoBack={onGoBack}
      />
    )
  }

  return (
    <ManageDataWrapper
      ocrData={ocrData}
      template={template}
      onGoBack={onGoBack}
      onGoNext={onGoNext}
      finishLabel="Finish"
      withFinishArrow={false}
    >
      {({ currentIndex, currentRecords }) => (
        <ExportStepContent
          key={currentIndex}
          records={currentRecords}
          template={template}
          formatMethod={formatMethod}
        />
      )}
    </ManageDataWrapper>
  )
}

export { ExportStep }
