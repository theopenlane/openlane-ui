import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'

export const DEFAULT_ACTIVITY_FEED_TITLE = 'Recent Activity'
export const ACTIVITY_FEED_PREVIEW_LIMIT = 5

type ActivityFeedCardProps = {
  title: string
  action: React.ReactNode
  children: React.ReactNode
}

export const ActivityFeedCard = ({ title, action, children }: ActivityFeedCardProps) => (
  <Card className="h-full">
    <CardContent className="pt-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl font-medium leading-7">{title}</p>
        {action}
      </div>
      {children}
    </CardContent>
  </Card>
)

export const ActivityFeedRowsSkeleton = ({ className }: { className?: string }) => <SkeletonRows count={ACTIVITY_FEED_PREVIEW_LIMIT} height={36} className={cn('rounded-md', className)} />

export const ActivityFeedSkeleton = ({ title = DEFAULT_ACTIVITY_FEED_TITLE }: { title?: string }) => (
  <ActivityFeedCard title={title} action={<Skeleton width={54} height={28} className="rounded-md" />}>
    <div className="flex-1 space-y-3">
      <ActivityFeedRowsSkeleton />
    </div>
  </ActivityFeedCard>
)
