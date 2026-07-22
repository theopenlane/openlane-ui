'use client'
import React, { useEffect } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { Card, CardContent } from '@repo/ui/cardpanel'
import Skeleton from '@/components/shared/skeleton/skeleton'
import DashboardActions from '@/components/pages/protected/overview/DashboardActions.tsx'
import DashboardComplianceOverview from '@/components/pages/protected/overview/DashboardComplianceOverview.tsx'
import DashboardSetupChecklist from '@/components/pages/protected/overview/DashboardSetupChecklist'
import DashboardTasksAndSuggestions from '@/components/pages/protected/overview/DashboardTasksAndSuggestions.tsx'
import ExposureActivityFeed from '@/components/pages/protected/exposure/overview/exposure-activity-feed'
import { useRecentActivityItems } from '@/components/pages/protected/exposure/overview/use-recent-activity-items'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { useSetupChecklist } from '@/hooks/useSetupChecklist'

const DashboardPage: React.FC = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { data: userData } = useGetCurrentUser(userId)
  const { setCrumbs } = React.use(BreadcrumbContext)

  const { activityItems, allActivityItems, isLoading: isActivityLoading } = useRecentActivityItems()
  const {
    items: setupChecklistItems,
    completedCount: setupChecklistCompletedCount,
    totalCount: setupChecklistTotalCount,
    isComplete: isSetupChecklistComplete,
    isHydrated,
    isAwaitingTasks,
    markInProgress,
    completeItem,
  } = useSetupChecklist()

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }])
  }, [setCrumbs])

  const renderSetupOrOverview = () => {
    if (!isHydrated || isAwaitingTasks) {
      return (
        <Card className="bg-homepage-card border-homepage-card-border">
          <CardContent className="p-6">
            <Skeleton height={96} className="w-full rounded-lg" />
          </CardContent>
        </Card>
      )
    }

    if (isSetupChecklistComplete) {
      return <DashboardComplianceOverview />
    }

    return (
      <DashboardSetupChecklist
        items={setupChecklistItems}
        completedCount={setupChecklistCompletedCount}
        totalCount={setupChecklistTotalCount}
        markInProgress={markInProgress}
        completeItem={completeItem}
      />
    )
  }

  return (
    <div className="max-w-[1476px] mx-auto w-full px-4 flex flex-col gap-4">
      <div>
        <p className="text-2xl leading-9 font-medium pt-2">Welcome, {userData?.user?.displayName}!</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-base font-normal leading-6 pt-2 pb-3">Here&apos;s what&apos;s happening in your organization today</p>
          <DashboardActions />
        </div>
      </div>

      {renderSetupOrOverview()}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <DashboardTasksAndSuggestions />
        </div>

        <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4">
          <ExposureActivityFeed activityItems={activityItems} allActivityItems={allActivityItems} isLoading={isActivityLoading} title="Recent Activity" />
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
