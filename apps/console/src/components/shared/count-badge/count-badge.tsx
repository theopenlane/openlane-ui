import React from 'react'

type Props = {
  count: number
  variant?: 'default' | 'destructive'
  className?: string
}

const CountBadge: React.FC<Props> = ({ count, variant = 'default', className }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full border h-6 w-6 text-xs shrink-0 ${
      variant === 'destructive' ? 'border-destructive/40 text-destructive' : 'border-border text-muted-foreground'
    } ${className ?? ''}`}
  >
    {count}
  </span>
)

export default CountBadge
