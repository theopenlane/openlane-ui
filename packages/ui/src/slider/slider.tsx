import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../../lib/utils'
import { sliderStyles } from './slider.styles'

const { root, track, range, thumb } = sliderStyles()

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(({ className, value, defaultValue, ...props }, ref) => {
  const thumbCount = value?.length ?? defaultValue?.length ?? 1
  return (
    <SliderPrimitive.Root ref={ref} className={cn(root(), className)} value={value} defaultValue={defaultValue} {...props}>
      <SliderPrimitive.Track className={track()}>
        <SliderPrimitive.Range className={range()} />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, i) => (
        <SliderPrimitive.Thumb key={i} className={thumb()} />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
