'use client'

import { useCallback } from 'react'
import { useGetVulnerabilityAssociations, useUpdateVulnerability } from '@/lib/graphql-hooks/vulnerability'
import type { UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { VULNERABILITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { asAssociationsData } from '@/components/shared/object-association/utils'

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

  return <AssociationSection {...props} config={VULNERABILITY_ASSOCIATION_CONFIG} associationsData={asAssociationsData(associationsData)} onUpdateEntity={handleUpdateEntity} />
}
