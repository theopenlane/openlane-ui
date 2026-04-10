import { type EnumOptionsGeneric, type GenericTablePageConfig } from '@/components/shared/crud-base/page'
import { type GenericDetailsSheetConfig, type RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'
import { type SystemDetailsNodeNonNull } from '@/lib/graphql-hooks/system-detail'
import { type SystemDetailFormData } from '../hooks/use-form-schema'
import {
  type CreateSystemDetailInput,
  type CreateSystemDetailMutation,
  ExportExportType,
  OrderDirection,
  SystemDetailOrderField,
  type SystemDetailWhereInput,
  type UpdateSystemDetailInput,
  type UpdateSystemDetailMutation,
} from '@repo/codegen/src/schema'
import { ObjectNames, ObjectTypes } from '@repo/codegen/src/type-names'
import { TableKeyEnum } from '@repo/ui/table-key'

type TFormData = SystemDetailFormData
type TData = SystemDetailsNodeNonNull
type TUpdateInput = UpdateSystemDetailInput
type TUpdateData = UpdateSystemDetailMutation
type TCreateInput = CreateSystemDetailInput
type TCreateData = CreateSystemDetailMutation
type TWhereInput = SystemDetailWhereInput
type TOrderField = SystemDetailOrderField

export const objectType = ObjectTypes.SYSTEM_DETAIL
export const objectName = ObjectNames.SYSTEM_DETAIL
export const tableKey = TableKeyEnum.SYSTEM_DETAIL
export const exportType = ExportExportType.SYSTEM_DETAIL
export const orderFieldEnum = SystemDetailOrderField
export const defaultSorting = [{ field: SystemDetailOrderField.system_name, direction: OrderDirection.ASC }]

type SystemDetailEnumKeys = 'sensitivityLevelOptions' | 'tagOptions' | 'platformOptions' | 'programOptions'

export type EnumOptions = EnumOptionsGeneric<SystemDetailEnumKeys>

export type SystemDetailTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type SystemDetailSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>

export type SystemDetailFieldProps = RenderFieldsProps<TData, TUpdateInput>
