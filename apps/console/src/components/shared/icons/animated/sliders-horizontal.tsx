'use client'

import type { Transition } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/sliders-horizontal.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface SlidersHorizontalIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface SlidersHorizontalIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<SlidersHorizontalIconHandle>
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 12,
  mass: 0.4,
}

const SlidersHorizontalIconBase = ({ ref, className, size, ...props }: SlidersHorizontalIconProps) => {
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
        <motion.line
          animate={controls}
          initial={false}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x2: 14,
            },
            animate: {
              x2: 10,
            },
          }}
          x1="21"
          x2="14"
          y1="4"
          y2="4"
        />
        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x1: 10,
            },
            animate: {
              x1: 5,
            },
          }}
          x1="10"
          x2="3"
          y1="4"
          y2="4"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x2: 12,
            },
            animate: {
              x2: 18,
            },
          }}
          x1="21"
          x2="12"
          y1="12"
          y2="12"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x1: 8,
            },
            animate: {
              x1: 13,
            },
          }}
          x1="8"
          x2="3"
          y1="12"
          y2="12"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x2: 12,
            },
            animate: {
              x2: 4,
            },
          }}
          x1="3"
          x2="12"
          y1="20"
          y2="20"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x1: 16,
            },
            animate: {
              x1: 8,
            },
          }}
          x1="16"
          x2="21"
          y1="20"
          y2="20"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x1: 14,
              x2: 14,
            },
            animate: {
              x1: 9,
              x2: 9,
            },
          }}
          x1="14"
          x2="14"
          y1="2"
          y2="6"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x1: 8,
              x2: 8,
            },
            animate: {
              x1: 14,
              x2: 14,
            },
          }}
          x1="8"
          x2="8"
          y1="10"
          y2="14"
        />

        <motion.line
          animate={controls}
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: {
              x1: 16,
              x2: 16,
            },
            animate: {
              x1: 8,
              x2: 8,
            },
          }}
          x1="16"
          x2="16"
          y1="18"
          y2="22"
        />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const SlidersHorizontalIcon = Object.assign(SlidersHorizontalIconBase, { animated: true as const })
