import { pluralizeWithCount } from '@/utils/strings'
import type { TColumnMapping, TDestinationField, TImportIssue, TSourceColumn } from './types'

export type TMappingValidation = {
  blockingIssues: TImportIssue[]
  columnsWithIssues: Set<number>
  mappedColumnCount: number
  ignoredColumnCount: number
}

export const validateMapping = ({
  columns,
  fields,
  mapping,
  rowCount,
}: {
  columns: TSourceColumn[]
  fields: TDestinationField[]
  mapping: Record<number, TColumnMapping>
  rowCount: number
}): TMappingValidation => {
  const columnsByField = new Map<string, number[]>()

  columns.forEach((column) => {
    const field = mapping[column.index]?.field
    if (!field) return
    columnsByField.set(field, [...(columnsByField.get(field) ?? []), column.index])
  })

  const duplicatedEntries = [...columnsByField].filter(([, indexes]) => indexes.length > 1)
  const columnsWithIssues = new Set(duplicatedEntries.flatMap(([, indexes]) => indexes))
  const blockingIssues: TImportIssue[] = []

  if (rowCount === 0) {
    blockingIssues.push({ id: 'no-rows', message: 'This file has a header row but no data rows to import.' })
  }

  if (columns.length > 0 && columnsByField.size === 0) {
    blockingIssues.push({ id: 'nothing-mapped', message: 'No column is mapped to a field, so there is nothing to import.' })
  }

  fields
    .filter((field) => field.required && !columnsByField.has(field.name))
    .forEach((field) => {
      blockingIssues.push({ id: `required:${field.name}`, message: `"${field.label}" is required and is not mapped to any column.` })
    })

  const labelByField = new Map(fields.map((field) => [field.name, field.label]))
  duplicatedEntries.forEach(([field, indexes]) => {
    blockingIssues.push({
      id: `duplicate:${field}`,
      message: `"${labelByField.get(field) ?? field}" is mapped from ${pluralizeWithCount(indexes.length, 'column')}.`,
      columnIndex: indexes[1],
    })
  })

  const mappedColumnCount = [...columnsByField.values()].reduce((total, indexes) => total + indexes.length, 0)

  return { blockingIssues, columnsWithIssues, mappedColumnCount, ignoredColumnCount: columns.length - mappedColumnCount }
}
