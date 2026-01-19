import { formatTimeSince } from '@/utils/date'
import { cn } from '@repo/ui/lib/utils'
import React from 'react'

import { ShieldCheck, Fingerprint, AlertTriangle, FileCheck, NotebookPen, AlertCircleIcon, ListChecks, ScrollText, Download } from 'lucide-react'
import { Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { GetExportsQueryNode } from '@/lib/graphql-hooks/export'

interface ExportRowProps {
  notification: Notification
  exportData: GetExportsQueryNode | undefined | null
}

export const ExportRow = ({ notification, exportData }: ExportRowProps) => {
  const isUnread = true

  return (
    <div className={cn('flex items-center gap-3 py-2 cursor-pointer transition-colors hover:bg-accent/50 px-1 rounded-md justify-center', isUnread && 'bg-accent/20')}>
      <div className="relative">
        <NotificationIcon objectType={notification.objectType} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-sm font-medium', isUnread && 'font-semibold')}>{notification.title}</div>
        <div className="truncate text-xs text-muted-foreground">{notification.body}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] text-muted-foreground">{formatTimeSince(new Date().toISOString())}</span>
        <a
          href={exportData?.files.edges?.[0]?.node?.presignedURL || '#'}
          target="_blank"
          rel="noreferrer"
          className="hover:bg-table-row-bg-hover inline-flex items-center gap-2 text-sm bg-panel-bg rounded-md border px-2 py-1 font-bold hover:bg-panel-bg/80 transition"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </a>
      </div>
      {isUnread && <div className="h-1.5 w-1.5 rounded-full bg-primary " />}
    </div>
  )
}

const getNotificationIconData = (objectType: string) => {
  switch (objectType) {
    case 'Program':
      return { icon: ShieldCheck, colorVar: 'var(--color-notifications-programs)' }
    case 'Task':
      return { icon: ListChecks, colorVar: 'var(--color-notifications-tasks)' }
    case 'Risk':
      return { icon: AlertTriangle, colorVar: 'var(--color-notifications-risks)' }
    case 'Procedure':
      return { icon: FileCheck, colorVar: 'var(--color-notifications-procedures)' }
    case 'Questionnaire':
      return { icon: NotebookPen, colorVar: 'var(--color-notifications-questionnaires)' }
    case 'Evidence':
      return { icon: Fingerprint, colorVar: 'var(--color-notifications-evidence)' }
    case 'Internal Policy':
      return { icon: ScrollText, colorVar: 'var(--color-notifications-policies)' }
    default:
      return { icon: AlertCircleIcon, colorVar: '#94a3b8' }
  }
}

const NotificationIcon = ({ objectType }: { objectType: string }) => {
  const { icon: Icon, colorVar } = getNotificationIconData(objectType)

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${colorVar}, transparent 80%)` }}>
      <Icon size={14} style={{ color: colorVar }} />
    </div>
  )
}
