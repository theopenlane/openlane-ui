'use client'

import { motion, useAnimation, type Variants } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/server-cog.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface ServerCogIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface ServerCogIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<ServerCogIconHandle>
}

const COG_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: 360, scale: [1, 1.2, 1] },
}

const ServerCogIconBase = ({ ref, className, size, ...props }: ServerCogIconProps) => {
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
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size ?? '100%'}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.g animate={controls} transition={{ duration: 1, ease: 'easeInOut' }} variants={COG_VARIANTS}>
          <path d="m10.852 14.772-.383.923" />
          <path d="M13.148 14.772a3 3 0 1 0-2.296-5.544l-.383-.923" />
          <path d="m13.148 9.228.383-.923" />
          <path d="m13.53 15.696-.382-.924a3 3 0 1 1-2.296-5.544" />
          <path d="m14.772 10.852.923-.383" />
          <path d="m14.772 13.148.923.383" />
          <path d="m9.228 10.852-.923-.383" />
          <path d="m9.228 13.148-.923.383" />
        </motion.g>

        <path d="M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5" />
        <path d="M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5" />
        <path d="M6 18h.01" />
        <path d="M6 6h.01" />
      </motion.svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const ServerCogIcon = Object.assign(ServerCogIconBase, { animated: true as const })
