'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/chart-bar-decreasing.json — the bars erase and redraw with a stagger
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface ChartBarDecreasingIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface ChartBarDecreasingIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<ChartBarDecreasingIconHandle>
}

const LINE_VARIANTS: Variants = {
  visible: { pathLength: 1, opacity: 1 },
  hidden: { pathLength: 0, opacity: 0 },
}

const ChartBarDecreasingIconBase = ({ ref, className, size, ...props }: ChartBarDecreasingIconProps) => {
  const controls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasGroupParentRef = useRef(false)

  const startAnimation = useCallback(async () => {
    await controls.start((i) => ({
      pathLength: 0,
      opacity: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }))
    await controls.start((i) => ({
      pathLength: 1,
      opacity: 1,
      transition: { delay: i * 0.1, duration: 0.3 },
    }))
  }, [controls])

  const stopAnimation = useCallback(() => {
    controls.start('visible')
  }, [controls])

  useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }))

  useEffect(() => {
    const row = containerRef.current?.closest('.group')
    if (!row) return
    hasGroupParentRef.current = true

    const enter = () => startAnimation()
    row.addEventListener('mouseenter', enter)
    row.addEventListener('mouseleave', stopAnimation)
    return () => {
      row.removeEventListener('mouseenter', enter)
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
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <motion.path animate={controls} custom={1} d="M7 11h8" initial="visible" variants={LINE_VARIANTS} />
        <motion.path animate={controls} custom={2} d="M7 16h3" initial="visible" variants={LINE_VARIANTS} />
        <motion.path animate={controls} custom={0} d="M7 6h12" initial="visible" variants={LINE_VARIANTS} />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const ChartBarDecreasingIcon = Object.assign(ChartBarDecreasingIconBase, { animated: true as const })
