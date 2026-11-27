import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { type TAssociationUpdateInput } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'
import { useBulkEditAsset, useUpdateAsset } from '@/lib/graphql-hooks/asset'
import { parseErrorMessage, UserFacingError } from '@/utils/graphQlErrorMatcher'

type TConnectionsInput = TAssociationUpdateInput<'connectedFromIDs' | 'connectedAssetIDs'>

export const useSaveAssetConnections = (assetId: string) => {
  const { mutateAsync: updateAsset } = useUpdateAsset()
  const { mutateAsync: updateAssets } = useBulkEditAsset()
  const { successNotification, errorNotification } = useNotification()

  const updateTargets = async (ids: string[] | undefined, input: UpdateAssetInput) => {
    if (!ids?.length) return
    const { updateBulkAsset } = await updateAssets({ ids, input })
    if (updateBulkAsset.notUpdatedIDs?.length) throw new UserFacingError('Some assets could not be connected. You may not have permission to edit them.')
  }

  return async ({ addConnectedAssetIDs, removeConnectedAssetIDs, ...incoming }: TConnectionsInput) => {
    try {
      if (Object.keys(incoming).length > 0) await updateAsset({ updateAssetId: assetId, input: incoming })
      await updateTargets(addConnectedAssetIDs, { addConnectedFromIDs: [assetId] })
      await updateTargets(removeConnectedAssetIDs, { removeConnectedFromIDs: [assetId] })
      successNotification({ title: 'Connections updated' })
    } catch (error) {
      errorNotification({ title: 'Failed to update connections', description: parseErrorMessage(error) })
      throw error
    }
  }
}
