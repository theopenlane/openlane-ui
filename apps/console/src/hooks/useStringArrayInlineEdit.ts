import { useCallback, useRef, useState } from 'react'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'

type Options = {
  draft: string[]
  persisted: string[] | null | undefined
  onCommit: (next: string[]) => void
  onCancel: () => void
}

const useStringArrayInlineEdit = ({ draft, persisted, onCommit, onCancel }: Options) => {
  const [isEditing, setIsEditing] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const beginEditing = useCallback(() => setIsEditing(true), [])

  useClickOutsideWithPortal(
    () => {
      const current = persisted ?? []
      const changed = current.length !== draft.length || current.some((v) => !draft.includes(v))
      if (changed) onCommit(draft)
      setIsEditing(false)
    },
    { refs: { triggerRef, popoverRef }, enabled: isEditing },
  )

  useEscapeKey(
    () => {
      onCancel()
      setIsEditing(false)
    },
    { enabled: isEditing },
  )

  return { isEditing, beginEditing, triggerRef, popoverRef }
}

export default useStringArrayInlineEdit
