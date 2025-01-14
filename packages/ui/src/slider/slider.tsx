import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../../lib/utils'
import { sliderStyles } from './slider.styles'

const { root, track, range, thumb } = sliderStyles()

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={cn(root(), className)} {...props}>
    <SliderPrimitive.Track className={cn(track(), className)}>
      <SliderPrimitive.Range className={cn(range(), className)} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={cn(thumb(), className)} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
