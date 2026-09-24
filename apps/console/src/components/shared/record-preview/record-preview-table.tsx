'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { cn } from '@repo/ui/lib/utils'

type TRecordPreviewTableProps = {
  headers: string[]
  rows: string[][]
  ariaLabel: string
  caption?: React.ReactNode
  emptyMessage?: string
  className?: string
}

export const RecordPreviewTable = React.memo(({ headers, rows, ariaLabel, caption, emptyMessage = 'Nothing to preview.', className }: TRecordPreviewTableProps) => {
  if (headers.length === 0 || rows.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className={cn('flex min-w-0 flex-col overflow-hidden', className)}>
      <Table compact containerClassName="min-h-0 flex-1" aria-label={ariaLabel} className="w-max min-w-full">
        <TableHeader>
          <TableRow compact>
            {headers.map((header, index) => (
              <TableHead key={index} compact scope="col" className="whitespace-nowrap font-medium text-foreground" title={header}>
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} compact>
              {headers.map((_, cellIndex) => {
                const value = row[cellIndex] ?? ''
                return (
                  <TableCell key={cellIndex} compact className="max-w-80 truncate whitespace-nowrap" title={value}>
                    {value}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {caption && <div className="shrink-0 border-t px-4 py-2.5 text-xs text-muted-foreground">{caption}</div>}
    </div>
  )
})

RecordPreviewTable.displayName = 'RecordPreviewTable'
