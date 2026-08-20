import React from 'react'

type Props = {
  count: number
  variant?: 'default' | 'destructive'
  label?: string
  className?: string
}

const CountBadge: React.FC<Props> = ({ count, variant = 'default', label, className }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full border text-xs shrink-0 ${label ? 'gap-1 px-2.5 py-1' : 'h-6 w-6'} ${
      variant === 'destructive' ? 'border-destructive/40 text-destructive' : 'border-border text-muted-foreground'
    } ${className ?? ''}`}
  >
    {count}
    {label && <span>{label}</span>}
  </span>
)

export default CountBadge
