'use client'

import { useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'

type UseAsyncCommandSearchOptions = {
  delay?: number
  minLength?: number
  controlled?: { value: string; onValueChange: (value: string) => void }
}

export const useAsyncCommandSearch = ({ delay = 300, minLength = 0, controlled }: UseAsyncCommandSearchOptions = {}) => {
  const [internalText, setInternalText] = useState('')

  const searchText = controlled?.value ?? internalText
  const setSearchText = controlled?.onValueChange ?? setInternalText

  const term = searchText.trim()
  const debouncedTerm = useDebounce(term, delay)

  const hasMinLength = term.length >= minLength
  const isDebouncing = term !== debouncedTerm

  return {
    searchText,
    setSearchText,
    term,
    debouncedTerm,
    hasMinLength,
    canQuery: debouncedTerm.length >= minLength,
    getIsSearching: (...fetching: boolean[]) => hasMinLength && (isDebouncing || fetching.some(Boolean)),
  }
}
