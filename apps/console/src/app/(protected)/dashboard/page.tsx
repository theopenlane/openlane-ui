'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@repo/ui/select'
import { ProgramCreate } from '@/components/pages/protected/program/program-create'
import MyTask from '@/components/pages/protected/overview/my-task'
import PendingActions from '@/components/pages/protected/overview/pending-actions'
import Risks from '@/components/pages/protected/overview/risks'
import Questionnaire from '@/components/pages/protected/overview/questionnaire'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { useGetAllPrograms } from '@/lib/graphql-hooks/programs'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import { NewUserLanding } from '@/components/pages/protected/dashboard/dashboard'
import { Loading } from '@/components/shared/loading/loading'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'

const Page: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedProgram, setSelectedProgram] = useState<string>('All programs')
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)

  const { data, isLoading } = useGetAllPrograms({
    where: {
      statusNEQ: ProgramProgramStatus.COMPLETED,
    },
  })

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
    const programId = searchParams.get('id')

    if (!programId) {
      setSelectedProgram('All programs')
    } else {
      const programName = programMap[programId] ?? 'Unknown Program'
      setSelectedProgram(programName)
    }
  }, [searchParams, programMap])

  const handleSelectChange = (val: string) => {
    if (val === 'All programs') {
      setSelectedProgram('All programs')
      router.push('/dashboard')
    } else {
      const programName = programMap[val] ?? 'Unknown Program'
      setSelectedProgram(programName)
      router.push(`/dashboard?id=${val}`)
    }
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
              <Select onValueChange={handleSelectChange}>
                <SelectTrigger className="w-48 border rounded-md px-3 py-2 flex items-center justify-between">{selectedProgram}</SelectTrigger>
                <SelectContent className="border rounded-md shadow-md">
                  <SelectItem value="All programs">All programs</SelectItem>
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
              {canCreate(permission?.roles, AccessEnum.CanCreateProgram) && <ProgramCreate />}
              <CreateTaskDialog />
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-7">
        <div className="flex flex-wrap gap-7">
          <MyTask />
          <PendingActions />
        </div>
        <StatsCards />
        <Risks />
        <Questionnaire />
      </div>
    </>
  )
}

export default Page
