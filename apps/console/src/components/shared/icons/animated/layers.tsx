'use client'

import type { Transition } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/layers.json — the lower layers lift up then settle back
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface LayersIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface LayersIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<LayersIconHandle>
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 14,
  mass: 1,
}

const LayersIconBase = ({ ref, className, size, ...props }: LayersIconProps) => {
  const controls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasGroupParentRef = useRef(false)

  const startAnimation = useCallback(async () => {
    await controls.start('firstState')
    await controls.start('secondState')
  }, [controls])

  const stopAnimation = useCallback(() => {
    controls.start('normal')
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
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <motion.path
          animate={controls}
          d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { y: 0 },
            firstState: { y: -9 },
            secondState: { y: 0 },
          }}
        />
        <motion.path
          animate={controls}
          d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { y: 0 },
            firstState: { y: -5 },
            secondState: { y: 0 },
          }}
        />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const LayersIcon = Object.assign(LayersIconBase, { animated: true as const })
