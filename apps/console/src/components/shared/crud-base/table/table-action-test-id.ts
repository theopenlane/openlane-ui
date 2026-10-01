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

export type TEntityAction = 'create' | 'invite'

export const tableActionTestId = (entityType: ObjectTypes, action: TTableAction): string => toKebabCase(entityType, 'table', action)

export const reportActionTestId = (entityType: ObjectTypes, action: TTableAction): string => toKebabCase(entityType, 'report', action)

export const entityActionTestId = (entityType: ObjectTypes, action: TEntityAction): string => toKebabCase(entityType, action)
