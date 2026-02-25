// Tremor ProgressCircle [v0.0.3]

import React from 'react'
import type { Ref } from 'react'
import { tv, VariantProps } from 'tailwind-variants'

import { cn } from '@repo/ui/lib/utils'

const progressCircleVariants = tv({
  slots: {
    background: '',
    circle: '',
  },
  variants: {
    variant: {
      default: {
        background: 'stroke-primary/30',
        circle: 'stroke-primary',
      },
      neutral: {
        background: 'stroke-gray-200 dark:stroke-gray-500/40',
        circle: 'stroke-gray-500 dark:stroke-gray-400',
      },
      blue: {
        background: 'stroke-info/40',
        circle: 'stroke-info',
      },
      warning: {
        background: 'stroke-warning/30',
        circle: 'stroke-warning',
      },
      error: {
        background: 'stroke-destructive/30',
        circle: 'stroke-destructive',
      },
      success: {
        background: 'stroke-primary/30',
        circle: 'stroke-primary',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface ProgressCircleProps extends Omit<React.SVGProps<SVGSVGElement>, 'value'>, VariantProps<typeof progressCircleVariants> {
  value?: number
  max?: number
  showAnimation?: boolean
  radius?: number
  strokeWidth?: number
  children?: React.ReactNode
}

const ProgressCircle = ({
  value = 0,
  max = 100,
  radius = 32,
  strokeWidth = 6,
  showAnimation = true,
  variant,
  className,
  children,
  ref,
  ...props
}: ProgressCircleProps & { ref?: Ref<SVGSVGElement> }) => {
  const safeValue = Math.min(max, Math.max(value, 0))
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const offset = circumference - (safeValue / max) * circumference

  const { background, circle } = progressCircleVariants({ variant })
  return (
    <div
      className={cn('relative')}
      role="progressbar"
      aria-label="Progress circle"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      data-max={max}
      data-value={safeValue ?? null}
      tremor-id="tremor-raw"
    >
      <svg ref={ref} width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`} className={cn('-rotate-90 transform', className)} {...props}>
        <circle
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          stroke=""
          strokeLinecap="round"
          className={cn('transition-colors ease-linear', background())}
        />
        {safeValue >= 0 ? (
          <circle
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            fill="transparent"
            stroke=""
            strokeLinecap="round"
            className={cn('transition-colors ease-linear', circle(), showAnimation && 'transform-gpu transition-all duration-300 ease-in-out')}
          />
        ) : null}
      </svg>
      <div className={cn('absolute inset-0 flex items-center justify-center')}>{children}</div>
    </div>
  )
}

export { ProgressCircle, type ProgressCircleProps }
