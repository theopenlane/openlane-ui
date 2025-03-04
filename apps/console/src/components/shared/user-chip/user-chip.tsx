import { UserAvatar } from '@/components/shared/user-avatar/user-avatar'
import { User } from '@repo/codegen/src/schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

export function UserChip(user: User | null) {
  //TODO: if we ever get ts error with user object we can create a fragment in query.ts file and use fragment as type
  if (!user) return null
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <UserAvatar user={user} />
            <span>
              {user.firstName} {user.lastName}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{user.email}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
