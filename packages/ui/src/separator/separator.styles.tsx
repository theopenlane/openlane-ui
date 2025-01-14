import { tv, type VariantProps } from 'tailwind-variants'

export const separatorStyles = tv({
  slots: {
    base: 'w-full flex items-center uppercase',
    line: 'flex-1 h-px bg-separator bg-opacity-60 mx-4',
    text: 'opacity-80 text-sm text-text-dark px-4',
  },
  variants: {
    full: {
      true: {
        line: 'flex-1 h-px bg-separator bg-opacity-60 mx-0',
      },
    },
  },
})

export type SeparatorVariants = VariantProps<typeof separatorStyles>
