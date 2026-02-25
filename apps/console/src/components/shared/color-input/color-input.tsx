import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import React, { memo, useTransition } from 'react'

interface ColorInputProps {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  disabled?: boolean
}

export const ColorInput = memo(({ label, value, onChange, disabled }: ColorInputProps) => {
  const [, startTransition] = useTransition()

  const handleChange = (val: string) => {
    startTransition(() => onChange(val))
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2 w-full border rounded-md px-2 bg-input">
        <Input type="color" disabled={disabled} value={value} onChange={(e) => handleChange(e.target.value)} className="w-6 h-6 p-0 border-none cursor-pointer rounded-full" />
        <Input type="text" disabled={disabled} value={value} onChange={(e) => handleChange(e.target.value)} className="flex-1 border-none p-0 bg-transparent" />
      </div>
    </div>
  )
})

ColorInput.displayName = 'ColorInput'
