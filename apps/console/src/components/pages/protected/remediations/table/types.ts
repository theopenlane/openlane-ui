import { GenericTablePageConfig, EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { GenericDetailsSheetConfig, RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import {
  RemediationOrderField,
  RemediationWhereInput,
  CreateRemediationInput,
  CreateRemediationMutation,
  UpdateRemediationInput,
  UpdateRemediationMutation,
  ExportExportType,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { RemediationsNodeNonNull } from '@/lib/graphql-hooks/remediation'
import { RemediationFormData } from '../hooks/use-form-schema'

type TFormData = RemediationFormData
type TData = RemediationsNodeNonNull
type TUpdateInput = UpdateRemediationInput
type TUpdateData = UpdateRemediationMutation
type TCreateInput = CreateRemediationInput
type TCreateData = CreateRemediationMutation
type TWhereInput = RemediationWhereInput
type TOrderField = RemediationOrderField

export const objectType = ObjectTypes.REMEDIATION
export const objectName = ObjectNames.REMEDIATION
export const tableKey = TableKeyEnum.REMEDIATION
export const exportType = ExportExportType.REMEDIATION
export const orderFieldEnum = RemediationOrderField
export const defaultSorting = [{ field: RemediationOrderField.updated_at, direction: OrderDirection.DESC }]

type RemediationEnumKeys = 'environmentOptions' | 'scopeOptions'
export type EnumOptions = EnumOptionsGeneric<RemediationEnumKeys>

export type RemediationTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>
export type RemediationSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>
export type RemediationFieldProps = RenderFieldsProps<TData, TUpdateInput>

export type EnumCreateHandlers = Partial<Record<string, (value: string) => Promise<void>>>
