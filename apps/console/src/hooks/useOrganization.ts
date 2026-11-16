import { useSession } from 'next-auth/react'
import { useGetOrganizationsForCurrentUser } from '@/lib/graphql-hooks/organization'

export const useOrganization = () => {
  const { data: sessionData } = useSession()
  const currentOrgId: string | undefined = sessionData?.user?.activeOrganizationId

  const { data } = useGetOrganizationsForCurrentUser()
  const organizations = data?.organizations.edges || []

  const getOrganizationByID = (organizationID: string | undefined) => {
    if (!organizationID) return undefined
    return organizations.find((item) => item?.node?.id === organizationID)
  }

  return { currentOrgId, allOrgs: organizations, getOrganizationByID }
}
