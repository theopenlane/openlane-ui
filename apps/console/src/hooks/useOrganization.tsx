import { useGetAllOrganizationsQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'

export const useOrganization = () => {
  const { data: sessionData, status } = useSession()
  const currentOrgId = sessionData?.user?.activeOrganizationId

  const [allOrgs] = useGetAllOrganizationsQuery({
    pause: status === 'loading' || !sessionData,
  })
  const organizations = allOrgs?.data?.organizations?.edges || []

  // const currentOrg = organizations.find((org) => org?.node?.id === currentOrgId)?.node

  return { currentOrgId, allOrgs: organizations }
}
