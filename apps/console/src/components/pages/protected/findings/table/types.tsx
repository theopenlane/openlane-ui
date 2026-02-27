import { GenericTablePageConfig, EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { GenericDetailsSheetConfig, RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import { FindingOrderField, FindingWhereInput, CreateFindingInput, CreateFindingMutation, UpdateFindingInput, UpdateFindingMutation, ExportExportType, OrderDirection } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { FindingsNodeNonNull } from '@/lib/graphql-hooks/finding'
import { FindingFormData } from '../hooks/use-form-schema'

type TFormData = FindingFormData
type TData = FindingsNodeNonNull
type TUpdateInput = UpdateFindingInput
type TUpdateData = UpdateFindingMutation
type TCreateInput = CreateFindingInput
type TCreateData = CreateFindingMutation
type TWhereInput = FindingWhereInput
type TOrderField = FindingOrderField

export const objectType = ObjectTypes.FINDING
export const objectName = ObjectNames.FINDING
export const tableKey = TableKeyEnum.FINDING
export const exportType = ExportExportType.FINDING
export const orderFieldEnum = FindingOrderField
export const defaultSorting = [{ field: FindingOrderField.updated_at, direction: OrderDirection.DESC }]

type FindingEnumKeys = 'environmentOptions' | 'scopeOptions'
export type EnumOptions = EnumOptionsGeneric<FindingEnumKeys>

export type FindingTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>
export type FindingSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>
export type FindingFieldProps = RenderFieldsProps<TData, TUpdateInput>
