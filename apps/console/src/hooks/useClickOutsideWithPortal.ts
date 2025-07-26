import { useEffect, RefObject } from 'react'

type RefRecord<T extends HTMLElement = HTMLElement> = Record<string, RefObject<T | null>>

type UseClickOutsideWithPortalOptions<T extends HTMLElement = HTMLElement> = {
  refs: RefRecord<T>
  enabled?: boolean
}

function useClickOutsideWithPortal<T extends HTMLElement = HTMLElement>(callback: () => void, { refs, enabled = true }: UseClickOutsideWithPortalOptions<T>) {
  const refArray = Object.values(refs)

  useEffect(() => {
    if (!enabled) return

    const handleClick = (event: MouseEvent) => {
      const isInside = refArray.some((ref) => ref.current?.contains(event.target as Node))
      if (!isInside) callback()
    }

    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [callback, enabled, refArray])
}

export default useClickOutsideWithPortal
