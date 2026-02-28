'use client'

import { useCallback } from 'react'
import { useGetIdentityHolderAssociations, useUpdateIdentityHolder } from '@/lib/graphql-hooks/identity-holder'
import type { UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { IDENTITY_HOLDER_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const IdentityHolderAssociationSection = (props: BaseAssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetIdentityHolderAssociations(entityId)
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()

  const handleUpdateEntity = useCallback(
    async (input: Partial<UpdateIdentityHolderInput>) => {
      if (!entityId) return
      await updateIdentityHolder({ updateIdentityHolderId: entityId, input })
    },
    [updateIdentityHolder, entityId],
  )

  return <AssociationSection {...props} config={IDENTITY_HOLDER_ASSOCIATION_CONFIG} associationsData={associationsData} onUpdateEntity={handleUpdateEntity} />
}
