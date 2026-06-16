'use client'

import { useCallback } from 'react'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { canEdit } from '@/lib/authz/utils'
import { useCurrentUserRole } from '@/lib/graphql-hooks/member'
import { type TAccessRole } from '@/types/authz'

export const useCanModifyReviews = () => {
  const { role: currentUserRole } = useCurrentUserRole()

  return useCallback(
    (accessRole: TAccessRole[] | undefined) => {
      return currentUserRole === OrgMembershipRole.AUDITOR || canEdit(accessRole)
    },
    [currentUserRole],
  )
}
