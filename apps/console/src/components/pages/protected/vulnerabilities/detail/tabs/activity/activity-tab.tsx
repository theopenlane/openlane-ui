'use client'

import React, { useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { useVulnerabilityHistories } from '@/lib/graphql-hooks/vulnerability'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useGetGroupNames } from '@/lib/graphql-hooks/group'
import { useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { resolveAuthorName } from '@/lib/authors'
import { formatDateTime } from '@/utils/date'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { buildHistoryEvents, historyReferencedIds, type THistoryChange, type THistoryEvent } from './vulnerability-history-events'

const MIN_VISIBLE_EVENTS = 10
const SKELETON_EVENT_COUNT = 4

const ActivitySkeleton = () => (
  <ol className="relative space-y-5 border-l pl-6" aria-busy="true" aria-label="Loading activity">
    {Array.from({ length: SKELETON_EVENT_COUNT }, (_, index) => (
      <li key={index} className="relative">
        <span className="absolute top-1.5 -left-6 size-2.5 -translate-x-1/2 rounded-full bg-muted-foreground/30" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton height={14} className="w-full max-w-[320px] rounded-md" />
            <Skeleton height={12} className="w-full max-w-[200px] rounded-md" />
          </div>
          <Skeleton height={12} className="w-1/5 max-w-24 rounded-md" />
        </div>
      </li>
    ))}
  </ol>
)

const ChangeValue: React.FC<{ value: string | null }> = ({ value }) => (value ? <span className="font-medium">{value}</span> : <span className="text-muted-foreground italic">Not set</span>)

const ChangeText: React.FC<{ change: THistoryChange }> = ({ change }) => (
  <>
    changed {change.field} from <ChangeValue value={change.from} /> to <ChangeValue value={change.to} />
  </>
)

const EventDescription: React.FC<{ event: THistoryEvent }> = ({ event }) => {
  if (event.kind === 'created')
    return (
      <>
        {event.source ? (
          <>
            created this vulnerability from <span className="font-medium">{event.source}</span>
          </>
        ) : (
          'created this vulnerability'
        )}
      </>
    )
  if (event.kind === 'deleted') return <>deleted this vulnerability</>
  if (!event.changes.length) return <>updated this vulnerability</>
  return (
    <span className="flex flex-col gap-0.5">
      {event.changes.map((change) => (
        <span key={change.field}>
          <ChangeText change={change} />
        </span>
      ))}
    </span>
  )
}

const ActivityTab: React.FC<{ vulnerabilityId: string }> = ({ vulnerabilityId }) => {
  const { histories, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useVulnerabilityHistories(vulnerabilityId)
  const { userIds, groupIds, personnelIds } = useMemo(() => historyReferencedIds(histories), [histories])
  const { userMap, tokenMap } = useAuthorMaps(userIds)
  const groupWhere = useMemo(() => ({ idIn: groupIds }), [groupIds])
  const { groups } = useGetGroupNames({ where: groupWhere, enabled: groupIds.length > 0 })
  const groupNames = useMemo(() => new Map(groups.map((group) => [group.id, group.displayName || group.name])), [groups])
  const personnelWhere = useMemo(() => ({ idIn: personnelIds }), [personnelIds])
  const { nodes: personnel } = useIdentityHolderOptions({ where: personnelWhere, enabled: personnelIds.length > 0 })
  const personnelNames = useMemo(() => new Map(personnel.map((person) => [person.id, person.fullName || person.email || person.id])), [personnel])

  const events = useMemo(
    () =>
      buildHistoryEvents(histories, !!hasNextPage, (kind, id) => {
        if (kind === 'group') return groupNames.get(id) ?? 'a group'
        if (kind === 'personnel') return personnelNames.get(id) ?? 'a person'
        return resolveAuthorName(id, { userMap, tokenMap })
      }),
    [histories, hasNextPage, userMap, tokenMap, groupNames, personnelNames],
  )

  useEffect(() => {
    if (events.length < MIN_VISIBLE_EVENTS && hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [events.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isPending) return <ActivitySkeleton />
  if (isError) return <EmptyTabState title="Activity unavailable" description="The change history for this vulnerability could not be loaded." />
  if (!events.length && !hasNextPage) return <EmptyTabState title="No activity yet" description="Changes to this vulnerability will appear here." />

  return (
    <div className="space-y-4">
      <ol className="relative space-y-5 border-l pl-6">
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute top-1.5 -left-6 flex -translate-x-1/2 size-2.5 items-center justify-center rounded-full bg-muted-foreground">
              {event.kind === 'created' && <Plus className="size-2 text-background" />}
            </span>
            <div className="flex items-start justify-between gap-4 text-sm">
              <div className="min-w-0">
                <span className="font-semibold">{event.actorId ? resolveAuthorName(event.actorId, { userMap, tokenMap }) : 'System'}</span> <EventDescription event={event} />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(event.at)}</span>
            </div>
          </li>
        ))}
      </ol>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? 'Loading…' : 'Load older activity'}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Activity shows changes to this vulnerability&apos;s own fields. Linked tasks, controls and remediations have their own history.</p>
    </div>
  )
}

export default ActivityTab
