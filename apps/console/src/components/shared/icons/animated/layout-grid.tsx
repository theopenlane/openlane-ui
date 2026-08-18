'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/layout-grid.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface LayoutGridIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface LayoutGridIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<LayoutGridIconHandle>
}

const RECT_1_VARIANTS: Variants = {
  normal: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, 11, 11, 0],
    translateY: [0, 0, 0, 0],
    transition: { duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 0.6, 1] },
  },
}

const RECT_2_VARIANTS: Variants = {
  normal: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, 0, 0, 0],
    translateY: [0, 11, 11, 0],
    transition: { duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 0.6, 1] },
  },
}

const RECT_3_VARIANTS: Variants = {
  normal: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, -11, -11, 0],
    translateY: [0, 0, 0, 0],
    transition: { duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 0.6, 1] },
  },
}

const RECT_4_VARIANTS: Variants = {
  normal: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, 0, 0, 0],
    translateY: [0, -11, -11, 0],
    transition: { duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 0.6, 1] },
  },
}

const LayoutGridIconBase = ({ ref, className, size, ...props }: LayoutGridIconProps) => {
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
        <motion.rect animate={controls} height="7" initial="normal" rx="1" variants={RECT_1_VARIANTS} width="7" x="3" y="3" />
        <motion.rect animate={controls} height="7" initial="normal" rx="1" variants={RECT_2_VARIANTS} width="7" x="14" y="3" />
        <motion.rect animate={controls} height="7" initial="normal" rx="1" variants={RECT_3_VARIANTS} width="7" x="14" y="14" />
        <motion.rect animate={controls} height="7" initial="normal" rx="1" variants={RECT_4_VARIANTS} width="7" x="3" y="14" />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const LayoutGridIcon = Object.assign(LayoutGridIconBase, { animated: true as const })
