'use client'

import { useCallback, useMemo } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { createOrgPersistedStore, parseStringArray, useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { mockSuggestedTasks } from '@/lib/suggested-tasks/mock-data'
import type { SuggestedTask, SuggestedTaskSourceValue } from '@/lib/suggested-tasks/types'

const DISMISSED_RECOMMENDATIONS_STORAGE_KEY = 'dashboard-dismissed-recommendations'

const dismissedRecommendationsStore = createOrgPersistedStore<string[]>(DISMISSED_RECOMMENDATIONS_STORAGE_KEY, parseStringArray, () => [])

const FEED_EVALUATED_AT = Date.now()

export type RecommendationsFeedFilter = {
  source?: SuggestedTaskSourceValue
}

export type RecommendationsFeed = {
  suggestions: SuggestedTask[]
  isLoading: boolean
  error: Error | null
  dismissSuggestion: (suggestionId: string) => void
}

export const useRecommendationsFeed = ({ source }: RecommendationsFeedFilter = {}): RecommendationsFeed => {
  const { currentOrgId } = useOrganization()
  const { value: dismissedIds, isHydrated, setValue: setDismissedIds } = useOrgPersistedState(dismissedRecommendationsStore, currentOrgId)

  const suggestions = useMemo(() => {
    if (!isHydrated) return []

    const dismissed = new Set(dismissedIds)
    return mockSuggestedTasks.filter(
      (task) => !dismissed.has(task.id) && (!task.availableAt || new Date(task.availableAt).getTime() <= FEED_EVALUATED_AT) && (source === undefined || task.source === source),
    )
  }, [dismissedIds, isHydrated, source])

  const dismissSuggestion = useCallback(
    (suggestionId: string) => {
      setDismissedIds((previous) => (previous.includes(suggestionId) ? previous.filter((id) => id !== suggestionId) : [...previous, suggestionId]))
    },
    [setDismissedIds],
  )

  return { suggestions, isLoading: !isHydrated, error: null, dismissSuggestion }
}
