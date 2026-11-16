'use client'

import React from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import DetailTabs from '@/components/shared/detail-tabs/detail-tabs'
import { type TDetailTabsState } from '@/components/shared/detail-tabs/use-detail-tabs'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import FindingOverviewTab from './finding-overview-tab'
import FindingRemediationTab from './finding-remediation-tab'
import FindingCommentsTab from './finding-comments-tab'
import FindingHistoryTab from './finding-history-tab'
import { type TFindingTabValue } from './finding-tab-values'

type TFindingDetailTabsProps = {
  tabs: TDetailTabsState<TFindingTabValue>
  finding: FindingDetailNode
  isEditing: boolean
  canEdit: boolean
  canCreateRemediation: boolean
  handleUpdateField: (input: UpdateFindingInput, options?: TPersistOptions) => Promise<void>
}

const FindingDetailTabs: React.FC<TFindingDetailTabsProps> = ({ tabs, finding, isEditing, canEdit, canCreateRemediation, handleUpdateField }) => (
  <DetailTabs state={tabs}>
    <TabsContent value="overview">
      <FindingOverviewTab finding={finding} isEditing={isEditing} canEdit={canEdit} handleUpdateField={handleUpdateField} />
    </TabsContent>
    <TabsContent value="remediation">
      <FindingRemediationTab finding={finding} canEdit={canEdit} canCreateRemediation={canCreateRemediation} />
    </TabsContent>
    <TabsContent value="comments">
      <FindingCommentsTab findingId={finding.id} />
    </TabsContent>
    <TabsContent value="history">
      <FindingHistoryTab finding={finding} />
    </TabsContent>
  </DetailTabs>
)

export default FindingDetailTabs
