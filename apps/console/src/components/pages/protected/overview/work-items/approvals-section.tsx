import React from 'react'
import { Button } from '@repo/ui/button'
import { X } from 'lucide-react'
import type { Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { formatTimeSince } from '@/utils/date'
import { FILTER_LABELS, WORK_ITEM_ROW_CLASS } from './types'
import SectionHeader from './section-header'

type ApprovalsSectionProps = {
  notifications: Notification[]
  showHeader: boolean
  onOpen: (notification: Notification) => void
  onDismiss: (notificationId: string) => void
}

const ApprovalsSection = ({ notifications, showHeader, onOpen, onDismiss }: ApprovalsSectionProps) => {
  if (notifications.length === 0) return null

  return (
    <div className="space-y-3">
      {showHeader && <SectionHeader label={FILTER_LABELS.approvals} count={notifications.length} />}
      {notifications.map((notification) => (
        <div key={`notification-${notification.id}`} className={WORK_ITEM_ROW_CLASS} onClick={() => onOpen(notification)}>
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
            onClick={(event) => {
              event.stopPropagation()
              onDismiss(notification.id)
            }}
          >
            Dismiss
          </Button>
        </div>
      ))}
    </div>
  )
}

export default ApprovalsSection
