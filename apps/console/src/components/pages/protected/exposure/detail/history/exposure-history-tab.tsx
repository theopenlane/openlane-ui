'use client'

import React, { useMemo } from 'react'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { Button } from '@repo/ui/button'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import AssociationTimeline from '@/components/pages/protected/exposure/overview/association-timeline'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { formatList, pluralizeWithCount, toHumanLabel } from '@/utils/strings'
import { type TOwnershipHistoryNode } from './history-events'
import { useOwnershipHistory } from './use-ownership-history'
import { buildExposureTimeline, hiddenEdgeCounts, historyEdgeAuthorIds, type TExposureHistoryEdges, type TExposureHistoryEntity, type TExposureMilestone } from './timeline-model'

type TExposureHistoryTabProps<TOp extends string> = {
  entity: TExposureHistoryEntity
  title: string
  objectType: ObjectTypes
  updateOperation: TOp
  milestones: TExposureMilestone[]
  edges: {
    data: TExposureHistoryEdges | undefined
    isPending: boolean
    isError: boolean
    error: unknown
  }
  history: {
    histories: TOwnershipHistoryNode<TOp>[]
    isPending: boolean
    isError: boolean
    error: unknown
    hasNextPage: boolean
    isFetchingNextPage: boolean
    fetchNextPage: () => unknown
  }
}

const ExposureHistoryTab = <TOp extends string>({ entity, title, objectType, updateOperation, milestones, edges, history }: TExposureHistoryTabProps<TOp>) => {
  const entityName = toHumanLabel(objectType).toLowerCase()
  const { histories, hasNextPage, isFetchingNextPage, fetchNextPage } = history
  useQueryErrorNotification({ error: edges.error ?? history.error, description: `Failed to load ${entityName} history` })

  const edgeAuthorIds = useMemo(() => historyEdgeAuthorIds(edges.data), [edges.data])
  const { authorName, ownershipChanges } = useOwnershipHistory({
    histories,
    updateOperation,
    authorIds: [...edgeAuthorIds, entity.createdBy],
    isPending: edges.isPending || history.isPending,
  })

  const timeline = useMemo(
    () => buildExposureTimeline({ edges: edges.data, ownershipChanges, milestones, entity, title, objectType, entityName, resolveAuthor: authorName }),
    [edges.data, ownershipChanges, milestones, entity, title, objectType, entityName, authorName],
  )

  const hidden = hiddenEdgeCounts(edges.data)

  if (edges.isError && history.isError) return <EmptyTabState title="History unavailable" description={`The history of this ${entityName} could not be loaded.`} />

  return (
    <div className="mt-5 space-y-4">
      <AssociationTimeline nodes={timeline} isLoading={edges.isPending || history.isPending} emptyText="No history yet" />
      {hasNextPage && (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? 'Loading…' : 'Load more history'}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Linked tasks, assets, remediations and reviews are dated by when each record was created. Records that existed before this {entityName} are listed as associated with it right after it was
        created, because when a record was linked is not recorded. Dates such as published, discovered and reported come from the source system and can be earlier than when this {entityName} was
        created here.
      </p>
      {hidden.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing the most recent of each kind. Not shown:{' '}
          {formatList(
            hidden.map(({ noun, hidden: count }) => pluralizeWithCount(count, noun)),
            'conjunction',
          )}
          . The full lists are in the Associated Objects panel and the Comments tab.
        </p>
      )}
    </div>
  )
}

export default ExposureHistoryTab
