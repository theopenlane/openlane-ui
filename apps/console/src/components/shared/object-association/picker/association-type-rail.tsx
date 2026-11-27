import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { getAssociationTypeLabel, type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { pluralizeWithCount } from '@/utils/strings'
import { type TAssociationTypeGroup } from './association-type-groups'

const MIN_TYPES_TO_GROUP = 6

type TAssociationTypeRailProps = {
  groups: TAssociationTypeGroup[]
  selectedType: ObjectTypeObjects | null
  onSelect: (type: ObjectTypeObjects) => void
  getChangeCount: (type: ObjectTypeObjects) => number
}

const AssociationTypeRail = ({ groups, selectedType, onSelect, getChangeCount }: TAssociationTypeRailProps) => {
  const showGroups = groups.reduce((count, { types }) => count + types.length, 0) >= MIN_TYPES_TO_GROUP

  return (
    <nav aria-label="Object types" className="max-h-36 shrink-0 overflow-y-auto border-b p-2 sm:max-h-none sm:w-52 sm:border-b-0 sm:border-r">
      {groups.map(({ label, types }) => (
        <div key={label} className={cn(showGroups && 'pb-2')}>
          {showGroups && <p className="px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>}
          {types.map((type) => {
            const count = getChangeCount(type)
            const isSelected = type === selectedType
            return (
              <Button
                key={type}
                type="button"
                variant="transparent"
                aria-current={isSelected ? 'true' : undefined}
                className={cn('w-full justify-start px-2 text-sm *:w-full *:min-w-0', isSelected && 'bg-primary/10 font-medium')}
                onClick={() => onSelect(type)}
              >
                <span className="flex w-full min-w-0 items-center justify-between gap-2">
                  <span className="truncate">{getAssociationTypeLabel(type)}</span>
                  {count > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground dark:text-background">
                      <span aria-hidden>{count}</span>
                      <span className="sr-only">{pluralizeWithCount(count, 'pending change')}</span>
                    </span>
                  )}
                </span>
              </Button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export default AssociationTypeRail
