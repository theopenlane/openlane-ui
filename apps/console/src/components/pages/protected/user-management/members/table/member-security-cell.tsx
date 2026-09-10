'use client'

import { ShieldCheck, ShieldOff } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Badge } from '@repo/ui/badge'

export const MEMBER_SECURITY_COLUMN_SIZE = 90

type TMemberSecurityCellProps = {
  enforced: boolean
  label: string
  description: string
}

export const MemberSecurityCell = ({ enforced, label, description }: TMemberSecurityCellProps) => {
  const Icon = enforced ? ShieldCheck : ShieldOff

  return (
    <SystemTooltip
      side="left"
      icon={
        <button type="button" className="cursor-default rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Badge variant={enforced ? 'primary' : 'select'} className="p-1.5">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </Badge>
        </button>
      }
      content={
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{label}</span>
          <span>{description}</span>
        </div>
      }
    />
  )
}
