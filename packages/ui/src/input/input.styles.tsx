import { tv, type VariantProps } from 'tailwind-variants'

export const inputStyles = tv({
  slots: {
    input:
      'flex h-12 w-full rounded-md border font-sans autofill:bg-white autofill:text-firefly-950 autofill:font-sans border-oxford-blue-200 dark:border-oxford-blue-700 bg-white dark:bg-oxford-blue-950 px-3 py-none text-base transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-firefly-100 focus-visible:dark:ring-firefly-700 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder-ziggurat-400',
    inputWrapper: 'relative flex items-center',
    iconWrapper:
      'absolute z-20 text-firefly-500 top-1/2 -translate-y-1/2 right-4',
    prefixWrapper:
      'absolute z-20 rounded-l-md px-4 border text-firefly-500 h-full left-0 flex items-center bg-firefly-700 border-firefly-500',
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
