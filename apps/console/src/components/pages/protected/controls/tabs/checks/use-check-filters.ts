import { useState } from 'react'
import { CheckResultCheckStatus } from '@repo/codegen/src/schema'
import { hourStartIso, MS_PER_DAY } from '@/utils/date'

export const CHECK_STATUS_FILTERS = [CheckResultCheckStatus.FAIL, CheckResultCheckStatus.PASS, CheckResultCheckStatus.UNKNOWN, 'ALL'] as const
export type TCheckStatusFilter = (typeof CHECK_STATUS_FILTERS)[number]

export const CHECK_PERIODS = ['7', '30', '90', 'all'] as const
export type TCheckPeriod = (typeof CHECK_PERIODS)[number]

export const CHECK_PERIOD_LABELS: Record<TCheckPeriod, string> = {
  '7': 'Last 7 days',
  '30': 'Last 30 days',
  '90': 'Last 90 days',
  all: 'All time',
}

const DEFAULT_STATUS: TCheckStatusFilter = CheckResultCheckStatus.FAIL
const DEFAULT_PERIOD: TCheckPeriod = '30'

const periodStart = (period: TCheckPeriod): string | undefined => (period === 'all' ? undefined : hourStartIso(Date.now() - Number(period) * MS_PER_DAY))

export type TCheckFilters = {
  status: TCheckStatusFilter
  period: TCheckPeriod
  since?: string
}

export const useCheckFilters = () => {
  const [filters, setFilters] = useState<TCheckFilters>(() => ({ status: DEFAULT_STATUS, period: DEFAULT_PERIOD, since: periodStart(DEFAULT_PERIOD) }))

  const setStatus = (status: TCheckStatusFilter) => setFilters((current) => ({ ...current, status }))
  const setPeriod = (period: TCheckPeriod) => setFilters((current) => ({ ...current, period, since: periodStart(period) }))

  return { filters, setStatus, setPeriod }
}

export type TCheckFiltersState = ReturnType<typeof useCheckFilters>
