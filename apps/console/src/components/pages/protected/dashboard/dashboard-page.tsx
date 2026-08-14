'use client'
import React, { useEffect } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { DashboardPageShell } from '@/components/pages/protected/dashboard/dashboard-page-shell'
import { DashboardOverviewCardSkeleton } from '@/components/pages/protected/dashboard/skeleton/dashboard-overview-card-skeleton'
import DashboardComplianceActions from '@/components/pages/protected/overview/DashboardComplianceActions.tsx'
import DashboardComplianceOverview from '@/components/pages/protected/overview/DashboardComplianceOverview.tsx'
import DashboardTrustCenterActions from '@/components/pages/protected/overview/DashboardTrustCenterActions.tsx'
import DashboardTrustCenterOverview from '@/components/pages/protected/overview/DashboardTrustCenterOverview.tsx'
import { type TDashboardOverviewVariant, useDashboardOverviewVariant } from '@/components/pages/protected/overview/use-dashboard-overview-variant.ts'
import DashboardSetupChecklist from '@/components/pages/protected/overview/DashboardSetupChecklist'
import DashboardTasksAndSuggestions from '@/components/pages/protected/overview/DashboardTasksAndSuggestions.tsx'
import ActivityFeed from '@/components/shared/activity-feed/activity-feed'
import { useRecentActivityItems } from '@/components/shared/activity-feed/use-recent-activity-items'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { useSetupChecklist } from '@/hooks/useSetupChecklist'

const DASHBOARD_OVERVIEWS: Record<TDashboardOverviewVariant, { Overview: React.FC; Actions: React.FC }> = {
  compliance: { Overview: DashboardComplianceOverview, Actions: DashboardComplianceActions },
  'trust-center': { Overview: DashboardTrustCenterOverview, Actions: DashboardTrustCenterActions },
}

const DashboardPage: React.FC = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { data: userData } = useGetCurrentUser(userId)
  const { setCrumbs } = React.use(BreadcrumbContext)
  const overviewVariant = useDashboardOverviewVariant()
  const dashboardOverview = overviewVariant ? DASHBOARD_OVERVIEWS[overviewVariant] : undefined

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
    if (!dashboardOverview || !isHydrated || isAwaitingTasks) {
      return <DashboardOverviewCardSkeleton />
    }

    if (isSetupChecklistComplete) {
      return <dashboardOverview.Overview />
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

  const header = (
    <>
      <p className="text-2xl leading-9 font-medium pt-2">Welcome, {userData?.user?.displayName}!</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-base font-normal leading-6 pt-2 pb-3">Here&apos;s what&apos;s happening in your organization today</p>
        {dashboardOverview && <dashboardOverview.Actions />}
      </div>
    </>
  )

  return (
    <DashboardPageShell
      header={header}
      overview={renderSetupOrOverview()}
      main={<DashboardTasksAndSuggestions />}
      aside={<ActivityFeed activityItems={activityItems} allActivityItems={allActivityItems} isLoading={isActivityLoading} />}
    />
  )
}

export default DashboardPage
