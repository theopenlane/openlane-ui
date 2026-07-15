'use client'

import React, { use, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { Loading } from '@/components/shared/loading/loading'
import { useProgramSelect, useGetProgramBasicInfo, useProgramEvidenceStats } from '@/lib/graphql-hooks/program'
import { useProgramReviewStats } from '@/lib/graphql-hooks/review'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'
import { AuditorDashboardHeader } from './auditor-dashboard-header'
import { AuditorStatCards } from './auditor-stat-cards'
import { AuditorControlsTable } from './table/auditor-controls-table'

const PROGRAM_PARAM = 'programId'
const SELECTED_PROGRAM_STORAGE_KEY = 'auditor-dashboard:selected-program'

const AuditorDashboardPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { replace } = useSmartRouter()
  const searchParams = useSearchParams()
  const programIdParam = searchParams.get(PROGRAM_PARAM) ?? undefined
  const { currentOrgId } = useOrganization()

  const { programOptions, isLoading: isLoadingPrograms } = useProgramSelect({})

  const selectedProgramId = useMemo(() => {
    if (programIdParam && programOptions.some((option) => option.value === programIdParam)) {
      return programIdParam
    }
    const stored = getOrganizationStorageItem(SELECTED_PROGRAM_STORAGE_KEY, currentOrgId)
    if (stored && programOptions.some((option) => option.value === stored)) {
      return stored
    }
    return programOptions[0]?.value
  }, [programIdParam, programOptions, currentOrgId])

  const selectProgram = useCallback((programId: string) => replace({ [PROGRAM_PARAM]: programId }), [replace])

  useEffect(() => {
    if (!selectedProgramId) {
      return
    }
    setOrganizationStorageItem(SELECTED_PROGRAM_STORAGE_KEY, selectedProgramId, currentOrgId)
    if (selectedProgramId !== programIdParam) {
      replace({ [PROGRAM_PARAM]: selectedProgramId })
    }
  }, [selectedProgramId, programIdParam, currentOrgId, replace])

  const { data: programData } = useGetProgramBasicInfo(selectedProgramId ?? null)
  const { data: evidenceStats } = useProgramEvidenceStats(selectedProgramId)
  const { data: reviewStats } = useProgramReviewStats(selectedProgramId)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/auditor-dashboard' },
      { label: 'Auditor Dashboard', href: '/auditor-dashboard' },
    ])
  }, [setCrumbs])

  if (isLoadingPrograms) {
    return <Loading />
  }

  if (!selectedProgramId) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl leading-9 font-medium">Auditor Dashboard</h1>
        <p className="text-muted-foreground">No programs available yet.</p>
      </div>
    )
  }

  const program = programData?.program

  return (
    <div className="flex flex-col gap-6">
      <AuditorDashboardHeader
        title={program?.name ?? 'Auditor Dashboard'}
        subtitle={program?.frameworkName}
        programOptions={programOptions}
        selectedProgramId={selectedProgramId}
        onSelectProgram={selectProgram}
      />

      <AuditorStatCards program={program} evidenceStats={evidenceStats} reviewStats={reviewStats} />

      <AuditorControlsTable programId={selectedProgramId} />
    </div>
  )
}

export default AuditorDashboardPage
