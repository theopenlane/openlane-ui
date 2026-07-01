import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { useCallback, useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'

const searchKey = (key: ObjectTypes): string => key.toLowerCase()

export const STORAGE_SEARCH_KEY_PREFIX = 'table-search:'

export const getInitialSearchTerm = (key: ObjectTypes, organizationId?: string, fallback = ''): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(getOrganizationStorageKey(`${STORAGE_SEARCH_KEY_PREFIX}${searchKey(key)}`, organizationId))
    if (stored != null) {
      return stored
    }
  }
  return fallback
}

type UseStorageSearchOptions = {
  fallback?: string
  persist?: boolean
}

export const useStorageSearch = (key: ObjectTypes, options: UseStorageSearchOptions = {}): [string, (value: string) => void] => {
  const { fallback = '', persist = true } = options
  const { currentOrgId } = useOrganization()

  const [searchTerm, setSearchTerm] = useState<string>(() => getInitialSearchTerm(key, currentOrgId, fallback))

  const updateSearchTerm = useCallback(
    (value: string) => {
      setSearchTerm(value)

      if (!persist) return
      if (typeof window === 'undefined') return

      const storageKey = getOrganizationStorageKey(`${STORAGE_SEARCH_KEY_PREFIX}${searchKey(key)}`, currentOrgId)

      if (!value) {
        localStorage.removeItem(storageKey)
      } else {
        localStorage.setItem(storageKey, value)
      }
    },
    [key, persist, currentOrgId],
  )

  useEffect(() => {
    setSearchTerm(getInitialSearchTerm(key, currentOrgId, fallback))
  }, [key, currentOrgId, fallback])

  return [searchTerm, updateSearchTerm]
}
