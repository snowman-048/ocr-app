'use client'

import { useMemo, useState } from 'react'

import { ColumnDef, Row } from '@tanstack/react-table'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EConfidenceLevel } from '@/lib/ocr/enums'
import { TTemplateRecord, getOcrTemplate } from '@/lib/ocr/templates'

import { Button } from './ui/button'
import { DataTable } from './ui/data-table'

interface DynamicDataTableProps {
  initialData: TTemplateRecord[]
  templateType: string
  onGoBack: () => void
  onGoNext: (data: TTemplateRecord[]) => void
  onDataChange?: (data: TTemplateRecord[]) => void
}

export function DynamicDataTable({
  initialData,
  templateType,
  onDataChange,
  onGoBack,
  onGoNext,
}: DynamicDataTableProps) {
  const [data, setData] = useState<TTemplateRecord[]>(initialData)
  const template = getOcrTemplate(templateType as any)

  const getConfidenceColor = (confidence: EConfidenceLevel) => {
    switch (confidence) {
      case 'low':
        return 'bg-red-50 border-red-300! focus:border-red-500!'
      case 'medium':
        return 'bg-yellow-50 border-yellow-300! focus:border-yellow-500!'
      case 'high':
        return ''
    }
  }

  // Helper to update cell value
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

  const EditableCell = ({
    row,
    columnKey,
    fieldType,
  }: {
    row: Row<TTemplateRecord>
    columnKey: string
    fieldType: string
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
          className={`${cell.confidence !== EConfidenceLevel.HIGH && getConfidenceColor(cell.confidence)} h-6 focus:ring-0! focus:ring-offset-0! min-w-12 text-center`}
          type={inputType}
        />
      </div>
    )
  }

  const columns: ColumnDef<TTemplateRecord>[] = useMemo(() => {
    const config: { key: string; label: string; type: string }[] = []

    if (templateType === 'freeform') {
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
      cell: ({ row }) => <EditableCell row={row} columnKey={column.key} fieldType={column.type} />,
    }))
  }, [template, templateType])

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
        <CardAction>
          <Button onClick={() => onGoNext(data)}>
            Next <ArrowRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="overflow-hidden flex">
        <DataTable
          data={data}
          columns={columns}
          className="max-w-full max-h-full flex overflow-hidden"
        />
      </CardContent>
    </Card>
  )
}
