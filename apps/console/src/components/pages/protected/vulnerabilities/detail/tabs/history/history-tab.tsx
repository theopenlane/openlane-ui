'use client'

import React, { useMemo } from 'react'
import { Button } from '@repo/ui/button'
import { useVulnerabilityHistories, useVulnerabilityHistoryEdges } from '@/lib/graphql-hooks/vulnerability'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useGetGroupNames } from '@/lib/graphql-hooks/group'
import { useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { resolveAuthor } from '@/lib/authors'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import AssociationTimeline from '@/components/pages/protected/exposure/overview/association-timeline'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { formatList, pluralizeWithCount } from '@/utils/strings'
import { type TVulnerabilityDetail } from '../../../vulnerability-display'
import { buildOwnershipChanges, historyReferencedIds } from './vulnerability-history-events'
import { buildVulnerabilityTimeline, hiddenEdgeCounts, historyEdgeAuthorIds } from './vulnerability-timeline-model'

const HistoryTab: React.FC<{ vulnerability: TVulnerabilityDetail }> = ({ vulnerability }) => {
  const edgesQuery = useVulnerabilityHistoryEdges(vulnerability.id)
  const { histories, isPending: isHistoryPending, isError: isHistoryError, error: historyError, hasNextPage, isFetchingNextPage, fetchNextPage } = useVulnerabilityHistories(vulnerability.id)
  useQueryErrorNotification({ error: edgesQuery.error ?? historyError, description: 'Failed to load vulnerability history' })

  const edges = edgesQuery.data?.vulnerability
  const { userIds, groupIds, personnelIds } = useMemo(() => historyReferencedIds(histories), [histories])
  const edgeAuthorIds = useMemo(() => historyEdgeAuthorIds(edges), [edges])
  const { authorMaps } = useAuthorMaps([...userIds, ...edgeAuthorIds, vulnerability.createdBy])
  const groupWhere = useMemo(() => ({ idIn: groupIds }), [groupIds])
  const { groups } = useGetGroupNames({ where: groupWhere, enabled: groupIds.length > 0 })
  const groupNames = useMemo(() => new Map(groups.map((group) => [group.id, group.displayName || group.name])), [groups])
  const personnelWhere = useMemo(() => ({ idIn: personnelIds }), [personnelIds])
  const { nodes: personnel } = useIdentityHolderOptions({ where: personnelWhere, enabled: personnelIds.length > 0 })
  const personnelNames = useMemo(() => new Map(personnel.map((person) => [person.id, person.fullName || person.email || person.id])), [personnel])

  const timeline = useMemo(() => {
    const authorName = (id: string | null | undefined) => {
      const author = resolveAuthor(id, authorMaps)
      return author.kind === 'unknown' || author.kind === 'unresolved' ? null : author.displayName
    }
    const ownershipChanges = buildOwnershipChanges(histories, (kind, id) => {
      if (kind === 'group') return groupNames.get(id) ?? 'a group'
      if (kind === 'personnel') return personnelNames.get(id) ?? 'a person'
      return authorName(id) ?? 'a user'
    })
    return buildVulnerabilityTimeline({
      edges,
      ownershipChanges,
      vulnerability,
      resolveAuthor: authorName,
    })
  }, [edges, histories, vulnerability, authorMaps, groupNames, personnelNames])

  const hidden = hiddenEdgeCounts(edges)

  if (edgesQuery.isError && isHistoryError) return <EmptyTabState title="History unavailable" description="The history of this vulnerability could not be loaded." />

  return (
    <div className="mt-5 space-y-4">
      <AssociationTimeline nodes={timeline} isLoading={edgesQuery.isPending || isHistoryPending} emptyText="No history yet" />
      {hasNextPage && (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? 'Loading…' : 'Load more history'}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Linked tasks, assets, remediations and reviews are dated by when each record was created. When it was linked to this vulnerability is not recorded.
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

export default HistoryTab
