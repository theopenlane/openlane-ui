'use client'

import React, { useState } from 'react'
import { formatDate } from '@/utils/date'
import { Shield } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { ActivityFeedCard, ActivityFeedRowsSkeleton, DEFAULT_ACTIVITY_FEED_TITLE } from './activity-feed-card'
import ViewVulnerabilitySheet from '@/components/pages/protected/vulnerabilities/view-vulnerability-sheet'
import ViewFindingSheet from '@/components/pages/protected/findings/view-finding-sheet'
import ViewScanSheet from '@/components/pages/protected/scans/view-scan-sheet'
import ReviewSheetResolver from '@/components/pages/protected/reviews/common/review-sheet-resolver'
import ViewRiskSheet from '@/components/pages/protected/risks/view-risk-sheet'
import { searchTypeIcons } from '@/components/shared/search/search-config'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { toHumanLabel } from '@/utils/strings'
import type { ActivityItem } from './use-recent-activity-items'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { cn } from '@repo/ui/lib/utils'
import { useFittingRowCount } from '@/hooks/useFittingRowCount'

const CREATED_ACTIVITY_TYPES = new Set<string>([ObjectTypes.INTERNAL_POLICY, ObjectTypes.CONTROL])

const SHEET_ENABLED_TYPES = new Set<string>([ObjectTypes.VULNERABILITY, ObjectTypes.FINDING, ObjectTypes.SCAN, ObjectTypes.REVIEW, ObjectTypes.RISK])

const activitySubtitle = (item: ActivityItem) => {
  if (item.type === 'Mention') {
    return 'You were mentioned'
  }

  const verb = CREATED_ACTIVITY_TYPES.has(item.type) ? 'created' : 'detected'
  const label = item.isGrouped ? undefined : toHumanLabel(item.type)
  const prefix = label ? `${label} ${verb}` : verb.charAt(0).toUpperCase() + verb.slice(1)
  return item.source ? `${prefix} by ${item.source}` : prefix
}

type ActivityRowProps = {
  item: ActivityItem
  onLabelClick?: (item: ActivityItem) => void
  hidden?: boolean
}

const ActivityRow = ({ item, onLabelClick, hidden }: ActivityRowProps) => {
  const Icon = searchTypeIcons[item.type] ?? Shield
  const hasSheet = SHEET_ENABLED_TYPES.has(item.type) && !!onLabelClick && !item.isGrouped
  const subtitle = activitySubtitle(item)

  const labelEl = hasSheet ? (
    <button className="text-sm font-medium truncate block w-full text-left hover:underline cursor-pointer" onClick={() => onLabelClick?.(item)}>
      {item.label}
    </button>
  ) : item.href ? (
    <Link href={item.href} className="text-sm font-medium truncate block hover:underline">
      {item.label}
    </Link>
  ) : (
    <p className="text-sm font-medium truncate">{item.label}</p>
  )

  return (
    <div className={cn('flex items-start gap-3 py-2 border-t first:border-t-0', hidden && 'invisible')}>
      <div className="mt-0.5 p-1.5 rounded-md bg-secondary">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        {labelEl}
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.createdAt)}</span>
    </div>
  )
}

type Props = {
  activityItems: ActivityItem[]
  allActivityItems?: ActivityItem[]
  title?: string
  isLoading?: boolean
}

const ActivityFeed = ({ activityItems, allActivityItems = activityItems, title = DEFAULT_ACTIVITY_FEED_TITLE, isLoading = false }: Props) => {
  const [viewItem, setViewItem] = useState<ActivityItem | null>(null)
  const [isSeeAllOpen, setIsSeeAllOpen] = useState(false)

  const handleViewItem = (item: ActivityItem) => {
    setIsSeeAllOpen(false)
    setViewItem(item)
  }
  const { containerRef: previewRef, fittingCount } = useFittingRowCount(activityItems)

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex-1 space-y-3">
          <ActivityFeedRowsSkeleton />
        </div>
      )
    }

    if (activityItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Shield size={24} className="mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No activity in the last 30 days</p>
        </div>
      )
    }

    return (
      <div ref={previewRef} className="relative min-h-0 flex-1">
        {activityItems.map((item, index) => (
          <ActivityRow key={`${item.type}-${item.id}`} item={item} onLabelClick={handleViewItem} hidden={index >= fittingCount} />
        ))}
      </div>
    )
  }

  const renderAll = () => {
    if (isLoading) {
      return <ActivityFeedRowsSkeleton className="mb-3" />
    }

    if (allActivityItems.length === 0) {
      return <p className="text-sm text-muted-foreground">No recent activity in the last 30 days.</p>
    }

    return allActivityItems.map((item) => <ActivityRow key={`${item.type}-${item.id}`} item={item} onLabelClick={handleViewItem} />)
  }

  const seeAll = (
    <Sheet open={isSeeAllOpen} onOpenChange={setIsSeeAllOpen}>
      <SheetTrigger asChild>
        <Button variant="transparent" size="sm" className="text-xs">
          See all
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-120 sm:max-w-120" header={<SlideoutHeader title={`All ${title} (30 days)`} onClose={() => setIsSeeAllOpen(false)} />}>
        <div className="mt-4 overflow-y-auto flex-1">{renderAll()}</div>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      <ActivityFeedCard title={title} action={seeAll}>
        {renderPreview()}
      </ActivityFeedCard>

      <ViewVulnerabilitySheet entityId={viewItem?.type === ObjectTypes.VULNERABILITY ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewFindingSheet entityId={viewItem?.type === ObjectTypes.FINDING ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewScanSheet entityId={viewItem?.type === ObjectTypes.SCAN ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ReviewSheetResolver reviewId={viewItem?.type === ObjectTypes.REVIEW ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewRiskSheet entityId={viewItem?.type === ObjectTypes.RISK ? viewItem.id : null} onClose={() => setViewItem(null)} />
    </>
  )
}

export default ActivityFeed
