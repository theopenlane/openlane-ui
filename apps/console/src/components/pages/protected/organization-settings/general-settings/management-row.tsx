'use client'
import { type ReactNode } from 'react'
import { cn } from '@repo/ui/lib/utils'

type ManagementRowProps = {
  icon: ReactNode
  iconClassName?: string
  title: string
  description: string
  action: ReactNode
}

const ManagementRow = ({ icon, iconClassName, title, description, action }: ManagementRowProps) => {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', iconClassName)}>{icon}</div>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}

export { ManagementRow }
