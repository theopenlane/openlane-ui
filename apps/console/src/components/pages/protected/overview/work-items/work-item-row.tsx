import { activatable } from '@repo/ui/lib/a11y'
import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { ArrowUpRight, Check, X } from 'lucide-react'
import { UNCATEGORIZED_KIND, WORK_ITEM_ROW_ACTION_CLASS, WORK_ITEM_ROW_CLASS, WORK_ITEM_ROW_TARGET_CLASS, type WorkItem, type WorkItemActionKind } from './types'

const ACTION_LABELS: Record<WorkItemActionKind, string> = {
  dismiss: 'Dismiss',
  complete: 'Mark as complete',
}

const ActionIcon = ({ kind }: { kind: WorkItemActionKind }) => (kind === 'dismiss' ? <X /> : <Check />)

type WorkItemRowProps = {
  item: WorkItem
  showKindLabel?: boolean
}

const WorkItemRow = ({ item, showKindLabel = false }: WorkItemRowProps) => (
  <div className={WORK_ITEM_ROW_CLASS} style={item.kindColor ? { borderLeftColor: item.kindColor, borderLeftWidth: 3 } : undefined}>
    <div className={WORK_ITEM_ROW_TARGET_CLASS} {...activatable(item.onClick)}>
      <p className="text-sm font-medium truncate">
        {showKindLabel && item.kind !== UNCATEGORIZED_KIND && <span className="text-xs font-normal uppercase tracking-wider text-muted-foreground">{item.kind}: </span>}
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
        className={WORK_ITEM_ROW_ACTION_CLASS}
        onClick={(event) => {
          event.stopPropagation()
          window.open(item.docsLink, '_blank', 'noopener,noreferrer')
        }}
      >
        Docs
      </Button>
    )}
    <Button variant="secondary" icon={<ActionIcon kind={item.actionKind} />} iconPosition="left" className={WORK_ITEM_ROW_ACTION_CLASS} onClick={item.onAction}>
      {ACTION_LABELS[item.actionKind]}
    </Button>
  </div>
)

export default WorkItemRow
