'use client'

import React from 'react'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip'
import { cn } from '@repo/ui/lib/utils'
import { integrationRunHref, runDurationMs, runOutcomeMeta, summarizeRunError, type TIntegrationRunSummary } from '@/lib/integrations/run-health'
import { formatDateTime, formatDurationMs } from '@/utils/date'
import { RunErrorText } from './health-controls'

type TRunStripProps = {
  newestFirstRuns: TIntegrationRunSummary[]
  providerId: string
  className?: string
}

const RunTooltip = ({ run }: { run: TIntegrationRunSummary }) => {
  const { label, textClassName } = runOutcomeMeta(run)
  const error = summarizeRunError(run.error)

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium">
          {run.operationName || 'Run'} <span className={textClassName}>{label.toLowerCase()}</span>
        </span>
        <span className="whitespace-nowrap text-muted-foreground">{formatDurationMs(runDurationMs(run))}</span>
      </div>
      <p className="text-muted-foreground">{formatDateTime(run.startedAt)}</p>
      {error ? (
        <p className="break-words">
          <RunErrorText error={error} />
        </p>
      ) : run.summary ? (
        <p>{run.summary}</p>
      ) : null}
      <p className="text-muted-foreground">Click to open the run</p>
    </div>
  )
}

export const RunStrip = ({ newestFirstRuns, providerId, className }: TRunStripProps) => (
  <div className={cn('flex h-4 items-stretch gap-0.5', className)}>
    {[...newestFirstRuns].reverse().map((run, index, runs) => {
      const { label, barClassName } = runOutcomeMeta(run)

      return (
        <Tooltip key={run.id}>
          <TooltipTrigger asChild>
            <Link
              href={integrationRunHref(providerId, run.id)}
              prefetch={false}
              tabIndex={index === runs.length - 1 ? 0 : -1}
              aria-label={`${run.operationName || 'Run'} ${label.toLowerCase()}, ${formatDateTime(run.startedAt)}`}
              className="group/bar block w-3 min-w-1 shrink rounded-[3px] outline-offset-2 *:pointer-events-none focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className={cn('block h-full w-full rounded-[3px] group-hover/bar:ring-1 group-hover/bar:ring-foreground/70', barClassName)} />
            </Link>
          </TooltipTrigger>
          <TooltipContent portal side="top" align="start" className="max-w-xs whitespace-normal break-words">
            <RunTooltip run={run} />
          </TooltipContent>
        </Tooltip>
      )
    })}
  </div>
)
