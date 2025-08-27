import { tv, type VariantProps } from 'tailwind-variants'

export const inputStyles = tv({
  slots: {
    input:
      'flex text-sm h-10 px-3 !py-0 w-full font-sans bg-input-background border border-border-light dark:border-border-dark rounded-md autofill:bg-white autofill:font-sans transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring disabled:cursor-not-allowed disabled:opacity-50',
    inputWrapper: 'relative flex items-center',
    iconWrapper: 'absolute z-20 top-1/2 -translate-y-1/2',
    prefixWrapper: 'absolute z-20 rounded-l-md px-4 border h-full left-0 flex items-center border-border-light dark:border-border-dark',
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
    iconPosition: {
      left: {
        input: 'pl-10',
        iconWrapper: 'left-4',
      },
      right: {
        input: 'pr-10',
        iconWrapper: 'right-4',
      },
    },
    variant: {
      medium: {
        input: 'w-[280px] max-w-full',
      },
      light: {
        input: 'bg-white text-text-dark',
      },
      searchTable: {
        input: 'border !border-border h-[34px]',
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
