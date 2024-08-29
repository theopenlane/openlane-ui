import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from '../../lib/utils'
import { checkboxStyles } from './checkbox.styles'

const {
  root,
  indicator,
  checkIcon,
} = checkboxStyles()

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(root(), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(indicator(), className)}
    >
      <Check className={cn(checkIcon(), className)} strokeWidth={4} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
