'use client'

import { useCallback } from 'react'
import { useGetFindingAssociations, useUpdateFinding } from '@/lib/graphql-hooks/finding'
import type { UpdateFindingInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { FINDING_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { asAssociationsData } from '@/components/shared/object-association/utils'

export const FindingAssociationSection = (props: BaseAssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetFindingAssociations(entityId)
  const { mutateAsync: updateFinding } = useUpdateFinding()

  const handleUpdateEntity = useCallback(
    async (input: Partial<UpdateFindingInput>) => {
      if (!entityId) return
      await updateFinding({ updateFindingId: entityId, input })
    },
    [updateFinding, entityId],
  )

  return <AssociationSection {...props} config={FINDING_ASSOCIATION_CONFIG} associationsData={asAssociationsData(associationsData)} onUpdateEntity={handleUpdateEntity} />
}
