'use client'

import React from 'react'
import { VulnerabilityHistoryOpType } from '@repo/codegen/src/historyschema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useVulnerabilityHistories, useVulnerabilityHistoryEdges } from '@/lib/graphql-hooks/vulnerability'
import ExposureHistoryTab from '../../../../exposure/detail/history/exposure-history-tab'
import { getVulnerabilityTitle, type TVulnerabilityDetail } from '../../../vulnerability-display'

const HistoryTab: React.FC<{ vulnerability: TVulnerabilityDetail }> = ({ vulnerability }) => {
  const edgesQuery = useVulnerabilityHistoryEdges(vulnerability.id)
  const history = useVulnerabilityHistories(vulnerability.id)

  return (
    <ExposureHistoryTab
      entity={vulnerability}
      title={getVulnerabilityTitle(vulnerability)}
      objectType={ObjectTypes.VULNERABILITY}
      updateOperation={VulnerabilityHistoryOpType.UPDATE}
      edges={{ ...edgesQuery, data: edgesQuery.data?.vulnerability }}
      history={history}
    />
  )
}

export default HistoryTab
