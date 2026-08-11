'use client'

import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/lock-keyhole.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface LockKeyholeIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface LockKeyholeIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<LockKeyholeIconHandle>
}

const LockKeyholeIconBase = ({ ref, className, size, ...props }: LockKeyholeIconProps) => {
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
      <motion.svg
        animate={controls}
        fill="none"
        height={size ?? '100%'}
        initial="normal"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        transition={{
          duration: 1,
          ease: [0.4, 0, 0.2, 1],
        }}
        variants={{
          normal: {
            rotate: 0,
            scale: 1,
          },
          animate: {
            rotate: [-3, 1, -2, 0],
            scale: [0.95, 1.05, 0.98, 1],
          },
        }}
        viewBox="0 0 24 24"
        width={size ?? '100%'}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="16" r="1" />
        <rect height="12" rx="2" width="18" x="3" y="10" />
        <motion.path
          animate={controls}
          d="M7 10V7a5 5 0 0 1 10 0v3"
          initial="normal"
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          variants={{
            normal: {
              pathLength: 1,
            },
            animate: {
              pathLength: 0.7,
            },
          }}
        />
      </motion.svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const LockKeyholeIcon = Object.assign(LockKeyholeIconBase, { animated: true as const })
