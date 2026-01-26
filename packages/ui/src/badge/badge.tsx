import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors focus:outline-hidden  h-fit', {
  variants: {
    variant: {
      default: 'border-transparent btn-secondary',
      secondary: 'border-transparent bg-secondary hover:bg-secondary/80 transition-colors duration-500',
      outline: 'text-foreground',
      gold: 'border-transparent bg-gold-trial text-white',
      destructive: 'border-transparent error text-white bg-red-700',
      select: 'border-transparent bg-border text-paragraph',
      green: 'text-success border-success/24 bg-success/16',
      blue: 'bg-info/16 border-info/24 text-info ',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
