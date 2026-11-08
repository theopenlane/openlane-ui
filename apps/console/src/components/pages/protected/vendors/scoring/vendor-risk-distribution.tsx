'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { useVendorRiskRatingCounts } from '@/lib/graphql-hooks/entity'
import { useOrganization } from '@/hooks/useOrganization'
import { getFiltersUpdatedEvent, loadFilters, saveFilters, type TFilterState } from '@/components/shared/table-filter/filter-storage'
import { isNullFilterValue } from '@/components/shared/table-filter/null-filter'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { isVendorRiskRating, VendorRiskRating, vendorRiskRatingColor, type TVendorRiskRating } from '@/lib/vendor-risk-rating'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type VendorRiskRatingCountsQuery } from '@repo/codegen/src/schema'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { tableKey } from '../table/types'
import { SegmentedBar } from './segmented-bar'

const NOT_SCORED = 'NOT_SCORED'
const OTHER = 'OTHER'

type TFilterSegmentKey = TVendorRiskRating | typeof NOT_SCORED

type TSegmentKey = TFilterSegmentKey | typeof OTHER

type TSegment = { key: TSegmentKey; label: string; count: number; color: string }

type TCountField = Exclude<keyof VendorRiskRatingCountsQuery, '__typename' | 'total'>

const COUNT_FIELD: Record<TFilterSegmentKey, TCountField> = {
  [VendorRiskRating.CRITICAL]: 'critical',
  [VendorRiskRating.HIGH]: 'high',
  [VendorRiskRating.MEDIUM]: 'medium',
  [VendorRiskRating.LOW]: 'low',
  [VendorRiskRating.VERY_LOW]: 'veryLow',
  [VendorRiskRating.NONE]: 'none',
  [NOT_SCORED]: 'notScored',
}

const SEGMENT_ORDER: readonly TFilterSegmentKey[] = [
  VendorRiskRating.CRITICAL,
  VendorRiskRating.HIGH,
  VendorRiskRating.MEDIUM,
  VendorRiskRating.LOW,
  VendorRiskRating.VERY_LOW,
  VendorRiskRating.NONE,
  NOT_SCORED,
]

const NOT_SCORED_COLOR = 'color-mix(in srgb, var(--color-muted-foreground) 40%, transparent)'

const toSegments = (data: VendorRiskRatingCountsQuery | undefined, selected: TFilterSegmentKey | null): TSegment[] => {
  const segments: TSegment[] = SEGMENT_ORDER.map((key) => ({
    key,
    label: key === NOT_SCORED ? 'Not scored' : getEnumLabel(key),
    count: data?.[COUNT_FIELD[key]]?.totalCount ?? 0,
    color: key === NOT_SCORED ? NOT_SCORED_COLOR : vendorRiskRatingColor(key),
  })).filter((segment) => segment.key !== VendorRiskRating.NONE || segment.count > 0 || segment.key === selected)

  const otherCount = (data?.total.totalCount ?? 0) - segments.reduce((sum, segment) => sum + segment.count, 0)
  return otherCount > 0 ? [...segments, { key: OTHER, label: 'Other', count: otherCount, color: 'var(--color-border)' }] : segments
}

const selectedSegmentOf = (filters: TFilterState | null): TFilterSegmentKey | null => {
  const value = filters?.riskRatingIn
  if (isNullFilterValue(value)) return value.nullState === 'IsNil' ? NOT_SCORED : null
  if (!Array.isArray(value) || value.length !== 1) return null
  const [rating] = value
  return typeof rating === 'string' && isVendorRiskRating(rating) ? rating : null
}

type TVendorRiskDistributionProps = {
  actions: React.ReactNode
}

export const VendorRiskDistribution: React.FC<TVendorRiskDistributionProps> = ({ actions }) => {
  const { currentOrgId } = useOrganization()
  const { data, isPending, error } = useVendorRiskRatingCounts()
  useQueryErrorNotification({ error, description: 'Failed to load vendor risk ratings' })

  const [selected, setSelected] = useState<TFilterSegmentKey | null>(null)

  useEffect(() => {
    const sync = () => setSelected(selectedSegmentOf(loadFilters(tableKey, undefined, currentOrgId)))
    sync()
    const eventName = getFiltersUpdatedEvent(tableKey, currentOrgId)
    window.addEventListener(eventName, sync)
    return () => window.removeEventListener(eventName, sync)
  }, [currentOrgId])

  const applySegment = (key: TFilterSegmentKey) => {
    const { riskRatingIn: _ratings, ...rest } = loadFilters(tableKey, undefined, currentOrgId) ?? {}
    const next: TFilterState = selected === key ? rest : { ...rest, riskRatingIn: key === NOT_SCORED ? { nullState: 'IsNil' } : [key] }
    saveFilters(tableKey, next, currentOrgId)
  }

  const segments = toSegments(data, selected)
  const total = data?.total.totalCount ?? 0

  const renderBody = () => {
    if (isPending) {
      return (
        <div role="status" aria-live="polite" aria-label="Loading vendor risk ratings" className="flex flex-col gap-3">
          <Skeleton height={8} className="w-full rounded-full" />
          <Skeleton height={16} className="w-full max-w-[420px] rounded-md" />
        </div>
      )
    }

    if (error && !data) {
      return <p className="text-sm text-muted-foreground">Risk ratings could not be loaded. Please try again later.</p>
    }

    return (
      <>
        <SegmentedBar
          className="bg-border"
          role="img"
          aria-label={segments.map((segment) => `${segment.label}: ${segment.count}`).join(', ')}
          segments={segments.map((segment) => ({ key: segment.key, color: segment.color, share: total > 0 ? segment.count / total : 0, dimmed: !!selected && selected !== segment.key }))}
        />
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {segments.map(({ key, label, count, color }) => {
            const content = (
              <>
                <span className="inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span>{label}</span>
                <span className="font-semibold tabular-nums">{count}</span>
              </>
            )
            if (key === OTHER) {
              return (
                <SystemTooltip
                  key={key}
                  icon={<span className="inline-flex h-8 items-center gap-2 px-2 text-xs text-muted-foreground">{content}</span>}
                  content="Vendors whose risk rating was entered by hand and is not one of the standard ratings."
                />
              )
            }
            return (
              <Button key={key} type="button" variant="tag" className={cn('px-2 text-xs', selected === key && 'is-active')} aria-pressed={selected === key} onClick={() => applySegment(key)}>
                {content}
              </Button>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <section className="mb-4 rounded-lg border bg-card p-4" aria-labelledby="vendor-risk-distribution-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id="vendor-risk-distribution-title" className="text-sm font-medium">
          Vendors by risk rating
        </h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {renderBody()}
    </section>
  )
}
