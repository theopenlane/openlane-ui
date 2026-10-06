'use client'

import React from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { type GetInternalPolicyAssociationsByIdQuery, type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import DetailTabs from '@/components/shared/detail-tabs/detail-tabs'
import { type TDetailTab, useDetailTabs } from '@/components/shared/detail-tabs/use-detail-tabs'
import { usePolicyAcknowledgementCount } from '@/lib/graphql-hooks/assessment'
import LinkedProcedures from './fields/linked-procedures'
import HistoryTab from './tabs/history/history-tab'
import { AcknowledgementsTab } from './tabs/acknowledgements/acknowledgements-tab'

type TPolicyTab = 'policy' | 'procedures' | 'acknowledgements' | 'history'

const POLICY_TABS: TDetailTab<TPolicyTab>[] = [
  { value: 'policy', label: 'Policy' },
  { value: 'procedures', label: 'Procedures' },
  { value: 'acknowledgements', label: 'Acknowledgments' },
  { value: 'history', label: 'History' },
]

const NO_TABS: ReadonlySet<TPolicyTab> = new Set()
const NO_ACKNOWLEDGEMENTS: ReadonlySet<TPolicyTab> = new Set(['acknowledgements'])

type TPolicyDetailTabsProps = {
  policy: InternalPolicyByIdFragment
  policyPanel: React.ReactNode
  procedures: NonNullable<NonNullable<GetInternalPolicyAssociationsByIdQuery['internalPolicy']>['procedures']>['edges']
  procedureCount: number
  onSendAcknowledgementRequest?: () => void
}

export const PolicyDetailTabs = ({ policy, policyPanel, procedures, procedureCount, onSendAcknowledgementRequest }: TPolicyDetailTabsProps) => {
  const { count: acknowledgementCount, isResolving } = usePolicyAcknowledgementCount(policy.id)
  const tabs = useDetailTabs({
    page: 'policy',
    tabs: POLICY_TABS,
    defaultTab: 'policy',
    unavailableTabs: acknowledgementCount > 0 ? NO_TABS : NO_ACKNOWLEDGEMENTS,
    isResolving,
  })

  return (
    <DetailTabs state={tabs} counts={{ procedures: procedureCount, acknowledgements: acknowledgementCount }}>
      <TabsContent value="policy">{policyPanel}</TabsContent>

      <TabsContent value="procedures">
        <LinkedProcedures procedures={procedures} />
      </TabsContent>

      <TabsContent value="acknowledgements">
        <AcknowledgementsTab policyId={policy.id} onSendRequest={onSendAcknowledgementRequest} />
      </TabsContent>

      <TabsContent value="history">
        <HistoryTab policyId={policy.id} policy={policy} />
      </TabsContent>
    </DetailTabs>
  )
}
