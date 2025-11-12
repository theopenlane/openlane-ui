'use client'

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { useGetProgramBasicInfo } from '@/lib/graphql-hooks/programs'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import BasicInformation from '@/components/pages/protected/programs/[id]/basic-info'
import ProgramAuditor from '@/components/pages/protected/programs/[id]/program-auditor'
import ProgramTaskTable from '@/components/pages/protected/programs/[id]/program-tasks-table/program-tasks-table'
import { ControlsSummaryCard } from '@/components/pages/protected/programs/[id]/controls-summary-card'
import { SquarePlus } from 'lucide-react'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import TimelineReadiness from '@/components/pages/protected/programs/[id]/timeline-readiness'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { ProgramSettingsIconBtn } from '@/components/shared/enum-mapper/program-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { ProgramsPageSkeleton } from '../skeleton/programs-page-skeleton'

const ProgramDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: basicInfoData, isLoading } = useGetProgramBasicInfo(id)
  const { data: permission } = useOrganizationRoles()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Compliance' }, { label: 'Programs', href: '/programs' }, { label: basicInfoData?.program?.name, isLoading }])
  }, [setCrumbs, basicInfoData, isLoading])

  useEffect(() => {
    if (basicInfoData) document.title = `${currentOrganization?.node?.displayName ?? 'Openlane'} | Programs - ${basicInfoData.program.name}`
  }, [basicInfoData, currentOrganization?.node?.displayName])

  if (isLoading) {
    return <ProgramsPageSkeleton />
  }

  return (
    <>
      <PageHeading
        heading={
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <h1>Overview</h1>
            </div>
            <div className="flex gap-2.5 items-center">
              {canCreate(permission?.roles, AccessEnum.CanCreateProgram) && (
                <Link href="/programs/create" className="text-sm text-blue-500 flex items-center gap-1">
                  <Button variant="primary" className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left">
                    Create Program
                  </Button>
                </Link>
              )}
              <Menu content={<ProgramSettingsIconBtn programId={id} />} />
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-7">
        <div className="flex gap-7 w-full">
          {basicInfoData?.program ? (
            <>
              <BasicInformation />
              <div className="flex flex-col gap-7 flex-1">
                <TimelineReadiness />
                <ProgramAuditor
                  programStatus={basicInfoData.program.status}
                  firm={basicInfoData.program.auditFirm}
                  name={basicInfoData.program.auditor}
                  email={basicInfoData.program.auditorEmail}
                  isReady={basicInfoData.program.auditorReady}
                />
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
    </>
  )
}

export default ProgramDetailsPage
