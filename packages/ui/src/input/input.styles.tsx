import { tv, type VariantProps } from 'tailwind-variants'

export const inputStyles = tv({
  slots: {
    input:
      'flex h-12 px-3 py-none w-full font-sans bg-input-background border border-neutral-300 dark:border-brand rounded-md autofill:bg-white autofill:font-sans transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring disabled:cursor-not-allowed disabled:opacity-50',
    inputWrapper: 'relative flex items-center',
    iconWrapper: 'absolute z-20 top-1/2 -translate-y-1/2 right-4',
    prefixWrapper: 'absolute z-20 rounded-l-md px-4 border h-full left-0 flex items-center border-neutral-300 dark:border-brand',
  },
  variants: {
    hasIcon: {
      true: {
        input: 'pr-11',
      },
    },
    hasPrefix: {
      true: {
        input: '',
      },
    },
    variant: {
      medium: {
        input: 'w-[280px] max-w-full',
      },
      light: {
        input: 'bg-white text-text-dark',
      },
    },
  },
})

export const inputRowStyles = tv({
  slots: {
    wrapper: 'flex gap-6 items-end',
  },
})

export type InputVariants = VariantProps<typeof inputStyles>
export type InputRowVariants = VariantProps<typeof inputRowStyles>
