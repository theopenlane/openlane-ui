'use client'

import { useCallback, useMemo, useState } from 'react'
import type React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { isToday } from 'date-fns'
import { EvidenceEvidenceStatus, NotificationNotificationTopic, OrderDirection, TaskOrderField, TaskTaskStatus } from '@repo/codegen/src/schema'
import type { Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { useTasksWithFilter, useUpdateTask } from '@/lib/graphql-hooks/task'
import { useGetEvidenceListLight } from '@/lib/graphql-hooks/evidence'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useNotification } from '@/hooks/useNotification'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { useRecommendationsFeed } from '@/hooks/useRecommendationsFeed'
import { redirectToNotification } from '@/components/shared/SystemNotification/notification-redirect'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isPastDate } from '@/utils/date'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { firstLineOf } from '@/lib/suggested-tasks/utils'
import { SuggestedTaskSource, type SuggestedTask } from '@/lib/suggested-tasks/types'
import { ALL_FILTER_KEY, FILTER_LABELS, UNCATEGORIZED_KIND, type FilterKey, type GroupBy, type WorkItem, type WorkItemFilter } from './types'

const TASK_WHERE_STATUS_NOT_IN = [TaskTaskStatus.COMPLETED, TaskTaskStatus.WONT_DO]
const TASK_ORDER_BY = [{ field: TaskOrderField.due, direction: OrderDirection.ASC }]
const TASK_KIND_ENUM_WHERE = { objectType: 'task', field: 'kind' }

const dueLabelFor = (due: string | null | undefined): string | null => {
  if (!due) return null
  if (isPastDate(due)) return 'Overdue'
  return isToday(new Date(due)) ? 'Due today' : null
}

export const useWorkItems = () => {
  const router = useRouter()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateTask } = useUpdateTask()
  const { notifications, markAsRead } = useNotificationsContext()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('type')
  const [requestedFilter, setRequestedFilter] = useState<FilterKey>(ALL_FILTER_KEY)

  const { suggestions, isLoading: isFeedLoading, error: feedError, dismissSuggestion } = useRecommendationsFeed()

  const {
    tasks,
    isLoading: isTasksLoading,
    error: tasksError,
  } = useTasksWithFilter({
    where: { assigneeID: userId, statusNotIn: TASK_WHERE_STATUS_NOT_IN },
    orderBy: TASK_ORDER_BY,
    pagination: DEFAULT_PAGINATION,
    enabled: !!userId,
  })

  const { enumOptions: taskKindOptions, error: taskKindError } = useGetCustomTypeEnums({ where: TASK_KIND_ENUM_WHERE })

  const {
    evidences: evidenceRequests,
    isPending: isEvidenceLoading,
    error: evidenceError,
  } = useGetEvidenceListLight({
    where: {
      status: EvidenceEvidenceStatus.REQUESTED,
      hasControlsWith: [{ hasControlOwnerWith: [{ hasMembersWith: [{ userID: userId }] }] }],
    },
    pagination: DEFAULT_PAGINATION,
    enabled: !!userId,
  })

  const approvalNotifications = useMemo(() => notifications.filter((notification) => !notification.readAt && notification.topic === NotificationNotificationTopic.APPROVAL), [notifications])

  const dismissNotification = useCallback((notificationId: string) => markAsRead(notificationId), [markAsRead])

  const openNotification = useCallback((notification: Notification) => redirectToNotification(router, notification), [router])

  const openSuggestion = useCallback(
    (suggestion: SuggestedTask) => {
      if (suggestion.metadata.link) {
        router.push(suggestion.metadata.link)
        return
      }
      setSelectedSuggestionId(suggestion.id)
    },
    [router],
  )

  const completeTask = useCallback(
    async (taskId: string) => {
      try {
        await updateTask({ updateTaskId: taskId, input: { status: TaskTaskStatus.COMPLETED } })
        successNotification({ title: 'Task Updated', description: 'The task has been successfully marked as complete.' })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [updateTask, successNotification, errorNotification],
  )

  const recommendationWorkItems: WorkItem[] = useMemo(() => {
    const suggestionItems = suggestions
      .filter((suggestion) => suggestion.source === SuggestedTaskSource.RECOMMENDATIONS)
      .map((suggestion) => ({
        key: `suggestion-${suggestion.id}`,
        kind: suggestion.taskKind.name,
        kindColor: suggestion.taskKind.color,
        title: suggestion.title,
        preview: firstLineOf(suggestion.details),
        docsLink: suggestion.metadata.docsLink,
        onClick: () => openSuggestion(suggestion),
        actionKind: 'dismiss' as const,
        onAction: (event: React.MouseEvent) => {
          event.stopPropagation()
          dismissSuggestion(suggestion.id)
        },
      }))

    return suggestionItems
  }, [suggestions, openSuggestion, dismissSuggestion])

  const taskWorkItems: WorkItem[] = useMemo(
    () =>
      tasks.map((task) => ({
        key: `task-${task.id}`,
        kind: task.taskKindName || UNCATEGORIZED_KIND,
        kindColor: taskKindOptions.find((option) => option.value === task.taskKindName)?.color,
        title: task.title,
        dueLabel: dueLabelFor(task.due),
        onClick: () => setSelectedTaskId(task.id),
        actionKind: 'complete' as const,
        onAction: (event: React.MouseEvent) => {
          event.stopPropagation()
          completeTask(task.id)
        },
      })),
    [tasks, taskKindOptions, completeTask],
  )

  const kindGroups: [string, WorkItem[]][] = useMemo(() => {
    const byKind = new Map<string, WorkItem[]>()
    ;[...recommendationWorkItems, ...taskWorkItems].forEach((item) => {
      const group = byKind.get(item.kind)
      if (group) {
        group.push(item)
        return
      }
      byKind.set(item.kind, [item])
    })

    return [...byKind.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [recommendationWorkItems, taskWorkItems])

  const availableFilters: WorkItemFilter[] = useMemo(() => {
    const filters: WorkItemFilter[] = [{ key: ALL_FILTER_KEY, label: 'All' }]

    if (groupBy === 'type') {
      if (recommendationWorkItems.length > 0) filters.push({ key: 'recommendations', label: FILTER_LABELS.recommendations })
      if (taskWorkItems.length > 0) filters.push({ key: 'tasks', label: FILTER_LABELS.tasks })
    } else {
      kindGroups.forEach(([kind]) => filters.push({ key: kind, label: kind }))
    }

    if (approvalNotifications.length > 0) filters.push({ key: 'approvals', label: FILTER_LABELS.approvals })
    if (evidenceRequests.length > 0) filters.push({ key: 'evidenceRequests', label: FILTER_LABELS.evidenceRequests })

    return filters
  }, [groupBy, recommendationWorkItems, taskWorkItems, kindGroups, approvalNotifications, evidenceRequests])

  const activeFilter = useMemo(() => (availableFilters.some((filter) => filter.key === requestedFilter) ? requestedFilter : ALL_FILTER_KEY), [availableFilters, requestedFilter])

  const showRecommendations = groupBy === 'type' && (activeFilter === ALL_FILTER_KEY || activeFilter === 'recommendations')
  const showTasks = groupBy === 'type' && (activeFilter === ALL_FILTER_KEY || activeFilter === 'tasks')
  const showApprovals = activeFilter === ALL_FILTER_KEY || activeFilter === 'approvals'
  const showEvidenceRequests = activeFilter === ALL_FILTER_KEY || activeFilter === 'evidenceRequests'

  const visibleKindGroups = useMemo(() => (groupBy === 'kind' ? kindGroups.filter(([kind]) => activeFilter === ALL_FILTER_KEY || activeFilter === kind) : []), [groupBy, kindGroups, activeFilter])

  const isLoading = !userId || isFeedLoading || isTasksLoading || isEvidenceLoading
  const error = feedError ?? tasksError ?? evidenceError ?? taskKindError ?? null

  const hasWorkItems = groupBy === 'type' ? (showRecommendations && recommendationWorkItems.length > 0) || (showTasks && taskWorkItems.length > 0) : visibleKindGroups.length > 0
  const isEmpty = !hasWorkItems && !(showApprovals && approvalNotifications.length > 0) && !(showEvidenceRequests && evidenceRequests.length > 0)

  const selectedSuggestion = useMemo(() => suggestions.find((suggestion) => suggestion.id === selectedSuggestionId) ?? null, [suggestions, selectedSuggestionId])

  return {
    groupBy,
    setGroupBy,
    activeFilter,
    setActiveFilter: setRequestedFilter,
    availableFilters,
    recommendationWorkItems,
    taskWorkItems,
    visibleKindGroups,
    approvalNotifications,
    evidenceRequests,
    showRecommendations,
    showTasks,
    showApprovals,
    showEvidenceRequests,
    isLoading,
    error,
    isEmpty,
    openNotification,
    dismissNotification,
    selectedTaskId,
    clearSelectedTask: () => setSelectedTaskId(null),
    selectedSuggestion,
    clearSelectedSuggestion: () => setSelectedSuggestionId(null),
    dismissSuggestion,
  }
}
