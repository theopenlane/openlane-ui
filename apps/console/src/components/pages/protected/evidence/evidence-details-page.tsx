'use client'
import { EvidenceTable } from '@/components/pages/protected/evidence/table/evidence-table.tsx'
import { EvidenceSummaryCard } from '@/components/pages/protected/evidence/chart/evidence-summary-card.tsx'
import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGetProgramBasicInfo } from '@/lib/graphql-hooks/program'
import { BreadcrumbContext, type Crumb } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization.ts'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import EvidenceSuggestedActions from './table/evidence-suggested-actions'
import Loading from '@/app/(protected)/evidence/loading'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import EvidenceCreateSheet from './evidence-create-sheet'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'
import EvidenceProgramFilter from './evidence-program-filter'
import { useStickyProgramFilter } from './hooks/use-sticky-program-filter'
import { useSmartRouter } from '@/hooks/useSmartRouter'

const EvidenceDetailsPage = () => {
  const { data: session } = useSession()
  const { programId, programOptions, selectProgram, isRestoringProgramFilter } = useStickyProgramFilter()

  const { data: basicInfoData, isLoading } = useGetProgramBasicInfo(programId)
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const searchParams = useSearchParams()
  const { replace: replaceParams } = useSmartRouter()
  const isSheetOpen = searchParams.get('create') === 'true'

  const currentOrganization = getOrganizationByID(currentOrgId ?? '')
  const { data: permission } = useOrganizationRoles()

  const createAllowed = hasPermission(permission?.roles, AccessEnum.CanCreateEvidence, session)

  useEffect(() => {
    const crumbs: Crumb[] = [
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Evidence', href: '/evidence' },
      ...(programId && basicInfoData
        ? [
            {
              label: basicInfoData.program?.name || 'Program',
              href: `/evidence?programId=${programId}`,
              isLoading,
            },
          ]
        : []),
    ]

    setCrumbs(crumbs)
  }, [setCrumbs, basicInfoData, isLoading, programId])

  useEffect(() => {
    if (basicInfoData) document.title = `${currentOrganization?.node?.displayName}: Programs - ${basicInfoData.program.name}`
  }, [basicInfoData, currentOrganization?.node?.displayName])

  const setSheetOpen = (open: boolean) => replaceParams({ create: open ? 'true' : null })

  if (isRestoringProgramFilter) {
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
              <div className="shrink-0 h-8 flex items-center">
                <EvidenceSuggestedActions />
              </div>
              <div className="shrink-0 h-8 flex items-center">
                <EvidenceProgramFilter programOptions={programOptions} selectedProgramId={programId} onSelect={selectProgram} />
              </div>
              {createAllowed && (
                <div className="shrink-0 h-8 flex items-center">
                  <Button variant="primary" className="h-8 px-2!" onClick={() => setSheetOpen(true)}>
                    Submit Evidence
                  </Button>
                  <EvidenceCreateSheet
                    onEvidenceCreateSuccess={() => setSheetOpen(false)}
                    open={isSheetOpen}
                    onOpenChange={setSheetOpen}
                    allowedObjectTypes={[ObjectTypeObjects.CONTROL_IMPLEMENTATION, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.SCAN, ObjectTypeObjects.TASK]}
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
  )
}

export default EvidenceDetailsPage
