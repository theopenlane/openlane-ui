'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../dropdown-menu/dropdown-menu'
import { ArrowUpDown, ClipboardCopyIcon, CreditCardIcon, MoreHorizontal, User } from 'lucide-react'
import { Tag } from '../../tag/tag'
import { Checkbox } from '../../checkbox/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '../../avatar/avatar'

export type Payment = {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
  name: {
    firstname: string
    lastname: string
  }
}

export const columns: ColumnDef<Payment>[] = [
  {
    id: 'select',
    size: 100,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'name',
    accessorKey: 'name.lastname',
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <div>
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/theopenlane.png" />
            </Avatar>
          </div>
          <div>
            {`${row.original.name.lastname}, ${row.original.name.firstname.charAt(0)}`}
            <br />
            {row.original.email}
          </div>
        </div>
      )
    },
    header: ({ column }) => {
      return (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Tag>{row.getValue('status')}</Tag>,
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const payment = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
              <ClipboardCopyIcon className="h-3 w-3" /> Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuItem>
              <User className="h-3 w-3" /> View customer
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCardIcon className="h-3 w-3" /> View payment details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export const mockData: Payment[] = [
  {
    id: '728ed52f',
    amount: 100,
    status: 'pending',
    email: 'm@example.com',
    name: { firstname: 'John', lastname: 'Doe' },
  },
  {
    id: '728ed53f',
    amount: 200,
    status: 'failed',
    email: 'n@example.com',
    name: { firstname: 'Jane', lastname: 'Smith' },
  },
  {
    id: '728ed54f',
    amount: 300,
    status: 'failed',
    email: 'o@example.com',
    name: { firstname: 'Michael', lastname: 'Johnson' },
  },
  {
    id: '728ed55f',
    amount: 150,
    status: 'success',
    email: 'p@example.com',
    name: { firstname: 'Chris', lastname: 'Lee' },
  },
  {
    id: '728ed56f',
    amount: 250,
    status: 'pending',
    email: 'q@example.com',
    name: { firstname: 'Patricia', lastname: 'Brown' },
  },
  {
    id: '728ed57f',
    amount: 350,
    status: 'success',
    email: 'r@example.com',
    name: { firstname: 'Linda', lastname: 'Davis' },
  },
  {
    id: '728ed58f',
    amount: 450,
    status: 'failed',
    email: 's@example.com',
    name: { firstname: 'Robert', lastname: 'Miller' },
  },
  {
    id: '728ed59f',
    amount: 550,
    status: 'pending',
    email: 't@example.com',
    name: { firstname: 'Jennifer', lastname: 'Wilson' },
  },
  {
    id: '728ed60f',
    amount: 150,
    status: 'success',
    email: 'u@example.com',
    name: { firstname: 'James', lastname: 'Moore' },
  },
  {
    id: '728ed61f',
    amount: 250,
    status: 'failed',
    email: 'v@example.com',
    name: { firstname: 'Barbara', lastname: 'Taylor' },
  },
  {
    id: '728ed62f',
    amount: 350,
    status: 'pending',
    email: 'w@example.com',
    name: { firstname: 'David', lastname: 'Anderson' },
  },
  {
    id: '728ed63f',
    amount: 450,
    status: 'success',
    email: 'x@example.com',
    name: { firstname: 'Susan', lastname: 'Thomas' },
  },
  {
    id: '728ed64f',
    amount: 550,
    status: 'failed',
    email: 'y@example.com',
    name: { firstname: 'Charles', lastname: 'Jackson' },
  },
  {
    id: '728ed65f',
    amount: 150,
    status: 'pending',
    email: 'z@example.com',
    name: { firstname: 'Elizabeth', lastname: 'White' },
  },
  {
    id: '728ed66f',
    amount: 250,
    status: 'success',
    email: 'a@example.com',
    name: { firstname: 'Paul', lastname: 'Harris' },
  },
  {
    id: '728ed67f',
    amount: 350,
    status: 'failed',
    email: 'b@example.com',
    name: { firstname: 'Nancy', lastname: 'Martin' },
  },
  {
    id: '728ed68f',
    amount: 450,
    status: 'pending',
    email: 'c@example.com',
    name: { firstname: 'Mark', lastname: 'Thompson' },
  },
  {
    id: '728ed69f',
    amount: 550,
    status: 'success',
    email: 'd@example.com',
    name: { firstname: 'Donna', lastname: 'Garcia' },
  },
  {
    id: '728ed70f',
    amount: 150,
    status: 'failed',
    email: 'e@example.com',
    name: { firstname: 'George', lastname: 'Martinez' },
  },
  {
    id: '728ed71f',
    amount: 250,
    status: 'pending',
    email: 'f@example.com',
    name: { firstname: 'Sandra', lastname: 'Rodriguez' },
  },
  {
    id: '728ed72f',
    amount: 350,
    status: 'success',
    email: 'g@example.com',
    name: { firstname: 'Kenneth', lastname: 'Lewis' },
  },
  {
    id: '728ed73f',
    amount: 450,
    status: 'failed',
    email: 'h@example.com',
    name: { firstname: 'Carol', lastname: 'Walker' },
  },
  {
    id: '728ed74f',
    amount: 550,
    status: 'pending',
    email: 'i@example.com',
    name: { firstname: 'Steven', lastname: 'Hall' },
  },
]
