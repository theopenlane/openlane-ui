import { tv, type VariantProps } from 'tailwind-variants'

export const dropdownMenuStyles = tv({
  slots: {
    subTrigger:
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 bg-accent-secondary text-text-dark text-sm outline-none focus:bg-muted focus:rounded data-[state=open]:bg-button-muted',
    subTriggerChevron: 'ml-auto h-4 w-4',
    icon: 'h-4 w-4',
    separator: '-mx-8 my-1 h-px',
    subContent:
      'z-50 min-w-72 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    menuContent:
      'font-sans z-50 min-w-40 px-3 py-3 overflow-hidden rounded-md bg-popover text-popover-foreground shadow-popover data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    menuItem:
      'relative flex cursor-default select-none items-center gap-3 rounded-sm mx-2 my-1.5 text-sm outline-none transition-colors focus:bg-muted focus:rounded found:rounded-sm focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    menuCheckboxItem:
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-muted focus:rounded focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    menuCheckboxItemSpan: 'absolute left-2 flex h-5 w-5 items-left justify-left border border-bg-accent-secondary ring-offset-white',
    menuRadioItem:
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-muted focus:rounded focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    menuRadioItemSpan: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center',
    menuLabel: 'px-2 py-1.5 text-sm font-semibold',
    menuShortcut: 'ml-auto text-sm tracking-widest opacity-60',
  },
  variants: {
    inset: {
      true: {
        subTrigger: 'pl-8',
        menuItem: 'pl-8',
        menuLabel: 'pl-8',
      },
    },
    spacing: {
      md: {
        separator: 'my-4',
      },
      lg: {
        separator: 'my-8',
      },
    },
  },
})

export type DropdownMenuVariants = VariantProps<typeof dropdownMenuStyles>
