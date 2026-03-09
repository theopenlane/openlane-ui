import { GenericTablePageConfig, EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { GenericDetailsSheetConfig, RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import {
  VulnerabilityOrderField,
  VulnerabilityWhereInput,
  CreateVulnerabilityInput,
  CreateVulnerabilityMutation,
  UpdateVulnerabilityInput,
  UpdateVulnerabilityMutation,
  ExportExportType,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { VulnerabilitiesNodeNonNull } from '@/lib/graphql-hooks/vulnerability'
import { VulnerabilityFormData } from '../hooks/use-form-schema'

type TFormData = VulnerabilityFormData
type TData = VulnerabilitiesNodeNonNull
type TUpdateInput = UpdateVulnerabilityInput
type TUpdateData = UpdateVulnerabilityMutation
type TCreateInput = CreateVulnerabilityInput
type TCreateData = CreateVulnerabilityMutation
type TWhereInput = VulnerabilityWhereInput
type TOrderField = VulnerabilityOrderField

export const objectType = ObjectTypes.VULNERABILITY
export const objectName = ObjectNames.VULNERABILITY
export const tableKey = TableKeyEnum.VULNERABILITY
export const exportType = ExportExportType.VULNERABILITY
export const orderFieldEnum = VulnerabilityOrderField
export const defaultSorting = [{ field: VulnerabilityOrderField.updated_at, direction: OrderDirection.DESC }]

type VulnerabilityEnumKeys = 'environmentOptions' | 'scopeOptions' | 'tagOptions'

export type EnumOptions = EnumOptionsGeneric<VulnerabilityEnumKeys>

export type VulnerabilityTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type VulnerabilitySheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>

export type VulnerabilityFieldProps = RenderFieldsProps<TData, TUpdateInput>

export type { EnumCreateHandlers } from '@/components/shared/crud-base/page'
