'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@repo/ui/button'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import { type TPagination } from '@repo/ui/pagination-types'
import type { EntityQuery } from '@repo/codegen/src/schema'
import { useVendorDirectory } from '@/lib/graphql-hooks/vendor-directory'
import DirectoryCoverageStats from './directory-coverage-stats'
import DirectoryGroupCard from './directory-group-card'

type DirectoryTabProps = {
  vendor: EntityQuery['entity']
}

const PAGE_SIZE = 30
const GROUP_QUERY_PARAM = 'group'

const INITIAL_PAGINATION: TPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  query: { first: PAGE_SIZE },
}

const DirectoryTab: React.FC<DirectoryTabProps> = ({ vendor }) => {
  const integrationIDs = useMemo(() => (vendor.integrations?.edges ?? []).flatMap((edge) => (edge?.node?.id ? [edge.node.id] : [])), [vendor.integrations?.edges])

  const searchParams = useSearchParams()
  const targetGroupId = searchParams.get(GROUP_QUERY_PARAM)

  const [pagination, setPagination] = useState<TPagination>(INITIAL_PAGINATION)
  const [showEmptyGroups, setShowEmptyGroups] = useState(false)

  const { groups, totalGroups, totalMembers, loadedMembers, matchedMembers, isLoading, isFetchingNextPage, paginationMeta, fetchNextPage } = useVendorDirectory({
    integrationIDs,
    pagination,
    enabled: integrationIDs.length > 0,
  })

  const emptyGroupCount = useMemo(() => groups.filter((g) => g.members.totalCount === 0).length, [groups])
  const visibleGroups = useMemo(() => {
    if (showEmptyGroups) return groups
    return groups.filter((g) => g.members.totalCount > 0 || g.id === targetGroupId)
  }, [groups, showEmptyGroups, targetGroupId])

  useEffect(() => {
    if (pagination.page > 1) {
      fetchNextPage()
    }
  }, [pagination.page, fetchNextPage])

  useEffect(() => {
    if (!targetGroupId) return
    if (isLoading || isFetchingNextPage) return
    if (groups.some((g) => g.id === targetGroupId)) return
    if (!paginationMeta.pageInfo?.hasNextPage) return
    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
  }, [targetGroupId, groups, isLoading, isFetchingNextPage, paginationMeta.pageInfo?.hasNextPage])

  const showIntegrationBadge = integrationIDs.length > 1

  if (isLoading && groups.length === 0) {
    return <div className="py-6 text-sm text-muted-foreground">Loading directory…</div>
  }

  if (!isLoading && groups.length === 0) {
    return <div className="py-6 text-sm text-muted-foreground">No directory groups have been synced for this vendor’s integrations yet.</div>
  }

  return (
    <div className="space-y-4">
      <DirectoryCoverageStats totalGroups={totalGroups} totalMembers={totalMembers} loadedMembers={loadedMembers} matchedMembers={matchedMembers} />
      {emptyGroupCount > 0 && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            icon={showEmptyGroups ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
            iconPosition="left"
            onClick={() => setShowEmptyGroups((prev) => !prev)}
          >
            {showEmptyGroups ? `Hide empty groups (${emptyGroupCount})` : `Show empty groups (${emptyGroupCount})`}
          </Button>
        </div>
      )}
      <InfiniteScroll pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} pageSize={PAGE_SIZE}>
        <div className="space-y-2">
          {visibleGroups.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              All {emptyGroupCount} synced {emptyGroupCount === 1 ? 'group has' : 'groups have'} no members. Use “Show empty groups” above to view them.
            </div>
          ) : (
            visibleGroups.map((group) => <DirectoryGroupCard key={group.id} group={group} showIntegrationBadge={showIntegrationBadge} targetGroupId={targetGroupId} />)
          )}
        </div>
      </InfiniteScroll>
    </div>
  )
}

export default DirectoryTab
