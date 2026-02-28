'use client'

import { useCallback } from 'react'
import { useGetAssetAssociations, useUpdateAsset } from '@/lib/graphql-hooks/asset'
import type { UpdateAssetInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { ASSET_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const AssetAssociationSection = (props: BaseAssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetAssetAssociations(entityId)
  const { mutateAsync: updateAsset } = useUpdateAsset()

  const handleUpdateEntity = useCallback(
    async (input: Partial<UpdateAssetInput>) => {
      if (!entityId) return
      await updateAsset({ updateAssetId: entityId, input })
    },
    [updateAsset, entityId],
  )

  return <AssociationSection {...props} config={ASSET_ASSOCIATION_CONFIG} associationsData={associationsData} onUpdateEntity={handleUpdateEntity} />
}
