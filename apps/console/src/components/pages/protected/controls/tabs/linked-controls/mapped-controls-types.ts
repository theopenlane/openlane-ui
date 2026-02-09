import type { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import { ControlType, SubcontrolType } from '@repo/codegen/src/type-names'

export type MappedControlRow = {
  id: string
  refCode: string
  referenceFramework?: string | null
  mappingType: MappedControlMappingType
  relation?: string | null
  source: MappedControlMappingSource
  nodeType: typeof ControlType | typeof SubcontrolType
  description?: string | null
  status?: string | null
  type?: string | null
  controlSource?: string | null
  category?: string | null
  subcategory?: string | null
}
