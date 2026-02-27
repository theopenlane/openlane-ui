'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { useGetIdentityHolderAssociations, useUpdateIdentityHolder } from '@/lib/graphql-hooks/identity-holder'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion'
import { Section } from '@/components/shared/object-association/types/object-association-types'
import { ASSOCIATION_REMOVAL_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { SetIdentityHolderAssociationDialog } from '../../../set-object-association-modal'
import { Panel, PanelHeader } from '@repo/ui/panel'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

type AssociationSectionProps = {
  data?: { id: string }
  isEditing: boolean
  isCreate: boolean
  isEditAllowed: boolean
}

export const IdentityHolderAssociationSection = ({ data, isEditing, isCreate, isEditAllowed }: AssociationSectionProps) => {
  const entityId = data?.id
  const form = useFormContext()
  const queryClient = useQueryClient()
  const { data: associationsData } = useGetIdentityHolderAssociations(entityId)
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (!associationsData?.identityHolder) return {}
    return {
      assetIDs: (associationsData.identityHolder.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      entityIDs: (associationsData.identityHolder.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      campaignIDs: (associationsData.identityHolder.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (associationsData.identityHolder.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
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
    async (input: UpdateIdentityHolderInput) => {
      if (!entityId) return
      await updateIdentityHolder({ updateIdentityHolderId: entityId, input })
    },
    [updateIdentityHolder, entityId],
  )

  const sections: Section = useMemo(() => {
    if (!associationsData?.identityHolder) return {}
    const identityHolder = associationsData.identityHolder

    return {
      assets: identityHolder.assets?.edges?.length
        ? {
            edges: identityHolder.assets.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.name, displayID: e.node.displayName ?? '' } : null,
            })),
            totalCount: identityHolder.assets.totalCount,
          }
        : undefined,
      entities: identityHolder.entities?.edges?.length
        ? {
            edges: identityHolder.entities.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.name, displayID: e.node.displayName ?? '' } : null,
            })),
            totalCount: identityHolder.entities.totalCount,
          }
        : undefined,
      campaigns: identityHolder.campaigns?.edges?.length
        ? {
            edges: identityHolder.campaigns.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.name, displayID: e.node.displayID } : null,
            })),
            totalCount: identityHolder.campaigns.totalCount,
          }
        : undefined,
      tasks: identityHolder.tasks?.edges?.length
        ? {
            edges: identityHolder.tasks.edges.map((e) => ({
              node: e?.node ? { id: e.node.id, name: e.node.title, title: e.node.title, displayID: e.node.displayID } : null,
            })),
            totalCount: identityHolder.tasks.totalCount,
          }
        : undefined,
    }
  }, [associationsData])

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: entityId ?? '',
    handleUpdateField,
    queryClient,
    cacheTargets: [{ queryKey: ['identityHolders', entityId, 'associations'], dataRootField: 'identityHolder' }],
    invalidateQueryKeys: [['identityHolders']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.identityHolder.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.identityHolder.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.identityHolder.sectionKeyToInvalidateQueryKey,
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
          allowedObjectTypes={[ObjectTypeObjects.ASSET, ObjectTypeObjects.ENTITY, ObjectTypeObjects.CAMPAIGN, ObjectTypeObjects.TASK]}
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
        {isEditAllowed && entityId && <SetIdentityHolderAssociationDialog identityHolderId={entityId} />}
      </div>
      {hasSections && <AssociatedObjectsAccordion sections={sections} toggleAll={false} removable={isEditAllowed} onRemove={handleRemoveAssociation} />}
    </Panel>
  )
}
