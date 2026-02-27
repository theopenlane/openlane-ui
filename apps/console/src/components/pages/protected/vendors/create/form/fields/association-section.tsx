'use client'

import React, { useCallback } from 'react'
import { useGetEntityAssociations, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { UpdateEntityInput } from '@repo/codegen/src/schema'
import { AssociationSection, type AssociationsData } from '@/components/shared/object-association/association-section'
import { ENTITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'

type AssociationSectionProps = {
  data?: { id: string }
  isEditing: boolean
  isCreate: boolean
  isEditAllowed: boolean
}

const EntitySetAssociationDialog = ({ entityId }: { entityId: string }) => {
  const { data: associationsData } = useGetEntityAssociations(entityId)
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const handleUpdate = useCallback(
    async (input: Record<string, unknown>) => {
      await updateEntity({ updateEntityId: entityId, input: input as UpdateEntityInput })
    },
    [updateEntity, entityId],
  )

  return <SetAssociationDialog config={ENTITY_ASSOCIATION_CONFIG.dialogConfig} associationsData={associationsData as AssociationsData | undefined} onUpdate={handleUpdate} />
}

export const EntityAssociationSection = (props: AssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetEntityAssociations(entityId)
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const handleUpdateEntity = useCallback(
    async (input: Record<string, unknown>) => {
      if (!entityId) return
      await updateEntity({ updateEntityId: entityId, input: input as UpdateEntityInput })
    },
    [updateEntity, entityId],
  )

  return (
    <AssociationSection
      {...props}
      config={ENTITY_ASSOCIATION_CONFIG}
      associationsData={associationsData as AssociationsData | undefined}
      onUpdateEntity={handleUpdateEntity}
      SetAssociationDialog={EntitySetAssociationDialog}
    />
  )
}
