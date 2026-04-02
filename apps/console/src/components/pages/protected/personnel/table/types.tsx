import { type GenericTablePageConfig, type EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { type GenericDetailsSheetConfig, type RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import {
  IdentityHolderOrderField,
  type IdentityHolderWhereInput,
  type CreateIdentityHolderInput,
  type CreateIdentityHolderMutation,
  type UpdateIdentityHolderInput,
  type UpdateIdentityHolderMutation,
  ExportExportType,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { type IdentityHoldersNodeNonNull } from '@/lib/graphql-hooks/identity-holder'
import { type EditPersonnelFormData } from '../hooks/use-form-schema'

type TFormData = EditPersonnelFormData
type TData = IdentityHoldersNodeNonNull
type TUpdateInput = UpdateIdentityHolderInput
type TUpdateData = UpdateIdentityHolderMutation
type TCreateInput = CreateIdentityHolderInput
type TCreateData = CreateIdentityHolderMutation
type TWhereInput = IdentityHolderWhereInput
type TOrderField = IdentityHolderOrderField

export const objectType = ObjectTypes.IDENTITY_HOLDER
export const objectName = ObjectNames.IDENTITY_HOLDER
export const displayName = 'Personnel'
export const tableKey = TableKeyEnum.IDENTITY_HOLDER
export const exportType = ExportExportType.IDENTITY_HOLDER
export const orderFieldEnum = IdentityHolderOrderField
export const defaultSorting = [{ field: IdentityHolderOrderField.full_name, direction: OrderDirection.ASC }]

type PersonnelEnumKeys = 'statusOptions' | 'identityHolderTypeOptions' | 'environmentOptions' | 'scopeOptions' | 'tagOptions'

export type EnumOptions = EnumOptionsGeneric<PersonnelEnumKeys>

export type PersonnelTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type PersonnelSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>

export type PersonnelFieldProps = RenderFieldsProps<TData, TUpdateInput>

export type { EnumCreateHandlers } from '@/components/shared/crud-base/page'
