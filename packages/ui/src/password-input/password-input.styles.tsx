import { tv, type VariantProps } from 'tailwind-variants'

export const passwordInputStyles = tv({
  slots: {
    input: 'bg-white',
    eye: 'h-4 w-4',
  },
})

export type InputVariants = VariantProps<typeof passwordInputStyles>
