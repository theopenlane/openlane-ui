'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { useOrganization } from '@/hooks/useOrganization'
import { useNotification } from '@/hooks/useNotification'
import { useRecommendationsFeed } from '@/hooks/useRecommendationsFeed'
import { useUpdateTask } from '@/lib/graphql-hooks/task'
import { clearOnboardingTasksPending, getOnboardingTasksPending } from '@/lib/storage/onboarding-tasks-pending'
import { isTerminalTaskStatus, SuggestedTaskSource, type SuggestedTask } from '@/lib/suggested-tasks/types'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export type SetupChecklistItemStatus = 'done' | 'in-progress' | 'not-started'

export type SetupChecklistItem = SuggestedTask & { itemStatus: SetupChecklistItemStatus }

const ONBOARDING_TASKS_POLL_MS = 3000
const ONBOARDING_TASKS_WAIT_MS = 30000

const itemStatusFromTaskStatus = (status: TaskTaskStatus): SetupChecklistItemStatus => {
  if (status === TaskTaskStatus.IN_PROGRESS || status === TaskTaskStatus.IN_REVIEW) return 'in-progress'
  return 'not-started'
}

export const useSetupChecklist = () => {
  const { currentOrgId } = useOrganization()
  const { mutate: updateTask } = useUpdateTask()
  const { errorNotification } = useNotification()
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    setIsPolling(getOnboardingTasksPending(currentOrgId))
  }, [currentOrgId])

  const { suggestions, isLoading: isFeedLoading } = useRecommendationsFeed({
    source: SuggestedTaskSource.ONBOARDING,
    refetchInterval: isPolling ? ONBOARDING_TASKS_POLL_MS : false,
  })

  const isHydrated = !isFeedLoading
  const totalCount = suggestions.length
  const isAwaitingTasks = isPolling && totalCount === 0

  const { items, completedCount } = useMemo(() => {
    const active: SetupChecklistItem[] = []
    let completed = 0
    for (const task of suggestions) {
      if (isTerminalTaskStatus(task.status)) {
        completed += 1
      } else {
        active.push({ ...task, itemStatus: itemStatusFromTaskStatus(task.status) })
      }
    }
    return { items: active, completedCount: completed }
  }, [suggestions])

  useEffect(() => {
    if (isPolling && totalCount > 0) {
      clearOnboardingTasksPending(currentOrgId)
    }
  }, [isPolling, totalCount, currentOrgId])

  useEffect(() => {
    if (!isPolling) return
    const timer = setTimeout(() => {
      clearOnboardingTasksPending(currentOrgId)
      setIsPolling(false)
    }, ONBOARDING_TASKS_WAIT_MS)
    return () => clearTimeout(timer)
  }, [isPolling, currentOrgId])

  const isComplete = isHydrated && !isAwaitingTasks && completedCount === totalCount

  const notifyUpdateFailure = useCallback((error: unknown) => errorNotification({ title: 'Error', description: parseErrorMessage(error) }), [errorNotification])

  const markInProgress = useCallback(
    (taskId: string) => {
      const current = items.find((task) => task.id === taskId)
      if (current && current.itemStatus === 'not-started') {
        updateTask({ updateTaskId: taskId, input: { status: TaskTaskStatus.IN_PROGRESS } }, { onError: notifyUpdateFailure })
      }
    },
    [items, updateTask, notifyUpdateFailure],
  )

  const completeItem = useCallback(
    (taskId: string) => {
      updateTask({ updateTaskId: taskId, input: { status: TaskTaskStatus.COMPLETED } }, { onError: notifyUpdateFailure })
    },
    [updateTask, notifyUpdateFailure],
  )

  return { items, completedCount, totalCount, isComplete, isHydrated, isAwaitingTasks, markInProgress, completeItem }
}
