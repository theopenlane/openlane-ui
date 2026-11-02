import React from 'react'
import { cn } from '@repo/ui/lib/utils'

type TLinearBarProps = {
  value: number
  label: string
  role?: 'progressbar' | 'meter'
  className?: string
}

export const LinearBar: React.FC<TLinearBarProps> = ({ value, label, role = 'progressbar', className }) => {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div
      role={role}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%`}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-border', className)}
    >
      <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}
