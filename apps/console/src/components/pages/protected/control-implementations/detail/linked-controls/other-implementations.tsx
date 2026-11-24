import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Badge } from '@repo/ui/badge'
import { Link } from '@/components/shared/link/link'
import { controlImplementationHref } from '@/utils/control-implementation'
import { type TOtherImplementations } from './linked-control-groups'

type TOtherImplementationsProps = {
  others: TOtherImplementations
}

export const OtherImplementations = ({ others: { totalCount, items } }: TOtherImplementationsProps) => {
  const [first] = items
  if (!first) return null

  const link = (
    <Link href={controlImplementationHref(first.id)} newTab className="min-w-0">
      <span className="truncate">{first.title}</span>
    </Link>
  )

  if (totalCount <= 1) return link

  const unlistedCount = totalCount - items.length

  return (
    <SystemTooltip
      portal
      side="top"
      disableHoverableContent={false}
      icon={
        <div className="flex min-w-0 items-center gap-1.5">
          {link}
          <Badge variant="outline" className="shrink-0 px-1.5">
            +{totalCount - 1}
          </Badge>
        </div>
      }
      content={
        <ul className="max-h-60 space-y-1 overflow-y-auto">
          {items.map(({ id, title }) => (
            <li key={id}>
              <Link href={controlImplementationHref(id)} newTab>
                {title}
              </Link>
            </li>
          ))}
          {unlistedCount > 0 && <li className="text-muted-foreground">and {unlistedCount} more</li>}
        </ul>
      }
    />
  )
}
