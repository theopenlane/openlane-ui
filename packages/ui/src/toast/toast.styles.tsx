import { tv, type VariantProps } from 'tailwind-variants'

export const toastStyles = tv({
  slots: {
    viewport: 'fixed bottom-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
    toast:
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:tranoxford-blue-x-0 data-[swipe=end]:tranoxford-blue-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:tranoxford-blue-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    toastDefault: 'border bg-background-secondary',
    toastDestructive: 'destructive group border-error bg-error-muted text-red-500',
    toastSuccess: 'group border-success bg-success-muted text-teal-900',
    action:
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-oxford-blue-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-oxford-blue-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-oxford-blue-50 group-[.destructive]:focus:ring-red-500 dark:ring-offset-oxford-blue-950 dark:hover:bg-oxford-blue-800 dark:focus:ring-oxford-blue-300 dark:group-[.destructive]:border-oxford-blue-800/40 dark:group-[.destructive]:hover:border-red-900/30 dark:group-[.destructive]:hover:bg-red-900 dark:group-[.destructive]:hover:text-oxford-blue-50 dark:group-[.destructive]:focus:ring-red-900',
    close:
      'absolute right-2 top-2 rounded-md p-1 text-jade-950/50 transition-opacity hover:text-jade-950 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 dark:text-brand dark:hover:text-brand',
    title: 'text-base',
    description: 'text-sm opacity-90',
    closeIcon: 'h-4 w-4',
  },
  variants: {
    variant: {
      default: {},
      destructive: {},
      success: {},
    },
  },
})

export type ToastVariants = VariantProps<typeof toastStyles>
