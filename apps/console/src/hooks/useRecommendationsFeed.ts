'use client'

import { useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'
import { mockSuggestedTasks } from '@/lib/suggested-tasks/mock-data'

const COMPLETED_RECOMMENDATIONS_STORAGE_KEY = 'dashboard-dismissed-recommendations'

export const useRecommendationsFeed = () => {
  const { currentOrgId } = useOrganization()
  const [completedKeys, setCompletedKeys] = useState<string[]>([])

  useEffect(() => {
    const raw = getOrganizationStorageItem(COMPLETED_RECOMMENDATIONS_STORAGE_KEY, currentOrgId)
    if (!raw) return
    try {
      setCompletedKeys(JSON.parse(raw))
    } catch {
      console.error('Could not parse completed recommendations from localStorage')
    }
  }, [currentOrgId])

  // mock data standing in for real suggested tasks until this is backed by the tasks API --
  // click routing (metadata.link vs opening the suggested-task view) is decided by the caller
  const suggestions = mockSuggestedTasks.filter((task) => !task.availableAt || new Date(task.availableAt) <= new Date())

  const toggleComplete = (key: string) => {
    setCompletedKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((completedKey) => completedKey !== key) : [...prev, key]
      setOrganizationStorageItem(COMPLETED_RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(next), currentOrgId)
      return next
    })
  }

  return { suggestions, completedKeys, toggleComplete }
}
