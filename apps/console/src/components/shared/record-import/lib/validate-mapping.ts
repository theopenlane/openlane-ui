import { formatList, pluralizeWithCount } from '@/utils/strings'
import type { TColumnMapping, TDestinationFieldSet, TImportIssue, TSourceColumn } from './types'

export type TMappingValidation = {
  blockingIssues: TImportIssue[]
  columnsWithIssues: Set<number>
  duplicateColumns: Set<number>
  mappedColumnCount: number
  ignoredColumnCount: number
}

const ROW_NUMBERS_SHOWN = 5
const HEADER_ROW_OFFSET = 2

const describeRows = (rowIndexes: number[]): string => {
  const shown = rowIndexes.slice(0, ROW_NUMBERS_SHOWN).map((index) => index + HEADER_ROW_OFFSET)
  const remaining = rowIndexes.length - shown.length
  return `${rowIndexes.length === 1 ? 'row' : 'rows'} ${shown.join(', ')}${remaining > 0 ? ` and ${remaining} more` : ''}`
}

const rowsMissingAll = (rows: string[][], columns: TSourceColumn[]): number[] => {
  if (columns.some((column) => column.filledCount === rows.length)) return []

  const missing: number[] = []
  rows.forEach((row, rowIndex) => {
    if (columns.every((column) => !row[column.index]?.trim())) missing.push(rowIndex)
  })
  return missing
}

export const validateMapping = ({
  columns,
  fieldSet,
  mapping,
  rows,
}: {
  columns: TSourceColumn[]
  fieldSet: TDestinationFieldSet
  mapping: Record<number, TColumnMapping>
  rows: string[][]
}): TMappingValidation => {
  const { fields, requiredGroups } = fieldSet
  const columnsByField = new Map<string, TSourceColumn[]>()

  columns.forEach((column) => {
    const field = mapping[column.index]?.field
    if (!field) return
    columnsByField.set(field, [...(columnsByField.get(field) ?? []), column])
  })

  const duplicatedEntries = [...columnsByField].filter(([, mapped]) => mapped.length > 1)
  const duplicateColumns = new Set(duplicatedEntries.flatMap(([, mapped]) => mapped.map((column) => column.index)))
  const blockingIssues: TImportIssue[] = []

  if (rows.length === 0) {
    blockingIssues.push({ id: 'no-rows', message: 'This file has a header row but no data rows to import.' })
  }

  if (columns.length > 0 && columnsByField.size === 0) {
    blockingIssues.push({ id: 'nothing-mapped', message: 'No column is mapped to a field, so there is nothing to import.' })
  }

  requiredGroups.forEach((group, groupIndex) => {
    const labels = formatList(
      group.map((field) => field.label),
      'disjunction',
    )
    const mappedColumns = group.flatMap((field) => columnsByField.get(field.name)?.slice(0, 1) ?? [])
    if (mappedColumns.length === 0) {
      blockingIssues.push({ id: `required:${groupIndex}`, message: `Map a column to ${labels}.` })
      return
    }

    const blankRows = group.length > 1 ? rowsMissingAll(rows, mappedColumns) : []
    if (blankRows.length > 0) {
      blockingIssues.push({
        id: `required-blank:${groupIndex}`,
        message: `Every row needs a value for ${labels}, but ${describeRows(blankRows)} ${blankRows.length === 1 ? 'has' : 'have'} none.`,
        columnIndex: mappedColumns[0].index,
      })
    }
  })

  const labelByField = new Map(fields.map((field) => [field.name, field.label]))
  duplicatedEntries.forEach(([field, mapped]) => {
    blockingIssues.push({
      id: `duplicate:${field}`,
      message: `"${labelByField.get(field) ?? field}" is mapped from ${pluralizeWithCount(mapped.length, 'column')}.`,
      columnIndex: mapped[1].index,
    })
  })

  const mappedColumnCount = [...columnsByField.values()].reduce((total, mapped) => total + mapped.length, 0)

  const columnsWithIssues = new Set([...duplicateColumns, ...blockingIssues.flatMap((issue) => (issue.columnIndex === undefined ? [] : [issue.columnIndex]))])

  return { blockingIssues, columnsWithIssues, duplicateColumns, mappedColumnCount, ignoredColumnCount: columns.length - mappedColumnCount }
}
