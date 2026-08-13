'use client'

import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/route.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface RouteIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface RouteIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<RouteIconHandle>
}

const RouteIconBase = ({ ref, className, size, ...props }: RouteIconProps) => {
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
        {/* endpoint circles stay static; the ghost path keeps the route visible while it redraws */}
        <circle cx="6" cy="19" r="3" />
        <circle cx="18" cy="5" r="3" />
        <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" opacity="0.5" />
        <motion.path
          animate={controls}
          d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"
          transition={{ duration: 0.7 }}
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
export const RouteIcon = Object.assign(RouteIconBase, { animated: true as const })
