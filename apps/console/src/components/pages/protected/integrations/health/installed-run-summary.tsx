'use client'

import React from 'react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { type TIntegrationRunSummary } from '@/lib/integrations/run-health'
import { formatTimeSince } from '@/utils/date'
import { formatList } from '@/utils/strings'
import { RunStrip } from './run-strip'

type TInstalledRunSummaryProps = {
  newestFirstRuns: TIntegrationRunSummary[]
  failingOperations: string[]
  isLoading: boolean
  providerId: string
}

const InstalledRunSummary = ({ newestFirstRuns, failingOperations, isLoading, providerId }: TInstalledRunSummaryProps) => {
  if (isLoading) {
    return <Skeleton height={62} className="w-full rounded-md" />
  }

  const latestRun = newestFirstRuns[0]

  if (!latestRun) {
    return <p className="rounded-md border px-3 py-2 text-xs text-muted-foreground">No runs recorded yet.</p>
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border px-3 py-2">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="whitespace-nowrap">Last run {formatTimeSince(latestRun.startedAt)}</span>
        {failingOperations.length > 0 ? <span className="truncate text-destructive">{formatList(failingOperations)} failing</span> : null}
      </div>
      <RunStrip newestFirstRuns={newestFirstRuns} providerId={providerId} stretch />
    </div>
  )
}

export default InstalledRunSummary
