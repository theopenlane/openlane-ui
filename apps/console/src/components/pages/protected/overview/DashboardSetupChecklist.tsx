'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Headset } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { useOrganization } from '@/hooks/useOrganization'
import type { SetupChecklistItem } from '@/hooks/useSetupChecklist'
import { SUPPORT_URL } from '@/constants'
import { DOCS_URL } from '@/constants/docs.ts'
import SetupChecklistItemCard, { SETUP_CHECKLIST_STATUS } from './setup-checklist-item'

const helpLinks = [
  { key: 'docs', label: 'View Docs', icon: <FileText size={14} className="text-muted-foreground" />, href: DOCS_URL },
  { key: 'support', label: 'Contact Us', icon: <Headset size={14} className="text-muted-foreground" />, href: SUPPORT_URL },
]

export type SetupChecklistProps = {
  items: SetupChecklistItem[]
  completedCount: number
  totalCount: number
  markInProgress: (taskId: string) => void
  completeItem: (taskId: string) => void
}

type OrderedIds = {
  organizationId?: string
  ids: string[]
}

const DashboardSetupChecklist = ({ items, completedCount, totalCount, markInProgress, completeItem }: SetupChecklistProps) => {
  const router = useRouter()
  const { currentOrgId } = useOrganization()
  const [initialOrder, setInitialOrder] = useState<OrderedIds | null>(null)

  useEffect(() => {
    if (items.length === 0) return
    if (initialOrder && initialOrder.organizationId === currentOrgId) return

    setInitialOrder({
      organizationId: currentOrgId,
      ids: [...items].sort((a, b) => SETUP_CHECKLIST_STATUS[a.itemStatus].order - SETUP_CHECKLIST_STATUS[b.itemStatus].order).map((task) => task.id),
    })
  }, [items, initialOrder, currentOrgId])

  const orderedItems = useMemo(() => {
    if (!initialOrder || initialOrder.organizationId !== currentOrgId) return items

    const byId = new Map(items.map((task) => [task.id, task]))
    const orderedIds = new Set(initialOrder.ids)
    const known = initialOrder.ids.map((id) => byId.get(id)).filter((task): task is SetupChecklistItem => !!task)
    const added = items.filter((task) => !orderedIds.has(task.id))

    return [...known, ...added]
  }, [items, initialOrder, currentOrgId])

  if (totalCount === 0) return null

  const progress = Math.round((completedCount / totalCount) * 100)

  const handleOpen = (task: SetupChecklistItem) => {
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
              {completedCount} of {totalCount} completed
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">Complete these tasks to get the most out of Openlane</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            {helpLinks.map((link) => (
              <a key={link.key} href={link.href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-text-paragraph hover:text-muted-foreground transition-colors">
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          {orderedItems.map((task) => (
            <SetupChecklistItemCard key={task.id} task={task} onOpen={handleOpen} onComplete={completeItem} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardSetupChecklist
