'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useDebounce } from '@uidotdev/usehooks'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { getEmailDomain, isValidDomain } from '@/utils/strings'
import { type ContactFormData } from './use-form-schema'

export const useVendorSuggestions = () => {
  const { watch } = useFormContext<ContactFormData>()
  const email = useDebounce(watch('email') ?? '', 300) // 300ms
  const emailDomain = getEmailDomain(email)
  const domain = emailDomain && isValidDomain(emailDomain) ? emailDomain : null

  const { vendorNodes } = useVendorsWithFilter({ where: domain ? { domainsHas: domain } : undefined, enabled: !!domain })

  const matches = useMemo(() => (domain ? vendorNodes : []), [domain, vendorNodes])

  return { domain, matches }
}
