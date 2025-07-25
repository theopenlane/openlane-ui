import * as React from 'react'
import { cn } from '../../lib/utils'
import { tableStyles, type TableVariants } from './table-styles'

const { container, table, tableHeader, tableBody, tableFooter, tableRow, tableHead, tableCell, tableCaption } = tableStyles()

const Table = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLTableElement> & TableVariants>(({ className, striped, compact, variant, stickyHeader, stickyDialogHeader, ...props }, ref) => {
  return (
    <div className="relative">
      <div ref={ref} className={cn(container({ stickyHeader, stickyDialogHeader }), 'relative')}>
        <table className={cn(table({ striped, compact, variant }), className)} {...props} />
      </div>
    </div>
  )
})
Table.displayName = 'Table'

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement> & TableVariants>(({ className, striped, compact, variant, ...props }, ref) => (
  <thead ref={ref} className={cn(tableHeader({ striped, compact, variant }), className)} {...props} />
))

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement> & TableVariants>(({ className, striped, compact, variant, ...props }, ref) => (
  <tbody ref={ref} className={cn(tableBody({ striped, compact, variant }), className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement> & TableVariants>(({ className, striped, compact, variant, ...props }, ref) => (
  <tfoot ref={ref} className={cn(tableFooter({ striped, compact, variant }), className)} {...props} />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement> & TableVariants>(({ className, striped, compact, variant, ...props }, ref) => (
  <tr ref={ref} className={cn(tableRow({ striped, compact, variant }), className)} {...props} />
))

TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement> & TableVariants>(({ className, striped, compact, variant, ...props }, ref) => (
  <th ref={ref} className={cn(tableHead({ striped, compact, variant }), className)} {...props} />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement> & TableVariants>(({ className, striped, compact, variant, ...props }, ref) => (
  <td ref={ref} className={cn(tableCell({ striped, compact, variant }), className)} {...props} />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement> & TableVariants>(({ className, striped, compact, variant, ...props }, ref) => (
  <caption ref={ref} className={cn(tableCaption({ striped, compact, variant }), className)} {...props} />
))
TableCaption.displayName = 'TableCaption'

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
