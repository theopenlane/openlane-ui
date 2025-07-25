import { useEffect, RefObject } from 'react'

const useClickOutsideWithPortal = <T extends HTMLElement = HTMLElement>(callback: () => void, refs: RefObject<T | null>[]) => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const isInside = refs.some((ref) => ref.current?.contains(event.target as Node))

      if (!isInside) {
        callback()
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [callback, refs])
}

export default useClickOutsideWithPortal
