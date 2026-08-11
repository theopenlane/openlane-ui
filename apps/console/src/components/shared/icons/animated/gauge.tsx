'use client'

import type { Transition } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/gauge.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface GaugeIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface GaugeIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<GaugeIconHandle>
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 160,
  damping: 17,
  mass: 1,
}

const GaugeIconBase = ({ ref, className, size, ...props }: GaugeIconProps) => {
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
        <motion.path
          animate={controls}
          d="m12 14 4-4"
          transition={DEFAULT_TRANSITION}
          variants={{
            animate: { translateX: 0.5, translateY: 3, rotate: 72 },
            normal: {
              translateX: 0,
              rotate: 0,
              translateY: 0,
            },
          }}
        />
        <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const GaugeIcon = Object.assign(GaugeIconBase, { animated: true as const })
