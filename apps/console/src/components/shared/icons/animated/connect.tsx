'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/connect.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface ConnectIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface ConnectIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<ConnectIconHandle>
}

const PLUG_VARIANTS: Variants = {
  normal: {
    x: 0,
    y: 0,
  },
  animate: {
    x: -3,
    y: 3,
  },
}

const SOCKET_VARIANTS: Variants = {
  normal: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 3,
    y: -3,
  },
}

const PATH_VARIANTS = {
  normal: (custom: { x: number; y: number }) => ({
    d: `M${custom.x} ${custom.y} l2.5 -2.5`,
  }),
  animate: (custom: { x: number; y: number }) => ({
    d: `M${custom.x + 2.93} ${custom.y - 2.93} l0.10 -0.10`,
  }),
}

const ConnectIconBase = ({ ref, className, size, ...props }: ConnectIconProps) => {
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
          d="M19 5l3 -3"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          variants={{
            normal: {
              d: 'M19 5l3 -3',
            },
            animate: {
              d: 'M17 7l5 -5',
            },
          }}
        />
        <motion.path
          animate={controls}
          d="m2 22 3-3"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          variants={{
            normal: {
              d: 'm2 22 3-3',
            },
            animate: {
              d: 'm2 22 6-6',
            },
          }}
        />
        <motion.path
          animate={controls}
          d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          variants={SOCKET_VARIANTS}
        />
        <motion.path animate={controls} custom={{ x: 7.5, y: 13.5 }} initial="normal" transition={{ type: 'spring', stiffness: 500, damping: 30 }} variants={PATH_VARIANTS} />
        <motion.path animate={controls} custom={{ x: 10.5, y: 16.5 }} initial="normal" transition={{ type: 'spring', stiffness: 500, damping: 30 }} variants={PATH_VARIANTS} />
        <motion.path animate={controls} d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" transition={{ type: 'spring', stiffness: 500, damping: 30 }} variants={PLUG_VARIANTS} />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const ConnectIcon = Object.assign(ConnectIconBase, { animated: true as const })
