import { formatList, formatTruncatedList, pluralizeWithCount } from '@/utils/strings'
import type { TColumnMapping, TDestinationFieldSet, TImportIssue, TSourceColumn } from './types'
import { unresolvedValues, type TColumnCellCheck } from './validate-cells'

export type TMappingValidation = {
  blockingIssues: TImportIssue[]
  unresolvedValueCounts: Map<number, number>
  columnsWithIssues: Set<number>
  duplicateColumns: Set<number>
  mappedColumnCount: number
  ignoredColumnCount: number
}

const ROW_NUMBERS_SHOWN = 5
const INVALID_VALUES_SHOWN = 3
const HEADER_ROW_OFFSET = 2

const describeRows = (firstRowIndexes: number[], total: number): string =>
  `${total === 1 ? 'row' : 'rows'} ${formatTruncatedList(
    firstRowIndexes.map((index) => String(index + HEADER_ROW_OFFSET)),
    total,
    ROW_NUMBERS_SHOWN,
  )} ${total === 1 ? 'has' : 'have'}`

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
  cellChecks,
}: {
  columns: TSourceColumn[]
  fieldSet: TDestinationFieldSet
  mapping: Record<number, TColumnMapping>
  rows: string[][]
  cellChecks: ReadonlyMap<number, TColumnCellCheck>
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
        message: `Every row needs a value for ${labels}, but ${describeRows(blankRows, blankRows.length)} none.`,
        columnIndex: mappedColumns[0].index,
      })
    }
  })

  const fieldByName = new Map(fields.map((field) => [field.name, field]))
  duplicatedEntries.forEach(([field, mapped]) => {
    blockingIssues.push({
      id: `duplicate:${field}`,
      message: `"${fieldByName.get(field)?.label ?? field}" is mapped from ${pluralizeWithCount(mapped.length, 'column')}.`,
      columnIndex: mapped[1].index,
    })
  })

  const unresolvedValueCounts = new Map<number, number>()
  cellChecks.forEach((check, columnIndex) => {
    const field = fieldByName.get(mapping[columnIndex]?.field ?? '')
    const unresolved = unresolvedValues(check, mapping[columnIndex]?.valueMap)
    unresolvedValueCounts.set(columnIndex, unresolved.length)
    if (!field || unresolved.length === 0) return

    const totalRows = unresolved.reduce((total, invalid) => total + invalid.rowIndexes.length, 0)
    const firstRows = unresolved
      .flatMap((invalid) => invalid.rowIndexes.slice(0, ROW_NUMBERS_SHOWN))
      .sort((a, b) => a - b)
      .slice(0, ROW_NUMBERS_SHOWN)
    const values = formatTruncatedList(
      unresolved.map((invalid) => (invalid.value ? `"${invalid.value}"` : 'a blank cell')),
      unresolved.length,
      INVALID_VALUES_SHOWN,
    )
    const remedy = check.mappableValues ? ' Map the values to fix it.' : check.tooManyToMap ? ' There are too many distinct values to map here, so fix them in the file.' : ''

    blockingIssues.push({
      id: `cells:${columnIndex}`,
      message: `"${field.label}" expects ${check.expected}, but ${describeRows(firstRows, totalRows)} ${values}.${remedy}`,
      columnIndex,
    })
  })

  const mappedColumnCount = [...columnsByField.values()].reduce((total, mapped) => total + mapped.length, 0)

  const columnsWithIssues = new Set([...duplicateColumns, ...blockingIssues.flatMap((issue) => (issue.columnIndex === undefined ? [] : [issue.columnIndex]))])

  return { blockingIssues, unresolvedValueCounts, columnsWithIssues, duplicateColumns, mappedColumnCount, ignoredColumnCount: columns.length - mappedColumnCount }
}
