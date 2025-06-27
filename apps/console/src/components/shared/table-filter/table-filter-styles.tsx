import { tv, type VariantProps } from 'tailwind-variants'

const tableFilterStyles = tv({
  slots: {
    prefixes: 'text-sm text-center',
    columnName: 'w-40 text-left',
    operator: 'w-40',
    value: 'w-40',
  },
})

export type TableFilterStylesVariants = VariantProps<typeof tableFilterStyles>

export { tableFilterStyles }
