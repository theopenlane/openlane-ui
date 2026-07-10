'use client'

import React from 'react'
import StatusBreakdown from './status-breakdown'
import RecentActivity from './recent-activity'
import CoverageByType from './coverage-by-type'
import AwaitingApprovalTable from './tables/awaiting-approval-table'
import ReviewDueSoonTable from './tables/review-due-soon-table'
import PoliciesWithoutProceduresTable from './tables/policies-without-procedures-table'
import { StatusBreakdownSkeleton } from '@/components/pages/protected/policies/skeletons/status-breakdown-skeleton.tsx'
import { RecentActivitySkeleton } from '@/components/pages/protected/policies/skeletons/recent-activity-skeleton.tsx'
import { CoverageByTypeSkeleton } from '@/components/pages/protected/policies/skeletons/coverage-by-type-skeleton.tsx'

type TPoliciesDashboardProps = {
  setActive: (tab: 'dashboard' | 'table') => void
  fetching: boolean
}

export default function PoliciesDashboard({ setActive, fetching }: TPoliciesDashboardProps) {
  const hasData = !fetching

  return (
    <div className="p-8 space-y-10">
      {fetching && (
        <>
          <div className="flex flex-col lg:flex-row gap-10">
            <StatusBreakdownSkeleton />
            <RecentActivitySkeleton />
          </div>
          <CoverageByTypeSkeleton />
        </>
      )}

      {hasData && (
        <>
          <div className="flex flex-col lg:flex-row gap-10">
            <StatusBreakdown onStatusClick={() => setActive('table')} />
            <RecentActivity />
          </div>

          <CoverageByType onTypeClick={() => setActive('table')} />

          <AwaitingApprovalTable />
          <ReviewDueSoonTable />
          <PoliciesWithoutProceduresTable />
        </>
      )}
    </div>
  )
}
