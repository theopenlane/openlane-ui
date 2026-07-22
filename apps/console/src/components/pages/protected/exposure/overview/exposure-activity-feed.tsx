'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { formatDate } from '@/utils/date'
import { Shield } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import Skeleton from '@/components/shared/skeleton/skeleton'
import ViewVulnerabilitySheet from '@/components/pages/protected/vulnerabilities/view-vulnerability-sheet'
import ViewFindingSheet from '@/components/pages/protected/findings/view-finding-sheet'
import ViewScanSheet from '@/components/pages/protected/scans/view-scan-sheet'
import ViewReviewSheet from '@/components/pages/protected/reviews/view-review-sheet'
import ViewRiskSheet from '@/components/pages/protected/risks/view-risk-sheet'
import { searchTypeIcons } from '@/components/shared/search/search-config'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { toHumanLabel } from '@/utils/strings'
import type { ActivityItem } from './use-recent-activity-items'

const CREATED_ACTIVITY_TYPES = new Set<string>([ObjectTypes.INTERNAL_POLICY, ObjectTypes.CONTROL])

const SHEET_ENABLED_TYPES = new Set<string>([ObjectTypes.VULNERABILITY, ObjectTypes.FINDING, ObjectTypes.SCAN, ObjectTypes.REVIEW, ObjectTypes.RISK])

const PREVIEW_SKELETON_ROWS = [0, 1, 2, 3, 4]

const activitySubtitle = (item: ActivityItem) => {
  if (item.type === 'Mention') {
    return 'You were mentioned'
  }

  const verb = CREATED_ACTIVITY_TYPES.has(item.type) ? 'created' : 'detected'
  const label = item.isGrouped ? undefined : toHumanLabel(item.type)
  const prefix = label ? `${label} ${verb}` : verb.charAt(0).toUpperCase() + verb.slice(1)
  return item.source ? `${prefix} by ${item.source}` : prefix
}

const ActivityRow = ({ item, onLabelClick }: { item: ActivityItem; onLabelClick?: (item: ActivityItem) => void }) => {
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
    <div className="flex items-start gap-3 py-2 border-b last:border-0">
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

const ExposureActivityFeed = ({ activityItems, allActivityItems = activityItems, title = 'Recent Activity', isLoading = false }: Props) => {
  const [viewItem, setViewItem] = useState<ActivityItem | null>(null)
  const preview = activityItems.slice(0, 5)

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex-1 space-y-3">
          {PREVIEW_SKELETON_ROWS.map((row) => (
            <Skeleton key={row} height={36} className="w-full rounded-md" />
          ))}
        </div>
      )
    }

    if (preview.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Shield size={24} className="mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No activity in the last 30 days</p>
        </div>
      )
    }

    return (
      <div className="flex-1">
        {preview.map((item) => (
          <ActivityRow key={`${item.type}-${item.id}`} item={item} onLabelClick={setViewItem} />
        ))}
      </div>
    )
  }

  const renderAll = () => {
    if (isLoading) {
      return PREVIEW_SKELETON_ROWS.map((row) => <Skeleton key={row} height={36} className="w-full rounded-md mb-3" />)
    }

    if (allActivityItems.length === 0) {
      return <p className="text-sm text-muted-foreground">No recent activity in the last 30 days.</p>
    }

    return allActivityItems.map((item) => <ActivityRow key={`${item.type}-${item.id}`} item={item} onLabelClick={setViewItem} />)
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xl font-medium leading-7">{title}</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="transparent" size="sm" className="text-xs">
                See all
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-120 sm:max-w-120">
              <SheetHeader>
                <SheetTitle>All {title} (30 days)</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-y-auto flex-1">{renderAll()}</div>
            </SheetContent>
          </Sheet>
        </div>

        {renderPreview()}
      </CardContent>

      <ViewVulnerabilitySheet entityId={viewItem?.type === ObjectTypes.VULNERABILITY ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewFindingSheet entityId={viewItem?.type === ObjectTypes.FINDING ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewScanSheet entityId={viewItem?.type === ObjectTypes.SCAN ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewReviewSheet entityId={viewItem?.type === ObjectTypes.REVIEW ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewRiskSheet entityId={viewItem?.type === ObjectTypes.RISK ? viewItem.id : null} onClose={() => setViewItem(null)} />
    </Card>
  )
}

export default ExposureActivityFeed
