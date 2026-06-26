import { type ObjectTypes } from '@repo/codegen/src/type-names'

export type MappedControlRow = {
  id: string
  refCode: string
  referenceFramework?: string | null
  nodeType: typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL
  targetId: string
  mappedControlReferenceIDs: string[]
  inheritedFromSubcontrols?: Array<{ refCode: string; href: string }>
  description?: string | null
  status?: string | null
  type?: string | null
  controlSource?: string | null
  category?: string | null
  subcategory?: string | null
  linkedPolicies?: Array<{ id: string; name: string }>
  evidenceRefs?: Array<{ id: string; name: string; status?: string | null }>
}
