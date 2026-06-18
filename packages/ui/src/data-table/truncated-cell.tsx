'use client'

import { useRef, useState, useCallback, type ReactNode } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '../tooltip'
import { cn } from '../../lib/utils'

interface TruncatedCellProps {
  children: ReactNode
  className?: string
  tooltipClassName?: string
  tooltipContent?: ReactNode
  lineClamp?: number
}

export const TruncatedCell = ({ children, className, tooltipClassName, tooltipContent, lineClamp }: TruncatedCellProps) => {
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

  const clampStyle = lineClamp ? { display: '-webkit-box', WebkitBoxOrient: 'vertical' as const, WebkitLineClamp: lineClamp } : undefined

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div ref={ref} className={cn(lineClamp ? 'overflow-hidden' : 'truncate', className)} style={clampStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {children}
        </div>
      </TooltipTrigger>
      {open && (
        <TooltipContent side="top" className={cn('max-w-sm whitespace-normal wrap-break-word', tooltipClassName)}>
          {tooltipContent ?? ref.current?.textContent}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
