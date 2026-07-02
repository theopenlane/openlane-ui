import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

const STORAGE_KEY = 'global-search-history'
const MAX_HISTORY = 5

export const useSearchHistory = () => {
  const { currentOrgId } = useOrganization()
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const raw = getOrganizationStorageItem(STORAGE_KEY, currentOrgId)
    if (raw) {
      try {
        setHistory(JSON.parse(raw))
      } catch {
        console.error('Could not parse search history from localStorage')
        removeOrganizationStorageItem(STORAGE_KEY, currentOrgId)
      }
    } else {
      setHistory([])
    }
  }, [currentOrgId])

  const addTerm = useCallback(
    (term: string) => {
      setHistory((prev) => {
        const deduped = [term, ...prev.filter((t) => t !== term)]
        const truncated = deduped.slice(0, MAX_HISTORY)
        setOrganizationStorageItem(STORAGE_KEY, JSON.stringify(truncated), currentOrgId)
        return truncated
      })
    },
    [currentOrgId],
  )

  return { history, addTerm }
}
