export type TSuggestedConfidence = 'exact' | 'normalized' | 'alias' | 'pattern' | 'none'

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
  required: boolean
  autoValue?: string
}

export type TSourceColumn = {
  index: number
  header: string
  values: string[]
  filledCount: number
}

export type TColumnMapping = {
  field: string | null
  confidence: TMatchConfidence
}

export type TImportIssue = {
  id: string
  message: string
  columnIndex?: number
}
