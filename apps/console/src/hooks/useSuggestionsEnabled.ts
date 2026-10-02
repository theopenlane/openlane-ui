'use client'

import { useSession } from 'next-auth/react'
import { docsHelpAvailable } from '@repo/dally/ai'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { useCurrentUserRole } from '@/lib/graphql-hooks/member'
import { isImpersonation } from '@/lib/authz/utils'

export const useSuggestionsEnabled = () => {
  const { data: session } = useSession()
  const { role, isLoading } = useCurrentUserRole()

  if (!docsHelpAvailable || isLoading) {
    return false
  }

  return role ? role !== OrgMembershipRole.AUDITOR : !!isImpersonation(session)
}
