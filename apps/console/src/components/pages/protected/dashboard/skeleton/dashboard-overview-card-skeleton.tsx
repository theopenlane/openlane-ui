import React from 'react'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'

const OVERVIEW_STAT_COUNT = 4

export const DashboardOverviewCardSkeleton: React.FC = () => (
  <Card className="bg-homepage-card border-homepage-card-border">
    <CardTitle className="px-6 pt-6 pb-0 text-lg font-semibold">
      <div className="flex h-7 items-center">
        <Skeleton width={180} height={18} className="rounded-md" />
      </div>
      <div className="flex h-6 items-center pt-1">
        <Skeleton width={150} height={12} className="rounded-md" />
      </div>
    </CardTitle>

    <CardContent className="grid grid-cols-2 gap-3 px-6 pb-6 pt-4 lg:grid-cols-4">
      <SkeletonRows count={OVERVIEW_STAT_COUNT} height={60} />
    </CardContent>
  </Card>
)
