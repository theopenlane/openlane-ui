import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import React, { memo, startTransition, useState } from 'react'
import { normalizeHexColor } from '@/utils/normalizeHexColor'

interface ColorInputProps {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  disabled?: boolean
}

const SWATCH_FALLBACK = '#000000'

export const ColorInput = memo(({ label, value, onChange, disabled }: ColorInputProps) => {
  const [draft, setDraft] = useState(value ?? '')
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    if (normalizeHexColor(draft) !== normalizeHexColor(value)) setDraft(value ?? '')
  }

  const propagate = (next: string) => {
    if (next !== value) startTransition(() => onChange(next))
  }

  const handleTextChange = (raw: string) => {
    setDraft(raw)
    if (!raw.trim()) {
      propagate('')
      return
    }
    const normalized = normalizeHexColor(raw)
    if (normalized) propagate(normalized)
  }

  const handleSwatchChange = (raw: string) => {
    setDraft(raw)
    propagate(raw)
  }

  const handleBlur = () => {
    if (!draft.trim()) {
      setDraft('')
      propagate('')
      return
    }
    const normalized = normalizeHexColor(draft)
    if (!normalized) {
      setDraft(value ?? '')
      return
    }
    setDraft(normalized)
    propagate(normalized)
  }

  const swatchValue = normalizeHexColor(draft) ?? normalizeHexColor(value) ?? SWATCH_FALLBACK

  return (
    <div className="flex flex-col gap-1 w-full">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2 w-full border rounded-md px-2 bg-input">
        <Input type="color" disabled={disabled} value={swatchValue} onChange={(e) => handleSwatchChange(e.target.value)} className="w-6 h-6 p-0 border-none cursor-pointer rounded-full" />
        <Input
          type="text"
          disabled={disabled}
          value={draft}
          maxLength={7}
          spellCheck={false}
          placeholder="#000000"
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          className="flex-1 border-none p-0 bg-transparent"
        />
      </div>
    </div>
  )
})

ColorInput.displayName = 'ColorInput'
