'use client'

import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/workflow.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface WorkflowIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface WorkflowIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<WorkflowIconHandle>
}

const WorkflowIconBase = ({ ref, className, size, ...props }: WorkflowIconProps) => {
  const controls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasGroupParentRef = useRef(false)

  useImperativeHandle(ref, () => ({
    startAnimation: () => controls.start('animate'),
    stopAnimation: () => controls.start('normal'),
  }))

  useEffect(() => {
    const row = containerRef.current?.closest('.group')
    if (!row) return
    hasGroupParentRef.current = true

    const enter = () => controls.start('animate')
    const leave = () => controls.start('normal')
    row.addEventListener('mouseenter', enter)
    row.addEventListener('mouseleave', leave)
    return () => {
      row.removeEventListener('mouseenter', enter)
      row.removeEventListener('mouseleave', leave)
    }
  }, [controls])

  return (
    <div
      ref={containerRef}
      className={cn('flex shrink-0 items-center justify-center', className)}
      onMouseEnter={() => !hasGroupParentRef.current && controls.start('animate')}
      onMouseLeave={() => !hasGroupParentRef.current && controls.start('normal')}
      {...props}
    >
      <svg
        fill="none"
        height={size ?? '100%'}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size ?? '100%'}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* the two boxes stay static; the ghost path keeps the connector visible while it redraws */}
        <rect height="8" rx="2" width="8" x="3" y="3" />
        <rect height="8" rx="2" width="8" x="13" y="13" />
        <path d="M7 11v4a2 2 0 0 0 2 2h4" opacity="0.5" />
        <motion.path
          animate={controls}
          d="M7 11v4a2 2 0 0 0 2 2h4"
          transition={{ duration: 0.5 }}
          variants={{
            normal: {
              pathLength: 1,
              pathOffset: 0,
            },
            animate: {
              pathLength: [0, 1],
              pathOffset: [1, 0],
            },
          }}
        />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const WorkflowIcon = Object.assign(WorkflowIconBase, { animated: true as const })
