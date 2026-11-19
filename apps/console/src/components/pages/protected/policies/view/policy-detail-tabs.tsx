'use client'

import React, { useState } from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { ReadOnlyToolbarPortalContext } from '@repo/ui/components/editor/read-only-toolbar-portal.ts'
import { type GetInternalPolicyAssociationsByIdQuery, type InternalPolicyByIdFragment, type PolicyDiscussionFieldsFragment } from '@repo/codegen/src/schema'
import DetailTabs from '@/components/shared/detail-tabs/detail-tabs'
import { type TDetailTab, useDetailTabs } from '@/components/shared/detail-tabs/use-detail-tabs'
import { usePolicyAcknowledgementCount } from '@/lib/graphql-hooks/assessment'
import { usePolicyCommentCount } from '@/lib/graphql-hooks/internal-policy'
import { countDiscussionThreads } from '@/components/shared/plate/discussions'
import LinkedProcedures from './fields/linked-procedures'
import HistoryTab from './tabs/history/history-tab'
import { AcknowledgementsTab } from './tabs/acknowledgements/acknowledgements-tab'
import { CommentsTab } from './tabs/comments/comments-tab'

type TPolicyTab = 'policy' | 'procedures' | 'comments' | 'acknowledgements' | 'history'

const POLICY_TABS: TDetailTab<TPolicyTab>[] = [
  { value: 'policy', label: 'Policy' },
  { value: 'procedures', label: 'Procedures' },
  { value: 'comments', label: 'Comments' },
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
  discussionEntity: PolicyDiscussionFieldsFragment | undefined
  onSendAcknowledgementRequest?: () => void
}

export const PolicyDetailTabs = ({ policy, policyPanel, procedures, procedureCount, discussionEntity, onSendAcknowledgementRequest }: TPolicyDetailTabsProps) => {
  const { count: acknowledgementCount, isResolving } = usePolicyAcknowledgementCount(policy.id)
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null)
  const { data: generalCommentCount = 0 } = usePolicyCommentCount(policy.id)
  const commentCount = generalCommentCount + countDiscussionThreads(discussionEntity)
  const tabs = useDetailTabs({
    page: 'policy',
    tabs: POLICY_TABS,
    defaultTab: 'policy',
    unavailableTabs: acknowledgementCount > 0 ? NO_TABS : NO_ACKNOWLEDGEMENTS,
    isResolving,
  })

  return (
    <DetailTabs state={tabs} counts={{ procedures: procedureCount, comments: commentCount, acknowledgements: acknowledgementCount }} end={<div ref={setToolbarSlot} />}>
      <TabsContent value="policy">
        <ReadOnlyToolbarPortalContext value={toolbarSlot}>{policyPanel}</ReadOnlyToolbarPortalContext>
      </TabsContent>

      <TabsContent value="procedures">
        <LinkedProcedures procedures={procedures} />
      </TabsContent>

      <TabsContent value="comments">
        <CommentsTab policy={policy} />
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
