'use client'

import type { GetRiskByIdQuery } from '@repo/codegen/src/schema'
import DetailsField from '../../../fields/details-field'
import BusinessCostField from '@/components/pages/protected/risks/view/fields/business-cost-field.tsx'
import { useGetRiskDiscussionById } from '@/lib/graphql-hooks/risk'

interface OverviewTabProps {
  risk: GetRiskByIdQuery['risk']
  isEditing: boolean
  canEdit: boolean
}

const OverviewTab: React.FC<OverviewTabProps> = ({ risk, isEditing, canEdit }) => {
  const { data: discussionData } = useGetRiskDiscussionById(risk.id)
  return (
    <div className="space-y-6">
      <DetailsField isEditing={isEditing} initialValue={risk.details || ''} isEditAllowed={canEdit} discussionData={discussionData?.risk} />
      <BusinessCostField isEditing={isEditing} initialValue={risk.businessCosts || ''} isEditAllowed={canEdit} />
    </div>
  )
}

export default OverviewTab
