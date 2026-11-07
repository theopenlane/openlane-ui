'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useVulnerabilitiesWithFilter } from '@/lib/graphql-hooks/vulnerability'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { getVulnerabilityDueDate } from '@/utils/vulnerability-due-date'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import ExposureMapTab, { type TExposureView } from '../../vulnerabilities/detail/tabs/exposure-map/exposure-map-tab'
import TriageDetail from './triage-detail'
import { type TriageCveGroup } from './triage-utils'

const SINGLE_RECORD_PAGINATION = { page: 1, pageSize: 1, query: { first: 1 } }

type Props = {
  group: TriageCveGroup
  slaDefinitions: SlaDefinitionsNodeNonNull[]
}

const TriageGroupDetail: React.FC<Props> = ({ group, slaDefinitions }) => {
  const { data: session } = useSession()
  const [openOnly, setOpenOnly] = useState(true)
  const [view, setView] = useState<TExposureView>('list')
  const representativeId = group.representative.id

  const { vulnerabilitiesNodes } = useVulnerabilitiesWithFilter({ where: { id: representativeId }, pagination: SINGLE_RECORD_PAGINATION })
  const representative = vulnerabilitiesNodes.find((node) => node.id === representativeId)

  const { data: permission } = useAccountRoles(ObjectTypes.VULNERABILITY, representativeId)
  const canEditReports = canEdit(permission?.roles, session)

  if (!representative) {
    return (
      <div className="p-6" role="status" aria-label="Loading vulnerability group">
        <SkeletonRows count={6} height={40} />
      </div>
    )
  }

  return (
    <TriageDetail vuln={{ ...representative, dueInfo: group.dueInfo ?? getVulnerabilityDueDate(representative, slaDefinitions) }} dueLabel="Due date (worst case)">
      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Reports</p>
        <ExposureMapTab vulnerability={representative} canEdit={canEditReports} state={{ openOnly, setOpenOnly, view, setView }} markCurrent={false} />
      </div>
    </TriageDetail>
  )
}

export default TriageGroupDetail
