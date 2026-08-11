'use client'

import { motion, useAnimation, type Variants } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/users-round.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface UsersRoundIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface UsersRoundIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<UsersRoundIconHandle>
}

const PATH_VARIANTS: Variants = {
  normal: {
    translateX: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 13,
    },
  },
  animate: {
    translateX: [-4, 0],
    opacity: [0, 1],
    transition: {
      delay: 0.1,
      type: 'spring',
      stiffness: 200,
      damping: 13,
    },
  },
}

const UsersRoundIconBase = ({ ref, className, size, ...props }: UsersRoundIconProps) => {
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
        <path d="M18 21a8 8 0 0 0-16 0" />
        <circle cx="10" cy="8" r="5" />
        <motion.path animate={controls} d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" initial="normal" variants={PATH_VARIANTS} />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const UsersRoundIcon = Object.assign(UsersRoundIconBase, { animated: true as const })
