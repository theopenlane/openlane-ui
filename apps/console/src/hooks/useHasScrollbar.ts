import { useEffect, useState } from 'react'

export function useHasScrollbar(deps: unknown[] = []) {
  const [hasScrollbar, setHasScrollbar] = useState(false)

  useEffect(() => {
    let rafId = 0
    const checkScrollbar = () => {
      const container = document.querySelector('[data-scroll-container="main"]') as HTMLElement | null
      if (!container) {
        const root = document.documentElement
        setHasScrollbar(root.scrollHeight > root.clientHeight)
        return
      }
      setHasScrollbar(container.scrollHeight > container.clientHeight)
    }

    const scheduleCheck = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        checkScrollbar()
      })
    }

    const container = document.querySelector('[data-scroll-container="main"]') as HTMLElement | null
    const resizeObserver = container ? new ResizeObserver(scheduleCheck) : null

    if (container) {
      resizeObserver?.observe(container)
    }

    checkScrollbar()
    window.addEventListener('resize', scheduleCheck)
    return () => {
      window.removeEventListener('resize', scheduleCheck)
      resizeObserver?.disconnect()
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return hasScrollbar
}
