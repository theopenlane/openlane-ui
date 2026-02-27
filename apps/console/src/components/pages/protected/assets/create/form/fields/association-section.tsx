'use client'

import React, { useCallback } from 'react'
import { useGetAssetAssociations, useUpdateAsset } from '@/lib/graphql-hooks/asset'
import { UpdateAssetInput } from '@repo/codegen/src/schema'
import { AssociationSection, type AssociationsData } from '@/components/shared/object-association/association-section'
import { ASSET_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'

type AssociationSectionProps = {
  data?: { id: string }
  isEditing: boolean
  isCreate: boolean
  isEditAllowed: boolean
}

const AssetSetAssociationDialog = ({ entityId }: { entityId: string }) => {
  const { data: associationsData } = useGetAssetAssociations(entityId)
  const { mutateAsync: updateAsset } = useUpdateAsset()

  const handleUpdate = useCallback(
    async (input: Record<string, unknown>) => {
      await updateAsset({ updateAssetId: entityId, input: input as UpdateAssetInput })
    },
    [updateAsset, entityId],
  )

  return <SetAssociationDialog config={ASSET_ASSOCIATION_CONFIG.dialogConfig} associationsData={associationsData as AssociationsData | undefined} onUpdate={handleUpdate} />
}

export const AssetAssociationSection = (props: AssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetAssetAssociations(entityId)
  const { mutateAsync: updateAsset } = useUpdateAsset()

  const handleUpdateEntity = useCallback(
    async (input: Record<string, unknown>) => {
      if (!entityId) return
      await updateAsset({ updateAssetId: entityId, input: input as UpdateAssetInput })
    },
    [updateAsset, entityId],
  )

  return (
    <AssociationSection
      {...props}
      config={ASSET_ASSOCIATION_CONFIG}
      associationsData={associationsData as AssociationsData | undefined}
      onUpdateEntity={handleUpdateEntity}
      SetAssociationDialog={AssetSetAssociationDialog}
    />
  )
}
