'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { UpdateEntityInput } from '@repo/codegen/src/schema'
import { useGetEntityAssociations, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion'
import { Section } from '@/components/shared/object-association/types/object-association-types'
import { ASSOCIATION_REMOVAL_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { SetEntityAssociationDialog } from '../../../set-object-association-modal'
import { Panel, PanelHeader } from '@repo/ui/panel'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

type AssociationSectionProps = {
  data?: { id: string }
  isEditing: boolean
  isCreate: boolean
  isEditAllowed: boolean
}

export const EntityAssociationSection = ({ data, isEditing, isCreate, isEditAllowed }: AssociationSectionProps) => {
  const entityId = data?.id
  const form = useFormContext()
  const queryClient = useQueryClient()
  const { data: associationsData } = useGetEntityAssociations(entityId)
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (!associationsData?.entity) return {}
    return {
      assetIDs: (associationsData.entity.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      scanIDs: (associationsData.entity.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      campaignIDs: (associationsData.entity.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      identityHolderIDs: (associationsData.entity.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [associationsData])

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      Object.entries(initialData).forEach(([key, ids]) => {
        form.setValue(key, ids, { shouldDirty: false })
      })
    }
  }, [initialData, form])

  const handleUpdateField = useCallback(
    async (input: UpdateEntityInput) => {
      if (!entityId) return
      await updateEntity({ updateEntityId: entityId, input })
    },
    [updateEntity, entityId],
  )

  const sections: Section = useMemo(() => {
    if (!associationsData?.entity) return {}
    const entity = associationsData.entity

    return {
      assets: entity.assets?.edges?.length
        ? {
            edges: entity.assets.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.name, displayID: e.node.displayName ?? '' } : null,
            })),
            totalCount: entity.assets.totalCount,
          }
        : undefined,
      scans: entity.scans?.edges?.length
        ? {
            edges: entity.scans.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.target, displayID: '' } : null,
            })),
            totalCount: entity.scans.totalCount,
          }
        : undefined,
      campaigns: entity.campaigns?.edges?.length
        ? {
            edges: entity.campaigns.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.name, displayID: e.node.displayID } : null,
            })),
            totalCount: entity.campaigns.totalCount,
          }
        : undefined,
      identityHolders: entity.identityHolders?.edges?.length
        ? {
            edges: entity.identityHolders.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.fullName, displayID: e.node.displayID } : null,
            })),
            totalCount: entity.identityHolders.totalCount,
          }
        : undefined,
    }
  }, [associationsData])

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: entityId ?? '',
    handleUpdateField,
    queryClient,
    cacheTargets: [{ queryKey: ['entities', entityId, 'associations'], dataRootField: 'entity' }],
    invalidateQueryKeys: [['entities']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.entity.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.entity.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.entity.sectionKeyToInvalidateQueryKey,
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
          allowedObjectTypes={[ObjectTypeObjects.ASSET, ObjectTypeObjects.SCAN, ObjectTypeObjects.CAMPAIGN, ObjectTypeObjects.IDENTITY_HOLDER]}
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
        {isEditAllowed && entityId && <SetEntityAssociationDialog entityId={entityId} />}
      </div>
      {hasSections && <AssociatedObjectsAccordion sections={sections} toggleAll={false} removable={isEditAllowed} onRemove={handleRemoveAssociation} />}
    </Panel>
  )
}
