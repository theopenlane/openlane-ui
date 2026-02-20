'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { CheckIcon, ChevronRightIcon, DotFilledIcon } from '@radix-ui/react-icons'
import { cn } from '../../lib/utils'
import { dropdownMenuStyles, type DropdownMenuVariants } from './dropdown-menu.styles'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const { separator, subTrigger, subTriggerChevron, subContent, menuContent, menuItem, menuCheckboxItem, menuCheckboxItemSpan, icon, menuRadioItem, menuRadioItemSpan, menuLabel, menuShortcut } =
  dropdownMenuStyles()

const DropdownMenuSubTrigger = ({
  className,
  inset,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
} & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>> }) => (
  <DropdownMenuPrimitive.SubTrigger ref={ref} className={cn(subTrigger({ inset }), className)} {...props}>
    {children}
    <ChevronRightIcon className={subTriggerChevron()} />
  </DropdownMenuPrimitive.SubTrigger>
)

const DropdownMenuSubContent = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>> }) => (
  <DropdownMenuPrimitive.SubContent ref={ref} className={cn(subContent(), className)} {...props} />
)

const DropdownMenuContent = ({
  className,
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Content>> }) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn(menuContent(), className)} {...props} />
  </DropdownMenuPrimitive.Portal>
)

const DropdownMenuItem = ({
  className,
  inset,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
} & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Item>> }) => <DropdownMenuPrimitive.Item ref={ref} className={cn(menuItem({ inset }), className)} {...props} />

const DropdownMenuCheckboxItem = ({
  className,
  children,
  checked,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>> }) => (
  <DropdownMenuPrimitive.CheckboxItem ref={ref} className={cn(menuCheckboxItem(), className)} checked={checked} {...props}>
    <span className={menuCheckboxItemSpan()}>
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className={icon()} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
)

const DropdownMenuRadioItem = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>> }) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn('flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none text-sm outline-none focus:bg-accent focus:text-accent-foreground rounded-sm', className)}
    {...props}
  >
    <span className="relative flex h-4 w-4 items-center justify-center">
      <span className="absolute h-3.5 w-3.5 rounded-full border border-muted-foreground/60" />
      <DropdownMenuPrimitive.ItemIndicator>
        <DotFilledIcon className={icon()} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>

    <span>{children}</span>
  </DropdownMenuPrimitive.RadioItem>
)

const DropdownMenuLabel = ({
  className,
  inset,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
} & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Label>> }) => <DropdownMenuPrimitive.Label ref={ref} className={cn(menuLabel({ inset }), className)} {...props} />

const DropdownMenuSeparator = ({
  className,
  spacing,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & DropdownMenuVariants & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Separator>> }) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={cn(separator({ spacing }), className)} {...props} />
)

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn(menuShortcut(), className)} {...props} />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
