'use client'

import React, { useState, useMemo } from 'react'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { NotificationNotificationTopic } from '@repo/codegen/src/schema'
import { NotificationRow } from '@/components/shared/SystemNotification/notification-row'
import { ExportRow } from '@/components/shared/SystemNotification/export-row'
import { useGetAllExports } from '@/lib/graphql-hooks/export'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/button'
import { isToday, isYesterday, format, startOfDay } from 'date-fns'

const PAGE_SIZE = 20

const TOPIC_LABELS: Record<NotificationNotificationTopic, string> = {
  [NotificationNotificationTopic.APPROVAL]: 'Approval',
  [NotificationNotificationTopic.DOMAIN_SCAN]: 'Domain Scan',
  [NotificationNotificationTopic.EXPORT]: 'Export',
  [NotificationNotificationTopic.MENTION]: 'Mention',
  [NotificationNotificationTopic.STANDARD_UPDATE]: 'Standard Update',
  [NotificationNotificationTopic.TASK_ASSIGNMENT]: 'Task Assignment',
}

type TopicFilter = NotificationNotificationTopic | 'ALL'

const getDateGroupLabel = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Earlier'
  const date = new Date(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(startOfDay(date), 'MMMM yyyy')
}

const groupByDate = <T extends { createdAt?: string | null }>(items: T[]): { label: string; items: T[] }[] => {
  const groups: Map<string, T[]> = new Map()

  for (const item of items) {
    const label = getDateGroupLabel(item.createdAt)
    if (!groups.has(label)) groups.set(label, [])
    const group = groups.get(label)
    if (group) group.push(item)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotificationsContext()
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('ALL')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const exportIDs = notifications.flatMap((n) => {
    if (n.topic === NotificationNotificationTopic.EXPORT && n.data?.export_id) {
      return [n.data.export_id as string]
    }
    return []
  })

  const { data: exportData } = useGetAllExports({ where: { idIn: exportIDs } })

  const filteredNotifications = useMemo(() => {
    const sorted = [...notifications].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    return sorted.filter((n) => {
      if (showUnreadOnly && n.readAt) return false
      if (topicFilter !== 'ALL' && n.topic !== topicFilter) return false
      return true
    })
  }, [notifications, topicFilter, showUnreadOnly])

  const visibleNotifications = filteredNotifications.slice(0, visibleCount)
  const hasMore = filteredNotifications.length > visibleCount
  const grouped = groupByDate(visibleNotifications)

  const unreadCount = useMemo(() => notifications.filter((n) => !n.readAt).length, [notifications])

  const handleTopicChange = (topic: TopicFilter) => {
    setTopicFilter(topic)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="max-w-250 mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>

        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}

          <div className="flex items-center rounded-lg bg-secondary p-0.5 gap-0.5">
            <button
              onClick={() => setShowUnreadOnly(false)}
              className={cn('px-4 py-1.5 text-sm font-medium rounded-md transition-colors', !showUnreadOnly ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              All
            </button>
            <button
              onClick={() => setShowUnreadOnly(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                showUnreadOnly ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Unread
              {unreadCount > 0 && <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">{unreadCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        <aside className="w-44 shrink-0 flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Filters</p>

          <FilterItem label="All" active={topicFilter === 'ALL'} onClick={() => handleTopicChange('ALL')} />

          {Object.values(NotificationNotificationTopic).map((topic) => (
            <FilterItem key={topic} label={TOPIC_LABELS[topic]} active={topicFilter === topic} onClick={() => handleTopicChange(topic)} />
          ))}
        </aside>

        <div className="flex-1 min-w-0">
          {visibleNotifications.length === 0 ? (
            <EmptyState showUnreadOnly={showUnreadOnly} topicFilter={topicFilter} />
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map(({ label, items }) => (
                <div key={label} className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">{label}</p>
                  {items.map((n) =>
                    exportIDs.includes(n.data?.export_id) ? (
                      <ExportRow key={n.id} notification={n} exportData={exportData?.exports.edges?.find((e) => e?.node?.id === n.data?.export_id)?.node} onRead={markAsRead} />
                    ) : (
                      <NotificationRow key={n.id} notification={n} onRead={markAsRead} />
                    ),
                  )}
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
                    Show more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
interface FilterItemProps {
  label: string
  active: boolean
  onClick: () => void
}

const FilterItem = ({ label, active, onClick }: FilterItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm transition-colors text-left',
      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
    )}
  >
    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', active ? 'bg-primary' : 'bg-transparent border border-muted-foreground/40')} />
    {label}
  </button>
)

const EmptyState = ({ showUnreadOnly, topicFilter }: { showUnreadOnly: boolean; topicFilter: TopicFilter }) => {
  const message = showUnreadOnly
    ? 'No unread notifications'
    : topicFilter !== 'ALL'
      ? `No ${TOPIC_LABELS[topicFilter as NotificationNotificationTopic]?.toLowerCase()} notifications`
      : 'All caught up!'
  const sub = showUnreadOnly ? "You're all caught up." : topicFilter !== 'ALL' ? 'Nothing here yet.' : 'No new notifications at the moment.'

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-3 rounded-full bg-muted p-3">
        <Bell className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}
