'use client'

import React, { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateVulnerabilityQueries, useVulnerabilityRemediationWork } from '@/lib/graphql-hooks/vulnerability'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { type TRemediationContextRef } from '@/components/pages/protected/remediations/sheet/remediation-context'
import RemediationWorkTab from '../../../../exposure/detail/remediation/remediation-work-tab'
import { LINK_ACTION_PLAN_DIALOG_PROPS } from '../../../../exposure/detail/remediation/remediation-links'
import { SetVulnerabilityAssociationDialog } from '../../../set-vulnerability-association-dialog'
import { buildRemediationTaskDefaults, getVulnerabilityTitle, type TVulnerabilityDetail } from '../../../vulnerability-display'

type TRemediationTabProps = {
  vulnerability: TVulnerabilityDetail
  canEdit: boolean
  canCreateRemediation: boolean
}

const RemediationTab: React.FC<TRemediationTabProps> = ({ vulnerability, canEdit, canCreateRemediation }) => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const workQuery = useVulnerabilityRemediationWork(vulnerability.id)
  const title = getVulnerabilityTitle(vulnerability)
  const taskInitialValues = useMemo(() => buildRemediationTaskDefaults(title, session?.user?.userId), [title, session?.user?.userId])
  const linkedTo = useMemo(() => ({ vulnerabilityIDs: [vulnerability.id] }), [vulnerability.id])
  const remediationContext = useMemo<TRemediationContextRef>(() => ({ type: ObjectAssociationNodeEnum.VULNERABILITY, id: vulnerability.id }), [vulnerability.id])

  return (
    <RemediationWorkTab
      entityName="vulnerability"
      workQuery={{ ...workQuery, data: workQuery.data?.vulnerability }}
      canCreateRemediation={canCreateRemediation}
      taskInitialValues={taskInitialValues}
      linkedTo={linkedTo}
      remediationContext={remediationContext}
      defaultSelectedObject={ObjectTypeObjects.VULNERABILITY}
      onWorkCreated={() => invalidateVulnerabilityQueries(queryClient)}
      renderLinkActionPlan={canEdit ? (props) => <SetVulnerabilityAssociationDialog vulnerabilityId={vulnerability.id} {...LINK_ACTION_PLAN_DIALOG_PROPS} {...props} /> : undefined}
    />
  )
}

export default RemediationTab
