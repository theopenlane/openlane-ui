import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    wrapper: 'flex gap-[26px] flex-col',
    nameRow: 'flex gap-2',
    copyIcon: 'text-teal-400 cursor-pointer',
    actionIcon: 'text-teal-400',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
