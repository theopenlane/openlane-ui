'use client'

import React, { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { type QuickActionItem } from '@/components/shared/crud-base/quick-actions/quick-actions-bar'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { type TRemediationContextRef } from '@/components/pages/protected/remediations/sheet/remediation-context'
import { type FindingDetailNode, invalidateFindingQueries } from '@/lib/graphql-hooks/finding'
import DetailQuickActions from '../../exposure/detail/detail-quick-actions'
import { LINK_ACTION_PLAN_DIALOG_PROPS } from '../../exposure/detail/remediation/remediation-links'
import { buildFindingTaskDefaults, getFindingTitle } from '../finding-display'
import { useFindingReviewer } from '../hooks/use-finding-review'
import { SetFindingAssociationDialog } from '../set-finding-association-dialog'
import SnoozeFindingDialog from './snooze-finding-dialog'

type TFindingQuickActionsProps = {
  finding: FindingDetailNode
  canEdit: boolean
  canCreateRemediation: boolean
  onShowRemediationTab: () => void
}

const FindingQuickActions: React.FC<TFindingQuickActionsProps> = ({ finding, canEdit, canCreateRemediation, onShowRemediationTab }) => {
  const [isSnoozeOpen, setIsSnoozeOpen] = useState(false)
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const markReviewed = useFindingReviewer()
  const title = getFindingTitle(finding)
  const taskInitialValues = useMemo(() => buildFindingTaskDefaults(title, session?.user?.userId), [title, session?.user?.userId])
  const linkedTo = useMemo(() => ({ findingIDs: [finding.id] }), [finding.id])
  const remediationContext = useMemo<TRemediationContextRef>(() => ({ type: ObjectAssociationNodeEnum.FINDING, id: finding.id }), [finding.id])

  const extraActions: QuickActionItem[] = canEdit && finding.open !== false ? [{ id: 'snooze', label: 'Snooze', icon: <Clock size={16} />, onClick: () => setIsSnoozeOpen(true) }] : []

  return (
    <DetailQuickActions
      remediations={finding.remediations}
      canCreateRemediation={canCreateRemediation}
      taskInitialValues={taskInitialValues}
      linkedTo={linkedTo}
      remediationContext={remediationContext}
      defaultSelectedObject={ObjectTypeObjects.FINDING}
      onShowRemediationTab={onShowRemediationTab}
      onTaskCreated={() => invalidateFindingQueries(queryClient)}
      onRemediationCreated={() => markReviewed(finding.id, { currentReviewerUserID: finding.reviewedByUser?.id, canEdit })}
      renderLinkActionPlan={canEdit ? (props) => <SetFindingAssociationDialog findingId={finding.id} {...LINK_ACTION_PLAN_DIALOG_PROPS} {...props} /> : undefined}
      extraActions={extraActions}
    >
      <SnoozeFindingDialog isOpen={isSnoozeOpen} finding={finding} findingName={title} onClose={() => setIsSnoozeOpen(false)} />
    </DetailQuickActions>
  )
}

export default FindingQuickActions
