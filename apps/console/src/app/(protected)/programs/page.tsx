'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@repo/ui/select'
import { ProgramCreate } from '@/components/pages/protected/program/program-create'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { useGetAllPrograms, useGetProgramBasicInfo } from '@/lib/graphql-hooks/programs'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import { Loading } from '@/components/shared/loading/loading'
import { OrderDirection, ProgramOrderField, ProgramProgramStatus } from '@repo/codegen/src/schema'
import BasicInformation from '@/components/pages/protected/dashboard/basic-info'
import ProgramAuditor from '@/components/pages/protected/dashboard/program-auditor'
import ProgramsTaskTable from '@/components/pages/programs/programs-tasks-table'
import { ControlsSummaryCard } from '@/components/pages/protected/programs/controls-summary-card'
import { ArrowRight, ShieldCheck } from 'lucide-react'

const Page: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const programId = searchParams.get('id')
  const { data, isLoading } = useGetAllPrograms({
    where: { statusNEQ: ProgramProgramStatus.COMPLETED },
    orderBy: [{ field: ProgramOrderField.end_date, direction: OrderDirection.ASC }],
  })

  const [selectedProgram, setSelectedProgram] = useState<string>('')

  const { data: basicInfoData, isLoading: isBasicInfoLoading } = useGetProgramBasicInfo(programId)

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
    if (!data?.programs?.edges?.length) return

    const firstProgram = data.programs.edges[0]?.node
    if (!programId && firstProgram?.id) {
      router.replace(`/programs?id=${firstProgram.id}`)
      setSelectedProgram(firstProgram.name)
    } else if (programId) {
      const programName = programMap[programId] ?? 'Unknown Program'
      setSelectedProgram(programName)
    }
  }, [programId, programMap, router, data?.programs?.edges])

  const handleSelectChange = (val: string) => {
    const programName = programMap[val] ?? 'Unknown Program'
    setSelectedProgram(programName)
    router.push(`/programs?id=${val}`)
  }

  if (isLoading) {
    return <Loading />
  }
  if (!data?.programs.edges?.length) {
    return (
      <>
        <PageHeading heading="Programs" />
        <div className="flex flex-col items-center justify-center mt-16 gap-6">
          <div className="max-w-3xl p-4 border rounded-lg  text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary">
                <svg width="20" height="20" fill="currentColor">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                  <circle cx="10" cy="10" r="1.5" />
                </svg>
              </span>
              <div>
                <p className="text-base">What is Programs?</p>
                <p className="mt-2 text-sm">
                  Within Openlane, Programs are a centerpiece for managing compliance and regulatory requirements. Think of a program as a large, high-level grouping of work; it represents a
                  significant body of work that can be broken down into smaller, more manageable tasks. Essentially, it’s a big picture initiative that can span months or possibly a year+, and can
                  encompass work across different teams.
                  <a href="https://docs.theopenlane.io" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500">
                    Learn more at Docs.
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="text-border" size={89} strokeWidth={1} />

            <p className="text-sm text-muted-foreground">No programs found</p>
            <p className="text-sm text-muted-foreground">Ready to get started?</p>
            <ProgramCreate
              trigger={
                <div className="text-blue-500 flex items-center gap-1">
                  <p className="text-blue-500">Create a new one</p> <ArrowRight className="mt-0.5" size={16} />
                </div>
              }
            />
          </div>
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
              <Select onValueChange={handleSelectChange} value={programId ?? ''}>
                <SelectTrigger className="w-48 border rounded-md px-3 py-2 flex items-center justify-between">{selectedProgram || 'Select a program'}</SelectTrigger>
                <SelectContent className="border rounded-md shadow-md">
                  {data?.programs?.edges?.map((edge) => {
                    const program = edge?.node
                    if (!program) return null

                    return (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2.5">
              <ProgramCreate />
              <CreateTaskDialog />
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-7">
        <div className="flex gap-7 w-full">
          {isBasicInfoLoading ? (
            <Loading />
          ) : basicInfoData?.program ? (
            <>
              <BasicInformation name={basicInfoData.program.name} startDate={basicInfoData.program.startDate} endDate={basicInfoData.program.endDate} description={basicInfoData.program.description} />
              <ProgramAuditor firm={basicInfoData.program.auditFirm} name={basicInfoData.program.auditor} email={basicInfoData.program.auditorEmail} isReady={!!basicInfoData.program.auditorReady} />
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

export default Page
