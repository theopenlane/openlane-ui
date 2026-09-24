'use client'

import React, { useMemo } from 'react'
import { InfoCard } from '@/components/shared/file-preview/preview-chrome'
import { RecordPreviewTable } from '@/components/shared/record-preview/record-preview-table'
import { parseDelimitedText } from '@/components/shared/record-import/lib/delimited-file'
import { pluralizeWithCount } from '@/utils/strings'

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
  const parsed = parseDelimitedText(input, { previewRows: MAX_PREVIEW_ROWS })
  if (!parsed) return null

  const widest = parsed.rows.reduce((columns, row) => Math.max(columns, row.length), parsed.headers.length)
  const columnCount = Math.min(widest, MAX_PREVIEW_COLUMNS)

  return {
    headers: Array.from({ length: columnCount }, (_, index) => parsed.headers[index] ?? `Column ${index + 1}`),
    rows: parsed.rows,
    truncated: clipped || parsed.truncated || widest > columnCount,
    malformed: parsed.malformed,
  }
}

const summarize = (grid: TCsvGrid): string => {
  const summary = `${pluralizeWithCount(grid.rows.length, 'row')} × ${pluralizeWithCount(grid.headers.length, 'column')}`
  if (grid.truncated) return `${summary} shown — download the file to see the rest.`

  return summary
}

const CsvPreview: React.FC<{ text: string }> = ({ text }) => {
  const grid = useMemo(() => buildGrid(text), [text])

  if (!grid) return <InfoCard tone="muted" message="This CSV file has no rows to preview." />

  return (
    <RecordPreviewTable
      ariaLabel="CSV contents"
      headers={grid.headers}
      rows={grid.rows}
      className="h-full max-h-[70vh] w-full rounded-md border bg-card"
      caption={
        <>
          <p>{summarize(grid)}</p>
          {grid.malformed && <p>Some rows could not be parsed cleanly — download the file to see the original.</p>}
        </>
      }
    />
  )
}

export default CsvPreview
