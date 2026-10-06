import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { toKebabCase } from '@/utils/strings'

export type TTableAction =
  | 'actions-menu'
  | 'create'
  | 'create-control'
  | 'create-subcontrol'
  | 'create-from-scratch'
  | 'create-from-template'
  | 'add-existing'
  | 'create-custom'
  | 'upload'
  | 'bulk-upload'
  | 'bulk-upload-mappings'
  | 'bulk-update'
  | 'bulk-edit'
  | 'bulk-delete'
  | 'bulk-unlink'
  | 'upload-from-standard'
  | 'import-document'
  | 'view-all-files'
  | 'export'
  | 'export-pdf'
  | 'merge-records'
  | 'send-acknowledgement-request'

export type TEntityAction = 'create' | 'invite'

export type TElementAnchor = { id: string; 'data-testid': string }

export const elementAnchor = (...parts: string[]): TElementAnchor => {
  const name = toKebabCase(...parts)
  return { id: name, 'data-testid': name }
}

export const tableActionAnchor = (entityType: ObjectTypes, action: TTableAction): TElementAnchor => elementAnchor(entityType, 'table', action)

export const reportActionAnchor = (entityType: ObjectTypes, action: TTableAction): TElementAnchor => elementAnchor(entityType, 'report', action)

export const entityActionAnchor = (entityType: ObjectTypes, action: TEntityAction): TElementAnchor => elementAnchor(entityType, action)
