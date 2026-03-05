import { GenericTablePageConfig, EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { GenericDetailsSheetConfig, RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import { AssetOrderField, AssetWhereInput, CreateAssetInput, CreateAssetMutation, UpdateAssetInput, UpdateAssetMutation, ExportExportType, OrderDirection } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { AssetsNodeNonNull } from '@/lib/graphql-hooks/asset'
import { AssetFormData } from '../hooks/use-form-schema'

type TFormData = AssetFormData // form data for create and update
type TData = AssetsNodeNonNull // data returned from the list query
type TUpdateInput = UpdateAssetInput // data shape for update mutation
type TUpdateData = UpdateAssetMutation // return type for update mutation
type TCreateInput = CreateAssetInput // data shape for create mutation
type TCreateData = CreateAssetMutation // return type for create mutation
type TWhereInput = AssetWhereInput // where filter shape
type TOrderField = AssetOrderField // order by fields

export const objectType = ObjectTypes.ASSET
export const objectName = ObjectNames.ASSET
export const tableKey = TableKeyEnum.ASSET
export const exportType = ExportExportType.ASSET
export const orderFieldEnum = AssetOrderField
export const defaultSorting = [{ field: AssetOrderField.name, direction: OrderDirection.ASC }]

type AssetEnumKeys =
  | 'accessModelOptions'
  | 'assetDataClassificationOptions'
  | 'assetTypeOptions'
  | 'assetSubtypeOptions'
  | 'assetSourceTypeOptions'
  | 'criticalityOptions'
  | 'encryptionStatusOptions'
  | 'environmentOptions'
  | 'tagOptions'
  | 'scopeOptions'
  | 'securityTierOptions'

export type EnumOptions = EnumOptionsGeneric<AssetEnumKeys>

export type AssetTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type AssetSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>

export type AssetFieldProps = RenderFieldsProps<TData, TUpdateInput>

export type { EnumCreateHandlers } from '@/components/shared/crud-base/page'
