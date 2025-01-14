import { tv, type VariantProps } from 'tailwind-variants'

export const tableStyles = tv({
  slots: {
    container: 'relative w-full overflow-auto rounded-sm border-table-border',
    table: 'w-full caption-bottom font-sans bg-table-bg text-table-text border-table-border',
    tableHeader: 'border-b text-left bg-table-header-bg text-table-header border-table-border',
    tableBody: '[&_tr:last-child]:border-0',
    tableFooter: 'p-1 font-medium [&>tr]:last:border-b-0 ',
    tableRow: 'px-2 border-b text-sm border-table-border-muted transition-colors hover:bg-table-row-bg-hover',
    tableHead: 'h-12 px-4 text-left text-table-header border-table-border align-middle font-medium [&:has([role=checkbox])]:pr-0',
    tableCell: 'px-4 py-2 align-middle [&:has([role=checkbox])]:pr-0',
    tableCaption: 'mt-4 text-sm',
  },
  variants: {
    striped: {
      true: {
        tableRow: 'odd:bg-table-row-bg-odd even:bg-table-row-bg-even',
      },
    },
  },
})

export type TableVariants = VariantProps<typeof tableStyles>
