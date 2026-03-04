import { type GenericTablePageConfig, type EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { type GenericDetailsSheetConfig, type RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import { ScanOrderField, type ScanWhereInput, type CreateScanInput, type CreateScanMutation, type UpdateScanInput, type UpdateScanMutation, OrderDirection } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { type ScansNodeNonNull } from '@/lib/graphql-hooks/scan'
import { type ScanFormData } from '../hooks/use-form-schema'

type TFormData = ScanFormData
type TData = ScansNodeNonNull
type TUpdateInput = UpdateScanInput
type TUpdateData = UpdateScanMutation
type TCreateInput = CreateScanInput
type TCreateData = CreateScanMutation
type TWhereInput = ScanWhereInput
type TOrderField = ScanOrderField

export const objectType = ObjectTypes.SCAN
export const objectName = ObjectNames.SCAN
export const tableKey = TableKeyEnum.SCAN
export const orderFieldEnum = ScanOrderField
export const defaultSorting = [{ field: ScanOrderField.updated_at, direction: OrderDirection.DESC }]

type ScanEnumKeys = 'environmentOptions' | 'scopeOptions' | 'statusOptions' | 'scanTypeOptions'
export type EnumOptions = EnumOptionsGeneric<ScanEnumKeys>

export type ScanTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>
export type ScanSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>
export type ScanFieldProps = RenderFieldsProps<TData, TUpdateInput>
