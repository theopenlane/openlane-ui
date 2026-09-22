'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { activatable } from '@repo/ui/lib/a11y'
import { cn } from '@repo/ui/lib/utils'
import type { SetupChecklistItem, SetupChecklistItemStatus } from '@/hooks/useSetupChecklist'

type SetupChecklistStatusMeta = { label: string; labelClass: string; markerClass: string; markerActionClass?: string; order: number }

export const SETUP_CHECKLIST_STATUS: Record<SetupChecklistItemStatus, SetupChecklistStatusMeta> = {
  done: { label: 'Done', labelClass: 'text-success', markerClass: 'border-success bg-success text-white', order: 0 },
  'in-progress': {
    label: 'Continue',
    labelClass: 'text-info',
    markerClass: 'border-info',
    markerActionClass: 'hover:border-info hover:bg-info hover:text-white focus-visible:border-info focus-visible:bg-info focus-visible:text-white',
    order: 1,
  },
  'not-started': {
    label: 'Start',
    labelClass: 'text-muted-foreground',
    markerClass: 'border-border',
    markerActionClass:
      'hover:border-muted-foreground hover:bg-muted-foreground hover:text-background focus-visible:border-muted-foreground focus-visible:bg-muted-foreground focus-visible:text-background',
    order: 2,
  },
}

const MARKER_BASE = 'group/marker flex h-5 w-5 shrink-0 items-center justify-center gap-0 rounded-full border p-0 transition-colors duration-200'
const MARKER_CHECK = 'size-3!'

const StatusGlyph = ({ status, className }: { status: SetupChecklistItemStatus; className?: string }) => {
  if (status === 'done') return <Check className={cn(MARKER_CHECK, className)} />
  return <span className={cn('h-2 w-2 rounded-full', status === 'in-progress' ? 'bg-info' : 'bg-muted-foreground', className)} />
}

type SetupChecklistItemCardProps = {
  task: SetupChecklistItem
  onOpen: (task: SetupChecklistItem) => void
  onComplete: (taskId: string) => void
}

const SetupChecklistItemCard = ({ task, onOpen, onComplete }: SetupChecklistItemCardProps) => {
  const status = SETUP_CHECKLIST_STATUS[task.itemStatus]
  const isDone = task.itemStatus === 'done'

  return (
    <div
      aria-label={task.title}
      className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-lg border border-homepage-card-border bg-homepage-card-item-transparent px-4 py-3 transition-colors duration-200 hover:border-muted-foreground focus-visible:border-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      {...activatable(() => onOpen(task))}
    >
      <div className="flex items-center justify-between gap-2">
        {isDone ? (
          <span className={cn(MARKER_BASE, status.markerClass)}>
            <StatusGlyph status={task.itemStatus} />
          </span>
        ) : (
          <Button
            type="button"
            variant="icon"
            descriptiveTooltipText="Mark complete"
            className={cn(MARKER_BASE, status.markerClass, status.markerActionClass)}
            onClick={(event) => {
              event.stopPropagation()
              onComplete(task.id)
            }}
          >
            <StatusGlyph status={task.itemStatus} className="group-hover/marker:hidden group-focus-visible/marker:hidden" />
            <Check className={cn(MARKER_CHECK, 'hidden group-hover/marker:block group-focus-visible/marker:block')} />
          </Button>
        )}
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
