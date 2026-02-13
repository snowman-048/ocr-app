import { useEffect, useState } from 'react'

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

import { Spinner } from './spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

type TProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  className?: string
  isLoading?: boolean
  onRowsSelect?: (row: TData[]) => void
}

const DataTable = <TData, TValue>({
  data,
  columns,
  isLoading,
  className,
  onRowsSelect,
}: TProps<TData, TValue>) => {
  const t = useTranslations()

  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  })

  useEffect(() => {
    if (!onRowsSelect) {
      return
    }

    const selectedIndexes = Object.keys(rowSelection)

    if (!selectedIndexes.length) {
      onRowsSelect([])
      return
    }

    onRowsSelect(selectedIndexes.map((index) => data[+index]))
  }, [rowSelection, onRowsSelect])

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="[&_[role=row]:last-child]:border-b-0">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={cn('relative z-0', !!onRowsSelect && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn((cell.column.columnDef.meta as any)?.className)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-12 text-center">
                {isLoading ? <Spinner size="small" className="mx-auto" /> : t('common.no_data')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
