import { User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'

// UserCellProps defines the props for UserCell
type UserCellProps = {
  user: User | undefined
  className?: string
}

// UserCell renders a user avatar and display name, or a "Deleted user" fallback
export function UserCell({ user, className }: UserCellProps) {
  if (!user) {
    return <span className="text-muted-foreground italic">Deleted user</span>
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar entity={user} className={className} />
      {user.displayName || '-'}
    </div>
  )
}
