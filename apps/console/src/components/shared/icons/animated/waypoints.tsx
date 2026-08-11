'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/waypoints.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface WaypointsIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface WaypointsIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<WaypointsIconHandle>
}

const VARIANTS: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: (custom: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      delay: 0.15 * custom,
      opacity: { delay: 0.1 * custom },
    },
  }),
}

const WaypointsIconBase = ({ ref, className, size, ...props }: WaypointsIconProps) => {
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
        <motion.circle animate={controls} custom={0} cx="12" cy="4.5" r="2.5" variants={VARIANTS} />
        <motion.path animate={controls} custom={1} d="m10.2 6.3-3.9 3.9" variants={VARIANTS} />
        <motion.circle animate={controls} custom={0} cx="4.5" cy="12" r="2.5" variants={VARIANTS} />
        <motion.path animate={controls} custom={2} d="M7 12h10" variants={VARIANTS} />
        <motion.circle animate={controls} custom={0} cx="19.5" cy="12" r="2.5" variants={VARIANTS} />
        <motion.path animate={controls} custom={3} d="m13.8 17.7 3.9-3.9" variants={VARIANTS} />
        <motion.circle animate={controls} custom={0} cx="12" cy="19.5" r="2.5" variants={VARIANTS} />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const WaypointsIcon = Object.assign(WaypointsIconBase, { animated: true as const })
