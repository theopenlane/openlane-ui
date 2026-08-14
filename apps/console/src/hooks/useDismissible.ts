'use client'

import { useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

// Remembers that the user waved something away, keyed per record and scoped to
// the organization. Used by the docs-driven suggestion cards, which should stay
// gone once dismissed
export function useDismissible(key: string): { dismissed: boolean; dismiss: () => void } {
  const { currentOrgId } = useOrganization()
  const [dismissed, setDismissed] = useState(() => getOrganizationStorageItem(key, currentOrgId) === 'true')

  const dismiss = () => {
    setDismissed(true)
    setOrganizationStorageItem(key, 'true', currentOrgId)
  }

  return { dismissed, dismiss }
}
