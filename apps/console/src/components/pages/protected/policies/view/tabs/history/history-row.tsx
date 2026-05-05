'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { formatTimeSince } from '@/utils/date'
import { type ApiToken, type User } from '@repo/codegen/src/schema'
import AuthorBadge from '@/components/shared/user-display/author-badge'
import { getRevisionKind } from './utils'

type HistoryRowProps = {
  id: string
  revision: string | null | undefined
  occurredAt: string | null | undefined
  user?: User
  token?: ApiToken
  isCurrent?: boolean
  onView?: (id: string) => void
  onRestore?: (id: string) => void
}

const HistoryRow: React.FC<HistoryRowProps> = ({ id, revision, occurredAt, user, token, isCurrent, onView, onRestore }) => {
  const kind = getRevisionKind(revision)

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Badge variant="outline" className="capitalize">
          {kind}
        </Badge>
        <div className="flex flex-col min-w-0">
          <span className="font-medium">{revision ?? '—'}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            {occurredAt ? formatTimeSince(occurredAt) : null}
            {occurredAt ? <span aria-hidden="true">·</span> : null}
            <AuthorBadge user={user} token={token} />
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isCurrent ? (
          <Badge variant="outline">Current</Badge>
        ) : (
          <>
            {onView ? (
              <Button type="button" variant="outline" onClick={() => onView(id)}>
                View
              </Button>
            ) : null}
            {onRestore ? (
              <Button type="button" variant="outline" onClick={() => onRestore(id)}>
                Restore
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export default HistoryRow
