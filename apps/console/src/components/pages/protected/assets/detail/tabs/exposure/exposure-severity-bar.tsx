import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { SegmentedBar } from '@/components/shared/segmented-bar/segmented-bar'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { getSeverityColor, SEVERITY_LEVELS } from '@/utils/severity'
import { type TExposureItem } from './exposure-items'

const UNRATED_COLOR = 'var(--color-muted-foreground)'

export const ExposureSeverityBar: React.FC<{ items: TExposureItem[] }> = ({ items }) => {
  const open = items.filter((item) => item.isOpen)
  const closedCount = items.length - open.length
  const segments = [
    ...SEVERITY_LEVELS.map((level) => ({ key: level, label: getEnumLabel(level.toUpperCase()), color: getSeverityColor(level), count: open.filter((item) => item.level === level).length })),
    { key: 'unrated', label: 'Unrated', color: UNRATED_COLOR, count: open.filter((item) => !item.level).length },
  ].filter(({ count }) => count > 0)

  return (
    <Card className="space-y-3 rounded-lg p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Open by severity</span>
        <span>{open.length} open</span>
      </div>
      {open.length > 0 && <SegmentedBar segments={segments.map(({ key, color, count }) => ({ key, color, share: count / open.length }))} aria-hidden />}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {segments.map(({ key, label, color, count }) => (
          <li key={key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            {label} {count}
          </li>
        ))}
        {closedCount > 0 && <li className="text-muted-foreground">Closed {closedCount}</li>}
      </ul>
    </Card>
  )
}
