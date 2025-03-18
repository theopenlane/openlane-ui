import { User } from '@repo/codegen/src/schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Avatar } from '../avatar/avatar'

export function UserChip(user: User | null) {
  //TODO: if we ever get ts error with user object we can create a fragment in query.ts file and use fragment as type
  if (!user) return null
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <Avatar entity={user} variant="small" />
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
