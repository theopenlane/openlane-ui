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
  portal?: boolean
}

export const TruncatedCell = ({ children, className, tooltipClassName, tooltipContent, lineClamp, portal }: TruncatedCellProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(false)
      return
    }
    const el = ref.current
    setOpen(!!el && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight))
  }, [])

  const clampStyle = lineClamp ? { display: '-webkit-box', WebkitBoxOrient: 'vertical' as const, WebkitLineClamp: lineClamp } : undefined
  // a clamped line cuts marks mid-height, leaving a stray sliver of their  background, so highlights are dropped where the text is truncated
  const clampedMarks = lineClamp ? '[&_mark]:bg-transparent [&_mark]:text-inherit' : ''

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <div ref={ref} className={cn(lineClamp ? 'overflow-hidden whitespace-normal' : 'truncate', clampedMarks, className)} style={clampStyle}>
          {children}
        </div>
      </TooltipTrigger>
      {open && (
        <TooltipContent side="top" portal={portal} className={cn('max-w-sm whitespace-normal wrap-break-word', tooltipClassName)}>
          {tooltipContent ?? ref.current?.textContent}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
