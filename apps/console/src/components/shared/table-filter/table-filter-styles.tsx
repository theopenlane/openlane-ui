import { tv, type VariantProps } from 'tailwind-variants'

const tableFilterStyles = tv({
  slots: {
    prefixes: 'w-16 text-sm min-w-[5rem] flex-shrink  flex-none text-center',
    columnName: 'w-40 text-left',
    operator: 'w-40',
    value: 'w-40',
  },
})

export type TableFilterStylesVariants = VariantProps<typeof tableFilterStyles>

export { tableFilterStyles }
