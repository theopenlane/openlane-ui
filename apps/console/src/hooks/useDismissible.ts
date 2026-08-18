'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

// Remembers that the user waved something away, keyed per record and scoped to
// the organization. Used by the docs-driven suggestion cards, which should stay
// gone once dismissed
export function useDismissible(key: string): { dismissed: boolean; dismiss: () => void } {
  const { currentOrgId } = useOrganization()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(getOrganizationStorageItem(key, currentOrgId) === 'true')
  }, [key, currentOrgId])

  // useCallback because this is passed down into card subtrees; a new function each
  // render would defeat any memoization there
  const dismiss = useCallback(() => {
    setDismissed(true)
    setOrganizationStorageItem(key, 'true', currentOrgId)
  }, [key, currentOrgId])

  return { dismissed, dismiss }
}
