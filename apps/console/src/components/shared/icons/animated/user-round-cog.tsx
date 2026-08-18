'use client'

import { motion, useAnimation, type Variants } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/user-round-cog.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface UserRoundCogIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface UserRoundCogIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<UserRoundCogIconHandle>
}

const COG_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: 360, scale: [1, 1.2, 1] },
}

const UserRoundCogIconBase = ({ ref, className, size, ...props }: UserRoundCogIconProps) => {
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
        width={size ?? '100%'}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 21a8 8 0 0 1 10.434-7.62" />
        <circle cx="10" cy="8" r="5" />
        {/* upstream passes { transition: {...} } as the transition prop, which motion ignores — inline it correctly */}
        <motion.g animate={controls} transition={{ duration: 1, ease: 'easeInOut' }} variants={COG_VARIANTS}>
          <circle cx="18" cy="18" r="3" />

          <path d="m14.305 19.53.923-.382" />
          <path d="m15.228 16.852-.923-.383" />
          <path d="m16.852 15.228-.383-.923" />
          <path d="m16.852 20.772-.383.924" />
          <path d="m19.148 15.228.383-.923" />
          <path d="m19.53 21.696-.382-.924" />
          <path d="m20.772 16.852.924-.383" />
          <path d="m20.772 19.148.924.383" />
        </motion.g>
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const UserRoundCogIcon = Object.assign(UserRoundCogIconBase, { animated: true as const })
