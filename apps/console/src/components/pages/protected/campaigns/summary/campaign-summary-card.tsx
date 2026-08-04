import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'

export type TCampaignSummaryCardAccent = 'success' | 'warning' | 'info'

const accentStyles: Record<TCampaignSummaryCardAccent, { bar: string; icon: string }> = {
  success: { bar: 'bg-[var(--color-success)]', icon: 'text-[var(--color-success)]' },
  warning: { bar: 'bg-[var(--color-warning)]', icon: 'text-[var(--color-warning)]' },
  info: { bar: 'bg-[var(--color-info)]', icon: 'text-[var(--color-info)]' },
}

type TCampaignSummaryCardProps = {
  title: string
  value: number
  unit: string
  accent: TCampaignSummaryCardAccent
  icon: React.ReactNode
  detail: string
  detailDescription?: string
  isFilterApplied: boolean
  onToggleFilter: () => void
}

const CampaignSummaryCard: React.FC<TCampaignSummaryCardProps> = ({ title, value, unit, accent, icon, detail, detailDescription, isFilterApplied, onToggleFilter }) => (
  <Card className={cn('relative flex flex-col overflow-hidden', isFilterApplied && 'ring-1 ring-primary')}>
    <span className={cn('absolute inset-y-0 left-0 w-1', accentStyles[accent].bar)} aria-hidden />
    <div className="flex flex-col gap-2 px-5 py-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold leading-none">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </p>
    </div>
    <div className="mt-auto flex items-center justify-between gap-3 border-t px-5 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className={cn('shrink-0', accentStyles[accent].icon)}>{icon}</span>
          <span className="truncate">{detail}</span>
        </div>
        {detailDescription && <p className="text-xs text-muted-foreground">{detailDescription}</p>}
      </div>
      <Button variant="outline" aria-pressed={isFilterApplied} onClick={onToggleFilter}>
        {isFilterApplied ? 'Clear' : 'View all'}
      </Button>
    </div>
  </Card>
)

export default CampaignSummaryCard
