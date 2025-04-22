import * as React from 'react'

import type { SlateElementProps } from '@udecode/plate'

import { cn } from '@udecode/cn'
import { SlateElement } from '@udecode/plate'
import { cva } from 'class-variance-authority'

interface HeadingElementViewProps extends SlateElementProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const headingVariants = cva('relative mb-1', {
  variants: {
    variant: {
      h1: 'pb-1 font-heading text-4xl font-bold',
      h2: 'pb-px font-heading text-2xl font-semibold tracking-tight',
      h3: 'pb-px font-heading text-xl font-semibold tracking-tight',
      h4: 'font-heading text-lg font-semibold tracking-tight',
      h5: 'text-lg font-semibold tracking-tight',
      h6: 'text-base font-semibold tracking-tight',
    },
  },
})

export const HeadingElementStatic = ({ children, className, variant = 'h1', ...props }: HeadingElementViewProps) => {
  return (
    <SlateElement as={variant} className={cn(className, headingVariants({ variant }))} {...props}>
      {children}
    </SlateElement>
  )
}
