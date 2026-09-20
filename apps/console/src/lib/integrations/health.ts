import { IntegrationIntegrationStatus } from '@repo/codegen/src/schema'
import { type BadgeProps } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type IntegrationHealth, type IntegrationHealthFilter, type IntegrationNode } from './types'

export type TIntegrationHealthBadge = {
  label: string
  summary?: string
  variant: NonNullable<BadgeProps['variant']>
}

export type TIntegrationHealthOption = {
  value: IntegrationHealthFilter
  label: string
  count: number
}

type TIntegrationHealthMeta = {
  label: string
  variant: NonNullable<BadgeProps['variant']>
  rank: number
}

const INTEGRATION_HEALTH: Record<IntegrationIntegrationStatus, TIntegrationHealthMeta> = {
  [IntegrationIntegrationStatus.CONNECTED]: { label: 'Healthy', variant: 'green', rank: 0 },
  [IntegrationIntegrationStatus.DEGRADED]: { label: 'Degraded', variant: 'destructive', rank: 1 },
  [IntegrationIntegrationStatus.ERRORED]: { label: 'Needs Attention', variant: 'destructive', rank: 2 },
  [IntegrationIntegrationStatus.PENDING]: { label: 'Pending', variant: 'outline', rank: 3 },
  [IntegrationIntegrationStatus.DISABLED]: { label: 'Disabled', variant: 'secondary', rank: 4 },
}

const integrationHealthSummary = (status: IntegrationIntegrationStatus, health?: IntegrationHealth): string | undefined => {
  if (status === IntegrationIntegrationStatus.DEGRADED) {
    const failing = Object.entries(health?.unhealthyOperations ?? {})
      .map(([name, reason]) => `${name}: ${reason}`)
      .join('\n')
    return failing || 'One or more operations are failing.'
  }

  if (status === IntegrationIntegrationStatus.ERRORED) {
    return health?.unhealthyReason || 'The integration has stopped syncing.'
  }

  return undefined
}

const UNKNOWN_HEALTH_RANK = Number.MAX_SAFE_INTEGER

const healthMeta = (status: IntegrationIntegrationStatus): TIntegrationHealthMeta => INTEGRATION_HEALTH[status] ?? { label: getEnumLabel(status), variant: 'outline', rank: UNKNOWN_HEALTH_RANK }

export const integrationHealthBadge = (status: IntegrationIntegrationStatus, health?: IntegrationHealth, isChecking = false): TIntegrationHealthBadge => {
  if (isChecking) {
    return { label: 'Checking', variant: 'secondary' }
  }

  const { label, variant } = healthMeta(status)

  return { label, variant, summary: integrationHealthSummary(status, health) }
}

export const buildIntegrationHealthOptions = (installedIntegrations: IntegrationNode[], selected: IntegrationHealthFilter): TIntegrationHealthOption[] => {
  const counts = new Map<IntegrationIntegrationStatus, number>()

  for (const integration of installedIntegrations) {
    counts.set(integration.status, (counts.get(integration.status) ?? 0) + 1)
  }

  if (selected !== 'All' && !counts.has(selected)) {
    counts.set(selected, 0)
  }

  const byStatus = [...counts.entries()].sort(([a], [b]) => healthMeta(a).rank - healthMeta(b).rank).map(([status, count]) => ({ value: status, label: healthMeta(status).label, count }))

  return [{ value: 'All', label: 'All', count: installedIntegrations.length }, ...byStatus]
}
