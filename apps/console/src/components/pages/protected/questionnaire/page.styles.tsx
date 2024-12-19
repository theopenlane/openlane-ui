import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    wrapper: 'flex gap-[26px] flex-col',
    actionIcon: 'text-accent-secondary-muted',
    searchRow: 'flex justify-between mb-[26px]',
    searchField: '',
    buttons: 'flex gap-2 px-2',
    nameRow: 'flex gap-2',
    copyIcon: 'text-accent-secondary-muted cursor-pointer',
    dropDownButton: 'flex justify-center items-center gap-2',
    buttonRow: 'mt-[26px] flex justify-end item-end',
    selectTemplate: 'flex items-center gap-2',
    emailRow: 'flex items-center gap-2',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
