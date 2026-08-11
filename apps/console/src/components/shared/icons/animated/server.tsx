'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/server.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface ServerIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface ServerIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<ServerIconHandle>
}

const TOP_RECT_VARIANTS: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, 12, 12, 0],
    transition: {
      duration: 0.9,
      ease: 'easeInOut',
      repeat: 1,
      times: [0, 0.35, 0.65, 1],
    },
  },
}

const BOTTOM_RECT_VARIANTS: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -12, -12, 0],
    transition: {
      duration: 0.9,
      ease: 'easeInOut',
      repeat: 1,
      times: [0, 0.35, 0.65, 1],
    },
  },
}

const ServerIconBase = ({ ref, className, size, ...props }: ServerIconProps) => {
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
        className="overflow-visible"
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
        <motion.g animate={controls} initial="normal" variants={TOP_RECT_VARIANTS}>
          <rect height="8" rx="2" ry="2" width="20" x="2" y="2" />
          <line x1="6" x2="10" y1="6" y2="6" />
        </motion.g>
        <motion.g animate={controls} initial="normal" variants={BOTTOM_RECT_VARIANTS}>
          <rect height="8" rx="2" ry="2" width="20" x="2" y="14" />
          <line x1="6" x2="10" y1="18" y2="18" />
        </motion.g>
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const ServerIcon = Object.assign(ServerIconBase, { animated: true as const })
