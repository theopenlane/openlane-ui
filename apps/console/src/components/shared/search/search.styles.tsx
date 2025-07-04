import { tv, type VariantProps } from 'tailwind-variants'

const searchStyles = tv({
  slots: {
    avatarRow: 'flex items-center',
    icon: 'w-3 h-3 text-text-informational',
    leftFlex: 'flex items-center gap-2 w-40',
  },
})

export type HeaderVariants = VariantProps<typeof searchStyles>

export { searchStyles }
