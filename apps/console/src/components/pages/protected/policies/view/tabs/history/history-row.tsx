'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { formatTimeSince } from '@/utils/date'
import { AuthorDisplay } from '@/components/shared/user-display/author-cell'
import { type ResolvedAuthor } from '@/lib/authors'
import { getRevisionKind } from './utils'

type HistoryRowProps = {
  id: string
  revision: string | null | undefined
  occurredAt: string | null | undefined
  author: ResolvedAuthor
  isCurrent?: boolean
  onView?: (id: string) => void
  onRestore?: (id: string) => void
}

const HistoryRow: React.FC<HistoryRowProps> = ({ id, revision, occurredAt, author, isCurrent, onView, onRestore }) => {
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
            <AuthorDisplay author={author} className="flex items-center gap-1" />
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
