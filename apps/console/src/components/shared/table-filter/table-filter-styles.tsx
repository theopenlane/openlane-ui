import { tv, type VariantProps } from 'tailwind-variants'

const tableFilterStyles = tv({
  slots: {
    prefixes: 'gap-1 p-1 pl-2 pr-2 h-[unset] text-sm text-center',
    columnName: 'w-40 text-left',
    operator: 'w-40',
    value: 'w-40 !gap-1 !p-1 !pl-2 !pr-2 h-[unset]',
  },
})

export type TableFilterStylesVariants = VariantProps<typeof tableFilterStyles>

export { tableFilterStyles }
