'use client'

import React from 'react'
import { Check, Circle } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import type { SetupChecklistItem, SetupChecklistItemStatus } from '@/hooks/useSetupChecklist'

export const SETUP_CHECKLIST_STATUS: Record<SetupChecklistItemStatus, { label: string; labelClass: string; markerClass: string; order: number }> = {
  done: { label: 'Done', labelClass: 'text-success', markerClass: 'border-success bg-success text-white', order: 0 },
  'in-progress': { label: 'Continue', labelClass: 'text-info', markerClass: 'border-info', order: 1 },
  'not-started': { label: 'Start', labelClass: 'text-muted-foreground', markerClass: 'border-border hover:border-muted-foreground', order: 2 },
}

const StatusMarker = ({ status }: { status: SetupChecklistItemStatus }) => {
  if (status === 'done') return <Check size={12} />
  if (status === 'in-progress') return <span className="h-2 w-2 rounded-full bg-info" />
  return <Circle size={8} className="fill-current text-muted-foreground" />
}

type SetupChecklistItemCardProps = {
  task: SetupChecklistItem
  onOpen: (task: SetupChecklistItem) => void
  onToggleDone: (taskId: string) => void
}

const SetupChecklistItemCard = ({ task, onOpen, onToggleDone }: SetupChecklistItemCardProps) => {
  const status = SETUP_CHECKLIST_STATUS[task.itemStatus]

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={task.title}
      className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-lg border border-homepage-card-border bg-homepage-card-item-transparent px-4 py-3 transition-colors duration-200 hover:border-muted-foreground focus-visible:border-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onOpen(task)
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={task.itemStatus === 'done' ? 'Mark as not started' : 'Mark as complete'}
          className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors', status.markerClass)}
          onClick={(event) => {
            event.stopPropagation()
            onToggleDone(task.id)
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <StatusMarker status={task.itemStatus} />
        </button>
        <span className={cn('text-xs font-medium', status.labelClass)}>{status.label}</span>
      </div>
      <div className="min-w-0">
        <p className="pb-1 text-sm font-medium">{task.title}</p>
        {task.details && <p className="line-clamp-3 text-xs text-muted-foreground">{task.details}</p>}
      </div>
    </div>
  )
}

export default SetupChecklistItemCard
