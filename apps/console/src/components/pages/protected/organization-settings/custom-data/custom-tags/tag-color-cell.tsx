'use client'

import { Pencil, Check, X } from 'lucide-react'
import { useUpdateTag } from '@/lib/graphql-hooks/tags'
import { cn } from '@repo/ui/lib/utils'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import useClickOutside from '@/hooks/useClickOutside'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TagColorCellProps = {
  tagId: string
  initialColor?: string | null
  disabled?: boolean
}

const normalizeHex = (color?: string | null) => {
  if (!color) return '#64748B'
  return color.startsWith('#') ? color : `#${color}`
}

const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex)

export default function TagColorCell({ tagId, initialColor, disabled }: TagColorCellProps) {
  const { mutateAsync: updateTag, isPending: isMutationPending } = useUpdateTag()
  const { successNotification, errorNotification } = useNotification()

  const initial = useMemo(() => normalizeHex(initialColor), [initialColor])
  const [draft, setDraft] = useState(initial)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const circleRef = useRef<HTMLDivElement | null>(null)

  const isDirty = draft.toLowerCase() !== initial.toLowerCase()
  const canSave = isDirty && !isMutationPending && isValidHex(draft)

  useEffect(() => {
    setDraft(initial)
  }, [initial])

  const handleSave = useCallback(
    async (e?: React.SyntheticEvent) => {
      e?.stopPropagation()
      if (disabled || !canSave) return

      try {
        await updateTag({
          updateTagDefinitionId: tagId,
          input: { color: draft.toUpperCase() },
        })

        successNotification({
          title: 'Success',
          description: 'Tag color updated successfully',
        })
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Update Failed',
          description: errorMessage,
        })
        setDraft(initial)
      }
    },
    [disabled, canSave, draft, tagId, updateTag, initial, successNotification, errorNotification],
  )

  const handleCancel = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.stopPropagation()
      setDraft(initial)
      if (circleRef.current) {
        circleRef.current.style.backgroundColor = initial
      }
    },
    [initial],
  )

  const containerRef = useClickOutside(() => {
    if (isDirty && !isMutationPending) {
      handleCancel()
    }
  })

  const onColorInput = (val: string) => {
    const upperVal = val.toUpperCase()
    if (circleRef.current) {
      circleRef.current.style.backgroundColor = upperVal
    }
    setDraft(upperVal)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'group inline-flex items-center gap-1 px-1.5 py-1 rounded-md transition-all border border-transparent',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted',
        isDirty && 'bg-accent/50',
      )}
      onClick={() => !disabled && !isMutationPending && inputRef.current?.click()}
    >
      <div className="relative flex items-center shrink-0">
        <div
          ref={circleRef}
          className={cn('h-4 w-4 rounded-full border border-border shadow-sm transition-transform', isMutationPending && 'animate-pulse opacity-50', isDirty && 'scale-110')}
          style={{ backgroundColor: isValidHex(draft) ? draft : initial }}
        />

        <input ref={inputRef} type="color" key={initial} defaultValue={initial} className="sr-only h-8" disabled={disabled || isMutationPending} onInput={(e) => onColorInput(e.currentTarget.value)} />
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
        disabled={disabled || isMutationPending}
        className={cn(
          'w-13 bg-transparent border-none p-0 text-xs font-mono uppercase focus:ring-0 focus:outline-none',
          isDirty ? 'text-foreground font-bold' : 'text-muted-foreground',
          !isValidHex(draft) && isDirty && 'text-destructive',
        )}
      />

      <div className="flex items-center gap-1 ml-1 min-w-10">
        {isMutationPending ? (
          <span className="text-[10px] text-muted-foreground animate-pulse italic">Saving...</span>
        ) : isDirty ? (
          <>
            <button
              onClick={handleSave}
              disabled={!isValidHex(draft)}
              className={cn('p-0.5 rounded transition-colors', isValidHex(draft) ? 'text-green-600 hover:bg-green-500/10' : 'text-muted-foreground opacity-50')}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleCancel} className="p-0.5 rounded text-destructive hover:bg-destructive/10 transition-colors">
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
