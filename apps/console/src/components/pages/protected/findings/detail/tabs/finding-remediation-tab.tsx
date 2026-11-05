'use client'

import React, { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { type FindingDetailNode, invalidateFindingQueries, useFindingRemediationWork } from '@/lib/graphql-hooks/finding'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import RemediationWorkTab from '../../../exposure/detail/remediation/remediation-work-tab'
import { LINK_ACTION_PLAN_DIALOG_PROPS } from '../../../exposure/detail/remediation/remediation-links'
import { buildFindingTaskDefaults, getFindingTitle } from '../../finding-display'
import { SetFindingAssociationDialog } from '../../set-finding-association-dialog'

type TFindingRemediationTabProps = {
  finding: FindingDetailNode
  canEdit: boolean
  canCreateRemediation: boolean
}

const FindingRemediationTab: React.FC<TFindingRemediationTabProps> = ({ finding, canEdit, canCreateRemediation }) => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const workQuery = useFindingRemediationWork(finding.id)
  const title = getFindingTitle(finding)
  const taskInitialValues = useMemo(() => buildFindingTaskDefaults(title, session?.user?.userId), [title, session?.user?.userId])
  const linkedTo = useMemo(() => ({ findingIDs: [finding.id] }), [finding.id])

  return (
    <RemediationWorkTab
      entityName="finding"
      title={title}
      workQuery={{ ...workQuery, data: workQuery.data?.finding }}
      canCreateRemediation={canCreateRemediation}
      taskInitialValues={taskInitialValues}
      linkedTo={linkedTo}
      remediationInstructions={finding.recommendedActions || undefined}
      onWorkCreated={() => invalidateFindingQueries(queryClient)}
      defaultSelectedObject={ObjectTypeObjects.FINDING}
      renderLinkActionPlan={canEdit ? (props) => <SetFindingAssociationDialog findingId={finding.id} {...LINK_ACTION_PLAN_DIALOG_PROPS} {...props} /> : undefined}
    />
  )
}

export default FindingRemediationTab
