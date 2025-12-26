import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    wrapper: 'flex gap-[26px] flex-col',
    actionIcon: 'text-brand-100',
    inviteRow: 'flex items-center justify-center gap-[10px]',
    inviteCount: 'flex items-center bg-accent text-text-dark justify-center text-[11px] font-semibold rounded-[5px] w-[19px] h-[19px]',
    membersSearchRow: 'flex justify-between mb-[26px]',
    membersSearchField: '',
    membersButtons: '',
    nameRow: 'flex gap-2',
    roleRow: 'flex items-center gap-2',
    copyIcon: 'text-accent-secondary-muted cursor-pointer',
    buttonRow: 'mt-[26px] flex justify-between',
  },
  variants: {
    activeBg: {
      true: {
        inviteCount: 'flex items-center text-text bg-card justify-center text-[11px] font-semibold rounded-[5px] w-[19px] h-[19px]',
      },
    },
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
