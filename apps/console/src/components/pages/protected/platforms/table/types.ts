import { type GenericTablePageConfig, type EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { type GenericDetailsSheetConfig, type RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'
import {
  PlatformOrderField,
  type PlatformWhereInput,
  type CreatePlatformInput,
  type CreatePlatformMutation,
  type UpdatePlatformInput,
  type UpdatePlatformMutation,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { type PlatformsNodeNonNull } from '@/lib/graphql-hooks/platform'
import { type EditPlatformFormData } from '../hooks/use-form-schema'

type TFormData = EditPlatformFormData
type TData = PlatformsNodeNonNull
type TUpdateInput = UpdatePlatformInput
type TUpdateData = UpdatePlatformMutation
type TCreateInput = CreatePlatformInput
type TCreateData = CreatePlatformMutation
type TWhereInput = PlatformWhereInput
type TOrderField = PlatformOrderField

export const objectType = ObjectTypes.PLATFORM
export const objectName = ObjectNames.PLATFORM
export const displayName = 'Platform'
export const tableKey = TableKeyEnum.PLATFORM
export const orderFieldEnum = PlatformOrderField
export const defaultSorting = [{ field: PlatformOrderField.name, direction: OrderDirection.ASC }]

type PlatformEnumKeys = 'statusOptions' | 'environmentOptions' | 'scopeOptions'

export type EnumOptions = EnumOptionsGeneric<PlatformEnumKeys>

export type PlatformTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type PlatformSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>

export type PlatformFieldProps = RenderFieldsProps<TData, TUpdateInput>
