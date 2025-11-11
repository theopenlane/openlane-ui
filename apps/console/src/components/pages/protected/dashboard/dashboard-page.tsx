'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import MyTask from '@/components/pages/protected/overview/my-task'
import PendingActions from '@/components/pages/protected/overview/pending-actions'
import Risks from '@/components/pages/protected/overview/risks'
import Questionnaire from '@/components/pages/protected/overview/questionnaire'
import { useGetAllPrograms } from '@/lib/graphql-hooks/programs'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import { NewUserLanding } from '@/components/pages/protected/dashboard/dashboard'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import Loading from '@/app/(protected)/dashboard/loading'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { SlidersHorizontal } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const [, setSelectedProgram] = useState<string>('All programs')
  const { setCrumbs } = React.useContext(BreadcrumbContext)

  const { data, isLoading } = useGetAllPrograms({
    where: {
      statusNotIn: [ProgramProgramStatus.COMPLETED, ProgramProgramStatus.ARCHIVED],
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
    if (!programId) {
      setSelectedProgram('All programs')
    } else {
      const programName = programMap[programId] ?? 'Unknown Program'
      setSelectedProgram(programName)
    }
  }, [searchParams, programMap, programId])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }])
  }, [setCrumbs])

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

  if (isLoading) return <Loading />
  if (!data?.programs.edges?.length) return <NewUserLanding />

  return (
    <>
      <PageHeading
        heading={
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <h1>Overview</h1>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 !px-2 !pl-3" icon={<SlidersHorizontal />} iconPosition="left">
                    <span className="text-muted-foreground">Filter by:</span>
                    <span>Program</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto min-w-56">
                  <DropdownMenuRadioGroup value={programId ?? 'All programs'} onValueChange={(val) => handleSelectChange(val)}>
                    <DropdownMenuRadioItem value="All programs">All programs</DropdownMenuRadioItem>
                    {data?.programs?.edges?.map((edge) => {
                      const program = edge?.node
                      if (!program) return null
                      return (
                        <DropdownMenuRadioItem key={program.id} value={program.id}>
                          {program.name}
                        </DropdownMenuRadioItem>
                      )
                    })}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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

export default DashboardPage
