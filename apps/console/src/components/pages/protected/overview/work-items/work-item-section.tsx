import React from 'react'
import { Badge } from '@repo/ui/badge'
import type { WorkItem } from './types'
import WorkItemRow from './work-item-row'

type WorkItemSectionProps = {
  label: string
  items: WorkItem[]
  showHeader: boolean
  showKindLabel?: boolean
}

const WorkItemSection = ({ label, items, showHeader, showKindLabel = false }: WorkItemSectionProps) => {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {showHeader && (
        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
          <Badge variant="secondary">{items.length}</Badge>
        </p>
      )}
      {items.map((item) => (
        <WorkItemRow key={item.key} item={item} showKindLabel={showKindLabel} />
      ))}
    </div>
  )
}

export default WorkItemSection
