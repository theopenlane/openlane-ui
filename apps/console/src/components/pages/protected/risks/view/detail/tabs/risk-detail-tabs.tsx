'use client'

import React from 'react'
import { TabsContent } from '@repo/ui/tabs'
import DetailTabs from '@/components/shared/detail-tabs/detail-tabs'
import { useDetailTabs, type TDetailTab } from '@/components/shared/detail-tabs/use-detail-tabs'
import OverviewTab from './overview/overview-tab'
import RiskReviewTab from './risk-review/risk-review-tab'
import type { GetRiskByIdQuery, GetRiskAssociationsQuery, UpdateRiskInput } from '@repo/codegen/src/schema'
import MitigationTab from './mitigation/mitigation-tab'
import ActivityTab from './activity/activity-tab'

type RiskTabValue = 'overview' | 'mitigation' | 'risk-review' | 'activity'

const RISK_TABS: TDetailTab<RiskTabValue>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'mitigation', label: 'Mitigation' },
  { value: 'risk-review', label: 'Risk Review' },
  { value: 'activity', label: 'Activity' },
]

interface RiskDetailTabsProps {
  risk: GetRiskByIdQuery['risk']
  associations?: GetRiskAssociationsQuery
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateRiskInput) => Promise<void>
}

const RiskDetailTabs: React.FC<RiskDetailTabsProps> = ({ risk, associations, isEditing, canEdit: canEditRisk, handleUpdateField }) => {
  const tabs = useDetailTabs({ page: 'risk', tabs: RISK_TABS, defaultTab: 'overview' })

  return (
    <DetailTabs state={tabs}>
      <TabsContent value="overview" className="space-y-6">
        <OverviewTab risk={risk} isEditing={isEditing} canEdit={canEditRisk} />
      </TabsContent>

      <TabsContent value="mitigation" className="space-y-6">
        <MitigationTab risk={risk} editAllowed={canEditRisk} associations={associations} isEditing={isEditing} />
      </TabsContent>

      <TabsContent value="risk-review" className="space-y-6">
        <RiskReviewTab risk={risk} handleUpdateField={handleUpdateField} canEdit={canEditRisk} isEditing={isEditing} />
      </TabsContent>

      <TabsContent value="activity" className="space-y-6">
        <ActivityTab riskId={risk?.id} />
      </TabsContent>
    </DetailTabs>
  )
}

export default RiskDetailTabs
