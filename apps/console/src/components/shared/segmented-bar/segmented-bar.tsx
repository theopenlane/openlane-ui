import React from 'react'
import { cn } from '@repo/ui/lib/utils'

export type TBarSegment = { key: string; share: number; color: string; dimmed?: boolean }

type TSegmentedBarProps = {
  segments: TBarSegment[]
  className?: string
} & Pick<React.HTMLAttributes<HTMLDivElement>, 'role' | 'aria-label' | 'aria-hidden'>

export const SegmentedBar: React.FC<TSegmentedBarProps> = ({ segments, className, ...props }) => (
  <div className={cn('flex h-2 w-full gap-0.5 overflow-hidden rounded-full', className)} {...props}>
    {segments
      .filter((segment) => segment.share > 0)
      .map((segment) => (
        <span key={segment.key} className={cn('h-full transition-opacity', segment.dimmed && 'opacity-40')} style={{ width: `${segment.share * 100}%`, backgroundColor: segment.color }} />
      ))}
  </div>
)
