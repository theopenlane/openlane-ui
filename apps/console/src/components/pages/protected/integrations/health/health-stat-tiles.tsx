'use client'

import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { OPERATION_HEALTH_META } from '@/lib/integrations/run-health'
import { formatTimeSince } from '@/utils/date'
import { pluralize } from '@/utils/strings'
import { type TInstanceHealth } from './use-integration-health'

type TLastSuccess = { integrationID?: string | null; operationName?: string | null; finishedAt?: string | null }

type THealthStatTilesProps = {
  instances: TInstanceHealth[]
  overall: TInstanceHealth
  windowDays: number
  totalRuns?: number
  failedRuns?: number
  lastSuccess?: TLastSuccess
  isLoadingStats: boolean
  isLoadingRuns: boolean
}

type TStatTileProps = {
  label: string
  value: React.ReactNode
  caption?: string
  valueClassName?: string
  isLoading?: boolean
}

export const StatTile = ({ label, value, caption, valueClassName, isLoading }: TStatTileProps) => (
  <div className="flex min-w-0 flex-col gap-1 rounded-md border bg-card px-4 py-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    {isLoading ? <Skeleton height={24} className="w-full max-w-[120px] rounded-md" /> : <span className={cn('break-words text-lg font-medium', valueClassName)}>{value}</span>}
    {caption && !isLoading ? <span className="truncate text-xs text-muted-foreground">{caption}</span> : null}
  </div>
)

const statusCaption = (instances: TInstanceHealth[]): string => {
  if (instances.length > 1) {
    const attention = instances.filter((instance) => instance.badge.severity > 0).length

    return attention > 0 ? `${attention} of ${instances.length} instances need attention` : `${instances.length} instances`
  }

  const operations = (instances[0]?.operations ?? []).filter((operation) => OPERATION_HEALTH_META[operation.state].isEnabled)
  const failing = instances[0]?.attentionOperations.length ?? 0

  if (operations.length === 0) return 'No enabled operations'
  if (failing > 0) return `${failing} of ${operations.length} enabled ${pluralize(operations.length, 'operation')} failing`

  return `${operations.length} enabled ${pluralize(operations.length, 'operation')}`
}

const runsCaption = (total?: number, failed?: number): string | undefined => {
  if (total === undefined || failed === undefined) return undefined
  if (total === 0) return 'No runs in this window'
  if (failed === 0) return 'No failed runs'

  return `${failed} failed (${Math.ceil((failed / total) * 100)}%)`
}

const healthCheckTile = (instances: TInstanceHealth[]): { value: string; caption: string } => {
  const checks = instances.map((instance) => instance.health?.lastSuccessfulHealthCheck ?? '')
  const unchecked = checks.filter((check) => !check).length
  const isMultiInstance = instances.length > 1

  if (unchecked > 0) {
    return { value: 'Never', caption: isMultiInstance && unchecked < instances.length ? `${unchecked} of ${instances.length} instances have no passing check` : 'No passing check recorded' }
  }

  return { value: formatTimeSince([...checks].sort()[0]), caption: isMultiInstance ? `Oldest passing check across ${instances.length} instances` : 'Last passing check' }
}

const HealthStatTiles = ({ instances, overall, windowDays, totalRuns, failedRuns, lastSuccess, isLoadingStats, isLoadingRuns }: THealthStatTilesProps) => {
  const isMultiInstance = instances.length > 1
  const lastSuccessInstance = isMultiInstance ? instances.find((instance) => instance.integration.id === lastSuccess?.integrationID)?.label : undefined
  const lastHealthCheck = healthCheckTile(instances)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Status" value={overall.badge.label} valueClassName={overall.badge.textClassName} caption={statusCaption(instances)} isLoading={isLoadingRuns} />
      <StatTile
        label="Last successful run"
        value={lastSuccess?.finishedAt ? formatTimeSince(lastSuccess.finishedAt) : 'Never'}
        caption={lastSuccess ? [lastSuccess.operationName, lastSuccessInstance].filter(Boolean).join(' · ') : 'No run has succeeded yet'}
        isLoading={isLoadingStats}
      />
      <StatTile label={`Runs, last ${windowDays} days`} value={totalRuns ?? '-'} caption={runsCaption(totalRuns, failedRuns)} isLoading={isLoadingStats} />
      <StatTile label="Last health check" value={lastHealthCheck.value} caption={lastHealthCheck.caption} />
    </div>
  )
}

export default HealthStatTiles
