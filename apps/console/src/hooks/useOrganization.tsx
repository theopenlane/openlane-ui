import { useGetAllOrganizationsQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export const useOrganization = () => {
  const { data: sessionData, status } = useSession()
  const currentOrgId = sessionData?.user?.activeOrganizationId

  const [allOrgs] = useGetAllOrganizationsQuery({
    pause: status === 'loading' || !sessionData,
  })
  const organizations = allOrgs?.data?.organizations?.edges || []

  return { currentOrgId, allOrgs: organizations }
}
