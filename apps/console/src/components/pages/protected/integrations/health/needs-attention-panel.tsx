'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Callout } from '@/components/shared/callout/callout'
import { isOperableIntegration } from '@/lib/integrations/health'
import { integrationRunHref, runOutcome, summarizeRunError, type TOperationHealth } from '@/lib/integrations/run-health'
import { formatDateTime } from '@/utils/date'
import { pluralizeWithCount } from '@/utils/strings'
import { ConfigureButton, RunErrorText } from './health-controls'
import { OperationHealthBadge } from './run-status-badge'
import { type TInstanceHealth } from './use-integration-health'

type TNeedsAttentionPanelProps = {
  instances: TInstanceHealth[]
  providerId: string
  canConfigure: boolean
  onConfigure: (integrationId: string) => void
}

type TOperationAttentionProps = Omit<TNeedsAttentionPanelProps, 'instances'> & {
  operation: TOperationHealth
  instanceLabel?: string
}

const streakFailures = (operation: TOperationHealth) => operation.newestFirstRuns.filter((run) => runOutcome(run) === 'failed').slice(0, operation.failureStreak)

const streakLabel = ({ failureStreak, isStreakCapped }: TOperationHealth): string => {
  if (isStreakCapped) return `${failureStreak}+ failures in a row`

  return failureStreak === 1 ? 'Last run failed' : `${pluralizeWithCount(failureStreak, 'failure')} in a row`
}

const failureWindow = (operation: TOperationHealth): string | undefined => {
  const failures = streakFailures(operation)
  const latest = failures[0]
  const first = failures[failures.length - 1]

  if (!latest || !first) return undefined
  if (latest.id === first.id) return `Failed ${formatDateTime(latest.startedAt)}.`

  return `${operation.isStreakCapped ? 'Failing since at least' : 'First failed'} ${formatDateTime(first.startedAt)}. Last attempt ${formatDateTime(latest.startedAt)}.`
}

const OperationAttention = ({ operation, instanceLabel, providerId, canConfigure, onConfigure }: TOperationAttentionProps) => {
  const failedRun = streakFailures(operation)[0]
  const error = summarizeRunError(failedRun?.error)
  const isStopped = operation.state === 'stopped'

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-4 md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{operation.name}</span>
          {instanceLabel ? <span className="text-sm text-muted-foreground">on {instanceLabel}</span> : null}
          {isStopped ? <OperationHealthBadge state="stopped" /> : null}
          {operation.failureStreak > 0 ? <Badge variant="red">{streakLabel(operation)}</Badge> : null}
        </div>
        {operation.stoppedReason ? <p className="break-words text-sm">{operation.stoppedReason}</p> : null}
        {error ? (
          <p className="break-words text-sm">
            <RunErrorText error={error} />
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {[
            failureWindow(operation),
            isStopped
              ? 'Syncing has stopped for this operation. Fix the cause, then run a health check to resume it.'
              : 'Each failure doubles the wait before the next attempt. After repeated failures in a row the whole integration stops syncing until a health check passes.',
          ]
            .filter(Boolean)
            .join(' ')}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {failedRun ? (
          <Button asChild variant="secondary">
            <Link href={integrationRunHref(providerId, failedRun.id)}>View Failed Run</Link>
          </Button>
        ) : null}
        {canConfigure ? <ConfigureButton onClick={() => onConfigure(operation.integrationId)} /> : null}
      </div>
    </div>
  )
}

const instanceReason = (instance: TInstanceHealth): string | undefined => {
  if (instance.attentionOperations.length > 0 && isOperableIntegration(instance.integration.status)) {
    return undefined
  }

  return instance.badge.summary ?? (instance.attentionOperations.length === 0 ? `This installation is reported as ${instance.badge.label}.` : undefined)
}

const NeedsAttentionPanel = ({ instances, providerId, canConfigure, onConfigure }: TNeedsAttentionPanelProps) => {
  const attentionInstances = instances.filter((instance) => instance.badge.severity > 0)
  if (attentionInstances.length === 0) {
    return null
  }

  const isMultiInstance = instances.length > 1
  const failingCount = attentionInstances.reduce((total, instance) => total + instance.attentionOperations.length, 0)

  return (
    <Callout variant="warning" title={failingCount > 0 ? `Needs attention: ${pluralizeWithCount(failingCount, 'operation')} failing` : 'Needs attention'}>
      <div className="mt-2 flex flex-col gap-3">
        {attentionInstances.map((instance) => {
          const reason = instanceReason(instance)

          return (
            <React.Fragment key={instance.integration.id}>
              {reason ? (
                <div className="rounded-md border bg-card p-4">
                  <p className="font-medium">{isMultiInstance ? `${instance.label}: ${instance.badge.label}` : instance.badge.label}</p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm">{reason}</p>
                </div>
              ) : null}
              {instance.attentionOperations.map((operation) => (
                <OperationAttention
                  key={operation.key}
                  operation={operation}
                  instanceLabel={isMultiInstance ? instance.label : undefined}
                  providerId={providerId}
                  canConfigure={canConfigure}
                  onConfigure={onConfigure}
                />
              ))}
            </React.Fragment>
          )
        })}
      </div>
    </Callout>
  )
}

export default NeedsAttentionPanel
