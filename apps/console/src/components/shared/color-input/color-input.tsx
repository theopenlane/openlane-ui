import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import React, { memo, useTransition } from 'react'

interface ColorInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export const ColorInput = memo(({ label, value, onChange, disabled }: ColorInputProps) => {
  const [, startTransition] = useTransition()

  const handleChange = (val: string) => {
    startTransition(() => onChange(val))
  }

  return (
    <div className={`space-y-1 ${disabled ? 'opacity-50' : ''}`}>
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="border px-1.5 py-1 rounded">
          <Input type="color" value={value} onChange={(e) => handleChange(e.target.value)} className="w-6 h-7 p-0 border-none cursor-pointer disabled:cursor-not-allowed" disabled={disabled} />
        </div>
        <Input type="text" value={value} onChange={(e) => handleChange(e.target.value)} className="w-[100px] px-2" disabled={disabled} />
      </div>
    </div>
  )
})

ColorInput.displayName = 'ColorInput'
