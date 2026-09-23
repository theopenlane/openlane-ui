import { type ColumnDef } from '@repo/ui/table-types'
import { type ContactsNodeNonNull } from '@/lib/graphql-hooks/contact'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { UserStatusLabel } from '@/components/shared/enum-mapper/user-status-enum'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'

export const getColumns = ({ userMap, tokenMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<ContactsNodeNonNull>[] => {
  return [
    createSelectColumn<ContactsNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'fullName', header: 'Full Name', size: 150, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'email', header: 'Email', size: 200 },
    { accessorKey: 'company', header: 'Company', size: 150 },
    { accessorKey: 'title', header: 'Title', size: 150 },
    { accessorKey: 'phoneNumber', header: 'Phone Number', size: 150 },
    { accessorKey: 'address', header: 'Address', size: 200 },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => (row.original.status ? <UserStatusLabel status={row.original.status} /> : <div>-</div>),
    },
    { accessorKey: 'tags', header: 'Tags', size: 180, cell: ({ row }) => <TagsCell tags={row.original.tags} /> },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <AuthorCell id={row.original.createdBy} userMap={userMap} tokenMap={tokenMap} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" /> },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <AuthorCell id={row.original.updatedBy} userMap={userMap} tokenMap={tokenMap} />,
    },
  ]
}
