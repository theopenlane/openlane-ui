import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'global-search-history'
const MAX_HISTORY = 5

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      try {
        setHistory(JSON.parse(raw))
      } catch {
        console.error('Could not parse search history from localStorage')
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const addTerm = useCallback((term: string) => {
    setHistory((prev) => {
      const deduped = [term, ...prev.filter((t) => t !== term)]
      const truncated = deduped.slice(0, MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(truncated))
      return truncated
    })
  }, [])

  return { history, addTerm }
}
