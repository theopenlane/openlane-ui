import React from 'react'
import { Badge } from '@repo/ui/badge'

export const StepProgress = ({ label, progress }: { label: string; progress: number }) => {
  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100)

  return (
    <div className="mb-6 flex flex-col gap-3">
      <Badge variant="primary" className="w-fit border-primary/24 uppercase tracking-wide">
        {label}
      </Badge>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={label} className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
