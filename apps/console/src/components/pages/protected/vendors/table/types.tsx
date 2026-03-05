import { GenericTablePageConfig, EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { GenericDetailsSheetConfig, RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import { EntityOrderField, EntityWhereInput, CreateEntityInput, CreateEntityMutation, UpdateEntityInput, UpdateEntityMutation, ExportExportType, OrderDirection } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { EntitiesNodeNonNull } from '@/lib/graphql-hooks/entity'
import { EditVendorFormData } from '../hooks/use-form-schema'

type TFormData = EditVendorFormData // form data for create and update
type TData = EntitiesNodeNonNull // data returned from the list query
type TUpdateInput = UpdateEntityInput // data shape for update mutation
type TUpdateData = UpdateEntityMutation // return type for update mutation
type TCreateInput = CreateEntityInput // data shape for create mutation
type TCreateData = CreateEntityMutation // return type for create mutation
type TWhereInput = EntityWhereInput // where filter shape
type TOrderField = EntityOrderField // order by fields

export const objectType = ObjectTypes.ENTITY
export const objectName = ObjectNames.ENTITY
export const tableKey = TableKeyEnum.VENDOR
export const exportType = ExportExportType.ENTITY
export const orderFieldEnum = EntityOrderField
export const defaultSorting = [{ field: EntityOrderField.name, direction: OrderDirection.ASC }]

type EntityEnumKeys =
  | 'relationshipStateOptions'
  | 'securityQuestionnaireStatusOptions'
  | 'environmentOptions'
  | 'scopeOptions'
  | 'tagOptions'
  | 'reviewFrequencyOptions'
  | 'entityStatusOptions'
  | 'sourceTypeOptions'

export type EnumOptions = EnumOptionsGeneric<EntityEnumKeys>

export type EntityTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type EntitySheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>

export type EntityFieldProps = RenderFieldsProps<TData, TUpdateInput>

export type { EnumCreateHandlers } from '@/components/shared/crud-base/page'
