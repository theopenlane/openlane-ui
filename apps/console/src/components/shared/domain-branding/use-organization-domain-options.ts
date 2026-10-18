import { useMemo } from 'react'
import { useGetOrganizationDomains } from '@/lib/graphql-hooks/organization'
import { useOrganization } from '@/hooks/useOrganization'
import { toHostname } from '@/utils/normalizeUrl'
import { isValidDomain } from '@/utils/strings'

export const useOrganizationDomainOptions = (enabled: boolean, extraDomain?: string | null) => {
  const { currentOrgId } = useOrganization()
  const { data, isLoadingDomains, refetch } = useGetOrganizationDomains(enabled ? currentOrgId : undefined)

  const organizationDomains = data?.organization?.setting?.domains

  const domainOptions = useMemo(() => [...new Set([...(organizationDomains ?? []), extraDomain].map(toHostname).filter(isValidDomain))], [organizationDomains, extraDomain])

  return { isLoadingDomains, domainOptions, refetchDomains: refetch }
}
