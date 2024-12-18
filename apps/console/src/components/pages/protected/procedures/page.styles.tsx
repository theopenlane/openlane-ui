import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    searchRow: 'flex justify-between mb-[26px]',
    searchField: '',
    actionIcon: 'text-teal-400',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
