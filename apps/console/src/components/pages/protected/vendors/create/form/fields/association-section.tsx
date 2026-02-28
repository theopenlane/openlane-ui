'use client'

import { useCallback } from 'react'
import { useGetEntityAssociations, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import type { UpdateEntityInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { ENTITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const EntityAssociationSection = (props: BaseAssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetEntityAssociations(entityId)
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const handleUpdateEntity = useCallback(
    async (input: Partial<UpdateEntityInput>) => {
      if (!entityId) return
      await updateEntity({ updateEntityId: entityId, input })
    },
    [updateEntity, entityId],
  )

  return <AssociationSection {...props} config={ENTITY_ASSOCIATION_CONFIG} associationsData={associationsData} onUpdateEntity={handleUpdateEntity} />
}
