import { serializeCsv } from './delimited-file'
import { enumCanonicalizer } from './validate-cells'
import type { TDateOrder } from '@/utils/loose-date'
import type { TCellConversion, TColumnMapping, TDestinationField, TMappedImport, TSourceColumn, TValueMap } from './types'

export type TImportPlan = {
  headers: string[]
  labels: string[]
  autoFilledFields: TDestinationField[]
  remappedFields: { label: string; count: number }[]
  convertedFields: { label: string; rowCount: number; dateOrder?: TDateOrder }[]
  buildRow: (row: string[]) => string[]
}

export const readCell = (row: string[], sourceIndex: number, valueMap: TValueMap | undefined, conversion?: TCellConversion): string => {
  const raw = row[sourceIndex]?.trim() ?? ''
  if (valueMap && Object.hasOwn(valueMap, raw)) return valueMap[raw] ?? ''
  return conversion && Object.hasOwn(conversion.values, raw) ? conversion.values[raw] : raw
}

export const buildImportPlan = ({ columns, fields, mapping }: { columns: TSourceColumn[]; fields: TDestinationField[]; mapping: Record<number, TColumnMapping> }): TImportPlan => {
  const sourceIndexByField = new Map<string, number>()
  columns.forEach((column) => {
    const field = mapping[column.index]?.field
    if (field && !sourceIndexByField.has(field)) sourceIndexByField.set(field, column.index)
  })

  const usedFields = fields.filter((field) => sourceIndexByField.has(field.name) || field.autoValue !== undefined)
  const sourceIndexes = usedFields.map((field) => sourceIndexByField.get(field.name))
  const valueMaps = sourceIndexes.map((sourceIndex) => (sourceIndex === undefined ? undefined : mapping[sourceIndex]?.valueMap))
  const conversions = sourceIndexes.map((sourceIndex) => (sourceIndex === undefined ? undefined : mapping[sourceIndex]?.conversion))
  const fallbacks = usedFields.map((field) => field.autoValue ?? '')
  const canonicalizers = usedFields.map((field) => enumCanonicalizer(field.meta))
  const readValue = (row: string[], position: number): string => {
    const sourceIndex = sourceIndexes[position]
    if (sourceIndex === undefined) return fallbacks[position]
    const value = readCell(row, sourceIndex, valueMaps[position], conversions[position])
    return canonicalizers[position]?.(value) ?? value
  }

  return {
    headers: usedFields.map((field) => field.name),
    labels: usedFields.map((field) => field.label),
    autoFilledFields: usedFields.filter((field) => !sourceIndexByField.has(field.name)),
    remappedFields: usedFields.flatMap((field, position) => {
      const count = Object.keys(valueMaps[position] ?? {}).length
      return count > 0 ? [{ label: field.label, count }] : []
    }),
    convertedFields: usedFields.flatMap((field, position) => {
      const conversion = conversions[position]
      return conversion ? [{ label: field.label, rowCount: conversion.rowCount, dateOrder: conversion.dateOrder }] : []
    }),
    buildRow: (row) => usedFields.map((_field, position) => readValue(row, position)),
  }
}

export const buildMappedImport = (fileName: string, rows: string[][], plan: TImportPlan): TMappedImport => ({
  toFile: () => new File([serializeCsv(plan.headers, rows.map(plan.buildRow))], `${fileName.replace(/\.[^.]+$/, '')}-mapped.csv`, { type: 'text/csv' }),
  toRecords: () =>
    rows.map((row) => {
      const values = plan.buildRow(row)
      return Object.fromEntries(plan.headers.map((header, position) => [header, values[position]]))
    }),
})
