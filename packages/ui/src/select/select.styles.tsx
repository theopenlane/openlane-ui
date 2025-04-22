import { tv, type VariantProps } from 'tailwind-variants'

export const selectStyles = tv({
  slots: {
    trigger:
      ' tracking-normal h-10 text-sm flex w-full items-center justify-between rounded-md px-3 py-2 border border-border-light dark:border-border-dark bg-input-background text-sm ring-offset-white focus:outline-none  disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
    icon: 'h-4 w-4 opacity-50',
    scrollButton: 'flex cursor-default items-center justify-center py-1',
    content:
      'relative z-50 max-h-96 overflow-hidden rounded-md border border-border-light dark:border-border-dark bg-input-background shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    viewport:
      'p-1 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
    label: 'py-1.5 pl-8 pr-2 text-sm font-semibold',
    item: 'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    separator: '-mx-1 my-1 h-px bg-border',
  },
  variants: {
    position: {
      popper: {
        content: 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
      },
    },
  },
  defaultVariants: {
    position: 'popper',
  },
})

export type SelectVariants = VariantProps<typeof selectStyles>
