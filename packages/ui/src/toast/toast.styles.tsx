import { tv, type VariantProps } from 'tailwind-variants'

export const toastStyles = tv({
  slots: {
    viewport: 'fixed bottom-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
    toast:
      'group pointer-events-auto relative flex w-full items-center gap-5 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    action:
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-oxford-blue-100 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50',
    close: 'absolute right-2 top-2 rounded-md p-1 text-jade-950/50 transition-opacity hover:text-jade-950 focus:outline-hidden focus:ring-2 group-hover:opacity-100',
    title: 'text-base font-semibold',
    description: 'text-sm opacity-90',
    closeIcon: 'h-4 w-4',
  },
  variants: {
    variant: {
      default: {
        toast: 'border-toast-success-border bg-toast-success-muted',
        description: 'text-toast-success',
      },
      info: {
        toast: 'border-toast-info-border bg-toast-info-muted',
        description: 'text-toast-info',
      },
      info2: {
        toast: 'border-toast-info2-border bg-toast-info2-muted',
        description: 'text-toast-info2',
      },
      warning: {
        toast: 'border-toast-warning-border bg-toast-warning-muted',
        description: 'text-toast-warning',
      },
      success: {
        toast: 'border-toast-success-border bg-toast-success-muted',
        description: 'text-toast-success',
      },
      error: {
        toast: 'border-toast-error-border bg-toast-error-muted',
        description: 'text-toast-error',
      },
    },
  },
})

export type ToastVariants = VariantProps<typeof toastStyles>
