import { serializeCsv } from './delimited-file'
import type { TDateOrder } from '@/utils/loose-date'
import type { TCellConversion, TColumnMapping, TDestinationField, TParsedDelimitedFile, TSourceColumn, TValueMap } from './types'

export type TImportPlan = {
  headers: string[]
  labels: string[]
  autoFilledFields: TDestinationField[]
  remappedFields: { label: string; count: number }[]
  convertedFields: { label: string; rowCount: number; dateOrder?: TDateOrder }[]
  buildRow: (row: string[]) => string[]
}

const readCell = (row: string[], sourceIndex: number, valueMap: TValueMap | undefined, conversion: TCellConversion | undefined): string => {
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
    buildRow: (row) => sourceIndexes.map((sourceIndex, position) => (sourceIndex === undefined ? fallbacks[position] : readCell(row, sourceIndex, valueMaps[position], conversions[position]))),
  }
}

export const buildImportFile = (parsed: TParsedDelimitedFile, plan: TImportPlan): File => {
  const csv = serializeCsv(plan.headers, parsed.rows.map(plan.buildRow))

  return new File([csv], `${parsed.fileName.replace(/\.[^.]+$/, '')}-mapped.csv`, { type: 'text/csv' })
}
