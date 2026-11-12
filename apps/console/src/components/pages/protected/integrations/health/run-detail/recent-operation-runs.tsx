'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { operationRunsWhere, useIntegrationRunSummaries } from '@/lib/graphql-hooks/integration-run'
import { RUN_STRIP_LENGTH, integrationRunHref, runDurationMs, runOutcome, summarizeRunError, type TIntegrationRunSummary } from '@/lib/integrations/run-health'
import { formatDateTime, formatDurationMs } from '@/utils/date'
import { RunStatusBadge } from '../run-status-badge'

const RECENT_RUNS_COUNT = 5

type TRecentOperationRunsProps = {
  integrationId: string
  operationName: string
  currentRunId: string
  providerId: string
}

const recentRunSummary = (run: TIntegrationRunSummary): string => {
  const error = runOutcome(run) === 'failed' ? summarizeRunError(run.error) : undefined

  return error ? [error.httpStatus, error.message].filter(Boolean).join(' ') : run.summary || '-'
}

const RecentOperationRuns = ({ integrationId, operationName, currentRunId, providerId }: TRecentOperationRunsProps) => {
  const where = useMemo(() => operationRunsWhere(integrationId, operationName), [integrationId, operationName])
  const { runs, isPending } = useIntegrationRunSummaries({ where, first: RUN_STRIP_LENGTH })

  return (
    <Card className="flex flex-col gap-3 p-6">
      <h3 className="font-medium">Latest {operationName} runs</h3>
      {isPending ? (
        <Skeleton height={120} className="w-full rounded-md" />
      ) : (
        <ul className="divide-y">
          {runs.slice(0, RECENT_RUNS_COUNT).map((recent) => {
            const isCurrent = recent.id === currentRunId

            return (
              <li key={recent.id}>
                <Link
                  href={integrationRunHref(providerId, recent.id)}
                  prefetch={false}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn('flex items-center gap-4 rounded-sm px-2 py-2 text-sm hover:bg-muted/50', isCurrent && 'bg-muted/50')}
                >
                  <span className="w-24 shrink-0">
                    <RunStatusBadge run={recent} />
                  </span>
                  <span className="w-52 shrink-0 whitespace-nowrap">{formatDateTime(recent.startedAt)}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {isCurrent ? 'This run · ' : ''}
                    {recentRunSummary(recent)}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{formatDurationMs(runDurationMs(recent))}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export default RecentOperationRuns
