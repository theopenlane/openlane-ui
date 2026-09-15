'use client'

import React, { useMemo } from 'react'
import Papa from 'papaparse'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { InfoCard } from '@/components/shared/file-preview/preview-chrome'

const MAX_PREVIEW_ROWS = 500
const MAX_PREVIEW_COLUMNS = 50
const MAX_PREVIEW_CHARS = 2_000_000

type TCsvGrid = {
  headers: string[]
  rows: string[][]
  truncated: boolean
  malformed: boolean
}

const clampToLastLine = (text: string): { input: string; clipped: boolean } => {
  if (text.length <= MAX_PREVIEW_CHARS) return { input: text, clipped: false }

  const head = text.slice(0, MAX_PREVIEW_CHARS)
  const lastNewline = head.lastIndexOf('\n')
  return { input: lastNewline > 0 ? head.slice(0, lastNewline) : head, clipped: true }
}

const buildGrid = (text: string): TCsvGrid | null => {
  const { input, clipped } = clampToLastLine(text)
  const { data, meta, errors } = Papa.parse<string[]>(input, { skipEmptyLines: true, preview: MAX_PREVIEW_ROWS + 1 })
  const [headerRow, ...rows] = data
  if (!headerRow?.length) return null

  const widest = rows.reduce((columns, row) => Math.max(columns, row.length), headerRow.length)
  const columnCount = Math.min(widest, MAX_PREVIEW_COLUMNS)

  return {
    headers: Array.from({ length: columnCount }, (_, index) => headerRow[index]?.trim() || `Column ${index + 1}`),
    rows,
    truncated: clipped || meta.truncated || widest > columnCount,
    malformed: errors.some((error) => error.type === 'Quotes'),
  }
}

const CsvPreview: React.FC<{ text: string }> = ({ text }) => {
  const grid = useMemo(() => buildGrid(text), [text])

  if (!grid) return <InfoCard tone="muted" message="This CSV file has no rows to preview." />

  return <CsvGrid grid={grid} />
}

const summarize = (grid: TCsvGrid): string => {
  const rows = `${grid.rows.length.toLocaleString()} ${grid.rows.length === 1 ? 'row' : 'rows'}`
  const columns = `${grid.headers.length.toLocaleString()} ${grid.headers.length === 1 ? 'column' : 'columns'}`
  if (grid.truncated) return `${rows} × ${columns} shown — download the file to see the rest.`

  return `${rows} × ${columns}`
}

const CsvGrid = React.memo(({ grid }: { grid: TCsvGrid }) => (
  <div className="flex h-full max-h-[70vh] w-full min-w-0 flex-col gap-2">
    <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-card">
      <table aria-label="CSV contents" className="w-max min-w-full text-xs">
        <TableHeader>
          <TableRow compact>
            {grid.headers.map((header, index) => (
              <TableHead key={index} compact scope="col" className="whitespace-nowrap font-medium text-foreground" title={header}>
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {grid.rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} compact>
              {grid.headers.map((_, cellIndex) => {
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
      </table>
    </div>
    <div className="shrink-0 text-xs text-muted-foreground">
      <p>{summarize(grid)}</p>
      {grid.malformed && <p>Some rows could not be parsed cleanly — download the file to see the original.</p>}
    </div>
  </div>
))

CsvGrid.displayName = 'CsvGrid'

export default CsvPreview
