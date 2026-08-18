'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { OrderDirection, ProgramOrderField, ProgramProgramStatus, type GetAllProgramsQueryVariables, type ProgramWhereInput } from '@repo/codegen/src/schema'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { evidenceProgramFilterStore } from '@/components/pages/protected/evidence/program-filter-storage'

const PROGRAM_PARAM = 'programId'

const ACTIVE_PROGRAMS_WHERE: ProgramWhereInput = { statusNotIn: [ProgramProgramStatus.COMPLETED, ProgramProgramStatus.ARCHIVED] }

const ACTIVE_PROGRAMS_ORDER_BY: GetAllProgramsQueryVariables['orderBy'] = [{ field: ProgramOrderField.end_date, direction: OrderDirection.ASC }]

export const useStickyProgramFilter = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get(PROGRAM_PARAM)
  const { data: session, status: sessionStatus } = useSession()
  const currentOrgId = session?.user?.activeOrganizationId
  const { replace } = useSmartRouter()
  const { programOptions, isSuccess, hasProgramAccess } = useProgramSelect({ where: ACTIVE_PROGRAMS_WHERE, orderBy: ACTIVE_PROGRAMS_ORDER_BY })
  const { value: storedProgramId, isHydrated, setValue: setStoredProgramId } = useOrgPersistedState(evidenceProgramFilterStore, currentOrgId)
  const restoredProgramIdRef = useRef<string | null>(null)
  const reconciledOrgIdRef = useRef<string | undefined>(undefined)

  const isOrgResolved = sessionStatus !== 'loading' && currentOrgId !== undefined
  const knownProgramIds = useMemo(() => (hasProgramAccess && isSuccess ? programOptions.map((option) => option.value) : null), [hasProgramAccess, isSuccess, programOptions])

  useEffect(() => {
    if (!isOrgResolved || !isHydrated || programId || storedProgramId === null) return
    if (knownProgramIds !== null && !knownProgramIds.includes(storedProgramId)) return

    restoredProgramIdRef.current = storedProgramId
    replace({ [PROGRAM_PARAM]: storedProgramId })
  }, [isOrgResolved, isHydrated, programId, storedProgramId, knownProgramIds, replace])

  useEffect(() => {
    if (!isOrgResolved || !isHydrated || knownProgramIds === null) return

    if (reconciledOrgIdRef.current !== currentOrgId) {
      reconciledOrgIdRef.current = currentOrgId

      if (programId && knownProgramIds.includes(programId)) {
        setStoredProgramId(programId)
        return
      }
    }

    if (storedProgramId === null || knownProgramIds.includes(storedProgramId)) return

    setStoredProgramId(null)

    if (programId === storedProgramId && restoredProgramIdRef.current === storedProgramId) {
      restoredProgramIdRef.current = null
      replace({ [PROGRAM_PARAM]: null })
    }
  }, [isOrgResolved, isHydrated, currentOrgId, programId, storedProgramId, knownProgramIds, setStoredProgramId, replace])

  const selectProgram = useCallback(
    (nextProgramId: string | null) => {
      reconciledOrgIdRef.current = currentOrgId
      restoredProgramIdRef.current = null
      setStoredProgramId(nextProgramId)

      if (nextProgramId !== programId) {
        replace({ [PROGRAM_PARAM]: nextProgramId })
      }
    },
    [currentOrgId, programId, replace, setStoredProgramId],
  )

  return {
    programId,
    programOptions,
    selectProgram,
    isRestoringProgramFilter: sessionStatus === 'loading' || !isHydrated || (isOrgResolved && !programId && storedProgramId !== null),
  }
}
