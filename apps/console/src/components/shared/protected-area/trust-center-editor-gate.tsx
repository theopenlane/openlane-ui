'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'

import { canEdit } from '@/lib/authz/utils'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { Loading } from '@/components/shared/loading/loading'
import ProtectedArea from '@/components/shared/protected-area/protected-area'

/**
 * Gates a trust-center route on edit access to the trust center itself.
 *
 * Org can_edit is not the right test here: core lets any trust-center editor
 * through (rule.AllowIfTrustCenterEditor short-circuits to Allow on the object's
 * can_edit), and the FGA model reaches that relation either from the org via
 * parent_editor or from a direct tuple on the trust center. Gating the route on
 * org roles therefore turns away a legitimate editor before the page can run its
 * own useAccountRoles check.
 */
const TrustCenterEditorGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession()
  const { data: trustCenterData, isLoading: isLoadingTrustCenter } = useGetTrustCenter()
  const trustCenterId = trustCenterData?.trustCenters?.edges?.[0]?.node?.id
  const { data: permission, isLoading: isLoadingRoles } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterId)

  if (isLoadingTrustCenter || (trustCenterId && isLoadingRoles)) {
    return <Loading />
  }

  if (!canEdit(permission?.roles, session)) {
    return <ProtectedArea />
  }

  return <>{children}</>
}

export default TrustCenterEditorGate
