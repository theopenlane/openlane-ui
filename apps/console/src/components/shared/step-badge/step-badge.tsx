import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

type StepBadgeSize = 'sm' | 'md'

interface StepBadgeProps {
  done?: boolean
  active?: boolean
  stepNumber?: number
  size?: StepBadgeSize
}

const sizes: Record<StepBadgeSize, { container: string; check: number }> = {
  sm: { container: 'h-5 w-5 text-xs', check: 12 },
  md: { container: 'h-8 w-8 text-sm', check: 16 },
}

const stateLabel = (done: boolean, active: boolean): string => {
  if (done) return 'Completed'
  if (active) return 'Current step'

  return 'Not completed'
}

export const StepBadge: React.FC<StepBadgeProps> = ({ done = false, active = false, stepNumber, size = 'md' }) => (
  <div
    role="img"
    aria-label={stateLabel(done, active)}
    className={cn(
      'flex shrink-0 items-center justify-center rounded-full border',
      sizes[size].container,
      done && 'border-primary bg-primary text-btn-primary-text',
      active && !done && 'border-primary bg-primary/15 font-medium text-primary',
      !done && !active && 'border-border text-muted-foreground',
    )}
  >
    {done ? <Check size={sizes[size].check} strokeWidth={3} /> : stepNumber}
  </div>
)
