'use client'

import type { Transition, Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/history.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface HistoryIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface HistoryIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<HistoryIconHandle>
}

const ARROW_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 25,
}

const ARROW_VARIANTS: Variants = {
  normal: {
    rotate: '0deg',
  },
  animate: {
    rotate: '-50deg',
  },
}

const HAND_TRANSITION: Transition = {
  duration: 0.6,
  ease: [0.4, 0, 0.2, 1],
}

const HAND_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    originX: '0%',
    originY: '100%',
  },
  animate: {
    rotate: -360,
    originX: '0%',
    originY: '100%',
  },
}

const MINUTE_HAND_TRANSITION: Transition = {
  duration: 0.5,
  ease: 'easeInOut',
}

const MINUTE_HAND_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    originX: '0%',
    originY: '0%',
  },
  animate: {
    rotate: -45,
    originX: '0%',
    originY: '0%',
  },
}

const HistoryIconBase = ({ ref, className, size, ...props }: HistoryIconProps) => {
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
        <motion.g animate={controls} transition={ARROW_TRANSITION} variants={ARROW_VARIANTS}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </motion.g>
        <motion.line animate={controls} initial="normal" transition={HAND_TRANSITION} variants={HAND_VARIANTS} x1="12" x2="12" y1="12" y2="7" />
        <motion.line animate={controls} initial="normal" transition={MINUTE_HAND_TRANSITION} variants={MINUTE_HAND_VARIANTS} x1="12" x2="16" y1="12" y2="14" />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const HistoryIcon = Object.assign(HistoryIconBase, { animated: true as const })
