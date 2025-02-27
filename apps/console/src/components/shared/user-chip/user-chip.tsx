import { UserAvatar } from '@/components/shared/user-avatar/user-avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import type { UserInfoFragment } from '@repo/codegen/src/schema'

export function UserChip(user: UserInfoFragment | null) {
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
