'use client'

import { useMemo, useState } from 'react'

import { ColumnDef, Row } from '@tanstack/react-table'
import { AlertTriangle, HelpCircle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { EConfidenceLevel } from '@/lib/ocr/enums'
import { TOcrTemplate, TTemplateRecord } from '@/lib/ocr/templates'
import { cn } from '@/lib/utils'

import { DataTable } from './ui/data-table'

const getConfidenceColor = (confidence: EConfidenceLevel) => {
  switch (confidence) {
    case EConfidenceLevel.LOW:
      return 'bg-red-50 border-red-300! focus:border-red-500!'
    case EConfidenceLevel.MEDIUM:
      return 'bg-yellow-50 border-yellow-300! focus:border-yellow-500!'
    default:
      return ''
  }
}

const ConfidenceIndicator = ({ confidence }: { confidence: EConfidenceLevel }) => {
  if (confidence === EConfidenceLevel.HIGH) return null

  const Icon = confidence === EConfidenceLevel.LOW ? AlertTriangle : HelpCircle
  const size = 12

  return (
    <span
      className={cn(
        'absolute -top-2 -right-2 z-10',
        confidence === EConfidenceLevel.LOW ? 'text-red-500' : 'text-yellow-500',
      )}
      title={`Confidence: ${confidence}`}
    >
      <Icon size={size} />
    </span>
  )
}

const EditableCell = ({
  row,
  columnKey,
  columnLabel,
  fieldType,
  updateCellValue,
}: {
  row: Row<TTemplateRecord>
  columnKey: string
  columnLabel: string
  fieldType: string
  updateCellValue: (rowIndex: number, key: string, newValue: string | number) => void
}) => {
  const cell = row.original.find((cell) => cell.key === columnKey)

  const [value, setValue] = useState(cell?.value ?? '')

  const inputType = fieldType === 'number' ? 'number' : 'text'
  const confidence = cell?.confidence ?? EConfidenceLevel.HIGH

  return (
    <div className="relative flex">
      <ConfidenceIndicator confidence={confidence} />
      <Input
        value={value ?? ''}
        aria-label={`${columnLabel}: ${value ?? ''}, confidence: ${confidence}`}
        onChange={(e) => {
          const val = inputType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
          setValue(val)
        }}
        onBlur={() => updateCellValue(row.index, columnKey, value)}
        className={cn(
          'h-8 sm:h-6 focus:ring-0! focus:ring-offset-0! min-w-12 text-center',
          getConfidenceColor(confidence),
        )}
        type={inputType}
      />
    </div>
  )
}

type TProps = {
  records: TTemplateRecord[]
  template: TOcrTemplate
  onDataChange?: (data: TTemplateRecord[]) => void
}

const DynamicDataTable = ({ records, template, onDataChange }: TProps) => {
  const [data, setData] = useState<TTemplateRecord[]>(records)

  const updateCellValue = (rowIndex: number, key: string, newValue: string | number) => {
    setData((old) => {
      const newData = old.map((row, index) => {
        if (index !== rowIndex) return row

        const existingCell = row.find((cell) => cell.key === key)
        if (existingCell) {
          return row.map((cell) => (cell.key === key ? { ...cell, value: newValue } : cell))
        }
        // Cell doesn't exist yet — add it
        return [...row, { key, value: newValue, confidence: EConfidenceLevel.HIGH }]
      })
      onDataChange?.(newData)
      return newData
    })
  }

  const columns: ColumnDef<TTemplateRecord>[] = useMemo(() => {
    const config: { key: string; label: string; type: string }[] = []

    if (template.type === 'freeform') {
      const uniqueKeys = new Set<string>()
      data.forEach((record) => {
        record.forEach((cell) => {
          uniqueKeys.add(cell.key)
        })
      })

      Array.from(uniqueKeys).forEach((key) => {
        config.push({ key, label: key, type: 'text' })
      })
    } else {
      template.fields?.forEach((field) => {
        if (field.type === 'empty') return
        config.push({
          key: field.key,
          label: field.label,
          type: field.type,
        })
      })
    }

    if (!config?.length) {
      return []
    }

    return config.map((column) => ({
      id: column.key,
      header: column.label,
      cell: ({ row }) => (
        <EditableCell
          row={row}
          columnKey={column.key}
          columnLabel={column.label}
          fieldType={column.type}
          updateCellValue={updateCellValue}
        />
      ),
    }))
  }, [template])

  return (
    <DataTable
      data={data}
      columns={columns}
      className="max-w-full max-h-full flex overflow-hidden"
    />
  )
}

export { DynamicDataTable }
