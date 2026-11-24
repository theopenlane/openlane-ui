import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Badge } from '@repo/ui/badge'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { type TOtherImplementations } from './linked-control-groups'

type TOtherImplementationsProps = {
  others: TOtherImplementations
}

export const OtherImplementations = ({ others: { totalCount, items } }: TOtherImplementationsProps) => {
  const openObjectSheet = useOpenObjectSheet()
  const [first] = items
  if (!first) return null

  const renderLink = ({ id, title }: TOtherImplementations['items'][number]) => (
    <ObjectSheetLink id={id} kind={ObjectAssociationNodeEnum.CONTROL_IMPLEMENTATION} label={title} onOpenSheet={openObjectSheet} />
  )

  const firstLink = (
    <div className="min-w-0 truncate" title={totalCount <= 1 ? first.title : undefined}>
      {renderLink(first)}
    </div>
  )

  if (totalCount <= 1) return firstLink

  const unlistedCount = totalCount - items.length

  return (
    <SystemTooltip
      portal
      side="top"
      disableHoverableContent={false}
      icon={
        <div className="flex min-w-0 items-center gap-1.5">
          {firstLink}
          <Badge variant="outline" className="shrink-0 px-1.5">
            +{totalCount - 1}
          </Badge>
        </div>
      }
      content={
        <ul className="max-h-60 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>{renderLink(item)}</li>
          ))}
          {unlistedCount > 0 && <li className="text-muted-foreground">and {unlistedCount} more</li>}
        </ul>
      }
    />
  )
}
