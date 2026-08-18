'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/scan-text.json — the text lines erase and redraw with a stagger
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface ScanTextIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface ScanTextIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<ScanTextIconHandle>
}

const FRAME_VARIANTS: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 1 },
}

const LINE_VARIANTS: Variants = {
  visible: { pathLength: 1, opacity: 1 },
  hidden: { pathLength: 0, opacity: 0 },
}

const ScanTextIconBase = ({ ref, className, size, ...props }: ScanTextIconProps) => {
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
        <motion.path d="M3 7V5a2 2 0 0 1 2-2h2" variants={FRAME_VARIANTS} />
        <motion.path d="M17 3h2a2 2 0 0 1 2 2v2" variants={FRAME_VARIANTS} />
        <motion.path d="M21 17v2a2 2 0 0 1-2 2h-2" variants={FRAME_VARIANTS} />
        <motion.path d="M7 21H5a2 2 0 0 1-2-2v-2" variants={FRAME_VARIANTS} />
        <motion.path animate={controls} custom={0} d="M7 8h8" initial="visible" variants={LINE_VARIANTS} />
        <motion.path animate={controls} custom={1} d="M7 12h10" initial="visible" variants={LINE_VARIANTS} />
        <motion.path animate={controls} custom={2} d="M7 16h6" initial="visible" variants={LINE_VARIANTS} />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const ScanTextIcon = Object.assign(ScanTextIconBase, { animated: true as const })
