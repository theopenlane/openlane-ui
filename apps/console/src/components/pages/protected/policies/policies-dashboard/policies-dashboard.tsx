'use client'

import React from 'react'
import StatusBreakdown from './status-breakdown'
import RecentActivity from './recent-activity'
import CoverageByType from './coverage-by-type'

export default function PoliciesDashboard() {
  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col lg:flex-row gap-10">
        <StatusBreakdown />
        <RecentActivity />
      </div>
      <CoverageByType />
    </div>
  )
}
