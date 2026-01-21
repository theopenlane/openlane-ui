import { Badge } from '@repo/ui/badge'
import { Option } from '@repo/ui/multiple-selector'
import React from 'react'

const CustomTypeEnumChip = ({ option }: { option: Option & { color?: string; description?: string } }) => {
  if (!option.color) {
    return option.label
  }
  return (
    <Badge variant="outline" className="flex items-center gap-1 w-fit">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: option?.color ?? '#6B7280' }} />
      <span>{option.label}</span>
    </Badge>
  )
}

export default CustomTypeEnumChip
