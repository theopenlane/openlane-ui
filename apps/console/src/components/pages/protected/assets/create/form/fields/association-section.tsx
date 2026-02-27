'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { UpdateAssetInput } from '@repo/codegen/src/schema'
import { useGetAssetAssociations, useUpdateAsset } from '@/lib/graphql-hooks/asset'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion'
import { Section } from '@/components/shared/object-association/types/object-association-types'
import { ASSOCIATION_REMOVAL_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { SetAssetAssociationDialog } from '../../../set-object-association-modal'
import { Panel, PanelHeader } from '@repo/ui/panel'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

type AssociationSectionProps = {
  data?: { id: string }
  isEditing: boolean
  isCreate: boolean
  isEditAllowed: boolean
}

export const AssetAssociationSection = ({ data, isEditing, isCreate, isEditAllowed }: AssociationSectionProps) => {
  const entityId = data?.id
  const form = useFormContext()
  const queryClient = useQueryClient()
  const { data: associationsData } = useGetAssetAssociations(entityId)
  const { mutateAsync: updateAsset } = useUpdateAsset()

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (!associationsData?.asset) return {}
    return {
      scanIDs: (associationsData.asset.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      entityIDs: (associationsData.asset.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      identityHolderIDs: (associationsData.asset.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      controlIDs: (associationsData.asset.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [associationsData])

  useEffect(() => {
    if (!isEditing && Object.keys(initialData).length > 0) {
      Object.entries(initialData).forEach(([key, ids]) => {
        form.setValue(key, ids, { shouldDirty: false })
      })
    }
  }, [initialData, form, isEditing])

  const handleUpdateField = useCallback(
    async (input: UpdateAssetInput) => {
      if (!entityId) return
      await updateAsset({ updateAssetId: entityId, input })
    },
    [updateAsset, entityId],
  )

  const sections: Section = useMemo(() => {
    if (!associationsData?.asset) return {}
    const asset = associationsData.asset

    return {
      scans: asset.scans?.edges?.length
        ? {
            edges: asset.scans.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.target, displayID: '' } : null,
            })),
            totalCount: asset.scans.totalCount,
          }
        : undefined,
      entities: asset.entities?.edges?.length
        ? {
            edges: asset.entities.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.name, displayID: e.node.displayName ?? '' } : null,
            })),
            totalCount: asset.entities.totalCount,
          }
        : undefined,
      identityHolders: asset.identityHolders?.edges?.length
        ? {
            edges: asset.identityHolders.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.fullName, displayID: e.node.displayID } : null,
            })),
            totalCount: asset.identityHolders.totalCount,
          }
        : undefined,
      controls: asset.controls?.edges?.length
        ? {
            edges: asset.controls.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.refCode, refCode: e.node.refCode, displayID: e.node.displayID, description: e.node.description } : null,
            })),
            totalCount: asset.controls.totalCount,
          }
        : undefined,
    }
  }, [associationsData])

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: entityId ?? '',
    handleUpdateField,
    queryClient,
    cacheTargets: [{ queryKey: ['assets', entityId, 'associations'], dataRootField: 'asset' }],
    invalidateQueryKeys: [['assets']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.asset.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.asset.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.asset.sectionKeyToInvalidateQueryKey,
  })

  if (isEditing || isCreate) {
    return (
      <Panel className="mt-5">
        <PanelHeader heading="Associate Related Objects" noBorder />
        <ObjectAssociation
          initialData={initialData}
          onIdChange={(updatedMap) => {
            Object.entries(updatedMap).forEach(([key, ids]) => {
              form.setValue(key, ids, { shouldDirty: true })
            })
          }}
          allowedObjectTypes={[ObjectTypeObjects.SCAN, ObjectTypeObjects.ENTITY, ObjectTypeObjects.IDENTITY_HOLDER, ObjectTypeObjects.CONTROL]}
        />
      </Panel>
    )
  }

  const hasSections = Object.values(sections).some((s) => s?.edges?.length)

  if (!hasSections && !isEditAllowed) return null

  return (
    <Panel className="mt-5">
      <div className="flex items-center justify-between">
        <PanelHeader heading="Associated Objects" noBorder />
        {isEditAllowed && entityId && <SetAssetAssociationDialog assetId={entityId} />}
      </div>
      {hasSections && <AssociatedObjectsAccordion sections={sections} toggleAll={false} removable={isEditAllowed} onRemove={handleRemoveAssociation} />}
    </Panel>
  )
}
