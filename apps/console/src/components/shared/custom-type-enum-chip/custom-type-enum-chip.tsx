import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { Badge } from '@repo/ui/badge'
import React from 'react'

export const CustomTypeEnumOptionChip = ({ option }: { option: CustomTypeEnumOption }) => {
  const color = option.color

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 w-fit overflow-hidden bg-secondary"
      style={color ? { backgroundColor: `color-mix(in srgb, ${color}, transparent 85%)`, borderColor: `color-mix(in srgb, ${color}, transparent 60%)` } : undefined}
    >
      {color && <div className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
      <span title={option.label} className="truncate">
        {option.label}
      </span>
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
    return <span className="text-muted-foreground">{placeholder}</span>
  }

  return <CustomTypeEnumOptionChip option={option} />
}
