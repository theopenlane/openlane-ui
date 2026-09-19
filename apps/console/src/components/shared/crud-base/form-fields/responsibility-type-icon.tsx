import { User, Users, IdCardLanyard, Type } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { type ResponsibilitySelection } from './responsibility-field-utils'

type NonNullSelection = NonNullable<ResponsibilitySelection>

const ICONS = {
  personnel: IdCardLanyard,
  user: User,
  group: Users,
  string: Type,
} satisfies Record<NonNullSelection['type'], React.ElementType>

export const ResponsibilityTypeIcon: React.FC<{ type: NonNullSelection['type']; className?: string }> = ({ type, className }) => {
  const Icon = ICONS[type]
  return <Icon className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground', className)} />
}

export const ResponsibilitySelectionLabel: React.FC<{ selection: NonNullSelection }> = ({ selection }) => {
  const label = selection.displayName || selection.value
  return (
    <>
      <ResponsibilityTypeIcon type={selection.type} />
      <span className="truncate" title={label}>
        {label}
      </span>
    </>
  )
}
