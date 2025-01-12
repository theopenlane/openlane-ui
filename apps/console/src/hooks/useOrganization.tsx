import { useGetAllOrganizationsQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'

export const useOrganization = () => {
  const { data: sessionData } = useSession()
  const currentOrgId = sessionData?.user?.activeOrganizationId

  const [allOrgs] = useGetAllOrganizationsQuery({ pause: !sessionData })

  const currentOrg = allOrgs?.data?.organizations?.edges?.find((org) => org?.node?.id === currentOrgId)?.node

  return { currentOrgId, allOrgs: allOrgs?.data?.organizations?.edges || [], currentOrg }
}
