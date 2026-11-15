import {
  IntegrationRunIntegrationRunStatus,
  IntegrationRunIntegrationRunType,
  type IntegrationRunFieldsFragment,
  type IntegrationRunSummaryFieldsFragment,
  type IntegrationRunWhereInput,
} from '@repo/codegen/src/schema'
import { type BadgeProps } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { isRecord } from '@/utils/type-guards'
import { type IntegrationHealth, type IntegrationNode, type IntegrationProvider } from './types'
import { operationAvailability, recurringOperationNames, type TOperationAvailability } from './utils'

export type TIntegrationRun = IntegrationRunFieldsFragment

export type TIntegrationRunSummary = IntegrationRunSummaryFieldsFragment

export const RUN_STRIP_LENGTH = 20

export const integrationDefinitionHref = (providerId: string): string => `/automation/integrations/${providerId}`

export const integrationHealthHref = (providerId: string): string => `${integrationDefinitionHref(providerId)}/health`

export const integrationRunHref = (providerId: string, runId: string): string => `${integrationHealthHref(providerId)}/runs/${runId}`

export type TRunOutcome = 'succeeded' | 'partial' | 'failed' | 'running' | 'pending' | 'cancelled'

type TBadgeVariant = NonNullable<BadgeProps['variant']>

type TRunOutcomeMeta = {
  label: string
  variant: TBadgeVariant
  barClassName: string
  textClassName: string
  isFinished: boolean
}

const NEUTRAL_OUTCOME_STYLE = { barClassName: 'bg-muted-foreground/40', textClassName: 'text-muted-foreground' }

const RUN_OUTCOME_META: Record<TRunOutcome, TRunOutcomeMeta> = {
  succeeded: { label: 'Succeeded', variant: 'green', barClassName: 'bg-success', textClassName: 'text-success', isFinished: true },
  partial: { label: 'Partial', variant: 'warning', barClassName: 'bg-warning', textClassName: 'text-warning', isFinished: true },
  failed: { label: 'Failed', variant: 'red', barClassName: 'bg-destructive', textClassName: 'text-destructive', isFinished: true },
  running: { label: 'Running', variant: 'blue', barClassName: 'bg-info', textClassName: 'text-info', isFinished: false },
  pending: { label: 'Queued', variant: 'outline', ...NEUTRAL_OUTCOME_STYLE, isFinished: false },
  cancelled: { label: 'Cancelled', variant: 'secondary', ...NEUTRAL_OUTCOME_STYLE, isFinished: true },
}

const STATUS_OUTCOME: Record<IntegrationRunIntegrationRunStatus, Exclude<TRunOutcome, 'partial'>> = {
  [IntegrationRunIntegrationRunStatus.SUCCESS]: 'succeeded',
  [IntegrationRunIntegrationRunStatus.FAILED]: 'failed',
  [IntegrationRunIntegrationRunStatus.RUNNING]: 'running',
  [IntegrationRunIntegrationRunStatus.PENDING]: 'pending',
  [IntegrationRunIntegrationRunStatus.CANCELLED]: 'cancelled',
}

export const RUN_STATUS_OPTIONS = Object.values(IntegrationRunIntegrationRunStatus).map((value) => ({ value, label: RUN_OUTCOME_META[STATUS_OUTCOME[value]].label }))

type TRunOutcomeFields = Pick<TIntegrationRunSummary, 'status' | 'error'>

export const runDurationMs = (run: Pick<TIntegrationRunSummary, 'finishedAt' | 'durationMs'>): number | null => (run.finishedAt ? run.durationMs : null)

export const PARTIAL_RUN_WHERE = { status: IntegrationRunIntegrationRunStatus.SUCCESS, not: { error: '' } } satisfies IntegrationRunWhereInput

export const runOutcome = (run: TRunOutcomeFields): TRunOutcome | undefined => {
  const outcome = STATUS_OUTCOME[run.status]

  return outcome === 'succeeded' && run.error?.trim() ? 'partial' : outcome
}

export const runOutcomeMeta = (run: TRunOutcomeFields): TRunOutcomeMeta => {
  const outcome = runOutcome(run)

  return outcome ? RUN_OUTCOME_META[outcome] : { label: getEnumLabel(run.status), variant: 'outline', ...NEUTRAL_OUTCOME_STYLE, isFinished: true }
}

const RUN_METRIC_KEYS = ['attempted', 'persisted', 'changed', 'removed', 'skipped', 'filtered', 'excluded', 'failed'] as const

export type TRunMetricKey = (typeof RUN_METRIC_KEYS)[number]

export type TRunMetrics = Record<TRunMetricKey, number>

export const readRunMetrics = (metrics: unknown): TRunMetrics | undefined => {
  if (!isRecord(metrics) || !RUN_METRIC_KEYS.some((key) => typeof metrics[key] === 'number')) {
    return undefined
  }

  const read = (key: TRunMetricKey): number => {
    const value = metrics[key]

    return typeof value === 'number' ? value : 0
  }

  return {
    attempted: read('attempted'),
    persisted: read('persisted'),
    changed: read('changed'),
    removed: read('removed'),
    skipped: read('skipped'),
    filtered: read('filtered'),
    excluded: read('excluded'),
    failed: read('failed'),
  }
}

export type TRunRecordFailure = { schema: string; resource: string; message: string }

export const readRunRecordFailures = (metrics: unknown): TRunRecordFailure[] => {
  const response = isRecord(metrics) ? metrics.response : undefined
  const failures = isRecord(response) ? response.Failures : undefined

  if (!Array.isArray(failures)) {
    return []
  }

  return failures.flatMap((failure) => (isRecord(failure) ? [{ schema: String(failure.Schema ?? ''), resource: String(failure.Resource ?? ''), message: String(failure.Message ?? '') }] : []))
}

const RUN_TYPE_LABEL_OVERRIDES: Partial<Record<IntegrationRunIntegrationRunType, string>> = {
  [IntegrationRunIntegrationRunType.RECONCILE]: 'Recurring',
}

export const runTypeLabel = (runType?: IntegrationRunIntegrationRunType | null): string => (runType ? (RUN_TYPE_LABEL_OVERRIDES[runType] ?? getEnumLabel(runType)) : '-')

export const RUN_TYPE_OPTIONS = Object.values(IntegrationRunIntegrationRunType).map((value) => ({ value, label: runTypeLabel(value) }))

export type TRunErrorSummary = {
  title: string
  guidance: string
  httpStatus?: number
  httpStatusText?: string
  message: string
}

type TRunErrorCategory = 'auth' | 'rate-limit' | 'not-found' | 'provider' | 'request' | 'unknown'

const HTTP_STATUS_TEXT: Partial<Record<number, string>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  408: 'Request Timeout',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

const LABELLED_STATUS_PATTERN = /\b(?:status ?code|status|http|code|error)\W{0,3}([45]\d{2})(?![\w.])/i

const REASON_STATUS_PATTERN = new RegExp(`\\b([45]\\d{2}) (?:${Object.values(HTTP_STATUS_TEXT).join('|')})\\b`)

const RUN_ERROR_CATEGORY_COPY: Record<TRunErrorCategory, { title: string; guidance: string }> = {
  auth: {
    title: 'Authentication or permission error',
    guidance: "The provider denied the request. Check the credential's permissions for this integration, then run a health check.",
  },
  'rate-limit': { title: 'Rate limited by the provider', guidance: 'The provider throttled the request. The next run will try again.' },
  'not-found': { title: 'Resource not found', guidance: 'The provider could not find what this operation asked for. Check the integration configuration.' },
  provider: { title: 'Provider error', guidance: 'The provider returned a server error. The next run will try again.' },
  request: { title: 'Request rejected by the provider', guidance: 'The provider rejected the request. Check the integration configuration.' },
  unknown: { title: 'Run failed', guidance: 'The run stopped with the error below.' },
}

const categoryForStatus = (httpStatus?: number): TRunErrorCategory => {
  if (!httpStatus) return 'unknown'
  if (httpStatus === 401 || httpStatus === 403) return 'auth'
  if (httpStatus === 429) return 'rate-limit'
  if (httpStatus === 404) return 'not-found'
  if (httpStatus >= 500 || httpStatus === 408) return 'provider'

  return 'request'
}

const RUN_ERROR_MESSAGE_MAX_LENGTH = 180

export const summarizeRunError = (error?: string | null): TRunErrorSummary | undefined => {
  const raw = error?.trim()
  if (!raw) {
    return undefined
  }

  const match = LABELLED_STATUS_PATTERN.exec(raw) ?? REASON_STATUS_PATTERN.exec(raw)
  const httpStatus = match ? Number(match[1]) : undefined
  const firstLine = raw.split('\n')[0]

  return {
    ...RUN_ERROR_CATEGORY_COPY[categoryForStatus(httpStatus)],
    httpStatus,
    httpStatusText: httpStatus ? HTTP_STATUS_TEXT[httpStatus] : undefined,
    message: firstLine.length > RUN_ERROR_MESSAGE_MAX_LENGTH ? `${firstLine.slice(0, RUN_ERROR_MESSAGE_MAX_LENGTH).trimEnd()}…` : firstLine,
  }
}

export type TOperationHealthState = 'healthy' | 'partial' | 'failing' | 'stopped' | 'no-runs' | 'unknown' | 'disabled' | 'unavailable'

type TOperationHealthMeta = {
  label: string
  variant: TBadgeVariant
  dotClassName: string
  needsAttention: boolean
  isEnabled: boolean
}

export const OPERATION_HEALTH_META: Record<TOperationHealthState, TOperationHealthMeta> = {
  healthy: { label: 'Healthy', variant: 'green', dotClassName: 'bg-success', needsAttention: false, isEnabled: true },
  partial: { label: 'Partial', variant: 'warning', dotClassName: 'bg-warning', needsAttention: false, isEnabled: true },
  failing: { label: 'Failing', variant: 'red', dotClassName: 'bg-destructive', needsAttention: true, isEnabled: true },
  stopped: { label: 'Stopped', variant: 'red', dotClassName: 'bg-destructive', needsAttention: true, isEnabled: true },
  'no-runs': { label: 'No runs yet', variant: 'outline', dotClassName: NEUTRAL_OUTCOME_STYLE.barClassName, needsAttention: false, isEnabled: true },
  unknown: { label: 'Runs unavailable', variant: 'outline', dotClassName: NEUTRAL_OUTCOME_STYLE.barClassName, needsAttention: false, isEnabled: true },
  disabled: { label: 'Not enabled', variant: 'secondary', dotClassName: NEUTRAL_OUTCOME_STYLE.barClassName, needsAttention: false, isEnabled: false },
  unavailable: { label: 'Coming soon', variant: 'secondary', dotClassName: NEUTRAL_OUTCOME_STYLE.barClassName, needsAttention: false, isEnabled: false },
}

export type TOperationHealth = {
  key: string
  integrationId: string
  name: string
  description?: string
  state: TOperationHealthState
  newestFirstRuns: TIntegrationRunSummary[]
  latestFinishedRun?: TIntegrationRunSummary
  lastSuccess?: TIntegrationRunSummary
  failureStreak: number
  isStreakCapped: boolean
  stoppedReason?: string
}

const OUTCOME_STATE: Partial<Record<TRunOutcome, TOperationHealthState>> = { failed: 'failing', partial: 'partial' }

const operationState = (availability: TOperationAvailability, stoppedReason: string | undefined, finishedRuns: TIntegrationRunSummary[] | undefined): TOperationHealthState => {
  if (availability !== 'enabled') return availability
  if (stoppedReason) return 'stopped'
  if (!finishedRuns) return 'unknown'

  const latestFinishedRun = finishedRuns[0]
  if (!latestFinishedRun) return 'no-runs'

  const outcome = runOutcome(latestFinishedRun)
  if (!outcome) return 'failing'

  return OUTCOME_STATE[outcome] ?? 'healthy'
}

export const operationRunsKey = (integrationId: string, operationName: string): string => `${integrationId}:${operationName}`

type TOperationHealthSource = Pick<IntegrationNode, 'id' | 'operationConfig' | 'health'>

export type TRunsByOperation = Record<string, TIntegrationRunSummary[] | undefined>

export const buildOperationHealth = (provider: IntegrationProvider | undefined, integration: TOperationHealthSource, runsByKey: TRunsByOperation): TOperationHealth[] => {
  const health: IntegrationHealth | undefined = integration.health ?? undefined

  return recurringOperationNames(provider).map((name) => {
    const key = operationRunsKey(integration.id, name)
    const loadedRuns = runsByKey[key]
    const newestFirstRuns = loadedRuns ?? []
    const finishedRuns = newestFirstRuns.filter((run) => runOutcomeMeta(run).isFinished)
    const firstNonFailure = finishedRuns.findIndex((run) => runOutcome(run) !== 'failed')
    const failureStreak = firstNonFailure === -1 ? finishedRuns.length : firstNonFailure
    const stoppedReason = health?.unhealthyOperations?.[name]

    return {
      key,
      integrationId: integration.id,
      name,
      description: provider?.operations?.find((operation) => operation.name === name)?.description,
      state: operationState(operationAvailability(provider, integration, name), stoppedReason, loadedRuns ? finishedRuns : undefined),
      newestFirstRuns,
      latestFinishedRun: finishedRuns[0],
      lastSuccess: finishedRuns.find((run) => run.status === IntegrationRunIntegrationRunStatus.SUCCESS),
      failureStreak,
      isStreakCapped: failureStreak > 0 && failureStreak === finishedRuns.length && newestFirstRuns.length >= RUN_STRIP_LENGTH,
      stoppedReason,
    }
  })
}

export const monitoredOperationKeys = (provider: IntegrationProvider | undefined, integration: TOperationHealthSource): Array<{ integrationId: string; operationName: string }> =>
  recurringOperationNames(provider)
    .filter((operationName) => operationAvailability(provider, integration, operationName) !== 'unavailable')
    .map((operationName) => ({ integrationId: integration.id, operationName }))

export const newestRunsAcross = (runsByKey: TRunsByOperation, limit: number): TIntegrationRunSummary[] =>
  Object.values(runsByKey)
    .flatMap((runs) => runs ?? [])
    .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))
    .slice(0, limit)

export const attentionOperations = (operations: TOperationHealth[]): TOperationHealth[] => operations.filter((operation) => OPERATION_HEALTH_META[operation.state].needsAttention)
