import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useCallback, useEffect, useState } from 'react'

function searchKey(key: ObjectTypes): string {
  return key.toLowerCase()
}

export const STORAGE_SEARCH_KEY_PREFIX = 'table-search:'

export function getInitialSearchTerm(key: ObjectTypes, fallback = ''): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${STORAGE_SEARCH_KEY_PREFIX}${searchKey(key)}`)
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

export function useStorageSearch(key: ObjectTypes, options: UseStorageSearchOptions = {}): [string, (value: string) => void] {
  const { fallback = '', persist = true } = options

  const [searchTerm, _setSearchTerm] = useState<string>(() => getInitialSearchTerm(key, fallback))

  const setSearchTerm = useCallback(
    (value: string) => {
      _setSearchTerm(value)

      if (!persist) return
      if (typeof window === 'undefined') return

      const storageKey = `${STORAGE_SEARCH_KEY_PREFIX}${searchKey(key)}`

      if (!value) {
        localStorage.removeItem(storageKey)
      } else {
        localStorage.setItem(storageKey, value)
      }
    },
    [key, persist],
  )

  useEffect(() => {
    _setSearchTerm(getInitialSearchTerm(key, fallback))
  }, [key, fallback])

  return [searchTerm, setSearchTerm]
}
