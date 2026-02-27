'use client'

import React, { useCallback } from 'react'
import { useGetIdentityHolderAssociations, useUpdateIdentityHolder } from '@/lib/graphql-hooks/identity-holder'
import { UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { AssociationSection } from '@/components/shared/object-association/association-section'
import { IDENTITY_HOLDER_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'

type AssociationSectionProps = {
  data?: { id: string }
  isEditing: boolean
  isCreate: boolean
  isEditAllowed: boolean
}

const IdentityHolderSetAssociationDialog = ({ entityId }: { entityId: string }) => {
  const { data: associationsData } = useGetIdentityHolderAssociations(entityId)
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()

  const handleUpdate = useCallback(
    async (input: Record<string, unknown>) => {
      await updateIdentityHolder({ updateIdentityHolderId: entityId, input: input as UpdateIdentityHolderInput })
    },
    [updateIdentityHolder, entityId],
  )

  return (
    <SetAssociationDialog
      config={IDENTITY_HOLDER_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={associationsData as Record<string, unknown> | undefined}
      onUpdate={handleUpdate}
    />
  )
}

export const IdentityHolderAssociationSection = (props: AssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetIdentityHolderAssociations(entityId)
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()

  const handleUpdateEntity = useCallback(
    async (input: Record<string, unknown>) => {
      if (!entityId) return
      await updateIdentityHolder({ updateIdentityHolderId: entityId, input: input as UpdateIdentityHolderInput })
    },
    [updateIdentityHolder, entityId],
  )

  return (
    <AssociationSection
      {...props}
      config={IDENTITY_HOLDER_ASSOCIATION_CONFIG}
      associationsData={associationsData as Record<string, unknown> | undefined}
      onUpdateEntity={handleUpdateEntity}
      SetAssociationDialog={IdentityHolderSetAssociationDialog}
    />
  )
}
