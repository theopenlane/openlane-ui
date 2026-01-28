import { useCallback, useEffect, useState } from 'react'

export enum SearchKeyEnum {
  ASSETS = 'assets',
  CONTROLS = 'controls',
  TASKS = 'tasks',
  POLICIES = 'policies',
  PROCEDURES = 'procedures',
  RISKS = 'risks',
  EVIDENCE = 'evidence',
  SUBPROCESSORS = 'subprocessors',
  DOCUMENTS = 'documents',
}

export const STORAGE_SEARCH_KEY_PREFIX = 'table-search:'

export function getInitialSearchTerm(key: SearchKeyEnum, fallback = ''): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${STORAGE_SEARCH_KEY_PREFIX}${key}`)
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

export function useStorageSearch(key: SearchKeyEnum, options: UseStorageSearchOptions = {}): [string, (value: string) => void] {
  const { fallback = '', persist = true } = options

  const [searchTerm, _setSearchTerm] = useState<string>(() => getInitialSearchTerm(key, fallback))

  const setSearchTerm = useCallback(
    (value: string) => {
      _setSearchTerm(value)

      if (!persist) return
      if (typeof window === 'undefined') return

      const storageKey = `${STORAGE_SEARCH_KEY_PREFIX}${key}`

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
