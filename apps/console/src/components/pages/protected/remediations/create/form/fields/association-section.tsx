'use client'

import { useCallback } from 'react'
import { useGetRemediationAssociations, useUpdateRemediation } from '@/lib/graphql-hooks/remediation'
import type { UpdateRemediationInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps, type AssociationsData } from '@/components/shared/object-association/association-section'
import { REMEDIATION_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const RemediationAssociationSection = (props: BaseAssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetRemediationAssociations(entityId)
  const { mutateAsync: updateRemediation } = useUpdateRemediation()

  const handleUpdateEntity = useCallback(
    async (input: Partial<UpdateRemediationInput>) => {
      if (!entityId) return
      await updateRemediation({ updateRemediationId: entityId, input })
    },
    [updateRemediation, entityId],
  )

  return <AssociationSection {...props} config={REMEDIATION_ASSOCIATION_CONFIG} associationsData={associationsData as AssociationsData | undefined} onUpdateEntity={handleUpdateEntity} />
}
