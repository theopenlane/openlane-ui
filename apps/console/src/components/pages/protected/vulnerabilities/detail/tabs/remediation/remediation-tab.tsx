'use client'

import React from 'react'
import { useVulnerabilityRemediationWork } from '@/lib/graphql-hooks/vulnerability'
import RemediationWorkTab from '../../../../exposure/detail/remediation/remediation-work-tab'
import { LINK_ACTION_PLAN_DIALOG_PROPS } from '../../../../exposure/detail/remediation/remediation-links'
import { useExposureRemediationContext } from '../../../../exposure/detail/remediation/use-exposure-remediation-context'
import { SetVulnerabilityAssociationDialog } from '../../../set-vulnerability-association-dialog'
import { getVulnerabilityTitle, type TVulnerabilityDetail } from '../../../vulnerability-display'

type TRemediationTabProps = {
  vulnerability: TVulnerabilityDetail
  canEdit: boolean
  canCreateRemediation: boolean
}

const RemediationTab: React.FC<TRemediationTabProps> = ({ vulnerability, canEdit, canCreateRemediation }) => {
  const workQuery = useVulnerabilityRemediationWork(vulnerability.id)
  const context = useExposureRemediationContext('vulnerability', vulnerability.id, getVulnerabilityTitle(vulnerability))

  return (
    <RemediationWorkTab
      entityName="vulnerability"
      workQuery={{ data: workQuery.data?.vulnerability, isPending: workQuery.isPending, isError: workQuery.isError, error: workQuery.error }}
      canCreateRemediation={canCreateRemediation}
      context={context}
      renderLinkActionPlan={canEdit ? (props) => <SetVulnerabilityAssociationDialog vulnerabilityId={vulnerability.id} {...LINK_ACTION_PLAN_DIALOG_PROPS} {...props} /> : undefined}
    />
  )
}

export default RemediationTab
