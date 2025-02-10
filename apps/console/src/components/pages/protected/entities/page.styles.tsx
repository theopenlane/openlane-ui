import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    actionIcon: 'text-accent-secondary-muted',
    vendorSearchRow: 'flex justify-between mb-[26px]',
    vendorSearchField: '',
    vendorButtons: '',
    nameRow: 'flex gap-2',
    nameRowDescription: 'flex gap-2 grid grid-flow-col grid-rows-2 grid-cols-3',
    vendorDescription: 'p-2 col-span-full line-clamp-3 overflow-hidden text-ellipsis border-dashed border-b',
    vendorTags: 'pt-2 col-span-full',
    copyIcon: 'text-accent-secondary-muted cursor-pointer',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
