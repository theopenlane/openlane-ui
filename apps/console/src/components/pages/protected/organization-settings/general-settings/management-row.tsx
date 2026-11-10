'use client'
import { type ReactNode } from 'react'
import { cn } from '@repo/ui/lib/utils'

type ManagementRowProps = {
  icon: ReactNode
  iconClassName?: string
  title: string
  description: string
  descriptionClassName?: string
  action: ReactNode
}

const ManagementRow = ({ icon, iconClassName, title, description, descriptionClassName, action }: ManagementRowProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', iconClassName)}>{icon}</div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className={cn('text-sm text-muted-foreground', descriptionClassName)}>{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}

export { ManagementRow }
