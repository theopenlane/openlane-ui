import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { getSeverityStyle, type TSeverityLevel } from '@/utils/severity'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type TSeverityChipProps = {
  severity?: string | null
  level?: TSeverityLevel | 'none'
  className?: string
}

export const SeverityChip: React.FC<TSeverityChipProps> = ({ severity, level, className }) => {
  if (!severity) {
    return null
  }

  return (
    <span
      className={cn('text-xs px-2 py-0.5 rounded-full font-medium', level === 'none' && 'bg-border text-muted-foreground', className)}
      style={level === 'none' ? undefined : getSeverityStyle(level ?? severity)}
    >
      {getEnumLabel(severity)}
    </span>
  )
}
