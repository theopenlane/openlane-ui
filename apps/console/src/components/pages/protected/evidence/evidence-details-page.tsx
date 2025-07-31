'use client'
import { EvidenceTable } from '@/components/pages/protected/evidence/table/evidence-table.tsx'
import { EvidenceSummaryCard } from '@/components/pages/protected/evidence/chart/evidence-summary-card.tsx'
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
import { canCreate } from '@/lib/authz/utils'
import { useOrganizationRole } from '@/lib/authz/access-api'
import { useSession } from 'next-auth/react'
import { AccessEnum } from '@/lib/authz/enums/access-enum'

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
  const { data: session } = useSession()

  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { data: permission } = useOrganizationRole(session)

  const createAllowed = canCreate(permission?.roles, AccessEnum.CanCreateEvidence)

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
      { label: 'Evidence', href: '/evidence' },
      { label: basicInfoData?.program?.name, isLoading: isLoading },
    ])
  }, [setCrumbs, basicInfoData, isLoading])

  useEffect(() => {
    if (basicInfoData) document.title = `${currentOrganization?.node?.displayName}: Programs - ${basicInfoData.program.name}`
  }, [basicInfoData, currentOrganization?.node?.displayName])

  const handleSelectChange = (val: string) => {
    if (val === 'all') {
      setSelectedProgram('All programs')
      router.push(`/evidence`)
    } else {
      const programName = programMap[val] ?? 'Unknown Program'
      setSelectedProgram(programName)
      router.push(`/evidence?programId=${val}`)
    }
  }

  const handleCreateEvidence = () => {
    if (programId) {
      router.push(`/evidence/create?programId=${programId}`)
    } else {
      router.push('/evidence/create')
    }
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
                  <div className="truncate">{selectedProgram || 'All Programs'}</div>
                </SelectTrigger>
                <SelectContent className="border rounded-md shadow-md">
                  <SelectItem value="all">All Programs</SelectItem>
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

              {createAllowed && (
                <Button className="h-8 !px-2" onClick={handleCreateEvidence}>
                  Submit Evidence
                </Button>
              )}
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
