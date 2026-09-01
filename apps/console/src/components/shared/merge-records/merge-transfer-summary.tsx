'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Loader2 } from 'lucide-react'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import type { MergeEdgeTransferCount } from './types'

type Props = {
  counts: MergeEdgeTransferCount[]
  isLoading: boolean
  error: unknown
  hasAclEdges: boolean
}

export const MergeTransferSummary: React.FC<Props> = ({ counts, isLoading, error, hasAclEdges }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold">Linked records being transferred</h3>
      {isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
    </div>
    <div className="rounded-md border p-3 bg-muted/20 space-y-2">
      {error ? (
        <p className="text-xs text-destructive">Could not read the linked records, so merging is blocked and nothing is lost: {parseErrorMessage(error)}</p>
      ) : isLoading ? (
        <p className="text-xs text-muted-foreground">Loading linked records from secondary…</p>
      ) : counts.length === 0 ? (
        <p className="text-xs text-muted-foreground">No linked records on the secondary. Nothing else to transfer.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {counts.map((c) => (
            <Badge key={c.key} variant="outline" className="text-xs">
              {c.count} {c.label.toLowerCase()}
            </Badge>
          ))}
        </div>
      )}
      {!error && hasAclEdges && <p className="text-xs text-muted-foreground">Group permissions on the secondary (editors, viewers, blocked groups) are not transferred and are removed with it.</p>}
    </div>
  </section>
)
