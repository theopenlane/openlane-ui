'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NotificationNotificationTopic, TaskTaskStatus } from '@repo/codegen/src/schema'
import { useOrganization } from '@/hooks/useOrganization'
import { useNotification } from '@/hooks/useNotification'
import { useRecommendationsFeed } from '@/hooks/useRecommendationsFeed'
import { type Notification } from '@/lib/graphql-hooks/notifications'
import { useUpdateTask } from '@/lib/graphql-hooks/task'
import { clearOnboardingTasksPending, getOnboardingTasksPending } from '@/lib/storage/onboarding-tasks-pending'
import { isTerminalTaskStatus, SuggestedTaskSource, type SuggestedTask } from '@/lib/suggested-tasks/types'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export type SetupChecklistItemStatus = 'done' | 'in-progress' | 'not-started'

export type SetupChecklistItem = SuggestedTask & { itemStatus: SetupChecklistItemStatus }

const ONBOARDING_TASKS_WAIT_MS = 30000
const SETUP_CHECKLIST_BATCH_SCHEMA = 'organization'

type SuggestedTasksNotificationData = { schema?: string }

const suggestedTasksBatchSchema = (notification: Notification): string | undefined => {
  const data = notification.data as SuggestedTasksNotificationData | null | undefined
  return data?.schema
}

const itemStatusFromTaskStatus = (status: TaskTaskStatus): SetupChecklistItemStatus => {
  if (isTerminalTaskStatus(status)) return 'done'
  if (status === TaskTaskStatus.IN_PROGRESS || status === TaskTaskStatus.IN_REVIEW) return 'in-progress'
  return 'not-started'
}

export const useSetupChecklist = () => {
  const { currentOrgId } = useOrganization()
  const queryClient = useQueryClient()
  const { addNewNotificationListener } = useNotificationsContext()
  const { mutate: updateTask } = useUpdateTask()
  const { errorNotification } = useNotification()
  const [isAwaitingGeneration, setIsAwaitingGeneration] = useState(false)

  useEffect(() => {
    setIsAwaitingGeneration(getOnboardingTasksPending(currentOrgId))
  }, [currentOrgId])

  const { suggestions, isLoading: isFeedLoading } = useRecommendationsFeed({ source: SuggestedTaskSource.ONBOARDING })

  const isHydrated = !isFeedLoading
  const totalCount = suggestions.length
  const isAwaitingTasks = isAwaitingGeneration && totalCount === 0

  const { items, completedCount } = useMemo(() => {
    const all: SetupChecklistItem[] = suggestions.map((task) => ({ ...task, itemStatus: itemStatusFromTaskStatus(task.status) }))
    return { items: all, completedCount: all.filter((task) => task.itemStatus === 'done').length }
  }, [suggestions])

  useEffect(() => {
    return addNewNotificationListener((notification) => {
      if (notification.topic !== NotificationNotificationTopic.ORGANIZATION_READY) return
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (suggestedTasksBatchSchema(notification) === SETUP_CHECKLIST_BATCH_SCHEMA) {
        clearOnboardingTasksPending(currentOrgId)
        setIsAwaitingGeneration(false)
      }
    })
  }, [addNewNotificationListener, queryClient, currentOrgId])

  useEffect(() => {
    if (isAwaitingGeneration && totalCount > 0) {
      clearOnboardingTasksPending(currentOrgId)
    }
  }, [isAwaitingGeneration, totalCount, currentOrgId])

  useEffect(() => {
    if (!isAwaitingGeneration) return
    const timer = setTimeout(() => {
      clearOnboardingTasksPending(currentOrgId)
      setIsAwaitingGeneration(false)
    }, ONBOARDING_TASKS_WAIT_MS)
    return () => clearTimeout(timer)
  }, [isAwaitingGeneration, currentOrgId])

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
