'use client'

import { useCallback } from 'react'
import { useGetVulnerabilityAssociations, useUpdateVulnerability } from '@/lib/graphql-hooks/vulnerability'
import type { UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps, type AssociationsData } from '@/components/shared/object-association/association-section'
import { VULNERABILITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const VulnerabilityAssociationSection = (props: BaseAssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetVulnerabilityAssociations(entityId)
  const { mutateAsync: updateVulnerability } = useUpdateVulnerability()

  const handleUpdateEntity = useCallback(
    async (input: Partial<UpdateVulnerabilityInput>) => {
      if (!entityId) return
      await updateVulnerability({ updateVulnerabilityId: entityId, input })
    },
    [updateVulnerability, entityId],
  )

  return <AssociationSection {...props} config={VULNERABILITY_ASSOCIATION_CONFIG} associationsData={associationsData as AssociationsData | undefined} onUpdateEntity={handleUpdateEntity} />
}
