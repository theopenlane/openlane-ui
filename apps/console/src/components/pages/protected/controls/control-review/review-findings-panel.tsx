'use client'

import React from 'react'
import { InfoIcon } from 'lucide-react'
import { Panel } from '@repo/ui/panel'
import { Badge } from '@repo/ui/badge'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { type FindingsNodeNonNull } from '@/lib/graphql-hooks/finding'

type TReviewFindingsPanelProps = {
  findings: FindingsNodeNonNull[]
  totalCount?: number
  isLoading: boolean
}

const ReviewFindingsPanel: React.FC<TReviewFindingsPanelProps> = ({ findings, totalCount, isLoading }) => (
  <Panel className="p-4 flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <InfoIcon size={16} className="text-warning" />
      <p className="text-lg font-medium">Findings</p>
      {!isLoading && <Badge variant="select">{totalCount ?? findings.length}</Badge>}
    </div>

    {isLoading && <Skeleton height={64} />}

    {!isLoading && findings.length === 0 && <p className="text-sm text-muted-foreground">No findings were raised in this review.</p>}

    {!isLoading && (totalCount ?? 0) > findings.length && <p className="text-xs text-muted-foreground">Showing the first {findings.length} findings. Open the Findings tab to see all of them.</p>}

    {!isLoading &&
      findings.map((finding) => (
        <div key={finding.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{finding.displayName || finding.displayID || 'Untitled finding'}</span>
            <div className="flex items-center gap-2 shrink-0">
              <SeverityChip severity={finding.severity} />
              {finding.findingStatusName ? <Badge variant="select">{finding.findingStatusName}</Badge> : null}
            </div>
          </div>
          {finding.description ? <p className="text-sm text-muted-foreground">{finding.description}</p> : null}
        </div>
      ))}
  </Panel>
)

export default ReviewFindingsPanel
