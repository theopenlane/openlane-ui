import React from 'react'
import { cn } from '@repo/ui/lib/utils'

export const ReadOnlyRow: React.FC<{ icon?: React.ReactNode; label: string; labelClassName?: string; children: React.ReactNode }> = ({ icon, label, labelClassName, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex shrink-0 items-center gap-2">
      {icon}
      <span className={cn('text-base text-muted-foreground', labelClassName)}>{label}</span>
    </div>
    <span className="min-w-0 px-1 py-2 text-right text-sm break-words">{children}</span>
  </div>
)
