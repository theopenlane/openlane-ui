import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    inviteRow: 'flex items-center justify-center gap-[10px]',
    inviteCount: 'flex items-center bg-accent text-text-dark justify-center text-[11px] font-semibold rounded-[5px] w-[19px] h-[19px]',
    nameRow: 'flex items-center gap-2 w-full',
    copyIcon: 'text-muted-foreground cursor-pointer ml-auto shrink-0',
    changeRoleGrid: 'grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-sm border-b border-border pb-4',
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
