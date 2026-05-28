'use client'

import { useRef, useState, useCallback, type ReactNode } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '../tooltip'
import { cn } from '../../lib/utils'

interface TruncatedCellProps {
  children: ReactNode
  className?: string
}

export const TruncatedCell = ({ children, className }: TruncatedCellProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const handleMouseEnter = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
      setOpen(true)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div ref={ref} className={cn('truncate', className)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {children}
        </div>
      </TooltipTrigger>
      {open && (
        <TooltipContent side="top" className="max-w-sm whitespace-normal wrap-break-word">
          {ref.current?.textContent}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
