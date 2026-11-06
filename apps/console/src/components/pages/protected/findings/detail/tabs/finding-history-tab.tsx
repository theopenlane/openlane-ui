'use client'

import React from 'react'
import { FindingHistoryOpType } from '@repo/codegen/src/historyschema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type FindingDetailNode, useFindingHistories, useFindingHistoryEdges } from '@/lib/graphql-hooks/finding'
import ExposureHistoryTab from '../../../exposure/detail/history/exposure-history-tab'
import { getFindingTitle } from '../../finding-display'

const FindingHistoryTab: React.FC<{ finding: FindingDetailNode }> = ({ finding }) => {
  const edgesQuery = useFindingHistoryEdges(finding.id)
  const history = useFindingHistories(finding.id)

  return (
    <ExposureHistoryTab
      entity={finding}
      title={getFindingTitle(finding)}
      objectType={ObjectTypes.FINDING}
      updateOperation={FindingHistoryOpType.UPDATE}
      edges={{ ...edgesQuery, data: edgesQuery.data?.finding }}
      history={history}
    />
  )
}

export default FindingHistoryTab
