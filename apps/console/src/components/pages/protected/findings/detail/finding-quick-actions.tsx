'use client'

import React, { useState } from 'react'
import { Clock } from 'lucide-react'
import { type QuickActionItem } from '@/components/shared/crud-base/quick-actions/quick-actions-bar'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import DetailQuickActions from '../../exposure/detail/detail-quick-actions'
import { LINK_ACTION_PLAN_DIALOG_PROPS } from '../../exposure/detail/remediation/remediation-links'
import { useExposureRemediationContext } from '../../exposure/detail/remediation/use-exposure-remediation-context'
import { getFindingTitle } from '../finding-display'
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
  const markReviewed = useFindingReviewer()
  const title = getFindingTitle(finding)
  const context = useExposureRemediationContext('finding', finding.id, title, finding.recommendedActions)

  const extraActions: QuickActionItem[] = canEdit && finding.open !== false ? [{ id: 'snooze', label: 'Snooze', icon: <Clock size={16} />, onClick: () => setIsSnoozeOpen(true) }] : []

  return (
    <DetailQuickActions
      remediations={finding.remediations}
      canCreateRemediation={canCreateRemediation}
      context={context}
      onShowRemediationTab={onShowRemediationTab}
      onRemediationCreated={() => markReviewed(finding.id, { currentReviewerUserID: finding.reviewedByUser?.id, canEdit })}
      renderLinkActionPlan={canEdit ? (props) => <SetFindingAssociationDialog findingId={finding.id} {...LINK_ACTION_PLAN_DIALOG_PROPS} {...props} /> : undefined}
      extraActions={extraActions}
    >
      <SnoozeFindingDialog isOpen={isSnoozeOpen} finding={finding} findingName={title} onClose={() => setIsSnoozeOpen(false)} />
    </DetailQuickActions>
  )
}

export default FindingQuickActions
