import Papa from 'papaparse'
import type { TParsedDelimitedFile, TSourceColumn } from './types'

export const MAX_IMPORT_FILE_SIZE_MB = 10
const SAMPLED_VALUES_PER_COLUMN = 20
const DELIMITERS_TO_GUESS = [',', ';', '\t', '|']

export type TDelimitedGrid = {
  headers: string[]
  rows: string[][]
  malformed: boolean
  raggedRowCount: number
  truncated: boolean
}

const firstLineOf = (text: string): string => {
  const end = text.search(/\r\n|\r|\n/)
  return end === -1 ? text : text.slice(0, end)
}

const delimiterOfHeaderRow = (text: string): string => {
  const { meta } = Papa.parse<string[]>(firstLineOf(text), { delimitersToGuess: DELIMITERS_TO_GUESS })
  return meta.delimiter || ','
}

export const parseDelimitedText = (text: string, { previewRows }: { previewRows?: number } = {}): TDelimitedGrid | null => {
  const { data, meta, errors } = Papa.parse<string[]>(text, {
    delimiter: delimiterOfHeaderRow(text),
    skipEmptyLines: 'greedy',
    ...(previewRows ? { preview: previewRows + 1 } : {}),
  })
  const [headerRow, ...rows] = data
  if (!headerRow?.length) return null

  const raggedRowCount = rows.filter((row) => row.length !== headerRow.length).length

  return {
    headers: headerRow.map((header, index) => header.trim() || `Column ${index + 1}`),
    rows,
    malformed: raggedRowCount > 0 || errors.some((error) => error.type === 'Quotes'),
    raggedRowCount,
    truncated: meta.truncated,
  }
}

export const parseDelimitedFile = async (file: File): Promise<TParsedDelimitedFile | null> => {
  const grid = parseDelimitedText(await file.text())
  if (!grid) return null

  const { headers, rows, malformed, raggedRowCount } = grid
  return { headers, rows, malformed, raggedRowCount, fileName: file.name, fileSize: file.size }
}

export const toSourceColumns = (parsed: TParsedDelimitedFile): TSourceColumn[] => {
  const columns: TSourceColumn[] = parsed.headers.map((header, index) => ({ index, header, values: [], filledCount: 0 }))

  parsed.rows.forEach((row) => {
    columns.forEach((column) => {
      const value = row[column.index]?.trim()
      if (!value) return

      column.filledCount += 1
      if (column.values.length < SAMPLED_VALUES_PER_COLUMN) column.values.push(value)
    })
  })

  return columns
}

export const serializeCsv = (headers: string[], rows: string[][]): string => Papa.unparse({ fields: headers, data: rows })
