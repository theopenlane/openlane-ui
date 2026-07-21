'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Circle, FileText, Headset } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { SUPPORT_URL } from '@/constants'
import { DOCS_URL } from '@/constants/docs.ts'
import type { useSetupChecklist, SetupChecklistItem, SetupChecklistItemStatus } from '@/hooks/useSetupChecklist'

const STATUS_LABEL: Record<SetupChecklistItemStatus, string> = {
  done: 'Done',
  'in-progress': 'Continue',
  'not-started': 'Start',
}

const STATUS_LABEL_CLASS: Record<SetupChecklistItemStatus, string> = {
  done: 'text-success',
  'in-progress': 'text-info',
  'not-started': 'text-muted-foreground',
}

const STATUS_SORT_ORDER: Record<SetupChecklistItemStatus, number> = {
  done: 0,
  'in-progress': 1,
  'not-started': 2,
}

type DashboardSetupChecklistProps = Pick<ReturnType<typeof useSetupChecklist>, 'items' | 'completedCount' | 'markInProgress' | 'toggleDone'>

// the checklist's items/statuses are lifted into DashboardPage (see useSetupChecklist there) so
// toggling a task here and swapping DashboardComplianceOverview in once everything's done share
// the same state instead of drifting until a refresh re-reads localStorage in each separately
const DashboardSetupChecklist = ({ items, completedCount, markInProgress, toggleDone }: DashboardSetupChecklistProps) => {
  const router = useRouter()

  const [sortedOrder, setSortedOrder] = useState<string[] | null>(null)
  useEffect(() => {
    if (sortedOrder === null && items.length > 0) {
      setSortedOrder([...items].sort((a, b) => STATUS_SORT_ORDER[a.itemStatus] - STATUS_SORT_ORDER[b.itemStatus]).map((task) => task.id))
    }
  }, [items, sortedOrder])

  const orderedItems = useMemo(() => {
    if (!sortedOrder) return items
    const byId = new Map(items.map((task) => [task.id, task]))
    const known = sortedOrder.map((id) => byId.get(id)).filter((task): task is SetupChecklistItem => !!task)
    const unknown = items.filter((task) => !sortedOrder.includes(task.id))
    return [...known, ...unknown]
  }, [items, sortedOrder])

  if (items.length === 0) {
    return null
  }

  const progress = Math.round((completedCount / items.length) * 100)

  const handleItemClick = (task: SetupChecklistItem) => {
    markInProgress(task.id)
    if (task.metadata.link) {
      router.push(task.metadata.link)
    }
  }

  return (
    <Card className="bg-homepage-card border-homepage-card-border">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row">
        <div className="flex shrink-0 flex-col gap-3 md:w-64">
          <div>
            <p className="text-lg font-semibold">Finish Setup</p>
            <p className="text-sm font-medium text-success">
              {completedCount} of {items.length} completed
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">Complete these tasks to get the most out of Openlane</p>
          <div className="flex gap-2">
            <a href={DOCS_URL} target="_blank" rel="noreferrer" aria-label="View Documentation" className="flex-1">
              <Button type="button" variant="secondary" icon={<FileText size={14} />} iconPosition="left" className="w-full">
                View Docs
              </Button>
            </a>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" aria-label="Contact Support" className="flex-1">
              <Button type="button" variant="secondary" icon={<Headset size={14} />} iconPosition="left" className="w-full">
                Contact Us
              </Button>
            </a>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          {orderedItems.map((task) => (
            <div
              key={task.id}
              className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-lg border border-homepage-card-border bg-homepage-card-item-transparent px-4 py-3 transition-colors duration-200 hover:border-muted-foreground"
              onClick={() => handleItemClick(task)}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label={task.itemStatus === 'done' ? 'Mark as not started' : 'Mark as complete'}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                    task.itemStatus === 'done' ? 'border-success bg-success text-white' : task.itemStatus === 'in-progress' ? 'border-info' : 'border-border hover:border-muted-foreground',
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDone(task.id)
                  }}
                >
                  {task.itemStatus === 'done' ? (
                    <Check size={12} />
                  ) : task.itemStatus === 'in-progress' ? (
                    <span className="h-2 w-2 rounded-full bg-info" />
                  ) : (
                    <Circle size={8} className="fill-current text-muted-foreground" />
                  )}
                </button>
                <span className={cn('text-xs font-medium', STATUS_LABEL_CLASS[task.itemStatus])}>{STATUS_LABEL[task.itemStatus]}</span>
              </div>
              <div className="min-w-0">
                <p className="pb-1 text-sm font-medium">{task.title}</p>
                {task.details && <p className="line-clamp-3 text-xs text-muted-foreground">{task.details}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardSetupChecklist
