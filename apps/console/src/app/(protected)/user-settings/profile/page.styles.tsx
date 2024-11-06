import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    wrapper: 'flex  gap-[26px] flex-col',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
