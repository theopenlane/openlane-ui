import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { canEdit } from '@/lib/authz/utils'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useAccountRoles } from '@/lib/query-hooks/permissions'

type TrustCenterEditAccess = {
  allowed: boolean
  isLoading: boolean
}

export const useCanEditTrustCenter = (): TrustCenterEditAccess => {
  const { data: session } = useSession()
  const { data: trustCenterData, isLoading: isLoadingTrustCenter } = useGetTrustCenter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''
  const { data: tcPermission, isLoading: isLoadingTrustCenterRoles } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterID)

  return {
    allowed: canEdit(tcPermission?.roles, session),
    isLoading: isLoadingTrustCenter || isLoadingTrustCenterRoles,
  }
}
