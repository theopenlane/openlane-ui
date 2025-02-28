import { useSession } from 'next-auth/react'
import { useGetAllOrganizations } from '../lib/graphql-hooks/organization'

export const useOrganization = () => {
  const { data: sessionData } = useSession()
  const currentOrgId: string | undefined = sessionData?.user?.activeOrganizationId

  const { data } = useGetAllOrganizations()
  const organizations = data?.organizations.edges || []

  return { currentOrgId, allOrgs: organizations }
}
