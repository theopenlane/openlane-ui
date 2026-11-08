'use client'

import { useSession } from 'next-auth/react'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { useCreateVendorScoringConfig, useOrganizationVendorScoringConfig } from '@/lib/graphql-hooks/vendor-scoring-config'
import { DEFAULT_VENDOR_SCORING_MODE } from '@/lib/vendor-scoring-config'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export const useVendorScoringAccess = () => {
  const { data: session } = useSession()
  const { data: orgPermission, isPending, isError } = useOrganizationRoles()

  if (canEdit(orgPermission?.roles, session)) {
    return { canConfigure: true, disabledReason: undefined }
  }

  if (isError) {
    return { canConfigure: false, disabledReason: 'Could not check your permissions. Please try again later.' }
  }

  if (isPending) {
    return { canConfigure: false, disabledReason: 'Checking your permissions…' }
  }

  return { canConfigure: false, disabledReason: 'Only organization owners and admins can change vendor scoring.' }
}

let setUpInFlight: Promise<boolean> | null = null

export const useSetUpVendorScoring = () => {
  const { isConfigured, isResolved } = useOrganizationVendorScoringConfig()
  const { mutateAsync, isPending } = useCreateVendorScoringConfig()
  const { errorNotification } = useNotification()

  const createConfig = async () => {
    try {
      await mutateAsync({ input: { scoringMode: DEFAULT_VENDOR_SCORING_MODE } })
      return true
    } catch (error) {
      errorNotification({ title: 'Could not set up vendor scoring', description: parseErrorMessage(error) })
      return false
    } finally {
      setUpInFlight = null
    }
  }

  const setUp = (): Promise<boolean> => {
    if (!isResolved) return Promise.resolve(false)
    if (isConfigured) return Promise.resolve(true)
    setUpInFlight ??= createConfig()
    return setUpInFlight
  }

  return { setUp, isSettingUp: isPending, canSetUp: isResolved && !isConfigured }
}
