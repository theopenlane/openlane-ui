'use client'

import React, { useMemo } from 'react'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { Button } from '@repo/ui/button'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useGetGroupNames } from '@/lib/graphql-hooks/group'
import { useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { useIntegrationInstallers } from '@/lib/graphql-hooks/integration'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import { resolveAuthor } from '@/lib/authors'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import AssociationTimeline from '@/components/pages/protected/exposure/overview/association-timeline'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { formatList, pluralizeWithCount, toHumanLabel } from '@/utils/strings'
import { buildOwnershipChanges, historyReferencedIds, type TOwnershipHistoryNode } from './history-events'
import { createActorResolver, integrationLookupIds, type TIntegrationProvenance } from './integration-actor'
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
  creation: {
    provenance: TIntegrationProvenance | undefined
    isPending: boolean
  }
}

const ExposureHistoryTab = <TOp extends string>({ entity, title, objectType, updateOperation, milestones, edges, history, creation }: TExposureHistoryTabProps<TOp>) => {
  const entityName = toHumanLabel(objectType).toLowerCase()
  const { histories, hasNextPage, isFetchingNextPage, fetchNextPage } = history
  useQueryErrorNotification({ error: edges.error ?? history.error, description: `Failed to load ${entityName} history` })

  const { userIds, groupIds, personnelIds } = useMemo(() => historyReferencedIds(histories), [histories])
  const edgeAuthorIds = useMemo(() => historyEdgeAuthorIds(edges.data), [edges.data])
  const actorIds = useMemo(() => [...userIds, ...edgeAuthorIds, entity.createdBy], [userIds, edgeAuthorIds, entity.createdBy])
  const sourcesPending = edges.isPending || history.isPending || creation.isPending
  const lookupIds = useMemo(() => integrationLookupIds([creation.provenance, ...histories], actorIds), [creation.provenance, histories, actorIds])
  const installers = useIntegrationInstallers({ ...lookupIds, enabled: !sourcesPending })
  const { data: providerData } = useIntegrationProviders()
  const isLoading = sourcesPending || installers.isPending
  const { authorMaps } = useAuthorMaps(isLoading ? [] : [...actorIds, ...installers.installations.map((installation) => installation.createdBy)])
  const groupWhere = useMemo(() => ({ idIn: groupIds }), [groupIds])
  const { groups } = useGetGroupNames({ where: groupWhere, enabled: groupIds.length > 0 })
  const groupNames = useMemo(() => new Map(groups.map((group) => [group.id, group.displayName || group.name])), [groups])
  const personnelWhere = useMemo(() => ({ idIn: personnelIds }), [personnelIds])
  const { nodes: personnel } = useIdentityHolderOptions({ where: personnelWhere, enabled: personnelIds.length > 0 })
  const personnelNames = useMemo(() => new Map(personnel.map((person) => [person.id, person.fullName || person.email || person.id])), [personnel])

  const timeline = useMemo(() => {
    const resolveActor = createActorResolver({
      installations: installers.installations,
      providers: providerData?.providers ?? [],
      authorOf: (id) => resolveAuthor(id, authorMaps),
      authorsResolving: authorMaps.status === 'resolving',
    })
    const ownershipChanges = buildOwnershipChanges(histories, updateOperation, (kind, id) => {
      if (kind === 'group') return groupNames.get(id) ?? 'a group'
      if (kind === 'personnel') return personnelNames.get(id) ?? 'a person'
      return resolveActor(id) ?? 'a user'
    })
    return buildExposureTimeline({ edges: edges.data, ownershipChanges, milestones, entity, title, objectType, entityName, creationProvenance: creation.provenance, resolveActor })
  }, [
    edges.data,
    histories,
    updateOperation,
    milestones,
    entity,
    title,
    objectType,
    entityName,
    authorMaps,
    groupNames,
    personnelNames,
    installers.installations,
    providerData?.providers,
    creation.provenance,
  ])

  const hidden = hiddenEdgeCounts(edges.data)

  if (edges.isError && history.isError) return <EmptyTabState title="History unavailable" description={`The history of this ${entityName} could not be loaded.`} />

  return (
    <div className="mt-5 space-y-4">
      <AssociationTimeline nodes={timeline} isLoading={isLoading} emptyText="No history yet" />
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
