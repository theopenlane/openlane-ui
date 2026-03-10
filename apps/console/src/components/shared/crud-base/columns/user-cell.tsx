import { type User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'

type UserCellProps = {
  user: User | undefined
  className?: string
}

export function UserCell({ user, className = 'h-6 w-6' }: UserCellProps) {
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
