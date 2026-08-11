'use client'

import { AnimatePresence, motion, useAnimation } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { cn } from '@repo/ui/lib/utils'

// adapted from https://lucide-animated.com/r/keyboard.json — the keys flicker while hovered
// animation is triggered by hovering the nearest `.group` ancestor (e.g. a nav row) so the
// whole row acts as the hover target; falls back to hovering the icon itself

export interface KeyboardIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface KeyboardIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  ref?: Ref<KeyboardIconHandle>
}

const KEYBOARD_PATHS = [
  { id: 'key1', d: 'M10 8h.01' },
  { id: 'key2', d: 'M12 12h.01' },
  { id: 'key3', d: 'M14 8h.01' },
  { id: 'key4', d: 'M16 12h.01' },
  { id: 'key5', d: 'M18 8h.01' },
  { id: 'key6', d: 'M6 8h.01' },
  { id: 'key7', d: 'M7 16h10' },
  { id: 'key8', d: 'M8 12h.01' },
]

const KeyboardIconBase = ({ ref, className, size, ...props }: KeyboardIconProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const controls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasGroupParentRef = useRef(false)

  const startAnimation = useCallback(() => setIsHovered(true), [])
  const stopAnimation = useCallback(() => setIsHovered(false), [])

  useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }))

  useEffect(() => {
    const row = containerRef.current?.closest('.group')
    if (!row) return
    hasGroupParentRef.current = true

    row.addEventListener('mouseenter', startAnimation)
    row.addEventListener('mouseleave', stopAnimation)
    return () => {
      row.removeEventListener('mouseenter', startAnimation)
      row.removeEventListener('mouseleave', stopAnimation)
    }
  }, [startAnimation, stopAnimation])

  useEffect(() => {
    if (isHovered) {
      controls.start((i) => ({
        opacity: [1, 0.2, 1],
        transition: {
          duration: 1.5,
          times: [0, 0.5, 1],
          delay: i * 0.2 * Math.random(),
          repeat: 1,
          repeatType: 'reverse',
        },
      }))
    } else {
      controls.stop()
      controls.set({ opacity: 1 })
    }
  }, [isHovered, controls])

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
        <rect height="16" rx="2" width="20" x="2" y="4" />
        <AnimatePresence>
          {KEYBOARD_PATHS.map((path, index) => (
            <motion.path animate={controls} custom={index} d={path.d} initial={{ opacity: 1 }} key={path.id} />
          ))}
        </AnimatePresence>
      </svg>
    </div>
  )
}

// the `animated` marker lets consumers (e.g. the sidebar) skip the generic CSS hover animation
export const KeyboardIcon = Object.assign(KeyboardIconBase, { animated: true as const })
