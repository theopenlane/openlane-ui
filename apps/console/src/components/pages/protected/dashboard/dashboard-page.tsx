'use client'
import React, { useEffect } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import DashboardActions from '@/components/pages/protected/overview/DashboardActions.tsx'
import DashboardComplianceOverview from '@/components/pages/protected/overview/DashboardComplianceOverview.tsx'
import DashboardSuggestedActions from '@/components/pages/protected/overview/DashboardSuggestedActions.tsx'
import DashboardViewDocumentation from '../overview/DashboardViewDocumentation'
import DashboardContactSupport from '@/components/pages/protected/overview/DashboardContactSupport.tsx'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'

const DashboardPage: React.FC = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { data: userData } = useGetCurrentUser(userId)
  const { setCrumbs } = React.use(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }])
  }, [setCrumbs])

  return (
    <>
      <div className="max-w-[1076px] mx-auto w-full px-4 flex flex-col gap-4">
        <div>
          <p className="text-3xl leading-9 font-medium pt-2">Welcome, {userData?.user?.displayName}!</p>
          <p className="text-muted-foreground text-base font-normal leading-6 pt-2 pb-3">Here&apos;s what&apos;s happening in your organization.</p>
        </div>

        <DashboardActions />
        <DashboardComplianceOverview />

        <div className="grid grid-cols-2 gap-4 auto-rows-fr">
          <div className="row-span-2">
            <DashboardSuggestedActions />
          </div>
          <DashboardViewDocumentation />
          <DashboardContactSupport />
        </div>
      </div>
    </>
  )
}

export default DashboardPage
