'use client'

import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/layout-panel-top.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface LayoutPanelTopIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface LayoutPanelTopIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<LayoutPanelTopIconHandle>
}

const LayoutPanelTopIconBase = ({ ref, className, size, ...props }: LayoutPanelTopIconProps) => {
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
        <motion.rect
          animate={controls}
          height="7"
          initial="normal"
          rx="1"
          variants={{
            normal: { opacity: 1, translateY: 0 },
            animate: {
              opacity: [0, 1],
              translateY: [-5, 0],
              transition: {
                opacity: { duration: 0.5, times: [0.2, 1] },
                duration: 0.5,
              },
            },
          }}
          width="18"
          x="3"
          y="3"
        />
        <motion.rect
          animate={controls}
          height="7"
          initial="normal"
          rx="1"
          variants={{
            normal: { opacity: 1, translateX: 0 },
            animate: {
              opacity: [0, 1],
              translateX: [-10, 0],
              transition: {
                opacity: { duration: 0.7, times: [0.5, 1] },
                translateX: { delay: 0.3 },
                duration: 0.5,
              },
            },
          }}
          width="7"
          x="3"
          y="14"
        />
        <motion.rect
          animate={controls}
          height="7"
          initial="normal"
          rx="1"
          variants={{
            normal: { opacity: 1, translateX: 0 },
            animate: {
              opacity: [0, 1],
              translateX: [10, 0],
              transition: {
                opacity: { duration: 0.8, times: [0.5, 1] },
                translateX: { delay: 0.4 },
                duration: 0.5,
              },
            },
          }}
          width="7"
          x="14"
          y="14"
        />
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const LayoutPanelTopIcon = Object.assign(LayoutPanelTopIconBase, { animated: true as const })
