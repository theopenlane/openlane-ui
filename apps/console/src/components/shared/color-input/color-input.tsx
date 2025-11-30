import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import React, { memo, useTransition } from 'react'

export const ColorInput = memo(({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const [, startTransition] = useTransition()

  const handleChange = (val: string) => {
    startTransition(() => onChange(val))
  }

  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="border px-1.5 py-1 rounded">
          <Input type="color" value={value} onChange={(e) => handleChange(e.target.value)} className="w-6 h-7 p-0 border-none" />
        </div>
        <Input type="text" value={value} onChange={(e) => handleChange(e.target.value)} className="w-[100px] px-2" />
      </div>
    </div>
  )
})

ColorInput.displayName = 'ColorInput'
