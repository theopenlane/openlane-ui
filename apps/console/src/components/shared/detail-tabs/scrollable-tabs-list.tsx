'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

type ScrollableTabsListProps = {
  children: React.ReactNode
  trailing?: React.ReactNode
  end?: React.ReactNode
}

const ScrollableTabsList: React.FC<ScrollableTabsListProps> = ({ children, trailing, end }) => {
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const container = tabsScrollRef.current
    if (!container) return

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }

    updateScrollState()

    const onScroll = () => updateScrollState()
    container.addEventListener('scroll', onScroll)

    const resizeObserver = new ResizeObserver(() => updateScrollState())
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', onScroll)
      resizeObserver.disconnect()
    }
  }, [])

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsScrollRef.current
    if (!container) return
    const delta = Math.round(container.clientWidth * 0.7)
    const offset = direction === 'left' ? -delta : delta
    container.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className="relative mb-1 flex items-center gap-2">
      <div className="relative min-w-0">
        {canScrollLeft && (
          <Button type="button" variant="secondary" onClick={() => scrollTabs('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0" aria-label="Scroll tabs left">
            <ArrowLeft size={16} />
          </Button>
        )}
        <div ref={tabsScrollRef} className="relative overflow-x-auto overflow-y-hidden no-scrollbar pb-1">
          {children}
        </div>
        {canScrollRight && (
          <Button type="button" variant="secondary" onClick={() => scrollTabs('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0" aria-label="Scroll tabs right">
            <ArrowRight size={16} />
          </Button>
        )}
      </div>
      {trailing && <div className="mb-px shrink-0">{trailing}</div>}
      {end && <div className="mb-px ml-auto shrink-0">{end}</div>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0.5 left-0.5 h-px shadow-[inset_0_-1px_0_0_var(--color-border)]" />
    </div>
  )
}

export default ScrollableTabsList
