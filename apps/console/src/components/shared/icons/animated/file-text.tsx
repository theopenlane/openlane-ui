'use client'

import { motion, useAnimation } from 'motion/react'
import type React from 'react'
import type { HTMLAttributes, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef } from 'react'

import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/file-text.json
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface FileTextIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface FileTextIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<FileTextIconHandle>
}

const FileTextIconBase = ({ ref, className, size, ...props }: FileTextIconProps) => {
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
        variants={{
          normal: { scale: 1 },
          animate: {
            scale: 1.05,
            transition: {
              duration: 0.3,
              ease: 'easeOut',
            },
          },
        }}
        viewBox="0 0 24 24"
        width={size ?? '100%'}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />

        <motion.path
          d="M10 9H8"
          stroke="currentColor"
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              x1: 8,
              x2: 10,
            },
            animate: {
              pathLength: [1, 0, 1],
              x1: [8, 10, 8],
              x2: [10, 10, 10],
              transition: {
                duration: 0.7,
                delay: 0.3,
              },
            },
          }}
        />
        <motion.path
          d="M16 13H8"
          stroke="currentColor"
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              x1: 8,
              x2: 16,
            },
            animate: {
              pathLength: [1, 0, 1],
              x1: [8, 16, 8],
              x2: [16, 16, 16],
              transition: {
                duration: 0.7,
                delay: 0.5,
              },
            },
          }}
        />
        <motion.path
          d="M16 17H8"
          stroke="currentColor"
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              x1: 8,
              x2: 16,
            },
            animate: {
              pathLength: [1, 0, 1],
              x1: [8, 16, 8],
              x2: [16, 16, 16],
              transition: {
                duration: 0.7,
                delay: 0.7,
              },
            },
          }}
        />
      </motion.svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const FileTextIcon = Object.assign(FileTextIconBase, { animated: true as const })
