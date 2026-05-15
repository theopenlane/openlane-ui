'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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

  const { groups, totalGroups, totalMembers, loadedMembers, matchedMembers, isLoading, isFetchingNextPage, paginationMeta, fetchNextPage } = useVendorDirectory({
    integrationIDs,
    pagination,
    enabled: integrationIDs.length > 0,
  })

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
      <InfiniteScroll pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} pageSize={PAGE_SIZE}>
        <div className="space-y-2">
          {groups.map((group) => (
            <DirectoryGroupCard key={group.id} group={group} showIntegrationBadge={showIntegrationBadge} targetGroupId={targetGroupId} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  )
}

export default DirectoryTab
