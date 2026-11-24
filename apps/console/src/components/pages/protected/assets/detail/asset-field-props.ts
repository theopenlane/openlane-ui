import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { type AssetDetailNode } from '../asset-display'

export type TAssetSectionProps = {
  asset: AssetDetailNode
  isEditing: boolean
  canEdit: boolean
  internalEditing: string | null
  setInternalEditing: (field: string | null) => void
  handleUpdate: (input: UpdateAssetInput, options?: TPersistOptions) => Promise<void>
}

export const assetFieldProps = ({ asset, isEditing, canEdit, internalEditing, setInternalEditing, handleUpdate }: TAssetSectionProps) => ({
  isEditing,
  isEditAllowed: canEdit,
  isCreate: false,
  data: asset,
  internalEditing,
  setInternalEditing,
  handleUpdate,
})

export const assetRowFieldProps = (props: TAssetSectionProps) => ({
  ...assetFieldProps(props),
  layout: 'horizontal' as const,
  labelClassName: 'text-muted-foreground',
})
