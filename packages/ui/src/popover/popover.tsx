'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { popoverStyles } from './popover.styles'
import { cn } from '../../lib/utils'
import { guardToastInteractOutside } from '../../lib/dismissable-outside'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const { content } = popoverStyles()

const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  ref,
  onInteractOutside,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { ref?: React.Ref<React.ElementRef<typeof PopoverPrimitive.Content>> }) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content ref={ref} align={align} sideOffset={sideOffset} className={cn(content(), className)} onInteractOutside={guardToastInteractOutside(onInteractOutside)} {...props} />
  </PopoverPrimitive.Portal>
)

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
