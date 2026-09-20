'use client'

import React, { useMemo } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { type TWorkItem } from './work-item'
import { OverdueBadge, WorkItemLink, WorkOwnerCell, WorkTypeChip } from './work-cells'
import { WORK_STATUS_DOT_CLASS, WORK_STATUS_ORDER, type WorkStatus } from './work-status'

type TProgramWorkBoardProps = {
  items: TWorkItem[]
  statuses: WorkStatus[]
  isLoading: boolean
}

const WorkBoardCard = ({ item }: { item: TWorkItem }) => (
  <Card className="w-full p-4 space-y-3">
    <div className="space-y-1">
      <div className="break-words">
        <WorkItemLink item={item} />
      </div>
      {item.secondary && <p className="text-sm text-muted-foreground break-words">{item.secondary}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <WorkTypeChip objectType={item.objectType} />
      {item.isOverdue && <OverdueBadge />}
    </div>
    <WorkOwnerCell owners={item.owners} />
  </Card>
)

const ProgramWorkBoard = ({ items, statuses, isLoading }: TProgramWorkBoardProps) => {
  const orderedStatuses = useMemo(() => WORK_STATUS_ORDER.filter((status) => statuses.includes(status)), [statuses])

  const itemsByStatus = useMemo(() => {
    const grouped = new Map<WorkStatus, TWorkItem[]>(orderedStatuses.map((status) => [status, []]))
    items.forEach((item) => grouped.get(item.workStatus)?.push(item))
    return grouped
  }, [items, orderedStatuses])

  if (isLoading) {
    return <SkeletonRows count={1} height={320} />
  }

  if (orderedStatuses.length === 0) {
    return <p className="text-sm text-muted-foreground">No statuses match the current filters.</p>
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-start">
      {orderedStatuses.map((status) => {
        const columnItems = itemsByStatus.get(status) ?? []

        return (
          <Card key={status} className="flex flex-col flex-1 min-w-[300px] overflow-hidden bg-secondary max-h-[calc(100vh-236px)]">
            <div className="flex items-center gap-2 border-b px-3 py-3 shrink-0">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', WORK_STATUS_DOT_CLASS[status])} />
              <span className="font-medium truncate">{getEnumLabel(status)}</span>
              <span className="shrink-0 rounded-md bg-card px-1.5 py-0.5 text-xs text-muted-foreground">{columnItems.length}</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto px-3 py-3 flex-1">
              {columnItems.length === 0 ? <p className="text-sm text-muted-foreground">No work</p> : columnItems.map((item) => <WorkBoardCard key={`${item.objectType}-${item.id}`} item={item} />)}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default ProgramWorkBoard
