'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { switchStyles } from './switch.styles'
import { cn } from '../../lib/utils'

const { base, thumb } = switchStyles()
const Switch = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & { ref?: React.Ref<React.ComponentRef<typeof SwitchPrimitives.Root>> }) => (
  <SwitchPrimitives.Root className={cn(base(), className)} {...props} ref={ref}>
    <SwitchPrimitives.Thumb className={thumb()} />
  </SwitchPrimitives.Root>
)

export { Switch }
