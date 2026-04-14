import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils.ts'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    defaultVariants: {
      size: 'sm',
      variant: 'default',
    },
    variants: {
      isMenu: {
        true: 'w-full cursor-pointer justify-start',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
      variant: {
        default: 'bg-oxford-blue-900 text-oxford-blue-50 hover:bg-oxford-blue-900/90 dark:bg-oxford-blue-50 dark:text-oxford-blue-900 dark:hover:bg-oxford-blue-50/90',
        destructive: 'bg-red-500 text-oxford-blue-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-oxford-blue-50 dark:hover:bg-red-900/90',
        ghost: 'hover:bg-button-muted',
        inlineLink: 'text-base text-oxford-blue-900 underline underline-offset-4 dark:text-oxford-blue-50',
        link: 'text-oxford-blue-900 underline-offset-4 hover:underline dark:text-oxford-blue-50',
        outline: 'border border-border bg-white hover:bg-oxford-blue-100 hover:text-oxford-blue-900 dark:bg-oxford-blue-950 dark:hover:bg-oxford-blue-800 dark:hover:text-oxford-blue-50',
        secondary: 'bg-oxford-blue-100 text-oxford-blue-900 hover:bg-oxford-blue-100/80 dark:bg-oxford-blue-800 dark:text-oxford-blue-50 dark:hover:bg-oxford-blue-800/80',
        // the above are all seemingly wrong so adding a new variant
        newSecondary: 'bg-btn-primary',
      },
    },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = ({ className, variant, size, asChild = false, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
}

export { Button, buttonVariants }
