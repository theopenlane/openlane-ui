import React from 'react'
import { Button } from '@repo/ui/button'
import { useDirectoryGroupMembers } from '@/lib/graphql-hooks/vendor-directory'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { StatusLine } from '@/components/shared/status-line/status-line'
import DirectoryMembersTable from './directory-members-table'

type DirectoryGroupMembersProps = {
  groupID: string
}

const DirectoryGroupMembers: React.FC<DirectoryGroupMembersProps> = ({ groupID }) => {
  const { members, totalMembers, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useDirectoryGroupMembers({ groupID })

  useQueryErrorNotification({ error, description: 'Failed to load group members' })

  if (isPending) {
    return <StatusLine>Loading members…</StatusLine>
  }

  if (isError && members.length === 0) {
    return <div className="px-4 py-3 text-sm text-muted-foreground">Members could not be loaded.</div>
  }

  return (
    <div className="space-y-3">
      <DirectoryMembersTable members={members} />
      {hasNextPage && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">
            Showing {members.length} of {totalMembers}
          </span>
          <Button type="button" variant="secondary" loading={isFetchingNextPage} disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            Load more members
          </Button>
        </div>
      )}
    </div>
  )
}

export default DirectoryGroupMembers
