import { type User } from '@repo/codegen/src/schema'
import { TruncatedCell } from '@repo/ui/data-table'
import { UserCell } from './user-cell'
import { Users, IdCardLanyard } from 'lucide-react'

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
      <div className="flex min-w-0 items-center gap-2">
        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
        <TruncatedCell portal>{group.displayName || '-'}</TruncatedCell>
      </div>
    )
  }

  if (personnel?.id) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <IdCardLanyard className="h-4 w-4 shrink-0 text-muted-foreground" />
        <TruncatedCell portal>{personnel.fullName || personnel.email || personnel.id}</TruncatedCell>
      </div>
    )
  }

  if (stringValue) {
    return <TruncatedCell portal>{stringValue}</TruncatedCell>
  }

  return <span className="text-muted-foreground">-</span>
}
