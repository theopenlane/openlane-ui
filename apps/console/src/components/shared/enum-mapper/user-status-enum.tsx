import React from 'react'
import { CircleHelp, UserLock, UserRoundCheck, UserRoundMinus, UserRoundPlus, UserRoundX } from 'lucide-react'
import { type ContactUserStatus, IdentityHolderUserStatus } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type UserStatus = IdentityHolderUserStatus | ContactUserStatus

type UserStatusMeta = { icon: React.ReactNode; badgeClassName: string }

const UNKNOWN_META: UserStatusMeta = {
  icon: <CircleHelp height={16} width={16} className="text-muted-foreground shrink-0" />,
  badgeClassName: 'text-muted-foreground bg-muted border-border',
}

const USER_STATUS_META = {
  [IdentityHolderUserStatus.ACTIVE]: {
    icon: <UserRoundCheck height={16} width={16} className="text-active shrink-0" />,
    badgeClassName: 'text-personnel-active bg-personnel-active-muted border-personnel-active-border',
  },
  [IdentityHolderUserStatus.INACTIVE]: {
    icon: <UserRoundX height={16} width={16} className="text-inactive shrink-0" />,
    badgeClassName: 'text-personnel-inactive bg-personnel-inactive-muted border-personnel-inactive-border',
  },
  [IdentityHolderUserStatus.DEACTIVATED]: {
    icon: <UserRoundMinus height={16} width={16} className="text-deactivated shrink-0" />,
    badgeClassName: 'text-personnel-deactivated bg-personnel-deactivated-muted border-personnel-deactivated-border',
  },
  [IdentityHolderUserStatus.SUSPENDED]: {
    icon: <UserLock height={16} width={16} className="text-suspended shrink-0" />,
    badgeClassName: 'text-personnel-suspended bg-personnel-suspended-muted border-personnel-suspended-border',
  },
  [IdentityHolderUserStatus.ONBOARDING]: {
    icon: <UserRoundPlus height={16} width={16} className="text-onboarding shrink-0" />,
    badgeClassName: 'text-personnel-onboarding bg-personnel-onboarding-muted border-personnel-onboarding-border',
  },
  [IdentityHolderUserStatus.UNKNOWN]: UNKNOWN_META,
} satisfies Record<IdentityHolderUserStatus, UserStatusMeta> & Record<ContactUserStatus, UserStatusMeta>

const userStatusMeta = (status: UserStatus): UserStatusMeta => USER_STATUS_META[status] ?? UNKNOWN_META

export const UserStatusIcon = ({ status }: { status: UserStatus }) => <>{userStatusMeta(status).icon}</>

export const UserStatusLabel = ({ status }: { status: UserStatus }) => (
  <div className="flex items-center gap-2">
    <UserStatusIcon status={status} />
    <span>{getEnumLabel(status)}</span>
  </div>
)

export const UserStatusBadge = ({ status, className }: { status: UserStatus; className?: string }) => (
  <Badge variant="outline" className={cn('flex w-fit items-center text-center gap-2', userStatusMeta(status).badgeClassName, className)}>
    {getEnumLabel(status)}
  </Badge>
)
