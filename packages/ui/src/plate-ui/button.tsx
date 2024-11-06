import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cn, withRef } from '@udecode/cn';
import { type VariantProps, cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxford-blue-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:ring-offset-oxford-blue-950 dark:focus-visible:ring-oxford-blue-300',
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
        icon: 'size-[28px] rounded-md px-1.5',
        lg: 'h-10 rounded-md px-4',
        md: 'h-8 px-3 text-sm',
        none: '',
        sm: 'h-[28px] rounded-md px-2.5',
        xs: 'h-8 rounded-md px-3 text-xs',
      },
      variant: {
        default: 'bg-oxford-blue-900 text-oxford-blue-50 hover:bg-oxford-blue-900/90 dark:bg-oxford-blue-50 dark:text-oxford-blue-900 dark:hover:bg-oxford-blue-50/90',
        destructive:
          'bg-red-500 text-oxford-blue-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-oxford-blue-50 dark:hover:bg-red-900/90',
        ghost: 'hover:bg-oxford-blue-100 hover:text-oxford-blue-900 dark:hover:bg-oxford-blue-800 dark:hover:text-oxford-blue-50',
        inlineLink: 'text-base text-oxford-blue-900 underline underline-offset-4 dark:text-oxford-blue-50',
        link: 'text-oxford-blue-900 underline-offset-4 hover:underline dark:text-oxford-blue-50',
        outline:
          'border border-oxford-blue-200 bg-white hover:bg-oxford-blue-100 hover:text-oxford-blue-900 dark:border-oxford-blue-800 dark:bg-oxford-blue-950 dark:hover:bg-oxford-blue-800 dark:hover:text-oxford-blue-50',
        secondary:
          'bg-oxford-blue-100 text-oxford-blue-900 hover:bg-oxford-blue-100/80 dark:bg-oxford-blue-800 dark:text-oxford-blue-50 dark:hover:bg-oxford-blue-800/80',
      },
    },
  }
);

export const Button = withRef<
  'button',
  {
    asChild?: boolean;
  } & VariantProps<typeof buttonVariants>
>(({ asChild = false, className, isMenu, size, variant, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ className, isMenu, size, variant }))}
      {...props}
    />
  );
});
