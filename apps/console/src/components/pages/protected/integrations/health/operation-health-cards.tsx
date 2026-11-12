'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { OPERATION_HEALTH_META, runOutcome, type TOperationHealth } from '@/lib/integrations/run-health'
import { formatTimeSince } from '@/utils/date'
import { ConfigureButton, HealthCheckButton } from './health-controls'
import { OperationHealthBadge } from './run-status-badge'
import { RunStrip } from './run-strip'
import { type TInstanceHealth } from './use-integration-health'

const operationFootnote = (operation: TOperationHealth, length: 'full' | 'short'): string => {
  const meta = OPERATION_HEALTH_META[operation.state]
  const isShort = length === 'short'

  if (operation.state === 'disabled' && !isShort) return 'Turn on in Configure'
  if (operation.state === 'unavailable' && !isShort) return 'Not available yet'
  if (!meta.isEnabled) return meta.label

  const latest = operation.latestFinishedRun
  if (!latest) return operation.newestFirstRuns.length > 0 ? 'First run in progress' : meta.label

  const since = formatTimeSince(latest.startedAt)

  const hasFailed = runOutcome(latest) === 'failed'

  if (isShort) return `${operation.state === 'stopped' ? 'Stopped · ' : ''}${hasFailed ? 'Failed ' : ''}${since}`

  if (hasFailed) {
    const lastSuccess = operation.lastSuccess?.finishedAt ? ` · last success ${formatTimeSince(operation.lastSuccess.finishedAt)}` : ''

    return `Last run failed ${since}${lastSuccess}`
  }

  return `${operation.state === 'stopped' ? 'Stopped · last run' : 'Last run'} ${since}${latest.summary ? ` · ${latest.summary}` : ''}`
}

const NoOperations = ({ subject }: { subject: string }) => (
  <p className="rounded-md border px-3 py-4 text-center text-sm text-muted-foreground">No recurring operations are set up for this {subject}.</p>
)

export const OperationHealthGrid = ({ operations, providerId, isLoading }: { operations: TOperationHealth[]; providerId: string; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" role="status" aria-live="polite" aria-label="Loading operations">
        {[0, 1].map((index) => (
          <Skeleton key={index} height={116} className="w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (operations.length === 0) {
    return <NoOperations subject="integration" />
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {operations.map((operation) => {
        const meta = OPERATION_HEALTH_META[operation.state]

        return (
          <Card key={operation.key} className={cn('flex min-w-0 flex-col gap-2 p-4', meta.needsAttention && 'border-destructive/50', !meta.isEnabled && 'text-muted-foreground')}>
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 truncate font-medium">{operation.name}</span>
              <span className="shrink-0">
                <OperationHealthBadge state={operation.state} />
              </span>
            </div>
            {operation.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{operation.description}</p> : null}
            {meta.isEnabled && operation.newestFirstRuns.length > 0 ? <RunStrip newestFirstRuns={operation.newestFirstRuns} providerId={providerId} /> : null}
            <p className="mt-auto line-clamp-2 text-xs text-muted-foreground">{operationFootnote(operation, 'full')}</p>
          </Card>
        )
      })}
    </div>
  )
}

type TInstanceHealthCardProps = {
  instance: TInstanceHealth
  providerId: string
  isLoading: boolean
  canManage: boolean
  canConfigure: boolean
  checkingIntegrationId?: string
  isCheckDisabled: boolean
  onHealthCheck: (integrationId: string) => void
  onConfigure: (integrationId: string) => void
}

export const InstanceHealthCard = ({ instance, providerId, isLoading, canManage, canConfigure, checkingIntegrationId, isCheckDisabled, onHealthCheck, onConfigure }: TInstanceHealthCardProps) => {
  const lastHealthCheck = instance.health?.lastSuccessfulHealthCheck
  const integrationId = instance.integration.id

  return (
    <Card className="flex min-w-0 flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{instance.label}</p>
          {instance.secondaryId ? <p className="truncate font-mono text-xs text-muted-foreground">{instance.secondaryId}</p> : null}
        </div>
        {isLoading ? null : (
          <Badge variant={instance.badge.variant} className="shrink-0">
            {instance.badge.label}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{lastHealthCheck ? `Last passing health check ${formatTimeSince(lastHealthCheck)}` : 'No passing health check recorded'}</p>
      {isLoading ? (
        <Skeleton height={96} className="w-full rounded-md" />
      ) : instance.operations.length === 0 ? (
        <NoOperations subject="instance" />
      ) : (
        <ul className="divide-y rounded-md border">
          {instance.operations.map((operation) => {
            const meta = OPERATION_HEALTH_META[operation.state]

            return (
              <li key={operation.key} className={cn('flex items-center gap-3 px-3 py-2 text-sm', meta.needsAttention && 'bg-destructive/5', !meta.isEnabled && 'text-muted-foreground')}>
                <span className={cn('size-2 shrink-0 rounded-full', meta.dotClassName)} aria-hidden="true" />
                <span className="w-32 shrink-0 truncate font-medium">{operation.name}</span>
                <div className="flex min-w-0 flex-1 justify-end overflow-x-clip py-1">
                  {meta.isEnabled && operation.newestFirstRuns.length > 0 ? <RunStrip newestFirstRuns={operation.newestFirstRuns} providerId={providerId} /> : null}
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{operationFootnote(operation, 'short')}</span>
              </li>
            )
          })}
        </ul>
      )}
      {canManage ? (
        <div className="flex flex-wrap items-center gap-2">
          <HealthCheckButton variant="secondary" onClick={() => onHealthCheck(integrationId)} isChecking={checkingIntegrationId === integrationId} disabled={isCheckDisabled} />
          {canConfigure ? <ConfigureButton onClick={() => onConfigure(integrationId)} /> : null}
        </div>
      ) : null}
    </Card>
  )
}
