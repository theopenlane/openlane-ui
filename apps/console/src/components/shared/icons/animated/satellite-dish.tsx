'use client'

import { motion, useAnimation, type Variants } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/satellite-dish.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface SatelliteDishIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface SatelliteDishIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<SatelliteDishIconHandle>
}

const SATELLITE_DISH_VARIANTS: Variants = {
  normal: {
    y: 0,
    rotate: 0,
  },
  animate: {
    y: [0, 1, 2, 0],
    rotate: [0, -15, 0],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
}

const PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    transition: {
      duration: 1.1,
    },
  },
  fadeOut: {
    opacity: 0,
    transition: { duration: 1.1 },
  },
  fadeIn: (i: number) => ({
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: i * 0.1,
    },
  }),
}

const SatelliteDishIconBase = ({ ref, className, size, ...props }: SatelliteDishIconProps) => {
  const svgControls = useAnimation()
  const pathControls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasGroupParentRef = useRef(false)

  const startAnimation = useCallback(async () => {
    svgControls.start('animate')
    await pathControls.start('fadeOut')
    pathControls.start('fadeIn')
  }, [pathControls, svgControls])

  const stopAnimation = useCallback(() => {
    svgControls.start('normal')
    pathControls.start('normal')
  }, [pathControls, svgControls])

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
      <motion.svg
        animate={svgControls}
        fill="none"
        height={size ?? '100%'}
        width={size ?? '100%'}
        initial="normal"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        variants={SATELLITE_DISH_VARIANTS}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 10a7.31 7.31 0 0 0 10 10Z" />
        <path d="m9 15 3-3" />
        <motion.path animate={pathControls} custom={1} d="M17 13a6 6 0 0 0-6-6" initial={{ opacity: 1 }} variants={PATH_VARIANTS} />
        <motion.path animate={pathControls} custom={2} d="M21 13A10 10 0 0 0 11 3" initial={{ opacity: 1 }} variants={PATH_VARIANTS} />
      </motion.svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const SatelliteDishIcon = Object.assign(SatelliteDishIconBase, { animated: true as const })
