import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    actionIcon: 'text-accent-secondary-muted',
    vendorSearchRow: 'flex justify-between mb-[26px]',
    vendorSearchField: '',
    vendorButtons: '',
    nameRow: 'flex gap-2',
    copyIcon: 'text-accent-secondary-muted cursor-pointer',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
