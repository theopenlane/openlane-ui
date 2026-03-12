'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { formatDate } from '@/utils/date'
import { AlertTriangle, Bug, FileSearch, ScanLine, MessageSquareText, Shield } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import ViewVulnerabilitySheet from '@/components/pages/protected/vulnerabilities/view-vulnerability-sheet'
import ViewFindingSheet from '@/components/pages/protected/findings/view-finding-sheet'

const TYPE_ICONS: Record<string, React.ElementType> = {
  Vulnerability: Bug,
  Finding: FileSearch,
  Risk: AlertTriangle,
  Scan: ScanLine,
  Review: MessageSquareText,
}

type ActivityItem = {
  id: string
  label: string
  type: string
  createdAt: string
  href: string
  source?: string | null
}

const ActivityRow = ({ item, onLabelClick }: { item: ActivityItem; onLabelClick?: (item: ActivityItem) => void }) => {
  const Icon = TYPE_ICONS[item.type] ?? Shield
  const isClickable = (item.type === 'Vulnerability' || item.type === 'Finding') && !!onLabelClick
  const subtitle = item.source ? `${item.type} detected by ${item.source}` : `${item.type} detected`

  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0">
      <div className="mt-0.5 p-1.5 rounded-md bg-secondary">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        {isClickable ? (
          <button className="text-sm font-medium truncate block w-full text-left hover:underline cursor-pointer" onClick={() => onLabelClick(item)}>
            {item.label}
          </button>
        ) : (
          <p className="text-sm font-medium truncate">{item.label}</p>
        )}
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.createdAt)}</span>
    </div>
  )
}

type Props = {
  activityItems: ActivityItem[]
}

const ExposureActivityFeed = ({ activityItems }: Props) => {
  const [viewItem, setViewItem] = useState<ActivityItem | null>(null)
  const preview = activityItems.slice(0, 5)

  return (
    <Card className="h-full">
      <CardContent className="pt-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xl font-medium leading-7">Recent Activity</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="transparent" size="sm" className="text-xs">
                See all
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-120 sm:max-w-120">
              <SheetHeader>
                <SheetTitle>All Recent Activity (30 days)</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-y-auto flex-1">
                {activityItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity in the last 30 days.</p>
                ) : (
                  activityItems.map((item) => <ActivityRow key={`${item.type}-${item.id}`} item={item} onLabelClick={setViewItem} />)
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <Shield size={24} className="mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No activity in the last 30 days</p>
          </div>
        ) : (
          <div className="flex-1">
            {preview.map((item) => (
              <ActivityRow key={`${item.type}-${item.id}`} item={item} onLabelClick={setViewItem} />
            ))}
          </div>
        )}
      </CardContent>

      <ViewVulnerabilitySheet entityId={viewItem?.type === 'Vulnerability' ? viewItem.id : null} onClose={() => setViewItem(null)} />
      <ViewFindingSheet entityId={viewItem?.type === 'Finding' ? viewItem.id : null} onClose={() => setViewItem(null)} />
    </Card>
  )
}

export default ExposureActivityFeed
