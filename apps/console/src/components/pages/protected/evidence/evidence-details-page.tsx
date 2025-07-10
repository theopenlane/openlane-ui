'use client'
import { EvidenceTable } from '@/components/pages/protected/evidence/table/evidence-table.tsx'
import { EvidenceSummaryCard } from '@/components/pages/protected/procedures/chart/evidence-summary-card.tsx'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGetAllPrograms, useGetProgramBasicInfo } from '@/lib/graphql-hooks/programs.ts'
import { OrderDirection, ProgramOrderField, ProgramProgramStatus } from '@repo/codegen/src/schema.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization.ts'
import { Loading } from '@/components/shared/loading/loading.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'
import EvidenceDetailsSheet from '@/components/pages/protected/controls/control-evidence/evidence-details-sheet.tsx'

const EvidenceDetailsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const { data, isLoading } = useGetAllPrograms({
    where: { statusNEQ: ProgramProgramStatus.COMPLETED },
    orderBy: [{ field: ProgramOrderField.end_date, direction: OrderDirection.ASC }],
  })

  const [selectedProgram, setSelectedProgram] = useState<string>('')

  const { data: basicInfoData } = useGetProgramBasicInfo(programId)
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)

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
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/programs' },
      { label: basicInfoData?.program?.name, isLoading: isLoading },
    ])
  }, [setCrumbs, basicInfoData, isLoading])

  useEffect(() => {
    if (basicInfoData) document.title = `${currentOrganization?.node?.displayName}: Programs - ${basicInfoData.program.name}`
  }, [basicInfoData, currentOrganization?.node?.displayName])

  useEffect(() => {
    if (!data?.programs?.edges?.length) return

    const firstProgram = data.programs.edges[0]?.node
    if (!programId && firstProgram?.id) {
      router.replace(`/evidence?programId=${firstProgram.id}`)
      setSelectedProgram(firstProgram.name)
    } else if (programId) {
      const programName = programMap[programId] ?? 'Unknown Program'
      setSelectedProgram(programName)
    }
  }, [programId, programMap, router, data?.programs?.edges])

  const handleSelectChange = (val: string) => {
    const programName = programMap[val] ?? 'Unknown Program'
    setSelectedProgram(programName)
    router.push(`/evidence?programId=${val}`)
  }

  const handleCreateEvidence = () => {
    router.push('/evidence/create')
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <>
      <PageHeading
        heading={
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <h1>Evidence Center</h1>
            </div>
            <div className="flex gap-2.5 items-center">
              <Select onValueChange={handleSelectChange} value={programId ?? ''}>
                <SelectTrigger className="max-w-64 min-w-48 h-[32px] border rounded-md px-3 py-2 flex items-center justify-between">
                  <div className="truncate">{selectedProgram || 'Select a program'}</div>
                </SelectTrigger>
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

              <Button className="h-8 !px-2" onClick={handleCreateEvidence}>
                Submit Evidence
              </Button>
            </div>
          </div>
        }
      />
      <EvidenceSummaryCard />
      <EvidenceTable />
      <EvidenceDetailsSheet />
    </>
  )
}

export default EvidenceDetailsPage
