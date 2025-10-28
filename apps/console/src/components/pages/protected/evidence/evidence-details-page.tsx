'use client'
import { EvidenceTable } from '@/components/pages/protected/evidence/table/evidence-table.tsx'
import { EvidenceSummaryCard } from '@/components/pages/protected/evidence/chart/evidence-summary-card.tsx'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGetAllPrograms, useGetProgramBasicInfo } from '@/lib/graphql-hooks/programs.ts'
import { OrderDirection, ProgramOrderField, ProgramProgramStatus } from '@repo/codegen/src/schema.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization.ts'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import EvidenceSuggestedActions from './table/evidence-suggested-actions'
import Loading from '@/app/(protected)/evidence/loading'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import EvidenceCreateSheet from './evidence-create-sheet'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const EvidenceDetailsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const programId = searchParams.get('programId')

  const { data, isLoading } = useGetAllPrograms({
    where: { statusNotIn: [ProgramProgramStatus.COMPLETED, ProgramProgramStatus.ARCHIVED] },
    orderBy: [{ field: ProgramOrderField.end_date, direction: OrderDirection.ASC }],
  })

  const [selectedProgram, setSelectedProgram] = useState<string>('')

  const { data: basicInfoData } = useGetProgramBasicInfo(programId)
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { data: permission } = useOrganizationRoles()

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

  useEffect(() => {
    if (programId && programMap[programId]) {
      setSelectedProgram(programMap[programId])
    } else {
      setSelectedProgram('All Programs')
    }
  }, [programId, programMap])

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
    setIsSheetOpen(true)
  }

  return (
    <>
      {isLoading ? (
        <>
          <Loading />
          <EvidenceTable />
        </>
      ) : (
        <>
          <PageHeading
            heading={
              <div className="flex w-full items-center justify-between">
                <h1>Evidence Center</h1>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <EvidenceSuggestedActions />

                  <Select onValueChange={handleSelectChange} value={programId ?? ''}>
                    <SelectTrigger className="h-8 min-w-[10rem] max-w-[16rem] border rounded-md px-3 flex items-center justify-between overflow-visible">
                      <div className="truncate">{selectedProgram || 'All Programs'}</div>
                    </SelectTrigger>
                    <SelectContent className="border rounded-md shadow-md z-50">
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
                    <>
                      <Button variant="primary" className="h-8 !px-2 whitespace-nowrap" onClick={handleCreateEvidence}>
                        Submit Evidence
                      </Button>
                      <EvidenceCreateSheet
                        onEvidenceCreateSuccess={() => setIsSheetOpen(false)}
                        open={isSheetOpen}
                        onOpenChange={setIsSheetOpen}
                        excludeObjectTypes={[ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.PROGRAM]}
                      />
                    </>
                  )}
                </div>
              </div>
            }
          />

          <EvidenceSummaryCard />
          <EvidenceTable />
          <EvidenceDetailsSheet />
        </>
      )}
    </>
  )
}

export default EvidenceDetailsPage
