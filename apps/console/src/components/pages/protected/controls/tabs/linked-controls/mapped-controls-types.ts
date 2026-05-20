import type { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import { type ObjectTypes } from '@repo/codegen/src/type-names'

export type SatisfiesTarget = {
  id: string
  refCode: string
  level: 'control' | 'subcontrol'
  referenceFramework?: string | null
  controlID?: string | null
}

export type MappedControlRow = {
  id: string
  mappedControlId: string
  isSystemOwnedMapping: boolean
  refCode: string
  referenceFramework?: string | null
  mappingType: MappedControlMappingType
  relation?: string | null
  source: MappedControlMappingSource
  nodeType: typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL
  targetId: string
  targetHref?: string
  isEditableTarget?: boolean
  description?: string | null
  status?: string | null
  type?: string | null
  controlSource?: string | null
  category?: string | null
  subcategory?: string | null
  satisfiesTargets?: SatisfiesTarget[]
  inheritedFromSubcontrols?: Array<{ id: string; refCode: string }>
  linkedPolicies?: Array<{ id: string; name: string }>
  evidenceRefs?: Array<{ id: string; name: string; status?: string | null }>
}
