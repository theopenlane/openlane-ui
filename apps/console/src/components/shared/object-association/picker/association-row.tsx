import { useId } from 'react'
import { ChevronDown, ChevronRight, Link2 } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { TableCell, TableRow } from '@repo/ui/table'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { cn } from '@repo/ui/lib/utils'
import { type TableRow as TAssociationTableRow } from '@/components/shared/object-association/object-association-config'
import { pluralizeWithCount } from '@/utils/strings'
import { type TAssociationColumn } from './association-columns'
import { isSelectedState, type TAssociationCandidate, type TAssociationState } from './use-association-changes'

const ROW_STATE_CLASS: Record<TAssociationState, string> = {
  none: '',
  linked: '',
  adding: 'bg-primary/10!',
  removing: 'bg-destructive/10!',
}

type TAssociationRowProps = {
  row: TAssociationTableRow
  candidate: TAssociationCandidate
  state: TAssociationState
  columns: readonly TAssociationColumn[]
  onToggle: (selected: boolean) => void
  onViewDetails?: () => void
  expansion?: { isExpanded: boolean; onToggle: () => void }
  hasExpansionGutter?: boolean
  isChild?: boolean
}

const AssociationRow = ({ row, candidate, state, columns, onToggle, onViewDetails, expansion, hasExpansionGutter, isChild }: TAssociationRowProps) => {
  const checkboxId = useId()
  const nameId = useId()
  const stateId = useId()
  const isRemoving = state === 'removing'
  const nameClass = cn(isRemoving && 'text-destructive line-through')
  const subcontrolCount = row.subcontrolCount ?? 0

  const isRefCoded = candidate.title !== undefined
  const name = (
    <>
      {isRefCoded && <span className={cn('mr-2 font-mono', candidate.title ? 'text-muted-foreground' : nameClass)}>{candidate.label}</span>}
      {(candidate.title || !isRefCoded) && <span className={nameClass}>{candidate.title || candidate.label}</span>}
    </>
  )

  return (
    <TableRow className={ROW_STATE_CLASS[state]}>
      <TableCell className="w-11 py-2 pl-4 pr-0">
        <Checkbox id={checkboxId} checked={isSelectedState(state)} onCheckedChange={(checked) => onToggle(checked === true)} aria-labelledby={nameId} aria-describedby={stateId} />
      </TableCell>
      <TableCell className="px-2 py-2">
        <div className={cn('flex min-h-6 min-w-0 items-center gap-2', isChild && 'pl-8')}>
          {hasExpansionGutter && (
            <span className="flex w-6 shrink-0 justify-center">
              {expansion && (
                <Button
                  type="button"
                  variant="icon"
                  className="h-6 w-6 p-0"
                  aria-expanded={expansion.isExpanded}
                  aria-label={`${expansion.isExpanded ? 'Collapse' : 'Expand'} subcontrols of ${candidate.label}`}
                  icon={expansion.isExpanded ? <ChevronDown /> : <ChevronRight />}
                  onClick={expansion.onToggle}
                />
              )}
            </span>
          )}
          <TruncatedCell portal className="min-w-0">
            {onViewDetails ? (
              <Button type="button" variant="link" className="font-normal" onClick={onViewDetails}>
                <span id={nameId}>{name}</span>
              </Button>
            ) : (
              <label id={nameId} htmlFor={checkboxId} className="cursor-pointer">
                {name}
              </label>
            )}
          </TruncatedCell>
          {state === 'linked' && (
            <span id={stateId} className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Link2 size={12} aria-hidden />
              Linked
            </span>
          )}
          {isRemoving && (
            <span id={stateId} className="shrink-0">
              <Badge variant="red">Will be unlinked</Badge>
            </span>
          )}
          {expansion && !expansion.isExpanded && subcontrolCount > 0 && <span className="shrink-0 text-xs text-muted-foreground">{pluralizeWithCount(subcontrolCount, 'subcontrol')}</span>}
        </div>
      </TableCell>
      {columns.map(({ header, render }) => (
        <TableCell key={header} className="hidden truncate px-2 py-2 text-muted-foreground sm:table-cell">
          {render(row)}
        </TableCell>
      ))}
    </TableRow>
  )
}

export default AssociationRow
