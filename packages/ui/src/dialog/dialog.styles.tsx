import { tv, type VariantProps } from 'tailwind-variants'

export const dialogStyles = tv({
  slots: {
    overlay:
      'text-left fixed inset-0 z-50 bg-glaucous-900/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    content:
      'fixed left-[50%] top-[50%] z-50 grid w-[75%] bg-panel translate-x-[-50%] translate-y-[-50%] gap-4 border border-oxford-blue-200 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-oxford-blue-800',
    close:
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-oxford-blue-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-oxford-blue-100 data-[state=open]:text-oxford-blue-500 dark:ring-offset-oxford-blue-950 dark:focus:ring-oxford-blue-300 dark:data-[state=open]:bg-oxford-blue-800 dark:data-[state=open]:text-oxford-blue-400',
    closeIcon: 'h-4 w-4',
    header: 'flex flex-col space-y-1.5 sm:text-left',
    footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-oxford-blue-800 dark:text-oxford-blue-100',
  },
})

export type DialogVariants = VariantProps<typeof dialogStyles>
