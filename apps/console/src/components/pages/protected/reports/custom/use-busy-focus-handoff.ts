import { useEffect, useRef } from 'react'

const isFocusOn = (...elements: (HTMLElement | null)[]) => elements.includes(document.activeElement instanceof HTMLElement ? document.activeElement : null)

export const useBusyFocusHandoff = (busy: boolean) => {
  const startRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const previousBusyRef = useRef(busy)

  useEffect(() => {
    if (previousBusyRef.current === busy) return
    previousBusyRef.current = busy

    const from = busy ? startRef.current : cancelRef.current
    if (isFocusOn(from, document.body, null)) (busy ? cancelRef : startRef).current?.focus()
  }, [busy])

  return { startRef, cancelRef }
}
