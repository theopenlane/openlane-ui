import { tv, type VariantProps } from 'tailwind-variants'

export const dialogStyles = tv({
  slots: {
    overlay: 'fixed inset-0 z-50 bg-[rgb(0_0_0/42%)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out',
    content:
      'bg-panel w-[75%] max-h-[90%] overflow-auto  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 ' +
      'data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] ' +
      'left-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg ' +
      'border p-6 shadow-lg duration-200',
    close: 'absolute right-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 bg-unset p-1',
    closeIcon: 'h-4 w-4',
    header: 'flex flex-col space-y-1.5 sm:text-left',
    footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-oxford-blue-800 dark:text-oxford-blue-100',
  },
})

export type DialogVariants = VariantProps<typeof dialogStyles>
