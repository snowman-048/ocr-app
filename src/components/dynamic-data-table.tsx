'use client'

import { useMemo, useState } from 'react'

import { ColumnDef, Row } from '@tanstack/react-table'

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

const EditableCell = ({
  row,
  columnKey,
  fieldType,
  updateCellValue,
}: {
  row: Row<TTemplateRecord>
  columnKey: string
  fieldType: string
  updateCellValue: (rowIndex: number, key: string, newValue: any) => void
}) => {
  const cell = row.original.find((cell) => cell.key === columnKey)
  if (!cell) return null

  const [value, setValue] = useState(cell.value)

  const inputType = fieldType === 'number' ? 'number' : 'text'

  return (
    <div className="relative flex">
      <Input
        value={value ?? ''}
        onChange={(e) => {
          const val = inputType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
          setValue(val)
        }}
        onBlur={() => updateCellValue(row.index, columnKey, value)}
        className={cn(
          'h-6 focus:ring-0! focus:ring-offset-0! min-w-12 text-center',
          getConfidenceColor(cell.confidence),
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

  const updateCellValue = (rowIndex: number, key: string, newValue: any) => {
    setData((old) => {
      const newData = old.map((row, index) => {
        if (index === rowIndex) {
          return row.map((cell) => (cell.key === key ? { ...cell, value: newValue } : cell))
        }
        return row
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
