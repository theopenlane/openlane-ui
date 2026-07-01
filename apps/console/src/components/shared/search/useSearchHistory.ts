import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'

const STORAGE_KEY = 'global-search-history'
const MAX_HISTORY = 5

export const useSearchHistory = () => {
  const { currentOrgId } = useOrganization()
  const storageKey = getOrganizationStorageKey(STORAGE_KEY, currentOrgId)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    if (raw) {
      try {
        setHistory(JSON.parse(raw))
      } catch {
        console.error('Could not parse search history from localStorage')
        localStorage.removeItem(storageKey)
      }
    } else {
      setHistory([])
    }
  }, [storageKey])

  const addTerm = useCallback(
    (term: string) => {
      setHistory((prev) => {
        const deduped = [term, ...prev.filter((t) => t !== term)]
        const truncated = deduped.slice(0, MAX_HISTORY)
        localStorage.setItem(storageKey, JSON.stringify(truncated))
        return truncated
      })
    },
    [storageKey],
  )

  return { history, addTerm }
}
