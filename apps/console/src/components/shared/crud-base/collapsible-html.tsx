'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleHtmlProps {
  children: React.ReactNode
}

const COLLAPSED_MAX_HEIGHT = 50

const CollapsibleHtml: React.FC<CollapsibleHtmlProps> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkTruncation = () => {
      if (!containerRef.current) return
      const el = containerRef.current
      const prevMax = el.style.maxHeight
      el.style.maxHeight = 'none'
      const fullHeight = el.scrollHeight
      el.style.maxHeight = prevMax
      setIsTruncated(fullHeight > COLLAPSED_MAX_HEIGHT + 4)
    }

    const timer = setTimeout(checkTruncation, 150)
    return () => clearTimeout(timer)
  }, [children])

  return (
    <div>
      <div ref={containerRef} className="relative overflow-hidden transition-[max-height] duration-300 ease-in-out" style={{ maxHeight: isExpanded ? '9999px' : `${COLLAPSED_MAX_HEIGHT}px` }}>
        {children}
        {!isExpanded && isTruncated && <div className="absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-card to-transparent pointer-events-none" />}
      </div>
      {(isTruncated || isExpanded) && (
        <button type="button" className="mt-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors" onClick={() => setIsExpanded((v) => !v)}>
          {isExpanded ? (
            <>
              <ChevronUp size={12} /> Show Less
            </>
          ) : (
            <>
              <ChevronDown size={12} /> Show More
            </>
          )}
        </button>
      )}
    </div>
  )
}

export { CollapsibleHtml }
