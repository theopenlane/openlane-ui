import { serializeCsv } from './delimited-file'
import type { TColumnMapping, TDestinationField, TParsedDelimitedFile, TSourceColumn } from './types'

export type TImportPlan = {
  headers: string[]
  labels: string[]
  autoFilledFields: TDestinationField[]
  buildRow: (row: string[]) => string[]
}

export const buildImportPlan = ({ columns, fields, mapping }: { columns: TSourceColumn[]; fields: TDestinationField[]; mapping: Record<number, TColumnMapping> }): TImportPlan => {
  const sourceIndexByField = new Map<string, number>()
  columns.forEach((column) => {
    const field = mapping[column.index]?.field
    if (field && !sourceIndexByField.has(field)) sourceIndexByField.set(field, column.index)
  })

  const usedFields = fields.filter((field) => sourceIndexByField.has(field.name) || field.autoValue !== undefined)
  const sourceIndexes = usedFields.map((field) => sourceIndexByField.get(field.name))
  const fallbacks = usedFields.map((field) => field.autoValue ?? '')

  return {
    headers: usedFields.map((field) => field.name),
    labels: usedFields.map((field) => field.label),
    autoFilledFields: usedFields.filter((field) => !sourceIndexByField.has(field.name)),
    buildRow: (row) => sourceIndexes.map((sourceIndex, position) => (sourceIndex === undefined ? fallbacks[position] : (row[sourceIndex]?.trim() ?? ''))),
  }
}

export const buildImportFile = (parsed: TParsedDelimitedFile, plan: TImportPlan): File => {
  const csv = serializeCsv(plan.headers, parsed.rows.map(plan.buildRow))

  return new File([csv], `${parsed.fileName.replace(/\.[^.]+$/, '')}-mapped.csv`, { type: 'text/csv' })
}
