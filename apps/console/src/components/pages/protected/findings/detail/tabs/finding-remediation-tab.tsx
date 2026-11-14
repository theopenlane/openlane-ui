'use client'

import React from 'react'
import { type FindingDetailNode, useFindingRemediationWork } from '@/lib/graphql-hooks/finding'
import RemediationWorkTab from '../../../exposure/detail/remediation/remediation-work-tab'
import { LINK_ACTION_PLAN_DIALOG_PROPS } from '../../../exposure/detail/remediation/remediation-links'
import { useExposureRemediationContext } from '../../../exposure/detail/remediation/use-exposure-remediation-context'
import { getFindingTitle } from '../../finding-display'
import { SetFindingAssociationDialog } from '../../set-finding-association-dialog'

type TFindingRemediationTabProps = {
  finding: FindingDetailNode
  canEdit: boolean
  canCreateRemediation: boolean
}

const FindingRemediationTab: React.FC<TFindingRemediationTabProps> = ({ finding, canEdit, canCreateRemediation }) => {
  const workQuery = useFindingRemediationWork(finding.id)
  const context = useExposureRemediationContext('finding', finding.id, getFindingTitle(finding), finding.recommendedActions)

  return (
    <RemediationWorkTab
      entityName="finding"
      workQuery={{ data: workQuery.data?.finding, isPending: workQuery.isPending, isError: workQuery.isError, error: workQuery.error }}
      canCreateRemediation={canCreateRemediation}
      context={context}
      renderLinkActionPlan={canEdit ? (props) => <SetFindingAssociationDialog findingId={finding.id} {...LINK_ACTION_PLAN_DIALOG_PROPS} {...props} /> : undefined}
    />
  )
}

export default FindingRemediationTab
