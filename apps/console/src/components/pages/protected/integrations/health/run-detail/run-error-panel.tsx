'use client'

import React from 'react'
import { CircleX, Copy, TriangleAlert } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import { useCopyWithNotification } from '@/hooks/useCopyWithNotification'
import { runOutcome, summarizeRunError, type TIntegrationRunSummary } from '@/lib/integrations/run-health'
import { HttpStatusChip } from '../health-controls'

const RunErrorPanel = ({ run }: { run: Pick<TIntegrationRunSummary, 'status' | 'error'> }) => {
  const copyToClipboard = useCopyWithNotification()
  const rawError = run.error?.trim()
  const error = summarizeRunError(rawError)

  if (!error || !rawError) {
    return null
  }

  const isPartial = runOutcome(run) === 'partial'
  const Icon = isPartial ? TriangleAlert : CircleX

  return (
    <Card className={cn('flex flex-col gap-3 p-6', isPartial ? 'border-warning/50' : 'border-destructive/50')}>
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4', isPartial ? 'text-warning' : 'text-destructive')} aria-hidden="true" />
        <h3 className="font-medium">{isPartial ? 'Some records could not be saved' : error.title}</h3>
      </div>
      <p className="text-sm">{isPartial ? 'The run finished, but some records were not saved. See the raw error for details.' : error.guidance}</p>
      {error.httpStatus && !isPartial ? (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 border-t pt-3 text-sm">
          <dt className="text-muted-foreground">HTTP status</dt>
          <dd>
            <HttpStatusChip status={error.httpStatus} />
            {error.httpStatusText}
          </dd>
        </dl>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Raw error</span>
          <Button variant="secondary" icon={<Copy className="size-4" />} iconPosition="left" onClick={() => copyToClipboard(rawError, 'Raw error')}>
            Copy
          </Button>
        </div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-background p-3 font-mono text-xs">{rawError}</pre>
      </div>
    </Card>
  )
}

export default RunErrorPanel
