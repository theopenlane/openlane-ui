'use client'

import React, { useMemo } from 'react'
import { VulnerabilityHistoryOpType } from '@repo/codegen/src/historyschema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useVulnerabilityHistories, useVulnerabilityHistoryEdges } from '@/lib/graphql-hooks/vulnerability'
import ExposureHistoryTab from '../../../../exposure/detail/history/exposure-history-tab'
import { getVulnerabilityTitle, type TVulnerabilityDetail } from '../../../vulnerability-display'
import { vulnerabilityHistoryMilestones } from './vulnerability-history-milestones'

const HistoryTab: React.FC<{ vulnerability: TVulnerabilityDetail }> = ({ vulnerability }) => {
  const edgesQuery = useVulnerabilityHistoryEdges(vulnerability.id)
  const history = useVulnerabilityHistories(vulnerability.id)
  const milestones = useMemo(() => vulnerabilityHistoryMilestones(vulnerability), [vulnerability])

  return (
    <ExposureHistoryTab
      entity={vulnerability}
      title={getVulnerabilityTitle(vulnerability)}
      objectType={ObjectTypes.VULNERABILITY}
      updateOperation={VulnerabilityHistoryOpType.UPDATE}
      milestones={milestones}
      edges={{ data: edgesQuery.data?.vulnerability, isPending: edgesQuery.isPending, isError: edgesQuery.isError, error: edgesQuery.error }}
      history={history}
    />
  )
}

export default HistoryTab
