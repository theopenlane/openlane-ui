import { type User } from '@repo/codegen/src/schema'
import { UserCell } from './user-cell'
import { Users } from 'lucide-react'

type ResponsibilityCellProps = {
  userMap: Record<string, User>
  user?: { id: string; displayName?: string | null } | null
  group?: { id: string; displayName?: string | null } | null
  personnel?: { id: string; fullName?: string | null; email?: string | null } | null
  stringValue?: string | null
}

export const ResponsibilityCell = ({ userMap, user, group, personnel, stringValue }: ResponsibilityCellProps) => {
  if (user?.id) {
    return <UserCell user={userMap[user.id]} />
  }

  if (group?.id) {
    return (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        {group.displayName || '-'}
      </div>
    )
  }

  if (personnel?.id) {
    return <span>{personnel.fullName || personnel.email || personnel.id}</span>
  }

  if (stringValue) {
    return <span>{stringValue}</span>
  }

  return <span className="text-muted-foreground">-</span>
}
