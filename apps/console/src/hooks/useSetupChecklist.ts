'use client'

import { useEffect, useState } from 'react'
import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { useOrganization } from '@/hooks/useOrganization'
import { useRecommendationsFeed } from '@/hooks/useRecommendationsFeed'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'
import { SuggestedTaskSource, type SuggestedTask } from '@/lib/suggested-tasks/types'

export type SetupChecklistItemStatus = 'done' | 'in-progress' | 'not-started'

const SETUP_CHECKLIST_STATUS_STORAGE_KEY = 'dashboard-setup-checklist-status'

const statusFromTaskStatus = (status: TaskTaskStatus): SetupChecklistItemStatus => {
  switch (status) {
    case TaskTaskStatus.COMPLETED:
    case TaskTaskStatus.WONT_DO:
      return 'done'
    case TaskTaskStatus.IN_PROGRESS:
    case TaskTaskStatus.IN_REVIEW:
      return 'in-progress'
    default:
      return 'not-started'
  }
}

export type SetupChecklistItem = SuggestedTask & { itemStatus: SetupChecklistItemStatus }

export const useSetupChecklist = () => {
  const { currentOrgId } = useOrganization()
  const { suggestions } = useRecommendationsFeed()
  const [statusOverrides, setStatusOverrides] = useState<Record<string, SetupChecklistItemStatus>>({})

  useEffect(() => {
    const raw = getOrganizationStorageItem(SETUP_CHECKLIST_STATUS_STORAGE_KEY, currentOrgId)
    if (!raw) {
      setStatusOverrides({})
      return
    }
    try {
      setStatusOverrides(JSON.parse(raw))
    } catch {
      setStatusOverrides({})
    }
  }, [currentOrgId])

  const setItemStatus = (taskId: string, status: SetupChecklistItemStatus) => {
    setStatusOverrides((prev) => {
      const next = { ...prev, [taskId]: status }
      setOrganizationStorageItem(SETUP_CHECKLIST_STATUS_STORAGE_KEY, JSON.stringify(next), currentOrgId)
      return next
    })
  }

  const items: SetupChecklistItem[] = suggestions
    .filter((task) => task.source === SuggestedTaskSource.ONBOARDING)
    .map((task) => ({ ...task, itemStatus: statusOverrides[task.id] ?? statusFromTaskStatus(task.status) }))

  const completedCount = items.filter((task) => task.itemStatus === 'done').length
  const isComplete = items.length === 0 || completedCount === items.length

  const markInProgress = (taskId: string) => {
    const current = items.find((task) => task.id === taskId)?.itemStatus
    if (current === 'not-started' || current === undefined) {
      setItemStatus(taskId, 'in-progress')
    }
  }

  const markComplete = (taskId: string) => setItemStatus(taskId, 'done')

  const markNotStarted = (taskId: string) => setItemStatus(taskId, 'not-started')

  const toggleDone = (taskId: string) => {
    const current = items.find((task) => task.id === taskId)?.itemStatus
    if (current === 'done') {
      markNotStarted(taskId)
    } else {
      markComplete(taskId)
    }
  }

  return { items, completedCount, isComplete, markInProgress, markComplete, markNotStarted, toggleDone }
}
