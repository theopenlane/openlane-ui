'use client'

import { docsHelpAvailable } from '@repo/dally/ai'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { useCurrentUserRole } from '@/lib/graphql-hooks/member'

export const useSuggestionsEnabled = () => {
  const { role, isLoading } = useCurrentUserRole()
  return docsHelpAvailable && !isLoading && !!role && role !== OrgMembershipRole.AUDITOR
}
