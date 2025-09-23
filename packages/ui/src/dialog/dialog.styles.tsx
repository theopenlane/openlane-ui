import { tv, type VariantProps } from 'tailwind-variants'

export const dialogStyles = tv({
  slots: {
    overlay: 'fixed inset-0 z-50 bg-[rgb(0_0_0/42%)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out',
    content:
      'fixed left-1/2 top-1/2 z-50 grid w-[75%] max-h-[90%] overflow-auto rounded-md border border-border bg-panel p-6 shadow-lg duration-200 -translate-x-1/2 -translate-y-1/2 gap-4 ' +
      'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
      'data-[state=open]:fade-in data-[state=closed]:fade-out ' +
      'data-[state=open]:zoom-in data-[state=closed]:zoom-out ' +
      'data-[state=open]:slide-in-from-top data-[state=open]:slide-in-from-left ' +
      'data-[state=closed]:slide-out-to-top data-[state=closed]:slide-out-to-left',
    close:
      'absolute right-4 top-4 rounded-xs opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-hidden disabled:pointer-events-none ' +
      'data-[state=open]:bg-oxford-blue-100 data-[state=open]:text-oxford-blue-500 ' +
      'dark:ring-offset-oxford-blue-950 dark:data-[state=open]:bg-oxford-blue-800 dark:data-[state=open]:text-oxford-blue-400',
    closeIcon: 'h-4 w-4',
    header: 'flex flex-col space-y-1.5 sm:text-left',
    footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-oxford-blue-800 dark:text-oxford-blue-100',
  },
})

export type DialogVariants = VariantProps<typeof dialogStyles>
