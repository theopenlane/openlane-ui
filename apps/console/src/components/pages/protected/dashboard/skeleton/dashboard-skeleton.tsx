import React from 'react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { ActivityFeedSkeleton } from '@/components/shared/activity-feed/activity-feed-card'
import { WorkItemsCardSkeleton } from '@/components/pages/protected/overview/work-items/work-items-card'
import { DashboardPageShell } from '@/components/pages/protected/dashboard/dashboard-page-shell'
import { DashboardOverviewCardSkeleton } from '@/components/pages/protected/dashboard/skeleton/dashboard-overview-card-skeleton'

const DashboardHeaderSkeleton: React.FC = () => (
  <>
    <div className="flex h-11 items-center pt-2">
      <Skeleton width={240} height={24} className="rounded-md" />
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex h-11 w-full max-w-[380px] items-center pt-2 pb-3">
        <Skeleton height={18} className="w-full rounded-md" />
      </div>
      <Skeleton height={16} className="w-full max-w-[520px] rounded-md" />
    </div>
  </>
)

const DashboardSkeleton: React.FC = () => (
  <DashboardPageShell header={<DashboardHeaderSkeleton />} overview={<DashboardOverviewCardSkeleton />} main={<WorkItemsCardSkeleton />} aside={<ActivityFeedSkeleton />} />
)

export default DashboardSkeleton
