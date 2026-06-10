// TAccessRole is generated from theopenlane/core's FGA model. Do not hand-edit the list of
// roles — add/remove relations in the backend model and re-run `task codegen:codegen`.
import type { TAccessRole } from '@repo/codegen/src/permissions.generated'

export type { TAccessRole }

export type TPermissionData = {
  success?: boolean
  organization_id?: string
  roles: TAccessRole[]
}

export type TScopesResponse = {
  success: boolean
  /** Keys are object types (e.g. "control"), values are available permission levels (e.g. ["read", "write", "delete"]) */
  scopes: Record<string, string[]>
}
