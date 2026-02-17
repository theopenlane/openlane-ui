'use client'
import { EvidenceTable } from '@/components/pages/protected/evidence/table/evidence-table.tsx'
import { EvidenceSummaryCard } from '@/components/pages/protected/evidence/chart/evidence-summary-card.tsx'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGetAllPrograms, useGetProgramBasicInfo } from '@/lib/graphql-hooks/program'
import { OrderDirection, ProgramOrderField, ProgramProgramStatus } from '@repo/codegen/src/schema.ts'
import { BreadcrumbContext, Crumb } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization.ts'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import EvidenceSuggestedActions from './table/evidence-suggested-actions'
import Loading from '@/app/(protected)/evidence/loading'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import EvidenceCreateSheet from './evidence-create-sheet'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { SlidersHorizontal } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'

const EvidenceDetailsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const programId = searchParams.get('programId')

  const { data, isLoading } = useGetAllPrograms({
    where: { statusNotIn: [ProgramProgramStatus.COMPLETED, ProgramProgramStatus.ARCHIVED] },
    orderBy: [{ field: ProgramOrderField.end_date, direction: OrderDirection.ASC }],
  })

  const { data: basicInfoData } = useGetProgramBasicInfo(programId)
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { data: permission } = useOrganizationRoles()

  const createAllowed = canCreate(permission?.roles, AccessEnum.CanCreateEvidence)

  useEffect(() => {
    const crumbs: Crumb[] = [
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/evidence' },
      programId && basicInfoData
        ? {
            label: basicInfoData.program?.name || 'Program',
            href: `/evidence?programId=${programId}`,
            isLoading,
          }
        : undefined,
    ].filter(Boolean) as Crumb[]

    setCrumbs(crumbs)
  }, [setCrumbs, basicInfoData, isLoading, programId])

  useEffect(() => {
    if (basicInfoData) document.title = `${currentOrganization?.node?.displayName}: Programs - ${basicInfoData.program.name}`
  }, [basicInfoData, currentOrganization?.node?.displayName])

  const handleSelectChange = (val: string) => {
    if (val === 'All programs') {
      router.push(`/evidence`)
    } else {
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
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <h1>Evidence Center</h1>
                </div>
                <div className="flex gap-2.5 items-center">
                  <div className="shrink-0 h-8 flex items-center">
                    <EvidenceSuggestedActions />
                  </div>
                  <div className="shrink-0 h-8 flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className={`h-8 px-2! pl-3! outline-none ring-0 focus-visible:outline-none focus-visible:ring-0 ${programId ? 'border border-primary!' : ''}`}
                          icon={<SlidersHorizontal />}
                          iconPosition="left"
                          variant="outline"
                        >
                          <span className="text-muted-foreground">Filter by:</span>
                          <span>Program</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto min-w-56">
                        {/* All programs */}
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onSelect={(e) => {
                            e.preventDefault()
                            handleSelectChange('All programs')
                          }}
                        >
                          <Checkbox checked={!programId} />
                          <span>All programs</span>
                        </DropdownMenuItem>

                        {/* Dynamic program list */}
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
                              <span>{program.name}</span>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {createAllowed && (
                    <div className="shrink-0 h-8 flex items-center">
                      <Button variant="primary" className="h-8 px-2!" onClick={handleCreateEvidence}>
                        Submit Evidence
                      </Button>
                      <EvidenceCreateSheet
                        onEvidenceCreateSuccess={() => setIsSheetOpen(false)}
                        open={isSheetOpen}
                        onOpenChange={setIsSheetOpen}
                        excludeObjectTypes={[ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.PROGRAM]}
                      />
                    </div>
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
