import React from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'

const WORK_ITEM_SKELETON_ROW_COUNT = 4

type WorkItemsCardProps = {
  children: React.ReactNode
}

export const WorkItemsCard = ({ children }: WorkItemsCardProps) => (
  <Card className="bg-homepage-card border-homepage-card-border h-full">
    <CardTitle className="px-6 pt-6 pb-0 text-lg font-semibold">Your Work</CardTitle>
    <CardDescription className="pt-1 pb-3">Tasks, recommendations, evidence requests, and notifications that need your attention</CardDescription>
    {children}
  </Card>
)

export const WorkItemsCardSkeletonContent = () => (
  <CardContent className="px-6 pb-6 pt-4">
    <div className="space-y-3">
      <SkeletonRows count={WORK_ITEM_SKELETON_ROW_COUNT} height={56} />
    </div>
  </CardContent>
)

export const WorkItemsCardSkeleton = () => (
  <WorkItemsCard>
    <WorkItemsCardSkeletonContent />
  </WorkItemsCard>
)
