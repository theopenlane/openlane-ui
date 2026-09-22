import { useEffect, useMemo, useState, type CSSProperties } from 'react'

export const FIXED_TOOLBAR_TOP_VAR = '--fixed-toolbar-top'

export const useFixedToolbarOffset = () => {
  const [stickyChrome, setStickyChrome] = useState<HTMLElement | null>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!stickyChrome) {
      setHeight(0)
      return
    }

    const observer = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height))
    observer.observe(stickyChrome)
    setHeight(stickyChrome.getBoundingClientRect().height)

    return () => observer.disconnect()
  }, [stickyChrome])

  const fixedToolbarOffset = useMemo(() => ({ [FIXED_TOOLBAR_TOP_VAR]: `${height}px` }) as CSSProperties, [height])

  return { stickyChromeRef: setStickyChrome, fixedToolbarOffset }
}
