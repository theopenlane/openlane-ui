'use client'

import { Pencil, Check, X } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import useClickOutside from '@/hooks/useClickOutside'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { FALLBACK_COLOR } from './constants'

type ColorCellProps = {
  id: string
  initialColor?: string | null
  disabled?: boolean
  onSave: (id: string, newColor: string) => Promise<void>
}

const ColorCell = ({ id, initialColor, disabled, onSave }: ColorCellProps) => {
  const { successNotification, errorNotification } = useNotification()

  const initial = useMemo(() => normalizeHexColor(initialColor) ?? FALLBACK_COLOR, [initialColor])
  const [draft, setDraft] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)

  const normalizedDraft = normalizeHexColor(draft)
  const isDirty = (normalizedDraft ?? draft).toLowerCase() !== initial.toLowerCase()

  useEffect(() => {
    setDraft(initial)
  }, [initial])

  const handleSave = useCallback(
    async (e?: React.SyntheticEvent) => {
      e?.stopPropagation()
      const normalized = normalizeHexColor(draft)
      if (disabled || isSaving || !isDirty || !normalized) return

      setIsSaving(true)
      try {
        await onSave(id, normalized.toUpperCase())
        successNotification({
          title: 'Success',
          description: 'Color updated successfully',
        })
      } catch (error) {
        errorNotification({
          title: 'Update Failed',
          description: parseErrorMessage(error),
        })
        setDraft(initial)
      } finally {
        setIsSaving(false)
      }
    },
    [disabled, isSaving, isDirty, draft, id, onSave, initial, successNotification, errorNotification],
  )

  const handleCancel = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.stopPropagation()
      setDraft(initial)
    },
    [initial],
  )

  const containerRef = useClickOutside(() => {
    if (isDirty && !isSaving) handleCancel()
  })

  return (
    <div
      ref={containerRef}
      className={cn(
        'group inline-flex items-center gap-1 px-1.5 py-1 rounded-md transition-all border border-transparent',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted',
        isDirty && 'bg-accent/50',
      )}
      onClick={() => !disabled && !isSaving && inputRef.current?.click()}
    >
      <div className="relative flex items-center shrink-0">
        <div
          className={cn('h-4 w-4 rounded-full border border-border shadow-sm transition-transform', isSaving && 'animate-pulse opacity-50', isDirty && 'scale-110')}
          style={{ backgroundColor: normalizedDraft ?? initial }}
        />
        <input ref={inputRef} type="color" value={normalizedDraft ?? initial} className="sr-only h-8" disabled={disabled || isSaving} onChange={(e) => setDraft(e.currentTarget.value.toUpperCase())} />
      </div>

      <input
        type="text"
        value={draft}
        maxLength={7}
        onChange={(e) => setDraft(e.target.value.toUpperCase())}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave(e)
          if (e.key === 'Escape') handleCancel(e)
        }}
        disabled={disabled || isSaving}
        className={cn(
          'w-14 bg-transparent border-none p-0 text-[11px] font-mono uppercase focus:ring-0 focus:outline-none',
          isDirty ? 'text-foreground font-bold' : 'text-muted-foreground',
          !normalizedDraft && isDirty && 'text-destructive',
        )}
      />

      <div className="flex items-center gap-1 ml-1 min-w-10">
        {isSaving ? (
          <span className="text-[10px] text-muted-foreground animate-pulse">...</span>
        ) : isDirty ? (
          <>
            <button onClick={handleSave} disabled={!normalizedDraft} className="text-green-600 hover:bg-green-500/10 p-0.5 rounded">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleCancel} className="text-destructive hover:bg-destructive/10 p-0.5 rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          !disabled && <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  )
}

export default ColorCell
