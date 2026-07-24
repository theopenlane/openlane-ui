import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { getSeverityStyle } from '@/utils/severity'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type TSeverityChipProps = {
  severity?: string | null
  className?: string
}

export const SeverityChip: React.FC<TSeverityChipProps> = ({ severity, className }) => {
  if (!severity) {
    return null
  }

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', className)} style={getSeverityStyle(severity)}>
      {getEnumLabel(severity)}
    </span>
  )
}
