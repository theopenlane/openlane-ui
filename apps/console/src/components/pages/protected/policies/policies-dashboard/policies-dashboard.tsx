'use client'

import React from 'react'
import StatusBreakdown from './status-breakdown'
import RecentActivity from './recent-activity'
import CoverageByType from './coverage-by-type'
import AwaitingApprovalTable from './tables/awaiting-approval-table'
import ReviewDueSoonTable from './tables/review-due-soon-table'
import PoliciesWithoutProceduresTable from './tables/policies-without-procedures-table'

export default function PoliciesDashboard() {
  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col lg:flex-row gap-10">
        <StatusBreakdown />
        <RecentActivity />
      </div>
      <CoverageByType />
      <AwaitingApprovalTable />
      <ReviewDueSoonTable />
      <PoliciesWithoutProceduresTable />
    </div>
  )
}
