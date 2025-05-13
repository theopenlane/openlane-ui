import { tv, type VariantProps } from 'tailwind-variants'

export const tableStyles = tv({
  slots: {
    container: 'relative w-full overflow-auto',
    table: 'w-full caption-bottom text-sm',
    tableHeader: '[&_tr]:border-b',
    tableBody: '[&_tr:last-child]:border-0',
    tableFooter: 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
    tableRow: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
    tableHead: 'h-10 px-4 text-sm text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
    tableCell: 'p-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
    tableCaption: 'mt-4 text-sm text-muted-foreground',
  },
  variants: {
    variant: {
      default: {},
      data: {
        tableHead: 'px-6 py-4 font-bold',
        // tableRow: 'odd:bg-muted even:bg-muted/50', // todo (sfunk): make this configurable between full page tables and small tables
        tableCell: 'px-6 py-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      },
    },
    striped: {
      true: {
        tableRow: 'odd:bg-muted even:bg-muted/50',
      },
    },
    compact: {
      true: {
        table: 'text-xs',
        tableRow: 'h-8',
        tableCell: 'p-2',
        tableHead: 'h-8 px-2 text-xs',
      },
    },
  },
  defaultVariants: {
    striped: false,
    compact: false,
  },
})

export type TableVariants = VariantProps<typeof tableStyles>
