import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    actionIcon: 'text-accent-secondary-muted',
    vendorSearchRow: 'flex justify-between mb-[26px]',
    vendorSearchField: '',
    vendorButtons: '',
    nameRow: 'flex gap-2',
    nameRowDescription: 'flex gap-2 grid grid-flow-col grid-rows-2 grid-cols-3',
    vendorDescription: 'border-b-2 border-dashed col-span-full',
    vendorTags: 'flex flex-wrap col-span-full',
    copyIcon: 'text-accent-secondary-muted cursor-pointer',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
