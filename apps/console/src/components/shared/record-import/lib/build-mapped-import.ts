import { serializeCsv } from './delimited-file'
import type { TColumnMapping, TDestinationField, TMappedImport, TSourceColumn, TValueMap } from './types'

export type TImportPlan = {
  headers: string[]
  labels: string[]
  autoFilledFields: TDestinationField[]
  remappedFields: { label: string; count: number }[]
  buildRow: (row: string[]) => string[]
}

export const readCell = (row: string[], sourceIndex: number, valueMap: TValueMap | undefined): string => {
  const raw = row[sourceIndex]?.trim() ?? ''
  return valueMap && Object.hasOwn(valueMap, raw) ? (valueMap[raw] ?? '') : raw
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
  const fallbacks = usedFields.map((field) => field.autoValue ?? '')

  return {
    headers: usedFields.map((field) => field.name),
    labels: usedFields.map((field) => field.label),
    autoFilledFields: usedFields.filter((field) => !sourceIndexByField.has(field.name)),
    remappedFields: usedFields.flatMap((field, position) => {
      const count = Object.keys(valueMaps[position] ?? {}).length
      return count > 0 ? [{ label: field.label, count }] : []
    }),
    buildRow: (row) => sourceIndexes.map((sourceIndex, position) => (sourceIndex === undefined ? fallbacks[position] : readCell(row, sourceIndex, valueMaps[position]))),
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
