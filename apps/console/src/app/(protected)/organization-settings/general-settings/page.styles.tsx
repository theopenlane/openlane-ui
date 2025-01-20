import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    wrapper: 'flex ',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
