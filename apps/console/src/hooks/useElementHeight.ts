import { useEffect, useState, type RefObject } from 'react'

export function useElementHeight<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height))
    observer.observe(element)
    setHeight(element.getBoundingClientRect().height)

    return () => observer.disconnect()
  }, [ref])

  return height
}
