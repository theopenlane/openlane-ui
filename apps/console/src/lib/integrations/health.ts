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
  tooltip?: string
}

type TIntegrationHealthMeta = {
  label: string
  variant: NonNullable<BadgeProps['variant']>
  rank: number
  isUnhealthy: boolean
}

const INTEGRATION_HEALTH: Record<IntegrationIntegrationStatus, TIntegrationHealthMeta> = {
  [IntegrationIntegrationStatus.CONNECTED]: { label: 'Healthy', variant: 'green', rank: 0, isUnhealthy: false },
  [IntegrationIntegrationStatus.DEGRADED]: { label: 'Degraded', variant: 'destructive', rank: 1, isUnhealthy: true },
  [IntegrationIntegrationStatus.ERRORED]: { label: 'Needs Attention', variant: 'destructive', rank: 2, isUnhealthy: true },
  [IntegrationIntegrationStatus.PENDING]: { label: 'Pending', variant: 'outline', rank: 3, isUnhealthy: false },
  [IntegrationIntegrationStatus.DISABLED]: { label: 'Disabled', variant: 'secondary', rank: 4, isUnhealthy: false },
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

const UNKNOWN_HEALTH_META: Omit<TIntegrationHealthMeta, 'label'> = { variant: 'outline', rank: Number.MAX_SAFE_INTEGER, isUnhealthy: true }

const healthMeta = (status: IntegrationIntegrationStatus): TIntegrationHealthMeta => INTEGRATION_HEALTH[status] ?? { ...UNKNOWN_HEALTH_META, label: getEnumLabel(status) }

export const integrationHealthBadge = (status: IntegrationIntegrationStatus, health?: IntegrationHealth, isChecking = false): TIntegrationHealthBadge => {
  if (isChecking) {
    return { label: 'Checking', variant: 'secondary' }
  }

  const { label, variant } = healthMeta(status)

  return { label, variant, summary: integrationHealthSummary(status, health) }
}

const UNHEALTHY_LABELS = Object.values(INTEGRATION_HEALTH)
  .filter(({ isUnhealthy }) => isUnhealthy)
  .map(({ label }) => label)
  .join(' and ')

const UNHEALTHY_TOOLTIP = `Includes ${UNHEALTHY_LABELS} integrations.`

export const matchesIntegrationHealthFilter = (status: IntegrationIntegrationStatus, selected: IntegrationHealthFilter): boolean => {
  if (selected === 'All') {
    return true
  }

  if (selected === 'Unhealthy') {
    return healthMeta(status).isUnhealthy
  }

  return status === selected
}

export const buildIntegrationHealthOptions = (integrations: IntegrationNode[], selected: IntegrationHealthFilter): TIntegrationHealthOption[] => {
  const counts = new Map<IntegrationIntegrationStatus, number>()

  for (const { status } of integrations) {
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  if (selected !== 'All' && selected !== 'Unhealthy' && !counts.has(selected)) {
    counts.set(selected, 0)
  }

  const statusEntries = [...counts.entries()].sort(([a], [b]) => healthMeta(a).rank - healthMeta(b).rank)

  const unhealthyCount = statusEntries.reduce((total, [status, count]) => total + (healthMeta(status).isUnhealthy ? count : 0), 0)

  const options: TIntegrationHealthOption[] = [
    { value: 'All', label: 'All', count: integrations.length },
    { value: 'Unhealthy', label: 'Unhealthy', count: unhealthyCount, tooltip: UNHEALTHY_TOOLTIP },
    ...statusEntries.map(([status, count]) => ({ value: status, label: healthMeta(status).label, count })),
  ]

  const hasIntegrations = integrations.length > 0

  return options.filter(({ value, count }) => value === 'All' || count > 0 || value === selected || (value === 'Unhealthy' && hasIntegrations))
}
