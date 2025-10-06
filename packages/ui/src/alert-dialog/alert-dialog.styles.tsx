import { tv, type VariantProps } from 'tailwind-variants'

export const alertDialogStyles = tv({
  slots: {
    overlay: 'fixed inset-0 z-50 bg-background/70 text-left data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
    content:
      'fixed left-1/2 top-1/2 z-50 grid w-full max-w-md bg-secondary border p-6 gap-4 shadow-lg duration-200 ' +
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 ' +
      'data-[state=open]:scale-95 data-[state=closed]:scale-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 ' +
      'rounded-lg -translate-x-1/2 -translate-y-1/2',
    header: 'flex flex-col space-y-2 text-left sm:text-left',
    footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
    title: 'text-lg font-semibold',
    description: 'text-sm',
  },
  variants: {
    size: {
      large: {
        content:
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-xl bg-white p-6 gap-4 shadow-lg duration-200 ' +
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 ' +
          'data-[state=open]:scale-95 data-[state=closed]:scale-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 ' +
          'rounded-lg -translate-x-1/2 -translate-y-1/2',
      },
    },
  },
})

export type AlertDialogVariants = VariantProps<typeof alertDialogStyles>
