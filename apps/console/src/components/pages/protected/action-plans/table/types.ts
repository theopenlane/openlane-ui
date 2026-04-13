import { type GenericTablePageConfig, type EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { type GenericDetailsSheetConfig, type RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import {
  ActionPlanOrderField,
  type ActionPlanWhereInput,
  type CreateActionPlanInput,
  type CreateActionPlanMutation,
  type UpdateActionPlanInput,
  type UpdateActionPlanMutation,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { type ActionPlansNodeNonNull } from '@/lib/graphql-hooks/action-plan'
import { type ActionPlanFormData } from '../hooks/use-form-schema'

type TFormData = ActionPlanFormData
type TData = ActionPlansNodeNonNull
type TUpdateInput = UpdateActionPlanInput
type TUpdateData = UpdateActionPlanMutation
type TCreateInput = CreateActionPlanInput
type TCreateData = CreateActionPlanMutation
type TWhereInput = ActionPlanWhereInput
type TOrderField = ActionPlanOrderField

export const objectType = ObjectTypes.ACTION_PLAN
export const objectName = ObjectNames.ACTION_PLAN
export const tableKey = TableKeyEnum.ACTION_PLAN
export const orderFieldEnum = ActionPlanOrderField
export const defaultSorting = [{ field: ActionPlanOrderField.updated_at, direction: OrderDirection.DESC }]

type ActionPlanEnumKeys = never
export type EnumOptions = EnumOptionsGeneric<ActionPlanEnumKeys>

export type ActionPlanTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>
export type ActionPlanSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>
export type ActionPlanFieldProps = RenderFieldsProps<TData, TUpdateInput>

export type { EnumCreateHandlers } from '@/components/shared/crud-base/page'
