import { Avatar, type AvatarEntityLike } from '@/components/shared/avatar/avatar'
import { TruncatedCell } from '@repo/ui/data-table'

type UserCellProps = {
  user: AvatarEntityLike | undefined
  fallback?: string
  className?: string
}

export const UserCell = ({ user, fallback, className = 'h-6 w-6' }: UserCellProps) => {
  if (!user) {
    if (fallback) {
      return <span className="text-muted-foreground">{fallback}</span>
    }
    return <span className="text-muted-foreground italic">Deleted user</span>
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar entity={user} className={className} />
      <TruncatedCell portal>{user.displayName || '-'}</TruncatedCell>
    </div>
  )
}
