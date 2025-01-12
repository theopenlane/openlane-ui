import { useGetAllOrganizationsQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export const useOrganization = () => {
  const { data: sessionData, status } = useSession()
  const currentOrgId = useMemo(() => sessionData?.user?.activeOrganizationId, [sessionData])

  const [allOrgs] = useGetAllOrganizationsQuery({
    pause: status === 'loading' || !sessionData,
  })
  const organizations = allOrgs?.data?.organizations?.edges || []

  const currentOrg = useMemo(() => {
    return organizations.find((org) => org?.node?.id === currentOrgId)?.node
  }, [organizations, currentOrgId])

  return { currentOrgId, allOrgs: allOrgs?.data?.organizations?.edges || [], currentOrg }
}
