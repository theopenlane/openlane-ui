import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    wrapper: 'flex gap-[26px] flex-col',
    actionIcon: 'text-accent-secondary-muted cursor-pointer',
    inviteRow: 'flex items-center justify-center gap-[10px]',
    inviteCount: 'flex items-center justify-center bg-accent-secondary-muted text-[11px] font-semibold rounded-[5px] w-[19px] h-[19px] text-white',
    subscribersSearchRow: 'flex justify-between mb-[26px]',
    subscribersSearchField: '',
    subscribersButtons: '',
    nameRow: 'flex gap-2',
    copyIcon: 'text-accent-secondary-muted cursor-pointer',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
