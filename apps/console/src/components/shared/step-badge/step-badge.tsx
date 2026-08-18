import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

type StepBadgeSize = 'sm' | 'md'

interface StepBadgeProps {
  done?: boolean
  stepNumber?: number
  size?: StepBadgeSize
}

const sizes: Record<StepBadgeSize, { container: string; check: number }> = {
  sm: { container: 'h-5 w-5 text-xs', check: 12 },
  md: { container: 'h-8 w-8 text-sm', check: 16 },
}

export const StepBadge: React.FC<StepBadgeProps> = ({ done = false, stepNumber, size = 'md' }) => (
  <div
    role="img"
    aria-label={done ? 'Completed' : 'Not completed'}
    className={cn(
      'flex shrink-0 items-center justify-center rounded-full border',
      sizes[size].container,
      done ? 'border-primary bg-primary text-btn-primary-text' : 'border-border text-muted-foreground',
    )}
  >
    {done ? <Check size={sizes[size].check} strokeWidth={3} /> : stepNumber}
  </div>
)
