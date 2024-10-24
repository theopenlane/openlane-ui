import { tv, type VariantProps } from 'tailwind-variants'

export const separatorStyles = tv({
  slots: {
    base: 'w-full flex items-center uppercase',
    line: 'flex-1 h-px bg-oxford-blue-100 dark:bg-ziggurat-100',
    text: 'text-oxford-blue-800 px-2 opacity-50 text-s',
  },
})

export type SeparatorVariants = VariantProps<typeof separatorStyles>
