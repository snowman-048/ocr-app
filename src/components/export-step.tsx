'use client'

import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

import { copyToClipboard } from '@/helpers/copy-to-clipboard'
import { exportToTsv } from '@/helpers/export-to-tsv'
import { TOcrTemplate, TOcrTemplateExportVariant, TTemplateRecord } from '@/lib/ocr/templates'

import { ManageDataWrapper, TManageDataWrapperProps } from './manage-data-wrapper'
import { Button } from './ui/button'
import { DataTable } from './ui/data-table'

type TExportStepContentProps = {
  records: TTemplateRecord[]
  template: TOcrTemplate
  formatMethod: TOcrTemplateExportVariant
  // onDataChange: (data: TTemplateRecord[]) => void
}

const ExportStepContent = ({
  records,
  template,
  formatMethod,
  // onDataChange,
}: TExportStepContentProps) => {
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
  }, [formattedData, formatMethod])

  return (
    <div className="min-w-lg w-full flex flex-col gap-2">
      <div className="flex justify-between">
        <div>
          <p>{formatMethod.name}</p>
          <p className="text-muted-foreground">{formatMethod.description}</p>
        </div>
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
      </div>
      <DataTable
        data={formattedData}
        columns={columns}
        className="max-w-full max-h-full flex overflow-hidden"
      />
    </div>
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

  return (
    <ManageDataWrapper
      ocrData={ocrData}
      template={template}
      onGoBack={onGoBack}
      onGoNext={onGoNext}
      finishLabel="Finish"
      withFinishArrow={false}
    >
      {({
        currentIndex,
        currentRecords,
        // onDataChange
      }) => (
        <ExportStepContent
          key={currentIndex}
          records={currentRecords}
          template={template}
          formatMethod={formatMethod}
          // onDataChange={onDataChange}
        />
      )}
    </ManageDataWrapper>
  )
}

export { ExportStep }
