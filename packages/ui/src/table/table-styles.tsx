import { tv, type VariantProps } from 'tailwind-variants'

export const tableStyles = tv({
  slots: {
    container: 'relative w-full overflow-auto',
    table: 'w-full caption-bottom text-sm',
    tableHeader: '[&_tr]:border-b [&_tr]:sticky [&_tr]:top-0 [&_tr]:z-10',
    tableBody: '[&_tr:last-child]:border-0',
    tableFooter: 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
    tableRow: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
    tableHead: 'h-12 px-4 text-left align-middle text-muted-foreground bg-table-header-bg [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
    tableCell: 'p-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
    tableCaption: 'mt-4 text-sm text-muted-foreground',
  },
  variants: {
    variant: {
      default: {},
      data: {
        tableHead: 'pl-0 pt-1 pb-1 pr-4 text-base font-normal leading-6',
        // tableRow: 'odd:bg-muted even:bg-muted/50', // todo (sfunk): make this configurable between full page tables and small tables
        tableCell: 'px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
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
    stickyHeader: {
      true: {
        container: 'max-h-[80vh]',
        stickyDialog: false,
      },
    },
    stickyDialogHeader: {
      true: {
        container: 'max-h-96',
        sticky: false,
      },
    },
  },
  defaultVariants: {
    striped: false,
    compact: false,
    sticky: false,
    stickyDialog: false,
  },
})

export type TableVariants = VariantProps<typeof tableStyles>
