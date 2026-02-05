import type { GetSubcontrolsPaginatedQuery } from '@repo/codegen/src/schema'

export type SubcontrolsPaginatedEdge = NonNullable<NonNullable<NonNullable<GetSubcontrolsPaginatedQuery['subcontrols']>['edges']>[number]>
export type SubcontrolsPaginatedNode = NonNullable<SubcontrolsPaginatedEdge['node']>

export type LinkedControlDetails = {
  description?: string | null
  status?: string | null
  type?: string | null
  controlSource?: string | null
  category?: string | null
  subcategory?: string | null
}
