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
import DashboardActions from '@/components/pages/protected/overview/DashboardActions.tsx'
import DashboardComplianceOverview from '@/components/pages/protected/overview/DashboardComplianceOverview.tsx'
import DashboardSuggestedActions from '@/components/pages/protected/overview/DashboardSuggestedActions.tsx'
import DashboardLatestActivity from '@/components/pages/protected/overview/DashboardLatestActivity.tsx'
import DashboardViewDocumentation from '../overview/DashboardViewDocumentation'
import DashboardContactSupport from '@/components/pages/protected/overview/DashboardContactSupport.tsx'

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
      <div className="max-w-[1076px] mx-auto w-full px-4 flex flex-col gap-4">
        <h1>Welcome, Luke!</h1>
        <p>Here&#39;s what&#39;s happening in your organization.</p>
        <DashboardActions />
        <DashboardComplianceOverview />

        <div className="grid grid-cols-2 gap-4 auto-rows-fr">
          {/* LEFT COLUMN (FULL HEIGHT) */}
          <div className="row-span-2">
            <DashboardSuggestedActions />
          </div>

          {/* RIGHT COLUMN (TOP) */}
          <DashboardViewDocumentation />

          {/* RIGHT COLUMN (BOTTOM) */}
          <DashboardContactSupport />
        </div>
      </div>
    </>
  )
}

export default DashboardPage
