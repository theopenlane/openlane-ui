import * as React from 'react'
import { cn } from '../../lib/utils'
import { tableStyles, type TableVariants } from './table-styles'

const { container, table, tableHeader, tableBody, tableFooter, tableRow, tableHead, tableCell, tableCaption } = tableStyles()

const Table = ({
  className,
  striped,
  compact,
  variant,
  stickyHeader,
  stickyDialogHeader,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & TableVariants & { ref?: React.Ref<HTMLDivElement> }) => {
  return (
    <div className="relative">
      <div ref={ref} className={cn(container({ stickyHeader, stickyDialogHeader }), 'relative')}>
        <table className={cn(table({ striped, compact, variant }), className)} {...props} />
      </div>
    </div>
  )
}

const TableHeader = ({ className, striped, compact, variant, ref, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & TableVariants & { ref?: React.Ref<HTMLTableSectionElement> }) => (
  <thead ref={ref} className={cn(tableHeader({ striped, compact, variant }), className)} {...props} />
)

const TableBody = ({ className, striped, compact, variant, ref, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & TableVariants & { ref?: React.Ref<HTMLTableSectionElement> }) => (
  <tbody ref={ref} className={cn(tableBody({ striped, compact, variant }), className)} {...props} />
)

const TableFooter = ({ className, striped, compact, variant, ref, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & TableVariants & { ref?: React.Ref<HTMLTableSectionElement> }) => (
  <tfoot ref={ref} className={cn(tableFooter({ striped, compact, variant }), className)} {...props} />
)

const TableRow = ({ className, striped, compact, variant, ref, ...props }: React.HTMLAttributes<HTMLTableRowElement> & TableVariants & { ref?: React.Ref<HTMLTableRowElement> }) => (
  <tr ref={ref} className={cn(tableRow({ striped, compact, variant }), className)} {...props} />
)

const TableHead = ({ className, striped, compact, variant, ref, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & TableVariants & { ref?: React.Ref<HTMLTableCellElement> }) => (
  <th ref={ref} className={cn(tableHead({ striped, compact, variant }), className)} {...props} />
)

const TableCell = ({ className, striped, compact, variant, ref, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & TableVariants & { ref?: React.Ref<HTMLTableCellElement> }) => (
  <td ref={ref} className={cn(tableCell({ striped, compact, variant }), className)} {...props} />
)

const TableCaption = ({ className, striped, compact, variant, ref, ...props }: React.HTMLAttributes<HTMLTableCaptionElement> & TableVariants & { ref?: React.Ref<HTMLTableCaptionElement> }) => (
  <caption ref={ref} className={cn(tableCaption({ striped, compact, variant }), className)} {...props} />
)

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
