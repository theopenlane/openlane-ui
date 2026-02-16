import { CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { Badge } from '@repo/ui/badge'
import React from 'react'

export const CustomTypeEnumOptionChip = ({ option }: { option: CustomTypeEnumOption }) => {
  if (!option.color) {
    return <span>{option.label}</span>
  }
  return (
    <Badge variant="outline" className="flex items-center gap-1 w-fit">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color ?? '#6B7280' }} />
      <span>{option.label}</span>
    </Badge>
  )
}

interface CustomTypeEnumValueProps {
  value?: string
  options: CustomTypeEnumOption[]
  placeholder?: string
}

export const CustomTypeEnumValue = ({ value, options, placeholder }: CustomTypeEnumValueProps) => {
  const option = options.find((o) => o.value === value)

  if (!option) {
    return <span>{placeholder}</span>
  }

  return <CustomTypeEnumOptionChip option={option} />
}
