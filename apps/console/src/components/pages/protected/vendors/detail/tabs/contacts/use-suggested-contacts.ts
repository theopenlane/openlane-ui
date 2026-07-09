'use client'

import { useMemo } from 'react'
import { useContacts } from '@/lib/graphql-hooks/contact'
import { useEntity } from '@/lib/graphql-hooks/entity'

const SUGGESTED_CONTACTS_LIMIT = 100

interface UseSuggestedContactsArgs {
  vendorId: string
  search?: string
  enabled?: boolean
}

export const useSuggestedContacts = ({ vendorId, search, enabled = true }: UseSuggestedContactsArgs) => {
  const { data: vendorData } = useEntity(enabled ? vendorId : undefined)
  const vendorDomains = useMemo(() => (vendorData?.entity?.domains ?? []).map((d) => d.toLowerCase().trim()).filter(Boolean), [vendorData])

  const { contacts } = useContacts({
    where: vendorDomains.length
      ? {
          and: [{ or: vendorDomains.map((d) => ({ emailHasSuffix: `@${d}` })) }, { not: { hasEntitiesWith: [{ id: vendorId }] } }, ...(search ? [{ fullNameContainsFold: search }] : [])],
        }
      : undefined,
    enabled: enabled && vendorDomains.length > 0,
    first: SUGGESTED_CONTACTS_LIMIT,
  })

  return { suggestedContacts: vendorDomains.length ? contacts : [] }
}
