'use client'

import type { Variants } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/message-square-more.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface MessageSquareMoreIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface MessageSquareMoreIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<MessageSquareMoreIconHandle>
}

const DOT_VARIANTS: Variants = {
  normal: {
    opacity: 1,
  },
  animate: (custom: number) => ({
    opacity: [1, 0, 0, 1, 1, 0, 0, 1],
    transition: {
      opacity: {
        times: [0, 0.1, 0.1 + custom * 0.1, 0.1 + custom * 0.1 + 0.1, 0.5, 0.6, 0.6 + custom * 0.1, 0.6 + custom * 0.1 + 0.1],
        duration: 1.5,
      },
    },
  }),
}

const MessageSquareMoreIconBase = ({ ref, className, size, ...props }: MessageSquareMoreIconProps) => {
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
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <motion.path animate={controls} custom={0} d="M8 10h.01" variants={DOT_VARIANTS} />
        <motion.path animate={controls} custom={1} d="M12 10h.01" variants={DOT_VARIANTS} />
        <motion.path animate={controls} custom={2} d="M16 10h.01" variants={DOT_VARIANTS} />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const MessageSquareMoreIcon = Object.assign(MessageSquareMoreIconBase, { animated: true as const })
