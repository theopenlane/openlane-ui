'use client'

import { useId } from 'react'
import { TriangleAlert } from 'lucide-react'
import { DropdownMenuCheckboxItem } from '@repo/ui/dropdown-menu'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { cn } from '@repo/ui/lib/utils'
import { Avatar, type AvatarEntityLike } from '@/components/shared/avatar/avatar'

const MISSING_PAYMENT_METHOD_REASON = 'This organization does not have a payment method on file. Add one in its billing settings to authorize it.'

type TTokenOrganizationOptionProps = {
  organization: AvatarEntityLike & { name: string }
  checked: boolean
  isMissingPaymentMethod: boolean
  isLoadingPaymentMethods: boolean
  onCheckedChange: (checked: boolean) => void
}

export const TokenOrganizationOption = ({ organization, checked, isMissingPaymentMethod, isLoadingPaymentMethods, onCheckedChange }: TTokenOrganizationOptionProps) => {
  const reasonId = useId()
  const isBlocked = !checked && (isMissingPaymentMethod || isLoadingPaymentMethods)

  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      aria-disabled={isBlocked}
      aria-describedby={isMissingPaymentMethod ? reasonId : undefined}
      className={cn(isBlocked && 'cursor-not-allowed')}
      onSelect={(event) => {
        if (isBlocked) event.preventDefault()
      }}
      onCheckedChange={(nextChecked) => {
        if (!isBlocked) onCheckedChange(nextChecked)
      }}
    >
      <span className={cn('flex min-w-0 items-center gap-2', isBlocked && 'opacity-50')}>
        <Avatar entity={organization} />
        {organization.name}
      </span>
      {isMissingPaymentMethod && (
        <>
          <SystemTooltip
            portal
            side="top"
            content={MISSING_PAYMENT_METHOD_REASON}
            icon={
              <span className="ml-2 inline-flex shrink-0">
                <TriangleAlert className="size-4 text-warning" aria-hidden />
              </span>
            }
          />
          <span id={reasonId} className="sr-only" aria-hidden>
            {MISSING_PAYMENT_METHOD_REASON}
          </span>
        </>
      )}
    </DropdownMenuCheckboxItem>
  )
}
