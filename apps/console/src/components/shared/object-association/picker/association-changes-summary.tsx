'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Minus, Plus, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { cn } from '@repo/ui/lib/utils'
import { toAssociationKey, type TAssociationChange, type TAssociationChanges } from './use-association-changes'

const VISIBLE_CHIPS = 3

type TAssociationChangesSummaryProps = Pick<TAssociationChanges, 'changes' | 'undo' | 'reset'>

type TChangeProps = {
  change: TAssociationChange
  onUndo: () => void
}

const changeName = ({ label, title }: TAssociationChange) => [label, title].filter(Boolean).join(' ')

const UndoButton = ({ change, onUndo }: TChangeProps) => (
  <Button
    type="button"
    variant="icon"
    className="h-6 w-6 shrink-0 p-0"
    aria-label={`${change.action === 'add' ? 'Do not add' : 'Keep'} ${change.objectType} ${change.label}`}
    icon={<X />}
    onClick={onUndo}
  />
)

const ChangeChip = ({ change, onUndo }: TChangeProps) => {
  const isRemoval = change.action === 'remove'
  return (
    <span className={cn('hidden h-7 min-w-0 max-w-52 items-center gap-1 rounded-md border bg-secondary pl-2 pr-1 text-xs sm:flex', isRemoval && 'border-destructive/40')}>
      {isRemoval ? <Minus size={12} className="shrink-0 text-destructive" /> : <Plus size={12} className="shrink-0 text-primary" />}
      <span className="shrink-0 text-muted-foreground">{change.objectType}</span>
      <TruncatedCell portal className={cn('min-w-0', isRemoval && 'text-destructive line-through')}>
        {change.label}
      </TruncatedCell>
      <UndoButton change={change} onUndo={onUndo} />
    </span>
  )
}

const ChangeSection = ({ heading, changes, undo }: { heading: string; changes: TAssociationChange[]; undo: (change: TAssociationChange) => void }) => {
  if (changes.length === 0) return null
  const isRemoval = changes[0].action === 'remove'
  return (
    <section>
      <h3 className={cn('px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground', isRemoval && 'text-destructive')}>{`${heading} · ${changes.length}`}</h3>
      <ul>
        {changes.map((change) => (
          <li key={toAssociationKey(change)} className="flex items-center gap-2 px-3 py-1 text-sm">
            <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{change.objectType}</span>
            <TruncatedCell portal className={cn('min-w-0 flex-1', isRemoval && 'text-destructive line-through')}>
              {changeName(change)}
            </TruncatedCell>
            <UndoButton change={change} onUndo={() => undo(change)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

const AssociationChangesSummary = ({ changes, undo, reset }: TAssociationChangesSummaryProps) => {
  const [open, setOpen] = useState(false)
  const isPopoverOpen = open && changes.length > 0
  const additions = changes.filter(({ action }) => action === 'add')
  const removals = changes.filter(({ action }) => action === 'remove')
  const handleReset = () => {
    setOpen(false)
    reset()
  }

  const handleUndo = (change: TAssociationChange) => {
    if (changes.length === 1) setOpen(false)
    undo(change)
  }

  const hiddenCount = changes.length - VISIBLE_CHIPS

  const summary = [additions.length > 0 ? `${additions.length} to add` : '', removals.length > 0 ? `${removals.length} to remove` : ''].filter(Boolean).join(' · ') || 'No changes yet'

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
        {summary}
      </p>
      {changes.slice(0, VISIBLE_CHIPS).map((change) => (
        <ChangeChip key={toAssociationKey(change)} change={change} onUndo={() => handleUndo(change)} />
      ))}
      {changes.length > 0 && (
        <Popover modal open={isPopoverOpen} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="h-7 px-2 text-xs">
              <span className="flex items-center gap-1">
                {hiddenCount > 0 ? `+${hiddenCount} more` : 'Review'}
                {isPopoverOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-96 max-w-[calc(100vw-2rem)] p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <p className="text-sm font-medium">{summary}</p>
              <Button type="button" variant="link" onClick={handleReset}>
                Reset changes
              </Button>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              <ChangeSection heading="To add" changes={additions} undo={handleUndo} />
              <ChangeSection heading="To remove" changes={removals} undo={handleUndo} />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default AssociationChangesSummary
