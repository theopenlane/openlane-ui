import { type User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'

type UserCellProps = {
  user: User | undefined
  fallback?: string
  className?: string
}

export function UserCell({ user, fallback, className = 'h-6 w-6' }: UserCellProps) {
  if (!user) {
    if (fallback) {
      return <span className="text-muted-foreground">{fallback}</span>
    }
    return <span className="text-muted-foreground italic">Deleted user</span>
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar entity={user} className={className} />
      {user.displayName || '-'}
    </div>
  )
}
