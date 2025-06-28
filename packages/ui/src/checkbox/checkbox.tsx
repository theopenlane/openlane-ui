import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { checkboxStyles } from './checkbox.styles'

const { root, indicator, checkIcon } = checkboxStyles()

type TCheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  stroke?: number
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, TCheckboxProps>(({ className, stroke = 4, ...props }, ref) => (
  <CheckboxPrimitive.Root ref={ref} className={cn(root(), className)} {...props}>
    <CheckboxPrimitive.Indicator className={cn(indicator(), className)}>
      <Check className={cn(checkIcon(), className)} strokeWidth={stroke} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
