import { tv, type VariantProps } from 'tailwind-variants'

export const separatorStyles = tv({
  slots: {
    base: 'w-full flex items-center uppercase',
    line: 'flex-1 h-px bg-winter-sky-900 dark:bg-peat-800',
    text: 'text-blackberry-800 px-2 opacity-50 text-xs',
  },
})

export type SeparatorVariants = VariantProps<typeof separatorStyles>
