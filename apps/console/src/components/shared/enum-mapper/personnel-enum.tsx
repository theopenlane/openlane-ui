import { UserLock, UserRoundCheck, UserRoundMinus, UserRoundPlus, UserRoundX } from 'lucide-react'
import { IdentityHolderUserStatus } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const PersonnelStatusIconMapper: Record<IdentityHolderUserStatus, React.ReactNode> = {
  [IdentityHolderUserStatus.ACTIVE]: <UserRoundCheck height={16} width={16} className="text-active" />,
  [IdentityHolderUserStatus.INACTIVE]: <UserRoundX height={16} width={16} className="text-inactive" />,
  [IdentityHolderUserStatus.DEACTIVATED]: <UserRoundMinus height={16} width={16} className="text-deactivated" />,
  [IdentityHolderUserStatus.SUSPENDED]: <UserLock height={16} width={16} className="text-suspended" />,
  [IdentityHolderUserStatus.ONBOARDING]: <UserRoundPlus height={16} width={16} className="text-onboarding" />,
}

const PersonnelStatusColorMapper: Record<IdentityHolderUserStatus, string> = {
  [IdentityHolderUserStatus.ACTIVE]: 'text-personnel-active bg-personnel-active-muted border-personnel-active-border',
  [IdentityHolderUserStatus.INACTIVE]: 'text-personnel-inactive bg-personnel-inactive-muted border-personnel-inactive-border',
  [IdentityHolderUserStatus.DEACTIVATED]: 'text-personnel-deactivated bg-personnel-deactivated-muted border-personnel-deactivated-border',
  [IdentityHolderUserStatus.SUSPENDED]: 'text-personnel-suspended bg-personnel-suspended-muted border-personnel-suspended-border',
  [IdentityHolderUserStatus.ONBOARDING]: 'text-personnel-onboarding bg-personnel-onboarding-muted border-personnel-onboarding-border',
}

export function PersonnelStatusBadge({ status }: { status: IdentityHolderUserStatus }) {
  return (
    <Badge variant="outline" className={`flex w-fit items-center text-center gap-2 ${PersonnelStatusColorMapper[status]}`}>
      {getEnumLabel(status)}
    </Badge>
  )
}
