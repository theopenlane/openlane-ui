'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/sparkles.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface SparklesIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface SparklesIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<SparklesIconHandle>
}

const SPARKLE_VARIANTS: Variants = {
  initial: {
    y: 0,
    fill: 'none',
  },
  hover: {
    y: [0, -1, 0, 0],
    fill: 'currentColor',
    transition: {
      duration: 1,
      bounce: 0.3,
    },
  },
}

const STAR_VARIANTS: Variants = {
  initial: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  blink: () => ({
    opacity: [0, 1, 0, 0, 0, 0, 1],
    transition: {
      duration: 2,
      type: 'spring',
      stiffness: 70,
      damping: 10,
      mass: 0.4,
    },
  }),
}

const SparklesIconBase = ({ ref, className, size, ...props }: SparklesIconProps) => {
  const starControls = useAnimation()
  const sparkleControls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasGroupParentRef = useRef(false)

  const startAnimation = useCallback(() => {
    sparkleControls.start('hover')
    starControls.start('blink', { delay: 1 })
  }, [sparkleControls, starControls])

  const stopAnimation = useCallback(() => {
    sparkleControls.start('initial')
    starControls.start('initial')
  }, [sparkleControls, starControls])

  useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }))

  useEffect(() => {
    const row = containerRef.current?.closest('.group')
    if (!row) return
    hasGroupParentRef.current = true

    row.addEventListener('mouseenter', startAnimation)
    row.addEventListener('mouseleave', stopAnimation)
    return () => {
      row.removeEventListener('mouseenter', startAnimation)
      row.removeEventListener('mouseleave', stopAnimation)
    }
  }, [startAnimation, stopAnimation])

  return (
    <div
      ref={containerRef}
      className={cn('flex shrink-0 items-center justify-center', className)}
      onMouseEnter={() => !hasGroupParentRef.current && startAnimation()}
      onMouseLeave={() => !hasGroupParentRef.current && stopAnimation()}
      {...props}
    >
      <svg
        fill="none"
        height={size ?? '100%'}
        width={size ?? '100%'}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          animate={sparkleControls}
          d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
          variants={SPARKLE_VARIANTS}
        />
        <motion.path animate={starControls} d="M20 3v4" variants={STAR_VARIANTS} />
        <motion.path animate={starControls} d="M22 5h-4" variants={STAR_VARIANTS} />
        <motion.path animate={starControls} d="M4 17v2" variants={STAR_VARIANTS} />
        <motion.path animate={starControls} d="M5 18H3" variants={STAR_VARIANTS} />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const SparklesIcon = Object.assign(SparklesIconBase, { animated: true as const })
