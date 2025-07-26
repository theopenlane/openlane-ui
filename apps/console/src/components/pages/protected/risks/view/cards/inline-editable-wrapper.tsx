'use client'

import React, { useRef, useEffect } from 'react'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'

type Props<T extends HTMLElement = HTMLElement> = {
  children: React.ReactNode
  onClose: () => void
  enabled?: boolean
  autoFocusRef?: React.RefObject<T> | null
}

const InlineEditableWrapper = <T extends HTMLElement = HTMLElement>({ children, onClose, enabled = true, autoFocusRef }: Props<T>) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useClickOutsideWithPortal(
    () => {
      onClose()
    },
    { refs: { containerRef, triggerRef }, enabled },
  )

  useEscapeKey(
    () => {
      if (enabled) onClose()
    },
    { enabled },
  )

  useEffect(() => {
    if (enabled && autoFocusRef?.current) {
      autoFocusRef.current.focus?.()
    }
  }, [enabled, autoFocusRef])

  return (
    <div ref={triggerRef}>
      <div ref={containerRef}>{children}</div>
    </div>
  )
}

export default InlineEditableWrapper
