import { tv, type VariantProps } from 'tailwind-variants'

const groupsTableStyles = tv({
  slots: {
    tableRow: 'h-64 text-center',
    keyIcon: 'text-accent-primary cursor-pointer text-4xl',
    message: ' text-sm mt-3',
    createLink: 'text-accent-primary text-sm font-medium mt-2 underline cursor-pointer',
  },
})

export type groupsTableStyles = VariantProps<typeof groupsTableStyles>

export { groupsTableStyles }
