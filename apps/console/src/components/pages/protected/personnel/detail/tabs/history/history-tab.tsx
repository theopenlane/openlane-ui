'use client'

import React, { useMemo } from 'react'
import AssociationTimeline from '@/components/pages/protected/exposure/overview/association-timeline'
import { useIdentityHolderTimeline, extractIdentityHolderTimelineNodes } from '@/lib/graphql-hooks/associations-timeline'

interface HistoryTabProps {
  personnelId: string
}

const HistoryTab: React.FC<HistoryTabProps> = ({ personnelId }) => {
  const { data, isLoading } = useIdentityHolderTimeline(personnelId)

  const timelineNodes = useMemo(() => extractIdentityHolderTimelineNodes(data), [data])

  return (
    <div className="mt-5">
      <AssociationTimeline nodes={timelineNodes} isLoading={isLoading} />
    </div>
  )
}

export default HistoryTab
