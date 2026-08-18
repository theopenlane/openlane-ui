'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

// Remembers that the user waved something away, keyed per record and scoped to
// the organization. Used by the docs-driven suggestion cards, which should stay
// gone once dismissed
export function useDismissible(key: string): { dismissed: boolean; dismiss: () => void; isResolved: boolean } {
  const { currentOrgId } = useOrganization()
  const [state, setState] = useState({ dismissed: false, isResolved: false })

  // read on the client only, so callers gating work on this have to wait for
  // isResolved rather than acting on the pre-read default of "not dismissed"
  useEffect(() => {
    setState({ dismissed: getOrganizationStorageItem(key, currentOrgId) === 'true', isResolved: true })
  }, [key, currentOrgId])

  // useCallback because this is passed down into card subtrees; a new function each
  // render would defeat any memoization there
  const dismiss = useCallback(() => {
    setState({ dismissed: true, isResolved: true })
    setOrganizationStorageItem(key, 'true', currentOrgId)
  }, [key, currentOrgId])

  return { ...state, dismiss }
}
