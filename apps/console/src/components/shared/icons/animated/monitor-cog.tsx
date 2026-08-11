'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/monitor-cog.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface MonitorCogIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface MonitorCogIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<MonitorCogIconHandle>
}

const G_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: 360, scale: [1, 1.2, 1] },
}

const MonitorCogIconBase = ({ ref, className, size, ...props }: MonitorCogIconProps) => {
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
        style={{ overflow: 'visible' }}
        viewBox="0 0 24 24"
        width={size ?? '100%'}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 17v4" />
        <path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
        <path d="M8 21h8" />

        <motion.g animate={controls} transition={{ duration: 1, ease: 'easeInOut' }} variants={G_VARIANTS}>
          <path d="m14.305 7.53.923-.382" />
          <path d="m15.228 4.852-.923-.383" />
          <path d="m16.852 3.228-.383-.924" />
          <path d="m16.852 8.772-.383.923" />
          <path d="m19.148 3.228.383-.924" />
          <path d="m19.53 9.696-.382-.924" />
          <path d="m20.772 4.852.924-.383" />
          <path d="m20.772 7.148.924.383" />
          <circle cx="18" cy="6" r="3" />
        </motion.g>
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const MonitorCogIcon = Object.assign(MonitorCogIconBase, { animated: true as const })
