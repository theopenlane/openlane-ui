'use client'

import { Pencil, Check, X } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import useClickOutside from '@/hooks/useClickOutside'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type ColorCellProps = {
  id: string
  initialColor?: string | null
  disabled?: boolean
  onSave: (id: string, newColor: string) => Promise<void>
}

const normalizeHex = (color?: string | null) => {
  if (!color) return '#64748B'
  return color.startsWith('#') ? color : `#${color}`
}

const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex)

export default function ColorCell({ id, initialColor, disabled, onSave }: ColorCellProps) {
  const { successNotification, errorNotification } = useNotification()

  const initial = useMemo(() => normalizeHex(initialColor), [initialColor])
  const [draft, setDraft] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const circleRef = useRef<HTMLDivElement | null>(null)

  const isDirty = draft.toLowerCase() !== initial.toLowerCase()
  const canSave = isDirty && !isSaving && isValidHex(draft)

  useEffect(() => {
    setDraft(initial)
  }, [initial])

  const handleSave = useCallback(
    async (e?: React.SyntheticEvent) => {
      e?.stopPropagation()
      if (disabled || !canSave) return

      setIsSaving(true)
      try {
        await onSave(id, draft.toUpperCase())
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
    [disabled, canSave, draft, id, onSave, initial, successNotification, errorNotification],
  )

  const handleCancel = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.stopPropagation()
      setDraft(initial)
      if (circleRef.current) circleRef.current.style.backgroundColor = initial
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
          ref={circleRef}
          className={cn('h-4 w-4 rounded-full border border-border shadow-sm transition-transform', isSaving && 'animate-pulse opacity-50', isDirty && 'scale-110')}
          style={{ backgroundColor: isValidHex(draft) ? draft : initial }}
        />
        <input
          ref={inputRef}
          type="color"
          value={draft}
          className="sr-only h-8"
          disabled={disabled || isSaving}
          onChange={(e) => {
            const val = e.currentTarget.value.toUpperCase()
            if (circleRef.current) circleRef.current.style.backgroundColor = val
            setDraft(val)
          }}
        />
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
          !isValidHex(draft) && isDirty && 'text-destructive',
        )}
      />

      <div className="flex items-center gap-1 ml-1 min-w-10">
        {isSaving ? (
          <span className="text-[10px] text-muted-foreground animate-pulse">...</span>
        ) : isDirty ? (
          <>
            <button onClick={handleSave} disabled={!isValidHex(draft)} className="text-green-600 hover:bg-green-500/10 p-0.5 rounded">
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
