import type { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'

export type MappedControlRow = {
  id: string
  refCode: string
  referenceFramework?: string | null
  mappingType: MappedControlMappingType
  relation?: string | null
  source: MappedControlMappingSource
  nodeType: 'Control' | 'Subcontrol'
  description?: string | null
  status?: string | null
  type?: string | null
  controlSource?: string | null
  category?: string | null
  subcategory?: string | null
}
