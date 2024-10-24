import { tv, type VariantProps } from 'tailwind-variants'

export const selectStyles = tv({
  slots: {
    trigger:
      'flex h-10 w-full items-center justify-between rounded-md border border-java-400 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:border-peat-800 dark:bg-peat-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300',
    icon: 'h-4 w-4 opacity-50',
    scrollButton: 'flex cursor-default items-center justify-center py-1',
    content:
      'relative z-50 max-h-96 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-java-400 dark:bg-slate-950 dark:text-slate-50',
    viewport:
      'p-1 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
    label: 'py-1.5 pl-8 pr-2 text-sm font-semibold',
    item: 'text-oxford-blue-800 relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-peat-800 dark:focus:text-slate-50',
    separator: '-mx-1 my-1 h-px bg-slate-100 dark:bg-java-600',
  },
  variants: {
    position: {
      popper: {
        content:
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
      },
    },
  },
  defaultVariants: {
    position: 'popper',
  },
})

export type SelectVariants = VariantProps<typeof selectStyles>
