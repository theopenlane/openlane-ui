import { tv, type VariantProps } from 'tailwind-variants'

export const passwordInputStyles = tv({
  slots: {
    eye: 'text-blackberry-900 h-4 w-4',
  },
})

export type InputVariants = VariantProps<typeof passwordInputStyles>
