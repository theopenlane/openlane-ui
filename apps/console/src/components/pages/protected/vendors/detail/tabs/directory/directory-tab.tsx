'use client'

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import type { EntityQuery } from '@repo/codegen/src/schema'
import { useVendorDirectoryCoverage, useVendorDirectoryGroup, useVendorDirectoryGroups } from '@/lib/graphql-hooks/vendor-directory'
import { useFetchNextPageOnVisible } from '@/hooks/useFetchNextPageOnVisible'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { StatusLine } from '@/components/shared/status-line/status-line'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { pluralize } from '@/utils/strings'
import DirectoryCoverageStats from './directory-coverage-stats'
import DirectoryGroupCard from './directory-group-card'

type DirectoryTabProps = {
  vendor: EntityQuery['entity']
}

const GROUP_QUERY_PARAM = 'group'

const DirectoryTab: React.FC<DirectoryTabProps> = ({ vendor }) => {
  const integrationIDs = useMemo(() => (vendor.integrations?.edges ?? []).flatMap((edge) => (edge?.node?.id ? [edge.node.id] : [])), [vendor.integrations?.edges])

  const searchParams = useSearchParams()
  const targetGroupId = searchParams.get(GROUP_QUERY_PARAM)

  const [showEmptyGroups, setShowEmptyGroups] = useState(false)

  const coverage = useVendorDirectoryCoverage({ integrationIDs })
  const target = useVendorDirectoryGroup({ integrationIDs, groupID: targetGroupId })
  const { groups, isPending, isError, isPlaceholderData, error, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = useVendorDirectoryGroups({
    integrationIDs,
    includeEmptyGroups: showEmptyGroups,
  })

  useQueryErrorNotification({ error: error ?? coverage.error ?? target.error, description: 'Failed to load the vendor directory' })

  const sentinelRef = useFetchNextPageOnVisible({ hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage })

  const listedGroups = useMemo(() => (target.group ? groups.filter((group) => group.id !== target.group?.id) : groups), [groups, target.group])
  const emptyGroupCount = coverage.emptyGroups ?? 0
  const showIntegrationBadge = integrationIDs.length > 1
  const targetMissing = !!targetGroupId && target.isSuccess && !target.group

  if (integrationIDs.length === 0) {
    return <EmptyTabState title="No directory groups" description="This vendor has no connected integrations with a directory." />
  }

  if (isPending || coverage.isPending || (!!targetGroupId && target.isPending)) {
    return <StatusLine>Loading directory…</StatusLine>
  }

  if (isError && groups.length === 0) {
    return <div className="py-6 text-sm text-muted-foreground">The directory could not be loaded.</div>
  }

  if (coverage.totalGroups === 0) {
    return <EmptyTabState title="No directory groups" description="No directory groups have been synced for this vendor’s integrations yet." />
  }

  return (
    <div className="space-y-4">
      <DirectoryCoverageStats totalGroups={coverage.totalGroups} totalAccounts={coverage.totalAccounts} matchedAccounts={coverage.matchedAccounts} />
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
      {targetMissing && <div className="text-sm text-muted-foreground">The linked group is not part of this vendor’s directory.</div>}
      <div className={cn('space-y-2', isPlaceholderData && 'opacity-60')}>
        {target.group && <DirectoryGroupCard key={target.group.id} group={target.group} showIntegrationBadge={showIntegrationBadge} isTarget />}
        {listedGroups.length === 0 && !target.group ? (
          <div className="rounded-md border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            All {emptyGroupCount} synced {pluralize(emptyGroupCount, 'group has', 'groups have')} no members. Use “Show empty groups” above to view them.
          </div>
        ) : (
          listedGroups.map((group) => <DirectoryGroupCard key={group.id} group={group} showIntegrationBadge={showIntegrationBadge} />)
        )}
      </div>
      <div ref={sentinelRef}>
        {isFetchingNextPage && <StatusLine>Loading more groups…</StatusLine>}
        {isFetchNextPageError && !isFetchingNextPage && (
          <Button type="button" variant="link" className="text-blue-500" onClick={() => fetchNextPage()}>
            Retry loading more groups
          </Button>
        )}
      </div>
    </div>
  )
}

export default DirectoryTab
