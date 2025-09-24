import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden  h-fit', {
  variants: {
    variant: {
      default: 'border-transparent btn-secondary text-button-text hover:bg-primary transition-colors duration-500',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'text-foreground',
      gold: 'border-transparent bg-saffron-500 text-white',
      destructive: 'border-transparent error text-white bg-red-700',
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
