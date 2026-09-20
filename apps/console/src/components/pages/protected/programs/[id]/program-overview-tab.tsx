'use client'

import React from 'react'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import BasicInformation from '@/components/pages/protected/programs/[id]/basic-info'
import ProgramAuditor from '@/components/pages/protected/programs/[id]/program-auditor'
import ProgramTaskTable from '@/components/pages/protected/programs/[id]/program-tasks-table/program-tasks-table'
import { ControlsSummaryCard } from '@/components/pages/protected/programs/[id]/controls-summary-card'
import TimelineReadiness from '@/components/pages/protected/programs/[id]/timeline-readiness'
import { type GetProgramBasicInfoQuery } from '@repo/codegen/src/schema'

type TProgramOverviewTabProps = {
  program?: GetProgramBasicInfoQuery['program'] | null
}

const ProgramOverviewTab = ({ program }: TProgramOverviewTabProps) => (
  <div className="flex flex-col gap-7">
    <div className="flex gap-7 w-full">
      {program ? (
        <>
          <BasicInformation />
          <div className="flex flex-col gap-7 flex-1">
            <TimelineReadiness />
            <ProgramAuditor programStatus={program.status} firm={program.auditFirm} name={program.auditor} email={program.auditorEmail} isReady={program.auditorReady} />
          </div>
        </>
      ) : (
        <div>No program info available</div>
      )}
    </div>

    <StatsCards />
    <ProgramTaskTable />
    <ControlsSummaryCard />
  </div>
)

export default ProgramOverviewTab
