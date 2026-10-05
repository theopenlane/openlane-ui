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
  description?: string
  example?: string
  fuzzyMatchable: boolean
  meta?: ImportFieldMeta
}

export type TDestinationFieldSet = {
  fields: TDestinationField[]
  requiredGroups: TDestinationField[][]
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
