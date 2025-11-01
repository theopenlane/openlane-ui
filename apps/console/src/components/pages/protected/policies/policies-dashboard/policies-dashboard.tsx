'use client'

import React from 'react'
import StatusBreakdown from './status-breakdown'
import RecentActivity from './recent-activity'
import CoverageByType from './coverage-by-type'
import AwaitingApprovalTable from './tables/awaiting-approval-table'
import ReviewDueSoonTable from './tables/review-due-soon-table'
import PoliciesWithoutProceduresTable from './tables/policies-without-procedures-table'

export default function PoliciesDashboard({ setActive }: { setActive: (tab: 'dashboard' | 'table') => void }) {
  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col lg:flex-row gap-10">
        <StatusBreakdown onStatusClick={() => setActive('table')} />
        <RecentActivity />
      </div>
      <CoverageByType onTypeClick={() => setActive('table')} />
      <AwaitingApprovalTable />
      <ReviewDueSoonTable />
      <PoliciesWithoutProceduresTable />
    </div>
  )
}
