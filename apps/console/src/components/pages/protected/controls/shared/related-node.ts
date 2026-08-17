import { type MappedControlMappingSource, type MappedControlMappingType } from '@repo/codegen/src/schema'
import { type ObjectTypes } from '@repo/codegen/src/type-names'

export type RelatedNode = {
  type: typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL
  id: string
  refCode: string
  referenceFramework?: string | null
  controlId?: string
  mappingType: MappedControlMappingType
  relation?: string | null
  source: MappedControlMappingSource
}

export type GroupedControls = Record<string, RelatedNode[]>
