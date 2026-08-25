import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { useCallback, useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

export const STORAGE_SEARCH_KEY_PREFIX = 'table-search:'

export const SEARCH_TERM_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

type StoredSearchTerm = {
  value: string
  savedAt: number
}

const searchStorageKey = (key: ObjectTypes): string => `${STORAGE_SEARCH_KEY_PREFIX}${key.toLowerCase()}`

const isStoredSearchTerm = (parsed: unknown): parsed is StoredSearchTerm =>
  typeof parsed === 'object' && parsed !== null && 'value' in parsed && 'savedAt' in parsed && typeof parsed.value === 'string' && typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt)

const isExpired = (stored: StoredSearchTerm): boolean => {
  const age = Date.now() - stored.savedAt
  return age < 0 || age >= SEARCH_TERM_TTL_MS
}

type SearchTermRead = {
  raw: string | null
  fresh: StoredSearchTerm | null
}

const readStoredSearchTerm = (key: ObjectTypes, organizationId?: string): SearchTermRead => {
  const raw = getOrganizationStorageItem(searchStorageKey(key), organizationId)
  if (raw === null) return { raw, fresh: null }

  try {
    const parsed: unknown = JSON.parse(raw)
    return { raw, fresh: isStoredSearchTerm(parsed) && !isExpired(parsed) ? parsed : null }
  } catch {
    return { raw, fresh: null }
  }
}

const writeSearchTerm = (key: ObjectTypes, value: string, organizationId?: string): void => {
  const stored: StoredSearchTerm = { value, savedAt: Date.now() }
  setOrganizationStorageItem(searchStorageKey(key), JSON.stringify(stored), organizationId)
}

export const getInitialSearchTerm = (key: ObjectTypes, organizationId?: string, fallback = ''): string => readStoredSearchTerm(key, organizationId).fresh?.value ?? fallback

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

      if (value) {
        writeSearchTerm(key, value, currentOrgId)
      } else {
        removeOrganizationStorageItem(searchStorageKey(key), currentOrgId)
      }
    },
    [key, persist, currentOrgId],
  )

  useEffect(() => {
    const { raw, fresh } = readStoredSearchTerm(key, currentOrgId)
    setSearchTerm(fresh?.value ?? fallback)

    if (!persist) return

    if (fresh) {
      writeSearchTerm(key, fresh.value, currentOrgId)
    } else if (raw !== null) {
      removeOrganizationStorageItem(searchStorageKey(key), currentOrgId)
    }
  }, [key, currentOrgId, fallback, persist])

  return [searchTerm, updateSearchTerm]
}
