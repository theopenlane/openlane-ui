'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '../../lib/utils'
import { labelStyles, LabelVariants } from './label.styles'

const Label = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & LabelVariants & { ref?: React.Ref<React.ComponentRef<typeof LabelPrimitive.Root>> }) => {
  const { label } = labelStyles()
  return <LabelPrimitive.Root ref={ref} className={cn(label(), className)} {...props} />
}

export { Label }
