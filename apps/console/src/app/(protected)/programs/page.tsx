'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@repo/ui/select'
import { ProgramCreate } from '@/components/pages/protected/program/program-create'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { useGetAllPrograms, useGetProgramBasicInfo } from '@/lib/graphql-hooks/programs'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import { NewUserLanding } from '@/components/pages/protected/dashboard/dashboard'
import { Loading } from '@/components/shared/loading/loading'
import { OrderDirection, ProgramOrderField, ProgramProgramStatus } from '@repo/codegen/src/schema'
import BasicInformation from '@/components/pages/protected/dashboard/basic-info'
import ProgramAuditor from '@/components/pages/protected/dashboard/program-auditor'
import ProgramsTaskTable from '@/components/pages/programs/programs-tasks-table'
import { ControlsSummaryCard } from '@/components/pages/protected/programs/controls-summary-card'

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
    return <NewUserLanding />
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
