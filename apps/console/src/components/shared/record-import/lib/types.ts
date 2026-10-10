import type { ImportFieldMeta } from '@repo/codegen/src/import-fields.generated'
import type { TDateOrder } from '@/utils/loose-date'

export type TSuggestedConfidence = 'exact' | 'normalized' | 'alias' | 'suggested' | 'pattern' | 'none'

export type TMatchConfidence = TSuggestedConfidence | 'manual'

export type TParsedDelimitedFile = {
  fileName: string
  fileSize: number
  headers: string[]
  rows: string[][]
  malformed: boolean
  raggedRowCount: number
}

export type TDestinationField = {
  name: string
  label: string
  requirement?: 'required' | 'oneOf'
  autoValue?: string
  autoValueLabel?: string
  description?: string
  example?: string
  fuzzyMatchable: boolean
  meta?: ImportFieldMeta
  format?: 'url'
  blankIsInvalid?: boolean
  aliases?: readonly string[]
}

export type TDestinationFieldSet = {
  fields: TDestinationField[]
  fixedFields: TDestinationField[]
  requiredGroups: TDestinationField[][]
  uniqueFields: TDestinationField[]
  primaryField?: string
}

export type TSourceColumn = {
  index: number
  header: string
  values: string[]
  filledCount: number
}

export type TValueMap = Readonly<Record<string, string | null>>

export type TColumnMapping = {
  field: string | null
  confidence: TMatchConfidence
  valueMap?: TValueMap
  conversion?: TCellConversion
}

export type TCellConversion = {
  values: Readonly<Record<string, string>>
  rowCount: number
  dateOrder?: TDateOrder
}

export type TImportIssue = {
  id: string
  message: string
  columnIndex?: number
}

export type TImportRecord = Readonly<Partial<Record<string, string>>>

export type TMappedImport = {
  toFile: () => File
  toRecords: () => TImportRecord[]
}

export type TImportDestination = {
  fieldSet: TDestinationFieldSet
  exampleCsv: string
  exampleFilename: string
}

export type TImportAutomaticValue = { label: string; value: string }
