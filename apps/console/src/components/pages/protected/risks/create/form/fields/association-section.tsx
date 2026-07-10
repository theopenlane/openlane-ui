import { useCallback } from 'react'
import { useGetRiskAssociations, useUpdateRisk } from '@/lib/graphql-hooks/risk'
import type { UpdateRiskInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { RISK_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { asAssociationsData } from '@/components/shared/object-association/utils'

export const RiskAssociationSection = (props: BaseAssociationSectionProps) => {
  const riskId = props.data?.id
  const { data: associationsData } = useGetRiskAssociations(riskId)
  const { mutateAsync: updateRisk } = useUpdateRisk()

  const handleUpdateRisk = useCallback(
    async (input: Partial<UpdateRiskInput>) => {
      if (!riskId) return
      await updateRisk({ updateRiskId: riskId, input })
    },
    [updateRisk, riskId],
  )

  return <AssociationSection {...props} config={RISK_ASSOCIATION_CONFIG} associationsData={asAssociationsData(associationsData)} onUpdateEntity={handleUpdateRisk} />
}
