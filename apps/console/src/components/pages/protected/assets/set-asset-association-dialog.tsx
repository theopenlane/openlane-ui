import { useCallback, type ReactNode } from 'react'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { ASSET_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { asAssociationsData } from '@/components/shared/object-association/utils'
import { useGetAssetAssociations, useUpdateAsset } from '@/lib/graphql-hooks/asset'

type TSetAssetAssociationDialogProps = {
  assetId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SetAssetAssociationDialog = ({ assetId, trigger, defaultSelectedObject, allowedObjectTypes, open, onOpenChange }: TSetAssetAssociationDialogProps) => {
  const { data } = useGetAssetAssociations(assetId)
  const { mutateAsync: updateAsset } = useUpdateAsset()

  const handleUpdate = useCallback(
    async (input: Partial<UpdateAssetInput>) => {
      await updateAsset({ updateAssetId: assetId, input })
    },
    [updateAsset, assetId],
  )

  return (
    <SetAssociationDialog
      config={ASSET_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={asAssociationsData(data)}
      onUpdate={handleUpdate}
      trigger={trigger}
      defaultSelectedObject={defaultSelectedObject}
      allowedObjectTypes={allowedObjectTypes}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
