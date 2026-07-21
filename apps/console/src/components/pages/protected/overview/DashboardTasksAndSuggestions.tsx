import { Card, CardContent, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ArrowUpRight, Check, PartyPopper, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@repo/ui/lib/utils'
import { isToday } from 'date-fns'
import { EvidenceEvidenceStatus, NotificationNotificationTopic, OrderDirection, TaskOrderField, TaskTaskStatus } from '@repo/codegen/src/schema'
import { useTasksWithFilter, useUpdateTask } from '@/lib/graphql-hooks/task'
import { useGetEvidenceListLight } from '@/lib/graphql-hooks/evidence'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useNotification } from '@/hooks/useNotification'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { useRecommendationsFeed } from '@/hooks/useRecommendationsFeed'
import { redirectToNotification } from '@/components/shared/SystemNotification/notification-redirect'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { formatTimeSince, isPastDate } from '@/utils/date'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import SuggestedTaskDetailsSheet from '@/components/pages/protected/overview/suggested-task-details-sheet'
import { firstLineOf } from '@/lib/suggested-tasks/utils'
import { SuggestedTaskSource } from '@/lib/suggested-tasks/types'

// In 'type' mode these are the fixed section keys; in 'kind' mode the section key is instead
// whatever kind name a task/suggestion carries (e.g. "Registry", "Policy Review"), which isn't
// known ahead of time
type FilterKey = string
type GroupBy = 'type' | 'kind'

const FILTER_LABELS: Record<'recommendations' | 'tasks' | 'approvals' | 'evidenceRequests', string> = {
  recommendations: 'Recommendations',
  tasks: 'Tasks',
  approvals: 'Approvals',
  evidenceRequests: 'Evidence Requests',
}

// domain scan notifications fold into the "Recommendations" section as work items, grouped
// under this kind so 'kind' mode still has somewhere sensible to bucket them
const SCAN_NOTIFICATION_KIND = { name: 'Domain Scan', color: '#ff842c' }

// A normalized shape both real tasks and suggested tasks map into so 'kind' mode can group and
// render them together regardless of which one they came from.
type WorkItem = {
  id: string
  kind: string
  kindColor?: string
  title: string
  preview?: string
  dueLabel?: string | null
  docsLink?: string
  onClick: () => void
  actionLabel: string
  actionIcon: React.ReactNode
  onAction: (e: React.MouseEvent) => void
}

const DashboardTasksAndSuggestions = () => {
  const router = useRouter()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateTask } = useUpdateTask()
  const { notifications, markAsRead } = useNotificationsContext()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('type')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const { suggestions: recommendations, completedKeys, toggleComplete } = useRecommendationsFeed()
  const visibleSuggestions = recommendations.filter((suggestion) => !completedKeys.includes(suggestion.id))
  const visibleRecommendations = visibleSuggestions.filter((suggestion) => suggestion.source === SuggestedTaskSource.RECOMMENDATIONS)

  // switching how work is grouped invalidates whatever single-section filter was active
  useEffect(() => {
    setActiveFilter('all')
  }, [groupBy])

  const { tasks, isLoading } = useTasksWithFilter({
    where: {
      assigneeID: userId,
      statusNotIn: [TaskTaskStatus.COMPLETED, TaskTaskStatus.WONT_DO],
    },
    orderBy: [{ field: TaskOrderField.due, direction: OrderDirection.ASC }],
    enabled: !!userId,
  })

  const { enumOptions: taskKindOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })

  const { evidences: evidenceRequests } = useGetEvidenceListLight({
    where: {
      status: EvidenceEvidenceStatus.REQUESTED,
      hasControlsWith: [{ hasControlOwnerWith: [{ hasMembersWith: [{ userID: userId ?? '' }] }] }],
    },
    pagination: DEFAULT_PAGINATION,
    enabled: !!userId,
  })

  const scanNotifications = notifications.filter((notification) => !notification.readAt && notification.topic === NotificationNotificationTopic.DOMAIN_SCAN)
  const approvalNotifications = notifications.filter((notification) => !notification.readAt && notification.topic === NotificationNotificationTopic.APPROVAL)

  const handleDismissNotification = (id: string) => {
    markAsRead(id)
  }

  const handleNotificationClick = (notification: (typeof scanNotifications)[number]) => {
    redirectToNotification(router, notification)
  }

  // a suggestion with a link goes straight there; without one, it opens the suggested-task view
  const handleSuggestionClick = (suggestion: (typeof recommendations)[number]) => {
    if (suggestion.metadata.link) {
      router.push(suggestion.metadata.link)
      return
    }
    setSelectedSuggestionId(suggestion.id)
  }

  const handleComplete = async (taskId: string) => {
    try {
      await updateTask({
        updateTaskId: taskId,
        input: { status: TaskTaskStatus.COMPLETED },
      })
      successNotification({
        title: 'Task Updated',
        description: 'The task has been successfully marked as complete.',
      })
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(error),
      })
    }
  }

  const suggestionToWorkItem = (suggestion: (typeof recommendations)[number]): WorkItem => ({
    id: suggestion.id,
    kind: suggestion.taskKind.name,
    kindColor: suggestion.taskKind.color,
    title: suggestion.title,
    preview: firstLineOf(suggestion.details),
    docsLink: suggestion.metadata.docsLink,
    onClick: () => handleSuggestionClick(suggestion),
    actionLabel: 'Dismiss',
    actionIcon: <X />,
    onAction: (e) => {
      e.stopPropagation()
      toggleComplete(suggestion.id)
    },
  })

  const scanNotificationToWorkItem = (notification: (typeof scanNotifications)[number]): WorkItem => ({
    id: notification.id,
    kind: SCAN_NOTIFICATION_KIND.name,
    kindColor: SCAN_NOTIFICATION_KIND.color,
    title: notification.title,
    preview: notification.body,
    onClick: () => handleNotificationClick(notification),
    actionLabel: 'Dismiss',
    actionIcon: <X />,
    onAction: (e) => {
      e.stopPropagation()
      handleDismissNotification(notification.id)
    },
  })

  const taskToWorkItem = (task: (typeof tasks)[number]): WorkItem => {
    const dueLabel = task.due ? (isPastDate(task.due) ? 'Overdue' : isToday(new Date(task.due)) ? 'Due today' : null) : null
    return {
      id: task.id,
      kind: task.taskKindName && task.taskKindName !== 'Uncategorized' ? task.taskKindName : 'Uncategorized',
      kindColor: taskKindOptions.find((option) => option.value === task.taskKindName)?.color,
      title: task.title,
      dueLabel,
      onClick: () => setSelectedTaskId(task.id),
      actionLabel: 'Mark as complete',
      actionIcon: <Check />,
      onAction: (e) => {
        e.stopPropagation()
        handleComplete(task.id as string)
      },
    }
  }

  // completed domain scans lead the Recommendations list -- they're time-sensitive and the
  // section already renders ahead of Tasks, so this keeps them the first thing a user sees
  const recommendationWorkItems = [...scanNotifications.map(scanNotificationToWorkItem), ...visibleRecommendations.map(suggestionToWorkItem)]
  const taskWorkItems = tasks.map(taskToWorkItem)

  // 'kind' mode mixes tasks and suggestions together, grouped by the kind they share, instead of
  // by which surface (recommendations, tasks) they came from
  const kindGroups: [string, WorkItem[]][] = []
  ;[...recommendationWorkItems, ...taskWorkItems].forEach((item) => {
    const existing = kindGroups.find(([kind]) => kind === item.kind)
    if (existing) {
      existing[1].push(item)
    } else {
      kindGroups.push([item.kind, [item]])
    }
  })
  kindGroups.sort(([a], [b]) => a.localeCompare(b))

  const showRecommendations = groupBy === 'type' && (activeFilter === 'all' || activeFilter === 'recommendations')
  const showTasks = groupBy === 'type' && (activeFilter === 'all' || activeFilter === 'tasks')
  const showApprovals = activeFilter === 'all' || activeFilter === 'approvals'
  const showEvidenceRequests = activeFilter === 'all' || activeFilter === 'evidenceRequests'

  const visibleKindGroups = groupBy === 'kind' ? kindGroups.filter(([kind]) => activeFilter === 'all' || activeFilter === kind) : []

  const isEmpty =
    (groupBy === 'type' ? (!showRecommendations || recommendationWorkItems.length === 0) && (!showTasks || (!isLoading && tasks.length === 0)) : visibleKindGroups.length === 0) &&
    (!showApprovals || approvalNotifications.length === 0) &&
    (!showEvidenceRequests || evidenceRequests.length === 0)

  const availableFilters: { key: FilterKey; label: string }[] = [{ key: 'all', label: 'All' }]
  if (groupBy === 'type') {
    if (recommendationWorkItems.length > 0) availableFilters.push({ key: 'recommendations', label: FILTER_LABELS.recommendations })
    if (tasks.length > 0) availableFilters.push({ key: 'tasks', label: FILTER_LABELS.tasks })
  } else {
    kindGroups.forEach(([kind]) => availableFilters.push({ key: kind, label: kind }))
  }
  if (approvalNotifications.length > 0) availableFilters.push({ key: 'approvals', label: FILTER_LABELS.approvals })
  if (evidenceRequests.length > 0) availableFilters.push({ key: 'evidenceRequests', label: FILTER_LABELS.evidenceRequests })

  // joined into a primitive so the effect only re-runs when the actual set of keys changes,
  // rather than on every render (availableFilters is a fresh array each time)
  const availableFilterKeys = availableFilters.map((filter) => filter.key).join('|')

  useEffect(() => {
    if (activeFilter !== 'all' && !availableFilterKeys.split('|').includes(activeFilter)) {
      setActiveFilter('all')
    }
  }, [activeFilter, availableFilterKeys])

  const renderWorkItem = (item: WorkItem, showKindLabel = false) => (
    <div
      key={item.id}
      className="flex items-center justify-between gap-3 rounded-lg border border-homepage-card-border bg-homepage-card-item-transparent p-3 cursor-pointer hover:border-muted-foreground transition-colors duration-200"
      style={item.kindColor ? { borderLeftColor: item.kindColor, borderLeftWidth: 3 } : undefined}
      onClick={item.onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {showKindLabel && item.kind !== 'Uncategorized' && <span className="text-xs font-normal uppercase tracking-wider text-muted-foreground">{item.kind}: </span>}
          {item.title}
        </p>
        {item.preview && <p className="text-xs text-muted-foreground truncate">{item.preview}</p>}
      </div>
      {item.dueLabel && <Badge variant={item.dueLabel === 'Overdue' ? 'destructive' : 'blue'}>{item.dueLabel}</Badge>}
      {item.docsLink && (
        <Button
          variant="secondary"
          icon={<ArrowUpRight />}
          iconPosition="left"
          className="h-8 !px-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            window.open(item.docsLink, '_blank', 'noopener,noreferrer')
          }}
        >
          Docs
        </Button>
      )}
      <Button variant="secondary" icon={item.actionIcon} iconPosition="left" className="h-8 !px-2 shrink-0" onClick={item.onAction}>
        {item.actionLabel}
      </Button>
    </div>
  )

  const renderSection = (key: string, label: string, items: WorkItem[], showKindLabel = false) => {
    if (items.length === 0) return null

    return (
      <div className="space-y-3" key={key}>
        {activeFilter === 'all' && (
          <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
            <Badge variant="secondary">{items.length}</Badge>
          </p>
        )}
        {items.map((item) => renderWorkItem(item, showKindLabel))}
      </div>
    )
  }

  return (
    <Card className="bg-homepage-card border-homepage-card-border h-full">
      <CardTitle className="px-6 pt-6 pb-0 text-lg font-semibold">Your Work</CardTitle>
      <CardDescription className="pt-1 pb-3">Tasks, recommendations, evidence requests, and notifications that need your attention</CardDescription>

      {!isEmpty && (
        <div className="px-6 pb-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {availableFilters.map((filter) => (
              <Button key={filter.key} size="sm" variant="tag" className={cn('font-normal', activeFilter === filter.key && 'is-active')} onClick={() => setActiveFilter(filter.key)}>
                {filter.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            Group by
            <Button size="sm" variant="tag" className={cn('font-normal', groupBy === 'type' && 'is-active')} onClick={() => setGroupBy('type')}>
              Type
            </Button>
            <Button size="sm" variant="tag" className={cn('font-normal', groupBy === 'kind' && 'is-active')} onClick={() => setGroupBy('kind')}>
              Kind
            </Button>
          </div>
        </div>
      )}

      <CardContent className="px-6 pb-6 pt-4 space-y-5">
        {groupBy === 'type' ? (
          <>
            {showRecommendations && renderSection('recommendations', FILTER_LABELS.recommendations, recommendationWorkItems)}
            {showTasks && renderSection('tasks', FILTER_LABELS.tasks, taskWorkItems, true)}
          </>
        ) : (
          visibleKindGroups.map(([kind, items]) => renderSection(kind, kind, items))
        )}

        {showApprovals && approvalNotifications.length > 0 && (
          <div className="space-y-1">
            {activeFilter === 'all' && (
              <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Approvals
                <Badge variant="secondary">{approvalNotifications.length}</Badge>
              </p>
            )}
            <div className="space-y-3">
              {approvalNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-homepage-card-border bg-homepage-card-item-transparent p-3 cursor-pointer hover:border-muted-foreground transition-colors duration-200"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notification.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeSince(notification.createdAt)}</span>
                  <Button
                    variant="secondary"
                    icon={<X />}
                    iconPosition="left"
                    className="h-8 !px-2 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismissNotification(notification.id)
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showEvidenceRequests && evidenceRequests.length > 0 && (
          <div className="space-y-3">
            {activeFilter === 'all' && (
              <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Evidence Requests
                <Badge variant="secondary">{evidenceRequests.length}</Badge>
              </p>
            )}
            <div className="space-y-3">
              {evidenceRequests.map((evidence) => {
                const controlRefCodes = evidence.controls?.edges?.map((edge) => edge?.node?.refCode).filter((refCode): refCode is string => !!refCode)
                // a control-linked request opens that control's evidence slideout directly;
                // only fall back to the standalone evidence view when nothing links it to a control
                const linkedControlId = evidence.controls?.edges?.[0]?.node?.id
                const href = linkedControlId ? `/controls/${linkedControlId}?controlEvidenceId=${evidence.id}` : `/evidence?id=${evidence.id}`

                return (
                  <div
                    key={evidence.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-homepage-card-border bg-homepage-card-item-transparent p-3 cursor-pointer hover:border-muted-foreground transition-colors duration-200"
                    onClick={() => router.push(href)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{evidence.name}</p>
                      {controlRefCodes && controlRefCodes.length > 0 && <p className="text-xs text-muted-foreground truncate">Requested for {controlRefCodes.join(', ')}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <PartyPopper className="text-homepage-action-icon" size={20} />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        )}
      </CardContent>

      <TaskDetailsSheet entityId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      <SuggestedTaskDetailsSheet
        task={recommendations.find((suggestion) => suggestion.id === selectedSuggestionId) ?? null}
        onClose={() => setSelectedSuggestionId(null)}
        onComplete={toggleComplete}
      />
    </Card>
  )
}

export default DashboardTasksAndSuggestions
