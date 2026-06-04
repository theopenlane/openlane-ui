import { Badge } from '@repo/ui/badge'
import { type UserAuthProvider } from '@repo/codegen/src/schema'
import { cn } from '@repo/ui/lib/utils'

type LastUsedBadgeProps = {
  provider: UserAuthProvider
  lastUsedProvider: UserAuthProvider | null
  floating?: boolean
  className?: string
}

export const LastUsedBadge = ({ provider, lastUsedProvider, floating = false, className }: LastUsedBadgeProps) => {
  if (lastUsedProvider !== provider) return null

  return (
    <Badge
      variant="primary"
      className={cn('bg-blue-500/50 text-white border-transparent', floating ? 'absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 w-fit whitespace-nowrap' : 'self-center', className)}
    >
      Last used
    </Badge>
  )
}
