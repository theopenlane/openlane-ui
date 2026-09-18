'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useGetOrganizationDomains } from '@/lib/graphql-hooks/organization'
import { useOrganization } from '@/hooks/useOrganization'
import { normalizeUrl } from '@/utils/normalizeUrl'
import { isValidDomain } from '@/utils/strings'
import { type BrandFormValues } from '../brand-schema'

const toHostname = (candidate?: string | null) => {
  const normalized = normalizeUrl(candidate)
  if (!normalized) return ''

  try {
    return new URL(normalized).hostname.toLowerCase()
  } catch {
    return ''
  }
}

export const useBrandingDomainOptions = (enabled: boolean) => {
  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationDomains(enabled ? currentOrgId : undefined)
  const { watch } = useFormContext<BrandFormValues>()

  const organizationDomains = data?.organization?.setting?.domains
  const companyDomain = watch('companyDomain')

  const domainOptions = useMemo(() => [...new Set([...(organizationDomains ?? []), companyDomain].map(toHostname).filter(isValidDomain))], [organizationDomains, companyDomain])

  return { isLoading, domainOptions }
}
