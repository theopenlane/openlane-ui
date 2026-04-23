import { useCallback } from 'react'
import { useGetInternalPolicyAssociationsById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import type { UpdateInternalPolicyInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps, type AssociationsData } from '@/components/shared/object-association/association-section'
import { POLICY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const PolicyAssociationSection = (props: BaseAssociationSectionProps) => {
  const policyId = props.data?.id
  const { data: associationsData } = useGetInternalPolicyAssociationsById(policyId || null)
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()

  const handleUpdatePolicy = useCallback(
    async (input: Partial<UpdateInternalPolicyInput>) => {
      if (!policyId) return
      await updatePolicy({ updateInternalPolicyId: policyId, input })
    },
    [updatePolicy, policyId],
  )

  return <AssociationSection {...props} config={POLICY_ASSOCIATION_CONFIG} associationsData={associationsData as AssociationsData | undefined} onUpdateEntity={handleUpdatePolicy} />
}
