import { tv, type VariantProps } from 'tailwind-variants'

export const tableStyles = tv({
  slots: {
    container: 'relative w-full overflow-auto',
    table: 'w-full caption-bottom text-sm',
    tableHeader: '[&_tr]:border-b [&_tr]:sticky [&_tr]:top-0 [&_tr]:z-10',
    tableBody: '[&_tr:last-child]:border-0',
    tableFooter: 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
    tableRow: `
      group
      border-b transition-colors
      data-[state=selected]:bg-muted
      [&:nth-child(even)]:bg-table-secondary
    `,
    tableCell: 'p-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] group-hover:bg-card transition-colors duration-500',
    tableHead: 'h-12 px-4 text-left align-middle text-muted-foreground bg-card [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
    tableCaption: 'mt-4 text-sm text-muted-foreground',
  },
  variants: {
    variant: {
      default: {},
      data: {
        table: 'table-fixed',
        tableHead: 'pt-1 pb-1 pr-4 text-base font-normal leading-6',
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
        container: 'max-h-[70vh]',
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
