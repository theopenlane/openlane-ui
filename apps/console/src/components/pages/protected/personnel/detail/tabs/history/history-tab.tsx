'use client'

import React, { useMemo } from 'react'
import AssociationTimeline from '@/components/pages/protected/exposure/overview/association-timeline'
import { type TimelineNode, useIdentityHolderTimeline, extractIdentityHolderTimelineNodes } from '@/lib/graphql-hooks/associations-timeline'
import { formatDate } from '@/utils/date'
import { useCanManageIntegrations } from '@/lib/authz/use-can-manage-integrations'
import type { IdentityHolderQuery } from '@repo/codegen/src/schema'

interface HistoryTabProps {
  personnel: IdentityHolderQuery['identityHolder']
}

const HistoryTab: React.FC<HistoryTabProps> = ({ personnel }) => {
  const { data, isLoading } = useIdentityHolderTimeline(personnel.id)

  const { canManageIntegrations } = useCanManageIntegrations()
  const timelineNodes = useMemo(() => {
    const associationNodes = extractIdentityHolderTimelineNodes(data, { linkIntegrations: canManageIntegrations })
    const creationNode: TimelineNode[] = personnel.createdAt
      ? [
          {
            id: personnel.id,
            name: personnel.fullName ?? 'Personnel record',
            type: 'Personnel',
            createdAt: personnel.createdAt,
            role: 'source',
            subtext: `record created on ${formatDate(personnel.createdAt)}`,
          },
        ]
      : []

    return [...associationNodes, ...creationNode].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [data, canManageIntegrations, personnel.createdAt, personnel.fullName, personnel.id])

  return (
    <div className="mt-5">
      <AssociationTimeline nodes={timelineNodes} isLoading={isLoading} />
    </div>
  )
}

export default HistoryTab
