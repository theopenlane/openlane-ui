import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    searchRow: 'flex justify-between mb-[26px]',
    searchField: '',
    actionIcon: 'text-accent-secondary-muted',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
