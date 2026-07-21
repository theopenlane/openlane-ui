'use client'

import { useCallback, useMemo } from 'react'
import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { useOrganization } from '@/hooks/useOrganization'
import { useRecommendationsFeed } from '@/hooks/useRecommendationsFeed'
import { createOrgPersistedStore, parseStringRecord, useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { SuggestedTaskSource, type SuggestedTask } from '@/lib/suggested-tasks/types'

export type SetupChecklistItemStatus = 'done' | 'in-progress' | 'not-started'

export type SetupChecklistItem = SuggestedTask & { itemStatus: SetupChecklistItemStatus }

const SETUP_CHECKLIST_STATUS_STORAGE_KEY = 'dashboard-setup-checklist-status'

const SETUP_CHECKLIST_ITEM_STATUSES: SetupChecklistItemStatus[] = ['done', 'in-progress', 'not-started']

const isSetupChecklistItemStatus = (value: string): value is SetupChecklistItemStatus => SETUP_CHECKLIST_ITEM_STATUSES.some((status) => status === value)

const setupChecklistStatusStore = createOrgPersistedStore<Record<string, SetupChecklistItemStatus>>(
  SETUP_CHECKLIST_STATUS_STORAGE_KEY,
  (raw) => parseStringRecord(raw, isSetupChecklistItemStatus),
  () => ({}),
)

const statusFromTaskStatus = (status: TaskTaskStatus): SetupChecklistItemStatus => {
  switch (status) {
    case TaskTaskStatus.COMPLETED:
      return 'done'
    case TaskTaskStatus.IN_PROGRESS:
    case TaskTaskStatus.IN_REVIEW:
      return 'in-progress'
    default:
      return 'not-started'
  }
}

export const useSetupChecklist = () => {
  const { currentOrgId } = useOrganization()
  const { suggestions, isLoading: isFeedLoading } = useRecommendationsFeed({ source: SuggestedTaskSource.ONBOARDING })
  const { value: statusOverrides, isHydrated: isStatusHydrated, setValue: setStatusOverrides } = useOrgPersistedState(setupChecklistStatusStore, currentOrgId)

  const isHydrated = isStatusHydrated && !isFeedLoading

  const items: SetupChecklistItem[] = useMemo(() => suggestions.map((task) => ({ ...task, itemStatus: statusOverrides[task.id] ?? statusFromTaskStatus(task.status) })), [suggestions, statusOverrides])

  const completedCount = useMemo(() => items.filter((task) => task.itemStatus === 'done').length, [items])
  const isComplete = isHydrated && completedCount === items.length

  const setItemStatus = useCallback(
    (taskId: string, status: SetupChecklistItemStatus) => {
      setStatusOverrides((previous) => ({ ...previous, [taskId]: status }))
    },
    [setStatusOverrides],
  )

  const markInProgress = useCallback(
    (taskId: string) => {
      const current = items.find((task) => task.id === taskId)?.itemStatus
      if (current === 'not-started' || current === undefined) {
        setItemStatus(taskId, 'in-progress')
      }
    },
    [items, setItemStatus],
  )

  const toggleDone = useCallback(
    (taskId: string) => {
      const current = items.find((task) => task.id === taskId)?.itemStatus
      setItemStatus(taskId, current === 'done' ? 'not-started' : 'done')
    },
    [items, setItemStatus],
  )

  return { items, completedCount, isComplete, isHydrated, markInProgress, toggleDone }
}
