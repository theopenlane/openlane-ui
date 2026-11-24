import React from 'react'
import { type BadgeProps, badgeVariants } from '@repo/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { cn } from '@repo/ui/lib/utils'

type TChipSelectProps<TValue extends string> = {
  label: string
  value?: TValue | null
  options: readonly { value: TValue; label: string }[]
  onChange: (value: TValue) => void
  children: React.ReactNode
  variant?: BadgeProps['variant']
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
}

export const ChipSelect = <TValue extends string>({ label, value, options, onChange, children, variant = 'secondary', className, style, disabled }: TChipSelectProps<TValue>) => (
  <Select
    value={value ?? ''}
    disabled={disabled}
    onValueChange={(next) => {
      const option = options.find((candidate) => candidate.value === next)
      if (option && option.value !== value) onChange(option.value)
    }}
  >
    <SelectTrigger
      aria-label={label}
      className={cn(badgeVariants({ variant }), 'w-fit h-auto gap-1 shadow-none cursor-pointer focus:ring-0 focus-visible:ring-1 focus-visible:ring-ring [&>svg]:opacity-100', className)}
      style={style}
    >
      {children}
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
