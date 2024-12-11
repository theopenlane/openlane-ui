import { tv, type VariantProps } from 'tailwind-variants'

export const toastStyles = tv({
  slots: {
    viewport:
      'fixed bottom-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
    toast:
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-ziggurat-200 p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:tranziggurat-x-0 data-[swipe=end]:tranziggurat-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:tranziggurat-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full dark:border-ziggurat-800',
    toastDefault:
      'border bg-white text-firefly-950 dark:bg-glaucous-900 dark:text-ziggurat-200',
    toastDestructive:
      'destructive group border-red-300 bg-red-100 text-red-500 dark:border-red-300 dark:bg-red-100 dark:text-red-500',
    toastSuccess:
      'group border-aquamarine-600 bg-java-300 text-java-900 dark:border-aquamarine-200 dark:bg-java-100',
    action:
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-ziggurat-200 bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-ziggurat-100 focus:outline-none focus:ring-2 focus:ring-ziggurat-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-ziggurat-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-ziggurat-50 group-[.destructive]:focus:ring-red-500 dark:border-ziggurat-800 dark:ring-offset-ziggurat-950 dark:hover:bg-ziggurat-800 dark:focus:ring-ziggurat-300 dark:group-[.destructive]:border-ziggurat-800/40 dark:group-[.destructive]:hover:border-red-900/30 dark:group-[.destructive]:hover:bg-red-900 dark:group-[.destructive]:hover:text-ziggurat-50 dark:group-[.destructive]:focus:ring-red-900',
    close:
      'absolute right-2 top-2 rounded-md p-1 text-firefly-950/50 opacity-0 transition-opacity hover:text-firefly-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 dark:text-ziggurat-50/50 dark:hover:text-ziggurat-200',
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
