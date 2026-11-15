import React from 'react'
import { type ColumnDef, type VisibilityState } from '@repo/ui/table-types'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { IntegrationRunIntegrationRunStatus, IntegrationRunIntegrationRunType, IntegrationRunOrderField, type IntegrationRunWhereInput } from '@repo/codegen/src/schema'
import { defineFilterFields } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'
import {
  PARTIAL_RUN_WHERE,
  RUN_STATUS_OPTIONS,
  RUN_TYPE_OPTIONS,
  readRunMetrics,
  runDurationMs,
  runOutcome,
  runTypeLabel,
  summarizeRunError,
  type TIntegrationRun,
  type TRunMetricKey,
  type TRunMetrics,
} from '@/lib/integrations/run-health'
import { cn } from '@repo/ui/lib/utils'
import { MS_PER_DAY, formatDateTime, formatDurationMs, hourStartIso } from '@/utils/date'
import { RunErrorText } from './health-controls'
import { RunStatusBadge } from './run-status-badge'

export type TRunHistoryRow = TIntegrationRun & { instance: string } & Partial<TRunMetrics>

export const toRunHistoryRow = (run: TIntegrationRun, instance: string): TRunHistoryRow => ({
  ...run,
  instance,
  ...(runOutcome(run) === 'failed' ? undefined : readRunMetrics(run.metrics)),
})

export const RUN_HISTORY_SORT_FIELDS = [
  { label: 'Started', key: IntegrationRunOrderField.STARTED_AT },
  { label: 'Duration', key: IntegrationRunOrderField.DURATION_MS },
  { label: 'Status', key: IntegrationRunOrderField.STATUS },
  { label: 'Operation', key: IntegrationRunOrderField.OPERATION_NAME },
  { label: 'Trigger', key: IntegrationRunOrderField.RUN_TYPE },
]

export const RUN_HISTORY_HIDDEN_COLUMNS: VisibilityState = { removed: false, skipped: false, filtered: false, excluded: false }

export const runHistoryFilterFields = (operationNames: string[]) =>
  defineFilterFields<IntegrationRunWhereInput>()([
    { key: 'statusIn', label: 'Status', type: 'multiselect', icon: FilterIcons.Status, options: RUN_STATUS_OPTIONS },
    { key: 'operationNameIn', label: 'Operation', type: 'multiselect', icon: FilterIcons.Type, options: operationNames.map((name) => ({ value: name, label: name })) },
    { key: 'runTypeIn', label: 'Trigger', type: 'multiselect', icon: FilterIcons.Type, options: RUN_TYPE_OPTIONS },
    { key: 'startedAt', label: 'Started', type: 'dateRange', icon: FilterIcons.Date },
  ])

export const RUN_HISTORY_QUICK_FILTERS: TQuickFilter[] = [
  { label: 'Failed', key: 'failedRuns', type: 'custom', getCondition: () => ({ status: IntegrationRunIntegrationRunStatus.FAILED }), isActive: false },
  {
    label: 'Last 24 hours',
    key: 'lastDayRuns',
    type: 'custom',
    getCondition: () => ({ startedAtGTE: hourStartIso(Date.now() - MS_PER_DAY) }), // 24hr
    isActive: false,
  },
  { label: 'Manual runs', key: 'manualRuns', type: 'custom', getCondition: () => ({ runType: IntegrationRunIntegrationRunType.MANUAL }), isActive: false },
  { label: 'With failed records', key: 'partialRuns', type: 'custom', getCondition: () => ({ ...PARTIAL_RUN_WHERE }), isActive: false },
]

export const runSearchWhere = (term: string): IntegrationRunWhereInput => ({ or: [{ operationNameContainsFold: term }, { errorContainsFold: term }, { summaryContainsFold: term }] })

const METRIC_COLUMNS: Array<{ key: TRunMetricKey; header: string }> = [
  { key: 'persisted', header: 'Persisted' },
  { key: 'changed', header: 'Changed' },
  { key: 'removed', header: 'Removed' },
  { key: 'skipped', header: 'Skipped' },
  { key: 'filtered', header: 'Filtered' },
  { key: 'excluded', header: 'Excluded' },
  { key: 'failed', header: 'Failed' },
]

const MetricCell = ({ value, metric }: { value: number | undefined; metric: TRunMetricKey }) => {
  if (value === undefined) {
    return <span className="block text-right text-muted-foreground">-</span>
  }

  return <span className={cn('block text-right tabular-nums', value === 0 && 'text-muted-foreground', value > 0 && metric === 'failed' && 'text-destructive')}>{value}</span>
}

const ErrorCell = ({ run }: { run: TIntegrationRun }) => {
  const error = summarizeRunError(run.error)
  if (!error) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <TruncatedCell portal tooltipContent={run.error}>
      <RunErrorText error={error} />
    </TruncatedCell>
  )
}

export const getRunHistoryColumns = (showInstance: boolean): ColumnDef<TRunHistoryRow>[] => [
  { accessorKey: 'status', header: 'Status', size: 115, minSize: 110, cell: ({ row }) => <RunStatusBadge run={row.original} /> },
  { accessorKey: 'operationName', header: 'Operation', size: 150, minSize: 130, cell: ({ row }) => <span>{row.original.operationName || '-'}</span> },
  ...(showInstance ? [{ accessorKey: 'instance', header: 'Instance', size: 150, minSize: 110 } satisfies ColumnDef<TRunHistoryRow>] : []),
  { accessorKey: 'runType', header: 'Trigger', size: 110, minSize: 100, cell: ({ row }) => <span>{runTypeLabel(row.original.runType)}</span> },
  { accessorKey: 'startedAt', header: 'Started', size: 215, minSize: 205, cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.startedAt)}</span> },
  {
    accessorKey: 'durationMs',
    header: 'Duration',
    size: 110,
    minSize: 105,
    cell: ({ row }) => <span className="block text-right tabular-nums">{formatDurationMs(runDurationMs(row.original))}</span>,
  },
  ...METRIC_COLUMNS.map(({ key, header }): ColumnDef<TRunHistoryRow> => ({
    accessorKey: key,
    header,
    size: 100,
    minSize: 95,
    cell: ({ row }) => <MetricCell value={row.original[key]} metric={key} />,
  })),
  { accessorKey: 'error', header: 'Error', size: 180, minSize: 160, cell: ({ row }) => <ErrorCell run={row.original} /> },
]
