'use client'
import React, { useEffect } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { DashboardPageShell } from '@/components/pages/protected/dashboard/dashboard-page-shell'
import { DashboardOverviewCardSkeleton } from '@/components/pages/protected/dashboard/skeleton/dashboard-overview-card-skeleton'
import DashboardActions from '@/components/pages/protected/overview/DashboardActions.tsx'
import DashboardComplianceOverview from '@/components/pages/protected/overview/DashboardComplianceOverview.tsx'
import DashboardSetupChecklist from '@/components/pages/protected/overview/DashboardSetupChecklist'
import DashboardTasksAndSuggestions from '@/components/pages/protected/overview/DashboardTasksAndSuggestions.tsx'
import ActivityFeed from '@/components/shared/activity-feed/activity-feed'
import { useRecentActivityItems } from '@/components/shared/activity-feed/use-recent-activity-items'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { useSetupChecklist } from '@/hooks/useSetupChecklist'
import { useHasModule } from '@/lib/subscription-plan/hooks/use-module-access'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'

const DashboardPage: React.FC = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { data: userData } = useGetCurrentUser(userId)
  const { setCrumbs } = React.use(BreadcrumbContext)
  const hasComplianceModule = useHasModule(PlanEnum.COMPLIANCE_MODULE)

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
      return <DashboardOverviewCardSkeleton />
    }

    if (isSetupChecklistComplete) {
      return hasComplianceModule ? <DashboardComplianceOverview /> : null
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
        <DashboardActions />
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
