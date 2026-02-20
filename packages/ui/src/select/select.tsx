import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { selectStyles, type SelectVariants } from './select.styles'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & SelectVariants & { ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Trigger>> }) => {
  const styles = selectStyles(props)
  return (
    <SelectPrimitive.Trigger ref={ref} className={cn(styles.trigger(), className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className={cn(styles.icon())} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

const SelectScrollUpButton = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & { ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.ScrollUpButton>> }) => {
  const styles = selectStyles()
  return (
    <SelectPrimitive.ScrollUpButton ref={ref} className={cn(styles.scrollButton(), className)} {...props}>
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

const SelectScrollDownButton = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> & { ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.ScrollDownButton>> }) => {
  const styles = selectStyles()
  return (
    <SelectPrimitive.ScrollDownButton ref={ref} className={cn(styles.scrollButton(), className)} {...props}>
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

const SelectContent = ({
  className,
  children,
  position = 'popper',
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & SelectVariants & { ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Content>> }) => {
  const styles = selectStyles({ position })
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} className={cn(styles.content(), className)} position={position} {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className={cn(styles.viewport())}>{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

const SelectLabel = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & { ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Label>> }) => {
  const styles = selectStyles()
  return <SelectPrimitive.Label ref={ref} className={cn(styles.label(), className)} {...props} />
}

const SelectItem = ({ className, children, ref, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Item>> }) => {
  const styles = selectStyles()
  return (
    <SelectPrimitive.Item ref={ref} className={cn(styles.item(), className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

const SelectSeparator = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & { ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Separator>> }) => {
  const styles = selectStyles()
  return <SelectPrimitive.Separator ref={ref} className={cn(styles.separator(), className)} {...props} />
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton }
