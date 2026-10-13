'use client'

import { Loader2, Pencil } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { FALLBACK_COLOR } from './constants'

type ColorCellProps = {
  id: string
  label: string
  initialColor?: string | null
  disabled?: boolean
  onSave: (id: string, newColor: string) => Promise<void>
}

const ColorCell = ({ id, label, initialColor, disabled, onSave }: ColorCellProps) => {
  const { successNotification, errorNotification } = useNotification()
  const pickerId = useId()

  const initial = normalizeHexColor(initialColor) ?? FALLBACK_COLOR
  const [prevInitial, setPrevInitial] = useState(initial)
  const [color, setColor] = useState({ saved: initial, draft: initial })
  const [pickerPreview, setPickerPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (initial !== prevInitial) {
    setPrevInitial(initial)
    setColor({ saved: initial, draft: initial })
  }

  const pickerRef = useRef<HTMLInputElement | null>(null)
  const isLocked = !!disabled || isSaving
  const normalizedDraft = normalizeHexColor(color.draft)
  const swatch = pickerPreview ?? normalizedDraft ?? color.saved

  const revert = () => setColor((current) => ({ ...current, draft: current.saved }))

  const commit = async (value: string) => {
    const normalized = normalizeHexColor(value)
    if (!normalized) {
      revert()
      return
    }
    setColor((current) => ({ ...current, draft: normalized }))
    if (normalized === color.saved) return

    setIsSaving(true)
    try {
      await onSave(id, normalized.toUpperCase())
      setColor({ saved: normalized, draft: normalized })
      successNotification({ title: 'Success', description: 'Color updated successfully' })
    } catch (error) {
      revert()
      errorNotification({ title: 'Update Failed', description: parseErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const onPickerCommit = useEffectEvent((value: string) => {
    setPickerPreview(null)
    commit(value)
  })

  useEffect(() => {
    const picker = pickerRef.current
    if (!picker) return
    const handlePickerCommit = () => onPickerCommit(picker.value)
    picker.addEventListener('change', handlePickerCommit)
    return () => picker.removeEventListener('change', handlePickerCommit)
  }, [])

  const cursor = isLocked ? 'cursor-not-allowed' : 'cursor-pointer'

  return (
    <div className={cn('group inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors', disabled ? 'opacity-50' : 'hover:bg-muted focus-within:bg-muted')}>
      <label className={cn('relative flex shrink-0 items-center', cursor)}>
        <input
          ref={pickerRef}
          id={pickerId}
          type="color"
          aria-label={`Pick color for ${label}`}
          value={swatch}
          disabled={isLocked}
          className="peer sr-only"
          onChange={(e) => setPickerPreview(e.currentTarget.value)}
          onBlur={() => setPickerPreview(null)}
        />
        <span
          className={cn(
            'h-4 w-4 rounded-full border border-border shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
            isSaving && 'animate-pulse opacity-50',
          )}
          style={{ backgroundColor: swatch }}
        />
      </label>

      <input
        type="text"
        aria-label={`Hex color for ${label}`}
        value={color.draft}
        maxLength={7}
        spellCheck={false}
        disabled={isLocked}
        onChange={(e) => setColor((current) => ({ ...current, draft: e.target.value }))}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') revert()
        }}
        className={cn(
          'w-16 bg-transparent border-none p-0 text-xs font-mono uppercase text-muted-foreground focus:text-foreground focus:ring-0 focus:outline-none disabled:cursor-not-allowed',
          !normalizedDraft && 'text-destructive focus:text-destructive',
        )}
      />

      {isSaving ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        !disabled && (
          <label htmlFor={pickerId} className={cn('shrink-0', cursor)}>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden />
          </label>
        )
      )}
    </div>
  )
}

export default ColorCell
