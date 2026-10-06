import { useEffect, useState, type RefObject } from 'react'

type TElementSize = { width: number; height: number }

type TMeasuredBox = 'border-box' | 'content-box'

const readSize = (entry: ResizeObserverEntry, box: TMeasuredBox): TElementSize => {
  const boxSize = box === 'border-box' ? entry.borderBoxSize?.[0] : entry.contentBoxSize?.[0]
  return boxSize ? { width: boxSize.inlineSize, height: boxSize.blockSize } : { width: entry.contentRect.width, height: entry.contentRect.height }
}

export const useElementSize = <T extends HTMLElement>(ref: RefObject<T | null>, box: TMeasuredBox = 'border-box'): TElementSize => {
  const [size, setSize] = useState<TElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new ResizeObserver(([entry]) => setSize(readSize(entry, box)))
    observer.observe(element, { box })

    return () => observer.disconnect()
  }, [ref, box])

  return size
}
