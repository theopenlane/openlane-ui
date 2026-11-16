import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { type TRunMetrics } from '@/lib/integrations/run-health'

type TMetricSegment = { key: string; label: string; value: number; className: string }

const metricSegments = (metrics: TRunMetrics): TMetricSegment[] =>
  [
    { key: 'unchanged', label: 'unchanged', value: Math.max(metrics.persisted - metrics.changed, 0), className: 'bg-info' },
    { key: 'changed', label: 'changed', value: metrics.changed, className: 'bg-primary' },
    { key: 'removed', label: 'removed', value: metrics.removed, className: 'bg-warning' },
    { key: 'skipped', label: 'skipped', value: metrics.skipped, className: 'bg-muted-foreground/70' },
    { key: 'filtered', label: 'filtered out', value: metrics.filtered, className: 'bg-muted-foreground/40' },
    { key: 'excluded', label: 'excluded', value: metrics.excluded, className: 'bg-muted-foreground/25' },
    { key: 'failed', label: 'failed', value: metrics.failed, className: 'bg-destructive' },
  ].filter((segment) => segment.value > 0)

const RunMetricsBar = ({ metrics }: { metrics: TRunMetrics }) => {
  const segments = metricSegments(metrics)
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">This run processed no records.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p>
          <span className="text-lg font-medium">{total}</span> <span className="text-sm text-muted-foreground">records processed</span>
        </p>
        <span className={cn('text-sm', metrics.failed > 0 ? 'text-destructive' : 'text-muted-foreground')}>{metrics.failed} failed</span>
      </div>
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={segments.map((segment) => `${segment.value} ${segment.label}`).join(', ')}>
        {segments.map((segment) => (
          <span key={segment.key} className={cn('h-full min-w-1', segment.className)} style={{ flexGrow: segment.value, flexBasis: 0 }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-sm', segment.className)} aria-hidden="true" />
            {segment.value} {segment.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RunMetricsBar
