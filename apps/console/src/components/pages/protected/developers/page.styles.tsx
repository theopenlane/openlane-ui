import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    wrapper: 'flex gap-[26px] flex-col',
    nameRow: 'flex gap-2',
    copyIcon: 'text-accent-secondary-muted cursor-pointer',
    actionIcon: 'text-accent-secondary-muted',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
