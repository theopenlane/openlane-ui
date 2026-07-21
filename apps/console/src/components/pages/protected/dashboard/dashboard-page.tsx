'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGetAllPrograms } from '@/lib/graphql-hooks/program'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import Loading from '@/app/(protected)/dashboard/loading'
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
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const [_selectedProgram, setSelectedProgram] = useState<string>('All programs')
  const { setCrumbs } = React.use(BreadcrumbContext)

  const { data, isLoading } = useGetAllPrograms({
    where: {
      statusNotIn: [ProgramProgramStatus.COMPLETED, ProgramProgramStatus.ARCHIVED],
    },
  })

  const { activityItems, allActivityItems } = useRecentActivityItems()
  const { items: setupChecklistItems, completedCount: setupChecklistCompletedCount, isComplete: isSetupChecklistComplete, markInProgress, toggleDone } = useSetupChecklist()

  const programMap = useMemo(() => {
    const map: Record<string, string> = {}
    data?.programs?.edges?.forEach((edge) => {
      if (edge?.node) {
        map[edge.node.id] = edge.node.name
      }
    })
    return map
  }, [data])

  useEffect(() => {
    if (!programId) {
      setSelectedProgram('All programs')
    } else {
      const programName = programMap[programId] ?? 'Unknown Program'
      setSelectedProgram(programName)
    }
  }, [searchParams, programMap, programId])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }])
  }, [setCrumbs])

  if (isLoading) return <Loading />

  return (
    <>
      <div className="max-w-[1476px] mx-auto w-full px-4 flex flex-col gap-4">
        <div>
          <p className="text-2xl leading-9 font-medium pt-2">Welcome, {userData?.user?.displayName}!</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-base font-normal leading-6 pt-2 pb-3">Here&apos;s what&apos;s happening in your organization today</p>
            <DashboardActions />
          </div>
        </div>

        {isSetupChecklistComplete ? (
          <DashboardComplianceOverview />
        ) : (
          <DashboardSetupChecklist items={setupChecklistItems} completedCount={setupChecklistCompletedCount} markInProgress={markInProgress} toggleDone={toggleDone} />
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <DashboardTasksAndSuggestions />
          </div>

          <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4">
            <ExposureActivityFeed activityItems={activityItems} allActivityItems={allActivityItems} title="Recent Activity" />
          </div>
        </div>
      </div>
    </>
  )
}

export default DashboardPage
