'use client';

import * as React from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn, withRef } from '@udecode/cn';
import { Check } from 'lucide-react';

export const Checkbox = withRef<typeof CheckboxPrimitive.Root>(
  ({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer size-4 shrink-0 rounded-sm border border-oxford-blue-200 border-oxford-blue-900 bg-white ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxford-blue-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-oxford-blue-900 data-[state=checked]:text-oxford-blue-50 dark:border-oxford-blue-800 dark:border-oxford-blue-50 dark:bg-oxford-blue-950 dark:ring-offset-oxford-blue-950 dark:focus-visible:ring-oxford-blue-300 dark:data-[state=checked]:bg-oxford-blue-50 dark:data-[state=checked]:text-oxford-blue-900',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        <Check className='size-4' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
);
