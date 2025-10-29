'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { useGetAllPrograms, useGetProgramBasicInfo } from '@/lib/graphql-hooks/programs'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import { OrderDirection, ProgramOrderField, ProgramProgramStatus, ProgramWhereInput } from '@repo/codegen/src/schema'
import BasicInformation from '@/components/pages/protected/dashboard/basic-info'
import ProgramAuditor from '@/components/pages/protected/dashboard/program-auditor'
import ProgramsTaskTable from '@/components/pages/programs/programs-tasks-table'
import { ControlsSummaryCard } from '@/components/pages/protected/programs/controls-summary-card'
import { InfoIcon, SlidersHorizontal, SquarePlus } from 'lucide-react'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import TimelineReadiness from '@/components/pages/protected/dashboard/timeline-readiness'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import Loading from '@/app/(protected)/programs/loading'
import { Checkbox } from '@repo/ui/checkbox'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { ProgramSettingsIconBtn } from '@/components/shared/enum-mapper/program-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs'
import { Callout } from '@/components/shared/callout/callout'
import ProgramsCreate from '../programs/create/programs-page'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'

const ProgramsPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const programId = searchParams.get('id')

  const { data: basicInfoData, isLoading: isBasicInfoLoading, isError } = useGetProgramBasicInfo(programId)
  const { data: permission } = useOrganizationRoles()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const [showAllPrograms, setShowAllPrograms] = useState<boolean>(false)
  const where: ProgramWhereInput = useMemo(() => {
    if (showAllPrograms) {
      return {
        statusIn: [
          ProgramProgramStatus.ACTION_REQUIRED,
          ProgramProgramStatus.ARCHIVED,
          ProgramProgramStatus.COMPLETED,
          ProgramProgramStatus.IN_PROGRESS,
          ProgramProgramStatus.NOT_STARTED,
          ProgramProgramStatus.READY_FOR_AUDITOR,
        ],
      }
    }
    return {}
  }, [showAllPrograms])
  const { data, isLoading } = useGetAllPrograms({
    orderBy: [{ field: ProgramOrderField.end_date, direction: OrderDirection.ASC }],
    where,
  })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Programs', href: '/programs' },
      { label: basicInfoData?.program?.name, isLoading: isLoading },
    ])
  }, [setCrumbs, basicInfoData, isLoading])

  useEffect(() => {
    if (basicInfoData) document.title = `${currentOrganization?.node?.displayName ?? 'Openlane'} | Programs - ${basicInfoData.program.name}`
  }, [basicInfoData, currentOrganization?.node?.displayName])

  useEffect(() => {
    if (!data?.programs?.edges?.length) return

    const firstProgram = data.programs.edges[0]?.node
    if (!programId && firstProgram?.id) {
      router.replace(`/programs?id=${firstProgram.id}`)
    }

    if (firstProgram?.id && isError) {
      router.replace(`/programs?id=${firstProgram.id}`)
    }
  }, [programId, data?.programs?.edges, router, isError])

  const handleSelectChange = (val: string) => {
    router.push(`/programs?id=${val}`)
  }

  if (isBasicInfoLoading || isLoading) {
    return <Loading />
  }

  if (!data?.programs.edges?.length) {
    return (
      <>
        <PageHeading heading="Programs" />

        <div className="max-w-5xl mx-auto">
          <Callout variant="info" title="What is a Program?">
            Within Openlane, Programs are a centerpiece for managing compliance and regulatory requirements. Think of a program as a large, high-level grouping of work; it represents a significant
            body of work that can be broken down into smaller, more manageable tasks. Essentially, it’s a big picture initiative that can span months or possibly a year+, and can encompass work across
            different teams.
            <a href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/programs/overview`} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500">
              See docs to learn more.
            </a>
          </Callout>
          {canCreate(permission?.roles, AccessEnum.CanCreateProgram) ? (
            <ProgramsCreate disableHeader={true} noPrograms={true} />
          ) : (
            <Callout variant="warning" className="max-w-6xl mx-33 mt-10" title="You do not have permission to create a program">
              Reach out to an organization admin to create a program on your behalf or request access for program creation
            </Callout>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeading
        heading={
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <h1>Overview</h1>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <Checkbox checked={showAllPrograms} onCheckedChange={(checked) => setShowAllPrograms(!!checked)} />
                <span className="text-sm">Include archived</span>
                <SystemTooltip
                  icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                  content={
                    <p>
                      Archived programs are not included by default. Check this box to include archived programs in the drop down. These will be read-only, unless the program is unarchived from
                      program settings.
                    </p>
                  }
                />
              </div>
            </div>
            <div className="flex gap-2.5 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={`h-8 !px-2 !pl-3 border-primary`} icon={<SlidersHorizontal />} iconPosition="left">
                    <span className="text-muted-foreground">Filter by:</span>
                    <span>Program</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto min-w-56">
                  {data?.programs?.edges?.map((edge) => {
                    const program = edge?.node
                    if (!program) return null

                    return (
                      <DropdownMenuItem
                        key={program.id}
                        className="flex items-center gap-2"
                        onSelect={(e) => {
                          e.preventDefault()
                          handleSelectChange(program.id)
                        }}
                      >
                        <Checkbox checked={program.id === programId} />
                        <span className="truncate">{program.name}</span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {canCreate(permission?.roles, AccessEnum.CanCreateProgram) && (
                <Link href="/programs/create" className="text-sm text-blue-500 flex items-center gap-1">
                  <Button variant="primary" className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left">
                    Create Program
                  </Button>
                </Link>
              )}
              <Menu content={<ProgramSettingsIconBtn programId={programId!} />} />
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
        <ProgramsTaskTable />
        <ControlsSummaryCard />
      </div>
    </>
  )
}

export default ProgramsPage
